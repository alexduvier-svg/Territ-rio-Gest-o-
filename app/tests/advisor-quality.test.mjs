import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { forecastNextEvent, dailyRates, bestMoments, runOut } from '../src/features/advisor/forecast.js';
import { productMargins, statement, profitByPlace, cardFeesOf, financeSettings } from '../src/features/finance/finance.js';

const product = { id: 'p', name: 'Produto', price: 1000, stock: 3, unitShort: 'un' };
const event = (id, start, days, sold, taken = sold, left = 0) => ({ id, name: id, start, days,
  items: [{ productId: 'p', sold, taken, left }],
});
const input = (events = [], daily = [], products = [product], days = 1) => ({
  dataContext: { type: 'real', id: 'quality-fixtures' }, today: '2026-10-15', products,
  history: { events, daily }, upcoming: { name: 'Próxima feira', days },
});

test('estoque esgotado é informação observada, sem bônus de demanda de 25%', () => {
  const f = forecastNextEvent(input([event('única', '2026-10-10', 1, 10)]));
  assert.equal(f.lines[0].take, 10);
  assert.equal(f.lines[0].soldOutObserved, true);
  assert.equal(f.low, 10000);
  assert.equal(f.high, 10000);
  assert.equal(f.confidence, null);
  assert.equal(f.limited, true);
  assert.match(f.warnings.join(' '), /não mede a demanda/);
});

test('cada observação é normalizada pela própria duração, sem média de feiras alheias', () => {
  const relevant = event('produto', '2026-10-10', 2, 20, 25, 5);
  const unrelated = { id: 'outra', name: 'Outra', start: '2026-10-12', days: 10,
    items: [{ productId: 'outro', sold: 200, taken: 250, left: 50 }] };
  assert.equal(forecastNextEvent(input([relevant], [], [product], 3)).lines[0].take, 30);
  const f = forecastNextEvent(input([unrelated, relevant], [], [product], 3));
  assert.equal(f.lines[0].take, 30);
  assert.equal(f.eventsUsed, 1);
  assert.equal(f.lines[0].samples, 1);
});

test('feiras de durações diferentes entram como quantidades por dia', () => {
  const f = forecastNextEvent(input([
    event('recente', '2026-10-12', 2, 20, 25, 5),
    event('anterior', '2026-10-05', 1, 4, 8, 4),
  ], [], [product], 2));
  // (10×0,4 + 4×0,3) ÷0,7 ×2 =14,86; arredondamento inteiro=15.
  assert.equal(f.lines[0].take, 15);
  assert.equal(f.lines[0].lowTake, 8);
  assert.equal(f.lines[0].highTake, 20);
  assert.equal(f.rangeKind, 'observed-history');
});

test('quatro feiras de outros produtos não dão amostra ao produto novo', () => {
  const unrelated = [1, 2, 3, 4].map(n => ({ id: 'o' + n, name: 'Outra', start: `2026-10-0${n}`, days: 1,
    items: [{ productId: 'outro', sold: 50, taken: 60, left: 10 }] }));
  const f = forecastNextEvent(input(unrelated));
  assert.deepEqual(f.lines, []);
  assert.equal(f.eventsUsed, 0);
  assert.equal(f.minimumSamples, 0);
  assert.equal(f.limited, true);
});

test('uma feira oferecida sem vender entra como observação zero', () => {
  const f = forecastNextEvent(input([
    event('recente', '2026-10-12', 1, 0, 10, 10),
    event('anterior', '2026-10-05', 1, 7, 10, 3),
  ]));
  assert.equal(f.lines[0].samples, 2);
  assert.equal(f.lines[0].take, 3);
  assert.equal(f.lines[0].lowTake, 0);
});

test('linhas duplicadas na mesma feira não viram amostras independentes', () => {
  const e = event('mesma', '2026-10-10', 1, 4, 10, 6);
  e.items.push({ productId: 'p', sold: 3, taken: 5, left: 2 });
  const f = forecastNextEvent(input([e]));
  assert.equal(f.lines[0].take, 7);
  assert.equal(f.lines[0].samples, 1);
});

test('evento repetido ou duração desconhecida não aumenta a amostra comparável', () => {
  const e = event('duplicada', '2026-10-10', 1, 8, 10, 2);
  const unknownDuration = { ...event('sem-duração', '2026-10-12', 1, 100), days: undefined };
  const f = forecastNextEvent(input([e, { ...e }, unknownDuration]));
  assert.equal(f.lines[0].take, 8);
  assert.equal(f.lines[0].samples, 1);
  assert.equal(f.eventsUsed, 1);
  assert.equal(f.limited, true);
});

