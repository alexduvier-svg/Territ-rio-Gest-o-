import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correctEventName, matchOfficialFair, buildFairReport } from '../src/features/fair-report.js';

test('corrige o nome do evento digitado', () => {
  assert.equal(correctEventName('feira do inventario'), 'Feira do Inventário');
  assert.equal(correctEventName('feirado invertario'), 'Feira do Inventário');
  assert.equal(correctEventName('FESTA DO CAFE'), 'Festa do Café');
  assert.equal(correctEventName('feira de sexta 3a idade'), 'Feira de Sexta 3ª Idade');
  assert.equal(correctEventName('Expo Rio Novo'), 'Expo Rio Novo');
});

test('reconhece a feira oficial mesmo com erros', () => {
  for (const typed of ['feira do inventario', 'feirado invertario', 'Feira Inventário Rural', 'feira do inventário rural e cultural']) {
    assert.equal(matchOfficialFair(typed)?.id, 'feira-inventario', typed);
  }
  assert.equal(matchOfficialFair('Festa do Café'), null);
  assert.equal(matchOfficialFair('feira'), null);
});

const ev = { name: 'Feira do Inventário Rural e Cultural', start: '2026-03-14', end: '2026-03-14', from: '09:00', until: '14:00' };
const at = hhmm => `2026-03-14T${hhmm}:00-03:00`;
const item = (productId, name, qty, price, cost) => ({ productId, name, unit: 'Unidade', description: 'Unidade', qty, price, total: qty * price, costTotal: qty * cost });
const sale = (hhmm, items, method = 'Pix') => { const total = items.reduce((n, i) => n + i.total, 0); return { date: at(hhmm), total, subtotal: total, payments: [{ method, amount: total }], items }; };

test('relatório do Jacks: levou, vendeu, restou, esgotamento, faixas e pagamento', () => {
  const load = { items: [{ productId: 'q', name: 'Queijo minas', unit: 'Unidade', qty: 15 }, { productId: 'i', name: 'Iogurte', unit: 'Unidade', qty: 15 }, { productId: 'l', name: 'Linguiça', unit: 'Unidade', qty: 10 }], updatedAt: '2026-03-13T20:00:00-03:00' };
  const sales = [
    sale('09:40', [item('q', 'Queijo minas', 8, 3500, 1800), item('i', 'Iogurte', 5, 1200, 500)]),
    sale('10:30', [item('l', 'Linguiça', 4, 3000, 2000)], 'Dinheiro'),
    sale('12:02', [item('q', 'Queijo minas', 7, 3500, 1800), item('i', 'Iogurte', 10, 1200, 500)]),
    sale('13:10', [item('l', 'Linguiça', 4, 3000, 2000)], 'Crédito'),
  ];
  const prices = { q: { price: 3500 }, i: { price: 1200 }, l: { price: 3000 } };
  const r = buildFairReport({ event: ev, load, sales, productOf: id => prices[id], producer: { name: 'Jacks Givisiez' } });
  assert.deepEqual([r.totals.took, r.totals.sold, r.totals.left], [40, 38, 2]);
  assert.equal(r.totals.revenue, 8 * 3500 + 5 * 1200 + 4 * 3000 + 7 * 3500 + 10 * 1200 + 4 * 3000);
  assert.equal(r.answers.maisVendido, 'Queijo minas'); // empate em 15: desempata pelo faturamento
  assert.equal(r.answers.menosVendido, 'Linguiça');
  assert.equal(r.answers.esgotouPrimeiro, 'Queijo minas (3h02)');
  assert.equal(r.answers.tempoEsgotar, 'NÃO ESGOTOU');
  assert.equal(r.answers.saidaCaro, 'EXCELENTE SAÍDA'); // queijo 15/15
  assert.equal(r.answers.saidaMedio, 'BOA SAÍDA');     // linguiça 8/10
  assert.equal(r.answers.saidaBarato, 'EXCELENTE SAÍDA');
  assert.equal(r.answers.reposicao, 'FIQUEI SEM REPOSIÇÃO');
  assert.equal(r.answers.maiorLucro, 'PRODUTOS MAIS CAROS');
  assert.match(r.answers.metodoPagamento, /^Pix \(\d+%\)$/);
  assert.equal(r.answers.semVenda, 'Todos venderam');
  assert.equal(r.hourly[9] > 0 && r.hourly[12] > 0, true);
  assert.equal(r.products.find(p => p.id === 'q').soldOutAt, '12:02');
});

test('sem "o que vou levar", o relatório avisa que não foi informado', () => {
  const r = buildFairReport({ event: ev, load: null, sales: [sale('10:00', [item('q', 'Queijo', 2, 3500, 1800)])] });
  assert.match(r.answers.levou, /Não informado/);
  assert.equal(r.totals.tookKnown, 0);
});

test('reposição: só conta quando o "o que vou levar" é atualizado depois da primeira venda', () => {
  const sales = [sale('10:00', [item('q', 'Queijo', 2, 3500, 1800)])];
  const items = [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 5 }];
  const before = buildFairReport({ event: ev, load: { items, createdAt: at('09:30'), updatedAt: at('09:30') }, sales });
  assert.equal(before.answers.reposicao, 'NÃO PRECISEI REPOR');
  const markedLate = buildFairReport({ event: ev, load: { items, createdAt: at('09:10'), updatedAt: at('09:45') }, sales });
  assert.equal(markedLate.answers.reposicao, 'NÃO PRECISEI REPOR');
  const restock = buildFairReport({ event: ev, load: { items, createdAt: at('08:00'), updatedAt: at('11:30') }, sales });
  assert.equal(restock.answers.reposicao, 'CONSEGUI REPOR');
});
