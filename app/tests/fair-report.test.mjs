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
const sale = (hhmm, items, method = 'Pix') => { const total = items.reduce((n, i) => n + i.total, 0); return { status: 'completed', date: at(hhmm), total, subtotal: total, payments: [{ method, amount: total }], items }; };

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

import { fairNoticeTimes, buildFairContract } from '../src/features/fair-report.js';
const br = ms => new Date(ms).toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).slice(0, 16);

test('avisos para finalizar: 10 min antes, 20h, depois 12h por 7 dias — nunca de madrugada', () => {
  const t = fairNoticeTimes(Date.parse('2026-11-21T14:00:00-03:00')).map(br);
  assert.deepEqual(t, ['2026-11-21 13:50', '2026-11-21 20:00', '2026-11-22 12:00', '2026-11-23 12:00', '2026-11-24 12:00', '2026-11-25 12:00', '2026-11-26 12:00', '2026-11-27 12:00', '2026-11-28 12:00']);
  for (const x of t) { const h = Number(x.slice(11, 13)); assert.ok(h >= 8 && h <= 21, x); }
  // Feira à noite: o das 20h ficaria antes do fim e sai.
  const night = fairNoticeTimes(Date.parse('2026-11-21T21:00:00-03:00')).map(br);
  assert.equal(night[0], '2026-11-21 20:50');
  assert.equal(night[1], '2026-11-22 12:00');
});

test('formato da skill: estoque com reposição, vendas uma a uma, fechamento e observação', () => {
  const load = { items: [{ productId: 'q', name: 'Queijo minas', unit: 'Unidade', description: 'Unidade', qty: 15, restocks: [{ at: at('11:00'), qty: 5 }] }] };
  const s1 = { ...sale('09:40', [item('q', 'Queijo minas', 2, 3500, 1800)]), id: 'v1', status: 'completed' };
  const s2 = { ...sale('10:10', [item('q', 'Queijo minas', 1, 3500, 1800)], 'Dinheiro'), id: 'v2', status: 'returned' };
  const s3 = { ...sale('13:59', [item('q', 'Queijo minas', 1, 3500, 1800)], 'Crédito'), id: 'v3', status: 'completed', late: true, registeredAt: '2026-11-22T10:00:00.000Z' };
  const c = buildFairContract({ event: { ...ev, place: 'Praça' }, load, sales: [s3, s1, s2], productOf: () => ({ price: 3500, category: 'Laticínios' }), producer: { id: 'p-jacks', name: 'Jacks Givisiez', community: 'Furriel' }, counts: { q: 10 }, note: 'Faltou sombra' });
  assert.deepEqual(c.estoque[0], { produtor_id: 'p-jacks', produto_id: 'q', produto: 'Queijo minas', categoria: 'Laticínios', unidade: 'Unidade', preco: 35, qtd_inicial: 10, reposicoes: [{ hora: '11:00', qtd: 5 }] });
  assert.deepEqual(c.vendas.map(v => v.id), ['v1', 'v2', 'v3']);
  assert.equal(c.vendas[0].hora, '2026-03-14T09:40:00-03:00');
  assert.deepEqual(c.vendas[0].itens, [{ produto_id: 'q', qtd: 2, preco_unit: 35 }]);
  assert.equal(c.vendas[0].total, 70);
  assert.equal(c.vendas[1].cancelada, true);
  assert.equal(c.vendas[1].pagamento, 'DINHEIRO');
  assert.equal(c.vendas[2].pagamento, 'CARTAO_CREDITO');
  assert.equal(c.vendas[2].lancada_depois, true);
  assert.deepEqual(c.fechamento, [{ produtor_id: 'p-jacks', produto_id: 'q', contado: 10 }]);
  assert.equal(c.feedback[0].observacao, 'Faltou sombra');
  assert.equal(c.produtor.nome_curto, 'Jacks');
});

test('relatório: reposição com horário e venda além do levado', () => {
  const load = { items: [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 5, restocks: [{ at: at('11:00'), qty: 2 }] }] };
  const r = buildFairReport({ event: ev, load, sales: [sale('10:00', [item('q', 'Queijo', 6, 3500, 1800)])] });
  assert.equal(r.answers.reposicao, 'CONSEGUI REPOR');
  assert.equal(r.products[0].restocked, 2);
  const over = buildFairReport({ event: ev, load: { items: [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 3 }] }, sales: [sale('10:00', [item('q', 'Queijo', 5, 3500, 1800)])] });
  assert.equal(over.products[0].oversold, 2);
  assert.match(over.answers.vendeuAlemDoLevado, /Queijo: 2 a mais/);
});