test('ritmo diário usa janela real por produto e não multiplicador de feira', () => {
  const daily = [{ day: '2026-10-12', productId: 'p', qty: 8, amount: 8000 },
    { day: '2026-10-01', productId: 'outro', qty: 30, amount: 30000 }];
  assert.equal(dailyRates(daily, '2026-10-15').get('p'), 2);
  const f = forecastNextEvent(input([], daily, [product], 2));
  assert.equal(f.lines[0].take, 4);
  assert.equal(f.low, null);
  assert.equal(f.high, null);
  assert.equal(f.rangeKind, null);
  assert.equal(f.lines[0].samples, 1);
  assert.equal(f.lines[0].daysObserved, 4);
  assert.equal(runOut(input([], daily))[0].limited, true);
});

test('registro futuro, data impossível e quantidade não finita não alimentam a referência', () => {
  const f = forecastNextEvent(input([event('futuro', '2026-10-16', 1, 1000)], [
    { day: '2026-02-30', productId: 'p', qty: 100, amount: 100000 },
    { day: '2026-10-16', productId: 'p', qty: 100, amount: 100000 },
    { day: '2026-10-12', productId: 'p', qty: NaN, amount: 100000 },
  ]));
  assert.deepEqual(f.lines, []);
});

test('não inventa estoque zero quando saldo desconhecido', () => {
  const f = forecastNextEvent(input([event('registrada', '2026-10-12', 1, 10)], [], [{ ...product, stock: undefined }]));
  assert.equal(f.lines[0].stock, null);
  assert.equal(f.lines[0].missing, null);
});

test('um dia isolado não declara melhor dia nem horário', () => {
  const m = bestMoments([{ day: '2026-10-10', hour: 9, amount: 10000 }]);
  assert.equal(m.day, null);
  assert.equal(m.hour, null);
  assert.equal(m.limited, true);
});

test('empate entre dias e horários não produz vencedor arbitrário', () => {
  const rows = ['2026-10-03', '2026-10-04', '2026-10-10', '2026-10-11'].map((day, i) => ({ day, hour: i % 2 ? 10 : 9, amount: 1000 }));
  const m = bestMoments(rows);
  assert.equal(m.day, null);
  assert.equal(m.hour, null);
  assert.equal(m.dayTied, true);
  assert.equal(m.hourTied, true);
});

test('padrão repetido tem amostra explícita e continua sendo receita registrada', () => {
  const m = bestMoments([
    { day: '2026-10-03', hour: 9, amount: 2000 },
    { day: '2026-10-10', hour: 9, amount: 3000 },
    { day: '2026-10-11', hour: 10, amount: 1000 },
    { day: '2026-10-12', hour: 25, amount: 0 },
  ]);
  assert.equal(m.day, 'sábado');
  assert.equal(m.hour, 9);
  assert.equal(m.daySamples, 2);
  assert.equal(m.hourSamples, 2);
  assert.match(m.basis, /sem ajuste/);
});

const sale = (costTotal, extra = {}) => ({ subtotal: 2000, total: 2000,
  items: [{ productId: 'p', name: 'Produto', qty: 2, total: 2000, costTotal, ...extra }],
});

test('zero de custo antigo é desconhecido; zero explicitamente confirmado é conhecido', () => {
  const [unknown] = productMargins([sale(0)]);
  assert.equal(unknown.costKnown, false);
  assert.equal(unknown.margin, null);
  assert.equal(unknown.costCoverage, 0);
  assert.equal(unknown.unknownCostQty, 2);
  assert.equal(unknown.unknownCostRevenue, 2000);
  const [confirmed] = productMargins([sale(0, { costKnown: true })]);
  assert.equal(confirmed.costKnown, true);
  assert.equal(confirmed.margin, 1);
  assert.equal(confirmed.costCoverage, 1);
});

test('venda com custo ausente não ganha custo histórico quando cadastro atual é corrigido', () => {
  const ctx = { console, Date, Math, JSON, Intl };
  ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js', import.meta.url), 'utf8'), ctx);
  const data = ctx.ERP.seed();
  data.products.push({ id: 'quality-cost', name: 'Produto da auditoria', baseName: 'Produto da auditoria', category: 'Outros', unit: 'Unidade', price: 1000, cost: 0, stock: 10, min: 1 });
  const model = new ctx.ERP.ERPModel(data);
  const historical = model.complete({ scope: 'loja', items: [{ productId: 'quality-cost', rawQty: '1' }], discountMode: 'R$', discountValue: '0', payment: 'Pix' });
  model.product('quality-cost').cost = 900;
  const [row] = productMargins([historical]);
  assert.equal(row.cost, 0);
  assert.equal(row.costKnown, false);
  assert.equal(row.costCoverage, 0);
});

