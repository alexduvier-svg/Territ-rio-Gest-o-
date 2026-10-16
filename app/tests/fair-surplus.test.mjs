import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSurplusSnapshot, dominantEventPayment, parseSurplusQuantity, planSurplusCheck, surplusKey } from '../src/features/fair-surplus.js';

const eventId = 'feira';
const at = '2026-10-15T18:00:00.000Z';
const product = (id, unit = 'Unidade', price = 1000, stock = 20) => ({ id, name: id, unit, price, cost: 500, stock });
const loadItem = (productId, qty, unit = 'Unidade', restocks = []) => ({ productId, name: productId, unit, qty, restocks });
const sale = (id, productId, qty, unit = 'Unidade', payment = 'Pix', amount = 1000) => ({ id, scope: eventId, status: 'completed', date: at, total: amount, items: [{ productId, unit, qty }], payments: [{ method: payment, amount }] });
const input = () => ({ eventId, load: { eventId, items: [loadItem('Banana Prata', 10, 'Dúzia'), loadItem('Café', 3)] }, products: [product('Banana Prata', 'Dúzia'), product('Café')], sales: [sale('v1', 'Banana Prata', 6, 'Dúzia'), sale('v2', 'Café', 3)] });
const snapshot = () => buildSurplusSnapshot(input());
const key = surplusKey('Banana Prata', 'Dúzia');
const plan = (extra = {}) => planSurplusCheck({ snapshot: snapshot(), now: at, ...extra });
const code = expected => error => error.code === expected;

test('sem carga, carga vazia ou carga de outro evento não mostram a conferência', () => {
  const data = input();
  for (const load of [null, { eventId, items: [] }, { eventId: 'outro', items: data.load.items }]) {
    const s = buildSurplusSnapshot({ ...data, load });
    assert.equal(s.eligible, false);
    assert.deepEqual(s.rows, []);
    const p = planSurplusCheck({ snapshot: s, now: at, direct: true });
    assert.deepEqual(p.check, { conferido: false, corrigido: false, vendasNaoRegistradas: { qtd: 0, valor: 0 }, perdas: { qtd: 0 }, itens: [] });
    assert.equal(p.metrics.confereDireto, false);
    assert.deepEqual(p.sales, []);
  }
});

test('mostra só sobra positiva; esgotados, devolvidas e vendas de outros eventos não entram', () => {
  const data = input();
  data.sales.push({ ...sale('devolvida', 'Banana Prata', 2, 'Dúzia'), status: 'returned' }, { ...sale('outro', 'Banana Prata', 3, 'Dúzia'), scope: 'outra-feira' });
  const s = buildSurplusSnapshot(data);
  assert.equal(s.rows.length, 1);
  assert.equal(s.rows[0].key, key);
  assert.equal(s.rows[0].calculated, 4);
  data.sales[0].items[0].qty = 12;
  assert.equal(buildSurplusSnapshot(data).eligible, false);
});

test('reposições já embutidas em qty não são contadas duas vezes', () => {
  const data = input();
  data.load.items[0] = loadItem('Banana Prata', 15, 'Dúzia', [{ at, qty: 3 }, { at, qty: 2 }]);
  const row = buildSurplusSnapshot(data).rows[0];
  assert.deepEqual([row.taken, row.restocked, row.loaded, row.sold, row.calculated], [10, 5, 15, 6, 9]);
});

test('perdas registradas anteriormente não são descontadas de novo na conferência', () => {
  const data = input();
  data.movements = [{ id: 'm1', productId: 'Banana Prata', unit: 'Dúzia', qty: 2, kind: 'loss', eventId, date: at }, { productId: 'Banana Prata', unit: 'Dúzia', qty: 100, kind: 'loss', eventId: 'outro' }];
  const s = buildSurplusSnapshot(data);
  assert.equal(s.rows[0].calculated, 2);
  assert.equal(s.rows[0].recordedLoss, 2);
  const p = planSurplusCheck({ snapshot: s, now: at, direct: true });
  assert.equal(p.check.perdas.qtd, 0);
  assert.equal(p.losses.length, 0);
  assert.equal(buildSurplusSnapshot({ ...data, includeRecordedLosses: false }).rows[0].calculated, 4);
});

test('Confere direto conclui sem correções e mede o tempo; sem conferência continua false', () => {
  const p = plan({ direct: true, openedAt: Date.parse(at) - 3210 });
  assert.equal(p.check.conferido, true);
  assert.equal(p.check.corrigido, false);
  assert.deepEqual(p.check.itens, [{ produto: 'Banana Prata', unidade: 'Dúzia', calculado: 4, real: 4, motivo: '' }]);
  assert.deepEqual(p.metrics, { tempoConferenciaMs: 3210, confereDireto: true, diferencaTotal: 0, diferencaLiquida: 0 });
  assert.equal(plan({ confirmed: false, counts: { [key]: 2 } }).check.conferido, false);
});