test('conferência ausente: contrato explícito, inclusive evento sem carga', () => {
  const r = buildFairReport({ event: ev, load: null, sales: [] });
  assert.deepEqual(r.check, { conferido: false, corrigido: false, vendasNaoRegistradas: { qtd: 0, valor: 0 }, perdas: { qtd: 0 }, itens: [] });
  assert.equal(r.totals.tookKnown, 0);
  assert.doesNotThrow(() => JSON.stringify(r)); // Mesmo contrato para fila local sem rede.
});

test('conferência é copiada e sanitizada sem alterar dados salvos', () => {
  const check = {
    conferido: true, corrigido: true, vendasNaoRegistradas: { qtd: '2', valor: '7000.4', privado: 'não enviar' },
    perdas: { qtd: 1 }, itens: [{ produto: 'Queijo', unidade: 'Unidade', calculado: '5', real: 2, motivo: 'venda', segredo: 'não enviar' }, null],
    tempoMs: 1400, touchedDirectly: false,
  };
  const original = structuredClone(check);
  const r = buildFairReport({ event: { ...ev, surplusCheck: check }, load: null, sales: [] });
  assert.deepEqual(r.check, { conferido: true, corrigido: true, vendasNaoRegistradas: { qtd: 2, valor: 7000 }, perdas: { qtd: 1 }, itens: [{ produto: 'Queijo', unidade: 'Unidade', calculado: 5, real: 2, motivo: 'venda' }] });
  assert.deepEqual(check, original);
  r.check.itens[0].real = 100;
  assert.equal(check.itens[0].real, 2);
  const bad = buildFairReport({ event: { ...ev, surplusCheck: { conferido: 'true', corrigido: 1, vendasNaoRegistradas: { qtd: Infinity, valor: -1 }, perdas: { qtd: 'inválido' }, itens: 'inválido' } }, load: null, sales: [] });
  assert.deepEqual(bad.check, { conferido: false, corrigido: false, vendasNaoRegistradas: { qtd: 0, valor: 0 }, perdas: { qtd: 0 }, itens: [] });
});

test('sobra desconta perdas da mesma feira e apresentação, sem contar reposição duas vezes', () => {
  const event = { ...ev, id: 'feira-a' };
  const load = { items: [
    { productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 15, restocks: [{ at: at('11:00'), qty: 5 }] },
    { productId: 'q', name: 'Queijo', unit: 'kg', qty: 2.5 },
  ] };
  const sales = [sale('10:00', [item('q', 'Queijo', 8, 3500, 1800)])];
  const losses = [
    { kind: 'loss', eventId: 'feira-a', productId: 'q', unit: 'Unidade', qty: 3 },
    { kind: 'loss', eventId: 'outra', productId: 'q', unit: 'Unidade', qty: 4 },
    { kind: 'correct', eventId: 'feira-a', productId: 'q', unit: 'Unidade', qty: 100 },
    { kind: 'loss', eventId: 'feira-a', productId: 'q', unit: 'kg', qty: 0.35 },
    { kind: 'loss', eventId: 'feira-a', productId: 'q', unit: 'kg', qty: -4 },
  ];
  const r = buildFairReport({ event, load, sales, losses });
  assert.deepEqual([r.products[0].took, r.products[0].restocked, r.products[0].sold, r.products[0].left], [15, 5, 8, 4]);
  assert.equal(r.products[1].left, 2.15);
  assert.equal(r.totals.left, 6.15);
  assert.equal(r.totals.revenue, 28000);
  assert.equal(r.answers.tempoEsgotar, 'NÃO ESGOTOU');
});

test('perda total não é esgotamento por venda, e sobra nunca é negativa', () => {
  const load = { items: [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 5 }] };
  const r = buildFairReport({ event: ev, load, sales: [sale('10:00', [item('q', 'Queijo', 2, 3500, 1800)])], losses: [{ kind: 'loss', productId: 'q', unit: 'Unidade', qty: 8 }] });
  assert.equal(r.products[0].left, 0);
  assert.equal(r.products[0].oversold, 0);
  assert.equal(r.answers.tempoEsgotar, 'NÃO ESGOTOU');
  assert.equal(r.answers.esgotouPrimeiro, 'Não esgotou nenhum');
});