test('cobertura parcial considera receita descontada, sem esconder itens sem custo', () => {
  const known = sale(800), unknown = { ...sale(null), total: 1000 };
  const [row] = productMargins([known, unknown]);
  assert.equal(row.revenue, 3000);
  assert.equal(row.costKnown, false);
  assert.equal(row.unknownCostRevenue, 1000);
  assert.ok(Math.abs(row.costCoverage - 2 / 3) < 1e-12);
});

test('devolução desconhecida não cancela lacuna nem restaura certeza da margem', () => {
  const [row] = productMargins([sale(800)], [sale(null)]);
  assert.equal(row.revenue, 0);
  assert.equal(row.qty, 0);
  assert.equal(row.costKnown, false);
  assert.equal(row.margin, null);
  assert.equal(row.unknownCostQty, 2);
  assert.equal(row.unknownCostRevenue, 2000);
  assert.equal(row.costCoverage, 0.5);
  const [returnedOnly] = productMargins([], [sale(null)]);
  assert.equal(returnedOnly.qty, -2);
  assert.equal(returnedOnly.costKnown, false);
  assert.equal(returnedOnly.costCoverage, 0);
});

test('taxas são arredondadas por pagamento e conciliam entre locais e demonstrativo', () => {
  const sales = Array.from({ length: 3 }, (_, i) => ({ scope: i === 2 ? 'b' : 'a', total: 110, cost: 50,
    payments: [{ method: 'Crédito', amount: 110 }],
  }));
  const st = statement({ sales, expenses: [], settings: {}, general: false });
  const places = profitByPlace({ sales, expenses: [], settings: {}, nameOf: id => id });
  assert.equal(st.fees, 15); // 3 × arredondamento de 5,478 centavos = 3 ×5.
  assert.equal(st.result, 165);
  assert.equal(places.reduce((n, p) => n + p.fees, 0), st.fees);
  assert.equal(places.reduce((n, p) => n + p.profit, 0), st.result);
  assert.equal(st.chargeEstimates.fees.rounding, 'integer-cent-per-payment');
  assert.equal(st.chargeEstimates.settlementTracked, false);
});

test('pagamento dividido conserva arredondamento por parcela, sem cobrar Pix como cartão', () => {
  const settings = financeSettings({ cardFees: { Crédito: 4.98, Débito: 1.99 } });
  assert.equal(cardFeesOf([{ payments: [
    { method: 'Crédito', amount: 110 }, { method: 'Crédito', amount: 110 },
    { method: 'Débito', amount: 110 }, { method: 'Pix', amount: 100000 },
  ] }], settings), 12); //5 +5 +2; ausência de taxaPix é limitação do modelo, não promessa do banco.
});

test('ponto de equilíbrio não inclui conta que começa depois do mês selecionado', () => {
  const settings = { fixedCosts: [
    { title: 'Conta atual', amount: 5000, since: '2026-09' },
    { title: 'Conta futura', amount: 10000, since: '2027-01' },
  ] };
  const sales = [{ total: 20000, cost: 10000, payments: [{ method: 'Pix', amount: 20000 }] }];
  const st = statement({ sales, expenses: [], settings, shares: [{ month: '2026-10', share: 1 }] });
  assert.equal(st.fixed, 5000);
  assert.equal(st.monthlyFixed, 5000);
  assert.equal(st.monthlyFixedReference, '2026-10');
  assert.equal(st.breakEven, 10000);
  const future = statement({ sales, expenses: [], settings, shares: [{ month: '2027-01', share: 1 }] });
  assert.equal(future.monthlyFixed, 15000);
  assert.equal(future.breakEven, 30000);
});

test('referência mensal segue o último mês selecionado e não depende do relógio', () => {
  const settings = { fixedCosts: [{ title: 'Nova conta', amount: 10000, since: '2026-11' }] };
  const sales = [{ total: 10000, cost: 5000, payments: [] }];
  const st = statement({ sales, expenses: [], settings, shares: [
    { month: '2026-10', share: 0.5 }, { month: '2026-09', share: 0.5 },
  ] });
  assert.equal(st.monthlyFixedReference, '2026-10');
  assert.equal(st.monthlyFixed, 0);
  assert.equal(st.breakEven, null);
  const unspecified = statement({ sales, expenses: [], settings, shares: [] });
  assert.equal(unspecified.monthlyFixedReference, null);
  assert.equal(unspecified.monthlyFixed, 10000);
  assert.equal(st.chargeEstimates.taxes.rate, 0);
});