test('diferença menor pede uma razão por linha, inclusive real zero', () => {
  assert.throws(() => plan({ counts: { [key]: 0 } }), error => {
    assert.equal(error.code, 'REASON_REQUIRED');
    assert.equal(error.details.items.length, 1);
    assert.equal(error.details.items[0].difference, 4);
    assert.equal(error.details.items[0].real, 0);
    return true;
  });
  assert.throws(() => plan({ counts: { [key]: 2 }, reasons: { [key]: 'qualquer coisa' } }), code('REASON_REQUIRED'));
});

test('venda não registrada usa preço atual, horário do fechamento e baixa só a diferença', () => {
  const p = plan({ counts: { [key]: 1 }, reasons: { [key]: 'sale' } });
  assert.deepEqual(p.check.vendasNaoRegistradas, { qtd: 3, valor: 3000 });
  assert.equal(p.check.corrigido, true);
  assert.deepEqual(p.sales, [{ productId: 'Banana Prata', name: 'Banana Prata', unit: 'Dúzia', qty: 3, price: 1000, total: 3000, payment: 'Pix', status: 'completed', unregistered: true, date: at }]);
  assert.deepEqual(p.losses, []);
  assert.deepEqual(p.loadAdjustments, []);
  assert.equal(p.check.itens[0].motivo, 'vendi_sem_registrar');
});

test('perda e brinde usam a base loss com o evento, sem gerar venda', () => {
  const p = plan({ counts: { [key]: 0 }, reasons: { [key]: 'loss' } });
  assert.equal(p.check.perdas.qtd, 4);
  assert.equal(p.sales.length, 0);
  assert.deepEqual(p.check.vendasNaoRegistradas, { qtd: 0, valor: 0 });
  assert.deepEqual(p.losses[0], { productId: 'Banana Prata', name: 'Banana Prata', unit: 'Dúzia', qty: 4, kind: 'loss', eventId, date: at, note: 'Perda / brinde na conferência da sobra' });
});

test('sobra maior corrige a carga inicial sem inventar reposição nem aumentar estoque geral', () => {
  const data = input();
  data.load.items[0].restocks = [{ at, qty: 2 }];
  const s = buildSurplusSnapshot(data);
  const p = planSurplusCheck({ snapshot: s, now: at, counts: { [key]: 7 }, direct: true });
  assert.deepEqual(p.loadAdjustments, [{ key, productId: 'Banana Prata', unit: 'Dúzia', qty: 3, previous: 10, next: 13, date: at }]);
  assert.deepEqual(p.sales, []);
  assert.deepEqual(p.losses, []);
  assert.equal(p.check.itens[0].motivo, 'ajuste_carga');
  assert.equal(p.metrics.confereDireto, false);
});

test('forma mais usada usa frequência, desempata por valor e ignora devolvidas e outros eventos', () => {
  const data = [sale('1', 'a', 1, 'Unidade', 'Dinheiro', 100), sale('2', 'a', 1, 'Unidade', 'Dinheiro', 100), sale('3', 'a', 1, 'Unidade', 'Pix', 5000), { ...sale('4', 'a', 1, 'Unidade', 'Crédito', 10000), status: 'returned' }];
  assert.equal(dominantEventPayment(data, eventId), 'Dinheiro');
  data.push(sale('5', 'a', 1, 'Unidade', 'Pix', 100));
  assert.equal(dominantEventPayment(data, eventId), 'Pix');
  assert.equal(dominantEventPayment([], eventId), 'Pix');
  const split = { ...sale('s', 'a', 1), payments: [{ method: 'Dinheiro', amount: 100 }, { method: 'Dinheiro', amount: 100 }, { method: 'Pix', amount: 300 }] };
  assert.equal(dominantEventPayment([split], eventId), 'Pix');
});

test('quantidade aceita zero e até três casas kg/L; inteiras para demais unidades', () => {
  for (const unit of ['kg', 'Litro', 'L']) {
    assert.equal(parseSurplusQuantity('1,234', unit), 1.234);
    assert.equal(parseSurplusQuantity('0.001', unit), .001);
    assert.equal(parseSurplusQuantity(0, unit), 0);
  }
  for (const raw of ['', '-1', '1e2', '2,0000', 'NaN', Infinity, '.5', '1.234,5', '1,2,3']) assert.throws(() => parseSurplusQuantity(raw, 'kg'), code('INVALID_QUANTITY'));
  for (const unit of ['Dúzia', 'Unidade', 'Caixa']) {
    assert.equal(parseSurplusQuantity('2', unit), 2);
    assert.throws(() => parseSurplusQuantity('1,5', unit), code('INVALID_QUANTITY'));
  }
});

test('diferenças decimais e centavos são arredondados uma vez por venda, sem ruído binário', () => {
  const s = buildSurplusSnapshot({ eventId, products: [product('Tomate', 'kg', 1299)], load: { items: [loadItem('Tomate', 1.3, 'kg')] }, sales: [sale('1', 'Tomate', 1, 'kg')] });
  assert.equal(s.rows[0].calculated, .3);
  const p = planSurplusCheck({ snapshot: s, now: at, counts: { [s.rows[0].key]: '0,1' }, reasons: { [s.rows[0].key]: 'sale' } });
  assert.deepEqual(p.check.vendasNaoRegistradas, { qtd: .2, valor: 260 });
  assert.equal(p.metrics.diferencaTotal, .2);
});