test('venda não registrada entra uma vez; retornadas e rascunhos não alteram total ou sobra', () => {
  const load = { items: [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 10 }] };
  const completed = { ...sale('13:59', [item('q', 'Queijo', 2, 3500, 1800)]), unregistered: true };
  const returned = { ...sale('11:00', [item('q', 'Queijo', 3, 3500, 1800)]), status: 'returned' };
  const draft = { ...sale('12:00', [item('q', 'Queijo', 5, 3500, 1800)]), status: 'draft' };
  const r = buildFairReport({ event: ev, load, sales: [returned, draft, completed] });
  assert.deepEqual([r.totals.sales, r.totals.sold, r.totals.left, r.totals.revenue, r.totals.ticket], [1, 2, 8, 7000, 7000]);
  assert.deepEqual(r.payments, { Pix: 7000 });
  assert.equal(r.hourly[11], undefined);
});

test('nova venda após fechamento atualiza relatório e mantém histórico da conferência', () => {
  const check = { conferido: true, corrigido: true, vendasNaoRegistradas: { qtd: 1, valor: 3500 }, perdas: { qtd: 1 }, itens: [{ produto: 'Queijo', unidade: 'Unidade', calculado: 5, real: 3, motivo: 'venda e perda' }] };
  const event = { ...ev, surplusCheck: check };
  const load = { items: [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 10 }] };
  const losses = [{ kind: 'loss', productId: 'q', unit: 'Unidade', qty: 1 }];
  const sales = [sale('13:50', [item('q', 'Queijo', 6, 3500, 1800)])];
  const first = buildFairReport({ event, load, sales, losses, now: Date.parse(at('13:59')) });
  const later = buildFairReport({ event, load, sales: [...sales, sale('14:05', [item('q', 'Queijo', 1, 3500, 1800)])], losses, now: Date.parse(at('14:05')) });
  assert.equal(first.totals.left, 3);
  assert.equal(later.totals.left, 2);
  assert.equal(later.totals.revenue, first.totals.revenue + 3500);
  assert.equal(later.totals.sales, 2);
  assert.deepEqual(later.check, first.check);
  assert.deepEqual(event.surplusCheck, check);
});

test('carga ajustada pela conferência corrige levou sem inventar reposição', () => {
  const sales = [sale('10:00', [item('q', 'Queijo', 3, 3500, 1800)])];
  const load = { items: [{ productId: 'q', name: 'Queijo', unit: 'Unidade', qty: 12, adjustments: [{ at: at('14:00'), qty: 2, reason: 'surplus-check' }] }], createdAt: at('08:00'), updatedAt: at('14:00'), surplusAdjustedAt: at('14:00') };
  const r = buildFairReport({ event: ev, load, sales });
  assert.deepEqual([r.totals.took, r.totals.sold, r.totals.left], [12, 3, 9]);
  assert.equal(r.answers.reposicao, 'NÃO PRECISEI REPOR');
  assert.equal(r.products[0].restocked, 0);
  const c = buildFairContract({ event: ev, load, sales });
  assert.equal(c.estoque[0].qtd_inicial, 12);
  assert.deepEqual(c.estoque[0].reposicoes, []);
});

test('venda corrigida leva flag unregistered no contrato da organização', () => {
  const s = { ...sale('14:00', [item('q', 'Queijo', 1, 3500, 1800)]), id: 'corrigida', unregistered: true, late: true, registeredAt: at('14:00') };
  const c = buildFairContract({ event: ev, load: null, sales: [s] });
  assert.equal(c.vendas[0].unregistered, true);
  assert.equal(c.vendas[0].lancada_depois, true);
  assert.equal(c.vendas[0].registrada_em, at('14:00'));
});

test('totais de quantidades decimais não carregam erro de ponto flutuante', () => {
  const load = { items: [{ productId: 'a', name: 'Tomate', unit: 'kg', qty: 0.3 }, { productId: 'b', name: 'Batata', unit: 'kg', qty: 0.2 }] };
  const sold = { ...item('a', 'Tomate', 0.2, 1000, 500), unit: 'kg' };
  const r = buildFairReport({ event: ev, load, sales: [sale('10:00', [sold])] });
  assert.equal(r.totals.took, 0.5);
  assert.equal(r.totals.sold, 0.2);
  assert.equal(r.totals.left, 0.3);
});
