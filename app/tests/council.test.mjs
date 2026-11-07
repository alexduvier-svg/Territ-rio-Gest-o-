import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MANAGEMENT_COUNCIL as COUNCIL } from '../src/data/management-council-guidelines.js';
import { throughputPerConstraint, clientConcentration, rfmSegments, COUNCIL_RULES, lensOf, lensName } from '../src/features/advisor/council-rules.js';
import { powerOfOne, cashCycle } from '../src/features/finance/producer-calcs.js';
import { basicsScore } from '../src/features/finance/audit.js';
import { purchaseMatrix, saveSupplier, recordPurchase } from '../src/features/suppliers/model.js';
import { buildGuidance } from '../src/features/advisor/engine.js';
import { buildDecisions, ITEM_LENS } from '../src/features/management-hub/decision-engine.js';

const G = COUNCIL.golden, day = d => String(d).slice(0, 10);
test('diretriz: seis agentes, ordem de prioridade e autoridade só de referência', () => {
  assert.equal(COUNCIL.authority, 'reference_only');
  assert.deepEqual(COUNCIL.agents.map(a => a.id), ['resultado', 'rotina', 'ganho', 'cliente', 'compra', 'caixa']);
  assert.equal(COUNCIL.precedence[2], 'caixa');
  for (const lens of Object.values(ITEM_LENS)) assert.ok(lensName(lens), lens);
});
test('T-GAN-01 corrigido: ganho por litro contra ganho por unidade', () => {
  const r = throughputPerConstraint([{ name: 'queijo', gain: 1200, use: 10, demand: 20 }, { name: 'doce', gain: 900, use: 2, demand: 60 }, { name: 'requeijão', gain: 800, use: 4, demand: 40 }], G['T-GAN-01'].constraintLiters);
  assert.equal(r.byUnit.total, G['T-GAN-01'].byUnitGainCents); assert.equal(r.byConstraint.total, G['T-GAN-01'].byConstraintGainCents); assert.equal(r.difference, G['T-GAN-01'].differenceCents);
  assert.equal(throughputPerConstraint([{ name: 'x', gain: NaN, use: 1, demand: 1 }], 10), null, 'custo ausente não vira zero');
  assert.equal(throughputPerConstraint([{ name: 'x', gain: 1, use: 1, demand: 1 }], 0), null, 'sem recurso não presume');
});
test('T-CAI-01: poder do um', () => {
  const p = powerOfOne({ revenue: 800000, cmv: 400000, fixed: 150000 }), g = G['T-CAI-01'], v = (list, id) => list.find(r => r.id === id).cents;
  assert.deepEqual([v(p.result, 'preco'), v(p.result, 'volume'), v(p.result, 'custo'), v(p.result, 'fixos')], [g.price, g.volume, g.directCost, g.fixed]);
  assert.deepEqual([v(p.cash, 'receber'), v(p.cash, 'estoque'), v(p.cash, 'pagar')], [g.receiveDayCash, g.stockDayCash, g.payDayCash]);
  assert.equal(powerOfOne({ revenue: 0, cmv: 0, fixed: 0 }), null);
});
test('T-CAI-02: ciclo pela fórmula do app e soma das alavancas, cada um com sua base', () => {
  const g = G['T-CAI-02'], c = cashCycle({ stockDays: g.stockDays, receiveDays: g.receiveDays, payDays: g.payDays, monthlyCost: g.monthlyCost });
  assert.equal(c.cycle, g.cycle); assert.equal(Math.round(c.working), g.workingCents);
  assert.equal(Math.round(10 * 800000 / 30 + 20 * 400000 / 30 - 15 * 400000 / 30), g.leversCents);
});
test('T-COM-01: matriz de compras', () => {
  const d = { dataContext: { id: 'a', type: 'real' }, products: [], clients: [], sales: [], movements: [], expenses: [] }; let n = 0; const uid = () => 'u' + (++n), NOW = '2026-11-05T15:00:00.000Z';
  for (const s of ['s1', 's2', 's3']) saveSupplier(d, { name: 'Fornecedor ' + s }, { id: s, uid, now: NOW });
  const buy = (name, goods, supplierId) => recordPurchase(d, { supplierId, confirmed: true, name, specification: 'Padrão', unit: 'Unidade', quantity: '1', occurredOn: '2026-10-10', goods: String(goods), freight: '0', discount: '0', charges: '0' }, { id: uid(), uid, now: NOW });
  buy('Pote', 350, 's1'); buy('Leite', 200, 's1'); buy('Leite', 150, 's2'); buy('Açúcar', 100, 's1'); buy('Açúcar', 100, 's2'); buy('Açúcar', 50, 's3'); buy('Rótulo', 30, 's1'); buy('Sacola', 10, 's1'); buy('Sacola', 10, 's2');
  const m = purchaseMatrix(d), q = n => m.rows.find(r => r.name === n).quadrant, g = G['T-COM-01'];
  assert.equal(m.available, true);
  assert.deepEqual([q('Pote'), q('Leite'), q('Rótulo'), q('Açúcar'), q('Sacola')], [g.pote, g.leite, g.rotulo, g.acucar, g.sacola]);
  assert.equal(purchaseMatrix({ ...d, supplierBook: { ...d.supplierBook, purchases: [] } }).available, false);
});
test('T-CLI-01: clientes contados por identificador, sem valor futuro', () => {
  const s = (customerId, total, date) => ({ status: 'completed', customerId, total, date });
  const c = clientConcentration([s('a', 500), s('b', 300), s('c', 100), s('d', 50), s('e', 50), { status: 'completed', total: 9999 }]);
  assert.equal(c.clients, 5); assert.equal(c.concentrated, true); assert.equal(Math.round(c.share * 100), 90);
  assert.equal(clientConcentration([s('a', 1)]).share, null);
  const r = rfmSegments([s('a', 100, '2026-10-30'), s('b', 100, '2026-05-01')], '2026-11-05', day);
  assert.equal(r.available, false); assert.equal(r.fresh, 1); assert.equal(r.dormant, 1);
  assert.ok(!Object.keys(r).some(k => /clv|ltv|futuro|previs/i.test(k)));
});
test('T-RES-01: índice de gestão básica; sem vendas, não mede', () => {
  const sale = { status: 'completed', payments: [{}], items: [{ costKnown: true, costTotal: 1 }] }, unknown = { status: 'completed', payments: [{}], items: [{ costKnown: false }] };
  assert.equal(basicsScore({ sales: [] }).score, null);
  assert.equal(basicsScore({ sales: [sale], backupDays: 2 }).score, 1);
  assert.ok(basicsScore({ sales: [unknown], backupDays: null, stockOk: false }).score < 0.8);
});
test('regras do Conselho entram no motor único, com lente; sem dados, não dizem nada', () => {
  assert.equal(lensOf('caixa:fiado'), 'caixa'); assert.equal(lensOf('fin-meta'), 'rotina'); assert.equal(lensOf('rebuy:x'), 'cliente'); assert.equal(lensOf('sem-dono'), null);
  for (const rule of COUNCIL_RULES) assert.deepEqual(rule({}), []);
  const [fiado] = COUNCIL_RULES[0]({ council: { revenue: 10000, receivable: { overdue: 2000 } } });
  assert.equal(fiado.id, 'caixa:fiado'); assert.equal(fiado.decision.lens, 'caixa'); assert.equal(fiado.decision.owner, 'produtor');
  assert.deepEqual(COUNCIL_RULES[0]({ council: { revenue: 10000, receivable: { overdue: 1000 } } }), []);
  const source = fs.readFileSync(new URL('../src/features/advisor/engine.js', import.meta.url), 'utf8');
  assert.match(source, /\.\.\.COUNCIL_RULES/);
});
test('T-CON-02: motor e regras não leem a edição do app', () => {
  for (const file of ['advisor/council-rules.js', 'advisor/engine.js', 'management-hub/decision-engine.js', 'finance/audit.js', 'finance/producer-calcs.js', 'kpi/kpi-engine.js']) assert.doesNotMatch(fs.readFileSync(new URL('../src/features/' + file, import.meta.url), 'utf8'), /BuildConfig|\bedition\b|gestaoclaude|codexteste/, file);
});
const base = () => ({ st: { grossSales: 10000, returned: 0, revenue: 10000, cmv: 5000, fees: 0, taxes: 0, contribution: 5000, costs: {}, operating: 0, losses: 0, fixed: 0, draw: 0, result: 5000, cash: 5000, cashForecast: 0, investments: 0, costsLogged: false, salesCount: 10 }, general: true, partial: false, empty: false, conference: { origin: 'real', errors: [], blocked: [] }, sales: { registered: 10, eligible: 10, ticket: 1000, lines: 2, daily: [{ date: '2026-10-10', amount: 10000 }], bestDay: { label: '10/10', amount: 10000 }, topHour: '10' }, cash: { recorded: 5000, receivable: { open: 0, count: 0, overdue: 0 }, payable: { open: 0, count: 0, overdue: 0, unknown: 0 }, outlook: { known: false, net: 0 } }, costs: { biggest: null, missingDays: 0 }, products: { rows: [{ revenue: 10000 }], top: { name: 'A', profit: 5000 }, classA: 1, loss: [], missing: 0 }, stock: { withStock: 1, cost: 100, retail: 200, costMissing: 0, out: [], short: [], still: [] }, clients: { sales: 10, identified: 5, anonymous: 5, clients: 5, repeat: 0 }, suppliers: { total: 0, count: 0, top: null, payable: { open: 0, overdue: 0 }, unknown: 0 }, indicators: [{ id: 'gross-margin', value: 50 }, { id: 'ticket', value: 1000 }, { id: 'contribution-rate', value: 50 }, { id: 'break-even', value: null }], gap: null, compare: null });
const format = { money: c => (c < 0 ? '-' : '') + 'R$ ' + (Math.abs(c) / 100).toFixed(2).replace('.', ','), pct: n => n.toFixed(1).replace('.', ',') + '%' };
test('Conselheiro: básico abaixo de 80% fala só de registros; senão, uma decisão da semana', () => {
  const weak = buildDecisions({ ...base(), council: { due: '2026-11-12', basics: { score: 0.6, parts: [{ label: 'informar o custo das vendas', value: 0.2 }, { label: 'conferir o estoque', value: 1 }] } } }, format);
  assert.match(weak.global.summary, /básico vem primeiro/); assert.deepEqual(weak.global.first, []); assert.deepEqual(weak.global.weak, ['informar o custo das vendas']); assert.equal(weak.global.week, null);
  const good = buildDecisions({ ...base(), cash: { ...base().cash, receivable: { open: 500, count: 1, overdue: 500 } }, council: { due: '2026-11-12', basics: { score: 1, parts: [] } } }, format);
  assert.equal(good.global.week.owner, 'você'); assert.equal(good.global.week.due, '2026-11-12'); assert.match(good.global.week.text, /Cobre/);
});
test('as lentes passam pela mesma liberação de números', () => {
  const council = { due: '2026-11-12', basics: { score: 1, parts: [] }, goal: { value: 9000, missing: 4000 }, power: powerOfOne({ revenue: 10000, cmv: 5000, fixed: 0 }), concentration: { concentrated: true, share: 0.9 }, rfm: { available: true, fading: 2 }, matrix: { available: true, rows: [{ name: 'Pote', quadrant: 'estrategico', suppliers: 1 }, { name: 'Açúcar', quadrant: 'alavancagem', suppliers: 3 }] } };
  const out = buildDecisions({ ...base(), stock: { ...base().stock, still: ['X'], stillValue: 700 }, council }, format), all = [...out.operacao, ...out.analise];
  assert.equal(out.withheld, 0); for (const e of all) assert.ok(e.released, e.key);
  const text = k => { const e = all.find(x => x.key === k); return [...e.meaning, ...e.decide].join(' '); };
  assert.match(text('resultado'), /faltam R\$ 40,00/); assert.match(text('caixa'), /Simulação/); assert.match(text('estoque'), /R\$ 7,00/); assert.match(text('clientes'), /sumindo/); assert.match(text('fornecedores'), /Pote depende/);
});
test('demonstração e real: mesma saída do Conselho', () => {
  const council = { due: '2026-11-12', basics: { score: 1, parts: [] } };
  const a = buildDecisions({ ...base(), council }, format), b = buildDecisions({ ...base(), council, conference: { origin: 'demo', errors: [], blocked: [] } }, format);
  assert.deepEqual(a.global, b.global); assert.deepEqual(a.analise, b.analise);
});
test('RFM encontra cliente valioso sumindo pela mediana do próprio produtor', () => {
  const sale = (customerId, total, date) => ({ status: 'completed', customerId, total, date }), list = [];
  for (let i = 0; i < 9; i++) for (const date of ['2026-10-01', '2026-10-15', '2026-11-01']) list.push(sale('c' + i, 1000, date));
  for (const date of ['2026-08-01', '2026-08-15', '2026-09-01']) list.push(sale('v', 9000, date));
  const r = rfmSegments(list, '2026-11-05', day);
  assert.equal(r.available, true); assert.equal(r.fading, 1); assert.equal(r.champions, 9); assert.equal(r.dormant, 0);
});
test('empate do mês não vira boa notícia com resultado negativo', () => {
  const out = buildDecisions({ ...base(), st: { ...base().st, operating: 6000, result: -1000, cash: -1000 }, indicators: [{ id: 'gross-margin', value: 50 }, { id: 'ticket', value: 1000 }, { id: 'contribution-rate', value: 50 }, { id: 'break-even', value: 5000 }], gap: { shortfall: 0, purchases: 0 }, council: { due: '2026-11-12', basics: { score: 1, parts: [] } } }, format), item = out.analise.find(e => e.key === 'indicadores');
  assert.match(item.decide.join(' '), /ainda deixam o resultado negativo/);
});
