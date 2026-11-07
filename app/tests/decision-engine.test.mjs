import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildDecisions, releaseCheck, auditFacts, DECISION_ITEMS, MAX_LINES, estimateLines, conferenceGate, PRECEDENCE } from '../src/features/management-hub/decision-engine.js';

const money = cents => (cents < 0 ? '-' : '') + 'R$ ' + (Math.abs(cents) / 100).toFixed(2).replace('.', ',');
const pct = n => n.toFixed(1).replace('.', ',') + '%';
const format = { money, pct };
const st = { grossSales: 67700, returned: 9000, revenue: 58700, discounts: 300, cmv: 35400, fees: 1842, taxes: 0, contribution: 21458, costs: { feira: 10500, producao: 4500, marketing: 1500, retirada: 25000, investimento: 50000 }, operating: 16500, losses: 7800, fixed: 9000, draw: 25000, result: -36842, cash: -34642, cashAfterForecast: -43642, cashForecast: 9000, investments: 50000, breakEven: 106687, monthlyFixed: 39000, costsLogged: true, salesCount: 7, feesDefault: false };
const input = (extra = {}) => ({
  st, general: true, partial: false, empty: false, conference: { origin: 'real', errors: [], blocked: [], ok: 12, total: 12 },
  sales: { registered: 7, eligible: 5, ticket: 9140, lines: 1.6, daily: [{ date: '2026-10-10', amount: 15700 }, { date: '2026-10-15', amount: 7000 }, { date: '2026-10-18', amount: 13000 }, { date: '2026-10-25', amount: 9000 }, { date: '2026-10-26', amount: -9000 }, { date: '2026-10-31', amount: 23000 }], bestDay: { label: '31/10', amount: 23000 }, topHour: '10' },
  cash: { recorded: -34642, receivable: { open: 4500, count: 1, overdue: 0, dueSoon: 4500 }, payable: { open: 10000, count: 1, overdue: 10000, dueSoon: 0, unknown: 1 }, outlook: { known: true, net: -44500 } },
  costs: { biggest: { name: 'Custos da Feira', amount: 10500 }, missingDays: 0 },
  products: { rows: [{ revenue: 25823 }, { revenue: 17877 }, { revenue: 15000 }], top: { name: 'Café · 1 kg', profit: 10223 }, classA: 3, loss: [], missing: 0 },
  stock: { withStock: 3, cost: 405000, retail: 675000, costMissing: 0, out: [], short: [], still: [] },
  clients: { sales: 5, identified: 1, anonymous: 4, clients: 1, repeat: 0 },
  suppliers: { total: 45000, count: 3, top: { name: 'Fornecedor Fictício', total: 45000 }, payable: { open: 10000, overdue: 10000 }, unknown: 1 },
  indicators: [{ id: 'gross-margin', value: 39.69 }, { id: 'ticket', value: 9140 }, { id: 'contribution-rate', value: 36.56 }, { id: 'break-even', value: 106687 }],
  gap: { shortfall: 47987, purchases: 6 },
  compare: { open: false, hasPrior: false, current: { revenue: 58700, result: -36842 }, previous: { revenue: 0, result: 0 } },
  ...extra,
});
const emptySt = { ...st, grossSales: 0, returned: 0, revenue: 0, cmv: 0, fees: 0, contribution: 0, operating: 0, losses: 0, fixed: 0, draw: 0, result: 0, cash: 0, cashForecast: 0, investments: 0, breakEven: null, salesCount: 0, costsLogged: false };
const zero = () => input({ st: emptySt, empty: true, sales: { registered: 0, eligible: 0, ticket: null, lines: null, daily: [], bestDay: null, topHour: '' }, cash: { recorded: 0, receivable: { open: 0, count: 0, overdue: 0 }, payable: { open: 0, count: 0, overdue: 0, unknown: 0 }, outlook: { known: false, net: 0 } }, costs: { biggest: null, missingDays: 0 }, products: { rows: [], top: null, classA: 0, loss: [], missing: 0 }, stock: { withStock: 0, cost: 0, retail: 0, costMissing: 0, out: [], short: [], still: [] }, clients: { sales: 0, identified: 0, anonymous: 0, clients: 0, repeat: 0 }, suppliers: { total: 0, count: 0, top: null, payable: { open: 0, overdue: 0 }, unknown: 0 }, indicators: [{ id: 'gross-margin', value: null }, { id: 'ticket', value: null }, { id: 'contribution-rate', value: null }, { id: 'break-even', value: null }], gap: null });