test('métricas somam diferenças absolutas sem cancelar ajuste maior com perda menor', () => {
  const s = buildSurplusSnapshot({ eventId, products: [product('a'), product('b')], load: { items: [loadItem('a', 5), loadItem('b', 5)] } });
  const p = planSurplusCheck({ snapshot: s, now: at, openedAt: Date.parse(at) - 100, counts: { 'a|Unidade': 3, 'b|Unidade': 7 }, reasons: { 'a|Unidade': 'loss' } });
  assert.equal(p.metrics.diferencaTotal, 4);
  assert.equal(p.metrics.diferencaLiquida, 0);
  assert.equal(p.check.perdas.qtd, 2);
  assert.equal(p.loadAdjustments[0].qty, 2);
});

test('mudança de venda, carga, estoque, preço, unidade ou perda impede salvar contagem antiga', () => {
  for (const mutate of [
    d => d.sales[0].items[0].qty++, d => d.sales[0].status = 'returned',
    d => d.load.items[0].qty++, d => d.products[0].stock--,
    d => d.products[0].price++, d => d.products[0].unit = 'kg',
    d => d.movements = [{ kind: 'loss', eventId, productId: 'Banana Prata', unit: 'Dúzia', qty: 1 }],
  ]) {
    const data = input(), before = buildSurplusSnapshot(data);
    mutate(data);
    const after = buildSurplusSnapshot(data);
    assert.throws(() => planSurplusCheck({ snapshot: before, currentSnapshot: after, now: at }), code('STALE_CHECK'));
  }
  const data = input(), before = buildSurplusSnapshot(data);
  data.sales.push({ ...sale('outro', 'Banana Prata', 1, 'Dúzia'), scope: 'outro' });
  data.products.push(product('Outro produto'));
  assert.doesNotThrow(() => planSurplusCheck({ snapshot: before, currentSnapshot: buildSurplusSnapshot(data), now: at }));
});

test('não baixa estoque insuficiente nem registra venda com preço ausente; desconhecidos são recusados', () => {
  const data = input();
  data.products[0].stock = 1;
  assert.throws(() => plan({ snapshot: buildSurplusSnapshot(data), counts: { [key]: 0 }, reasons: { [key]: 'loss' } }), code('INSUFFICIENT_STOCK'));
  data.products[0].stock = 20;
  data.products[0].price = 0;
  assert.throws(() => plan({ snapshot: buildSurplusSnapshot(data), counts: { [key]: 0 }, reasons: { [key]: 'sale' } }), code('INVALID_PRICE'));
  assert.throws(() => plan({ counts: { 'Café|Unidade': 2 } }), code('UNKNOWN_ITEM'));
  data.products[0].unit = 'kg';
  assert.throws(() => plan({ snapshot: buildSurplusSnapshot(data), counts: { [key]: 0 }, reasons: { [key]: 'loss' } }), code('PRODUCT_CHANGED'));
});

test('motor é determinístico, não altera dados e não depende de rede para planejar', () => {
  const data = input(), before = JSON.stringify(data), s = buildSurplusSnapshot(data);
  const options = { snapshot: s, now: at, counts: { [key]: 2 }, reasons: { [key]: 'sale' }, openedAt: Date.parse(at) - 4500 };
  const first = planSurplusCheck(options), second = planSurplusCheck(options);
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(data), before);
  assert.equal(s.rows[0].calculated, 4);
  const reversed = { ...data, sales: data.sales.slice().reverse(), products: data.products.slice().reverse(), load: { ...data.load, items: data.load.items.slice().reverse() } };
  assert.equal(buildSurplusSnapshot(reversed).fingerprint, s.fingerprint);
});

test('carga e vendas inválidas não são silenciosamente arredondadas ou omitidas', () => {
  for (const qty of [NaN, Infinity, -1, 1.5, .0001]) {
    const data = input();
    data.load.items[0].qty = qty;
    assert.throws(() => buildSurplusSnapshot(data), code('INVALID_LOAD'));
  }
  for (const qty of [NaN, Infinity, -1, 0]) {
    const data = input();
    data.sales[0].items[0].qty = qty;
    assert.throws(() => buildSurplusSnapshot(data), code('INVALID_SALE'));
  }
  const data = input();
  data.sales[0].items[0].qty = 1.5;
  assert.throws(() => buildSurplusSnapshot(data), code('INVALID_QUANTITY'));
});

test('produto removido ainda pode ser conferido, mas não baixado sem cadastro correspondente', () => {
  const data = input();
  data.products = data.products.filter(p => p.id !== 'Banana Prata');
  const s = buildSurplusSnapshot(data);
  assert.equal(planSurplusCheck({ snapshot: s, now: at, direct: true }).check.conferido, true);
  assert.throws(() => planSurplusCheck({ snapshot: s, now: at, counts: { [key]: 2 }, reasons: { [key]: 'sale' } }), code('PRODUCT_CHANGED'));
});