const text = e => [...e.meaning, ...e.decide].join(' ');

test('explica os 4 itens de Operação e os 6 de Análise, com significado e decisão', () => {
  const out = buildDecisions(input(), format);
  assert.deepEqual(out.operacao.map(e => e.key), DECISION_ITEMS.operacao.map(([k]) => k));
  assert.deepEqual(out.analise.map(e => e.key), DECISION_ITEMS.analise.map(([k]) => k));
  assert.equal(out.operacao.length + out.analise.length, 10);
  for (const e of [...out.operacao, ...out.analise]) { assert.ok(e.released, e.key); assert.ok(e.meaning.length, e.key); assert.ok(e.decide.length, e.key); assert.ok(estimateLines([...e.meaning, ...e.decide]) <= MAX_LINES, e.key); }
});
test('os valores do texto são os do gabarito', () => {
  const out = buildDecisions(input(), format), by = k => out.operacao.concat(out.analise).find(e => e.key === k);
  assert.match(text(by('resultado')), /-R\$ 368,42/); assert.match(text(by('resultado')), /R\$ 587,00/);
  assert.match(text(by('caixa')), /-R\$ 346,42/); assert.match(text(by('caixa')), /R\$ 100,00/);
  assert.match(text(by('vendas')), /R\$ 91,40/); assert.match(text(by('indicadores')), /39,7%/);
  assert.match(out.global.summary, /-R\$ 368,42/);
  assert.equal(out.global.first[0].priority, 3);
  assert.equal(out.withheld, 0);
});
test('liberação retém texto com número sem fato', () => {
  assert.equal(releaseCheck('O resultado foi R$ 10,00.', { a: 'R$ 10,00' }).ok, true);
  assert.equal(releaseCheck('O resultado foi R$ 11,00.', { a: 'R$ 10,00' }).ok, false);
  assert.equal(releaseCheck('Foram 3 compras.', {}).ok, false);
  assert.equal(releaseCheck('Sobrou {x}.', {}).ok, false);
});
test('auditoria bloqueia a leitura inteira quando a conta não fecha', () => {
  assert.deepEqual(auditFacts(input()), []);
  const out = buildDecisions(input({ st: { ...st, result: st.result + 1 } }), format);
  assert.equal(out.blocked, true); assert.equal(out.global, null); assert.deepEqual(out.operacao, []);
  assert.ok(auditFacts(input({ sales: { ...input().sales, daily: [{ date: 'x', amount: 1 }] } })).length);
});
test('base zerada: nenhum número inventado, nenhum erro', () => {
  const out = buildDecisions(zero(), format);
  assert.equal(out.blocked, false); assert.equal(out.withheld, 0);
  for (const e of [...out.operacao, ...out.analise]) { assert.ok(e.released, e.key); assert.ok(!/\d/.test(text(e).replace(/\b30\b/g, '')), e.key + ': ' + text(e)); assert.ok(e.decide.length, e.key); }
  assert.match(out.global.summary, /Ainda não há registros/);
});
test('um local não recebe contas do negócio inteiro e não afirma causa', () => {
  const out = buildDecisions(input({ general: false, gap: null }), format), all = [...out.operacao, ...out.analise].map(text).join(' ');
  assert.match(text(out.operacao[1]), /Todos os locais/); assert.doesNotMatch(text(out.operacao[2]), /compras vencidas/);
  assert.doesNotMatch(all, /porque|por causa|vai vender|com certeza|garantido que/i);
});
test('custo faltando deixa o resultado parcial e vira a primeira decisão', () => {
  const out = buildDecisions(input({ partial: true, cash: { ...input().cash, payable: { open: 0, count: 0, overdue: 0, unknown: 0 } }, suppliers: { ...input().suppliers, payable: { open: 0, overdue: 0 }, unknown: 0 } }), format);
  assert.match(text(out.operacao[1]), /parcial/); assert.equal(out.global.first[0].key, 'resultado');
});
test('Conferência: sem ela, com origem não confirmada ou com erro, nada é liberado', () => {
  for (const conference of [undefined, { origin: 'unconfirmed' }, { origin: 'real', errors: [{ title: 'Pagamentos conferem com as vendas', problem: '1 venda não fecha.' }] }, { origin: 'real', blocked: ['Há registro repetido.'] }]) {
    const out = buildDecisions(input({ conference }), format);
    assert.equal(out.blocked, true); assert.equal(out.gate, true); assert.equal(out.global, null); assert.deepEqual([...out.operacao, ...out.analise], []); assert.ok(out.problems.length);
  }
  assert.deepEqual(conferenceGate({ origin: 'demo', errors: [], blocked: [] }), []);
  assert.equal(buildDecisions(input({ conference: { origin: 'demo', errors: [], blocked: [] } }), format).blocked, false);
});
test('demonstração e dados reais usam a mesma matemática', () => {
  const real = buildDecisions(input(), format), demo = buildDecisions(input({ conference: { origin: 'demo', errors: [], blocked: [] } }), format);
  assert.deepEqual(demo.operacao, real.operacao); assert.deepEqual(demo.analise, real.analise); assert.deepEqual(demo.global, real.global);
});
test('resultado parcial nunca é apresentado como lucro', () => {
  const positive = { ...st, operating: 0, losses: 0, fixed: 0, draw: 0, costs: { ...st.costs, feira: 0, producao: 0, marketing: 0, retirada: 0 }, result: st.contribution };
  const out = buildDecisions(input({ st: positive, partial: true }), format), item = out.operacao[1];
  assert.doesNotMatch(text(item), /sobrou/); assert.match(text(item), /parcial/); assert.match(out.global.summary, /parcial/); assert.equal(out.global.first[0].integrity, true);
});
test('decisões seguem a ordem do Conselho, até três e uma por família', () => {
  const out = buildDecisions(input({ partial: true }), format), keys = out.global.first.map(a => a.key);
  assert.equal(keys[0], 'resultado'); assert.equal(keys[1], 'caixa'); assert.ok(keys.length <= 3);
  assert.equal(new Set(out.global.first.map(a => a.rank)).size, keys.length);
  assert.ok(PRECEDENCE.caixa < PRECEDENCE.resultado && PRECEDENCE.resultado < PRECEDENCE.produtos && PRECEDENCE.produtos < PRECEDENCE.clientes && PRECEDENCE.clientes < PRECEDENCE.fornecedores);
  const first = buildDecisions(input({ sales: { ...input().sales, ticket: 9140 }, st: { ...st, returned: 9000 } }), format).global.first[0];
  assert.equal(first.key, 'caixa');
});
test('a Orientações passa pela Conferência do app', () => {
  const ui = fs.readFileSync(new URL('../src/legacy/erp-ui.js', import.meta.url), 'utf8');
  assert.match(ui, /input\.conference=mghConference\(sel,report\)/);
  assert.match(ui, /function mghConference[^\n]*auditRun\(\)/);
});
test('as regras ficam gravadas no sistema', async () => {
  const { INTERFACE_GUIDELINES } = await import('../src/data/interface-guidelines.js');
  assert.match(INTERFACE_GUIDELINES.decisionPower, /poder de decisão/);
  assert.ok(fs.readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8').includes('Poder de decisão'));
  assert.ok(fs.readFileSync(new URL('../public/knowledge/premissas-interface.md', import.meta.url), 'utf8').includes('Poder de Decisão'));
});

test('comparação não conclui queda ou crescimento do lucro com custos históricos parciais',()=>{
 const result=buildDecisions(input({compare:{open:false,hasPrior:true,partial:true,current:{revenue:58700,result:10000},previous:{revenue:50000,result:20000}}}),format);
 const row=result.analise.find(r=>r.key==='comparacao');assert.equal(row.released,true);assert.match(row.meaning.join(' '),/parcial/);assert.match(row.decide.join(' '),/custos/);assert.doesNotMatch(row.decide.join(' '),/resultado caiu|resultado não caiu|Receita e resultado caíram/);
});
