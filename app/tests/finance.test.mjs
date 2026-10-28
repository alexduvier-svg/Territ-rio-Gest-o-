import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statement, monthShares, profitByPlace, productMargins, costKind, suggestedGoal, cardFeesOf, financeSettings } from '../src/features/finance/finance.js';

const sale = (o) => ({ total: 10000, subtotal: 10000, discount: 0, cost: 5000, scope: 'loja', payments: [{ method: 'Pix', amount: o?.total ?? 10000 }], items: [], ...o });

test('demonstrativo: margem de contribuição desconta custo dos produtos e taxa de cartão', () => {
  const s = statement({ sales: [sale({ payments: [{ method: 'Crédito', amount: 10000 }] })], expenses: [], settings: {}, shares: [] });
  assert.equal(s.revenue, 10000);
  assert.equal(s.cmv, 5000);
  assert.equal(s.fees, 498); // 4,98% de R$ 100
  assert.equal(s.contribution, 4502);
  assert.equal(s.result, 4502);
});

test('custos lançados, fixos rateados e retirada entram no resultado', () => {
  const settings = { fixedCosts: [{ title: 'Energia', amount: 30000 }], drawOn: true, drawMonthly: 60000 };
  const s = statement({
    sales: [sale({ total: 200000, subtotal: 200000, cost: 80000, payments: [{ method: 'Pix', amount: 200000 }] })],
    expenses: [{ amount: 5000, kind: 'feira' }, { amount: 2000, category: 'Marketing' }],
    settings, shares: [{ month: '2026-10', share: 1 }],
  });
  assert.equal(s.costs.feira, 5000);
  assert.equal(s.costs.marketing, 2000);
  assert.equal(s.fixed, 30000);
  assert.equal(s.draw, 60000);
  assert.equal(s.result, 200000 - 80000 - 5000 - 2000 - 30000 - 60000);
  assert.equal(s.breakEven, Math.round(90000 / 0.6)); // (fixos + retirada) ÷ 60%
});

test('fixos e retirada mensal só entram em "Todos os locais"', () => {
  const s = statement({ sales: [sale()], expenses: [], settings: { fixedCosts: [{ title: 'Internet', amount: 10000 }] }, shares: [{ month: '2026-10', share: 1 }], general: false });
  assert.equal(s.fixed, 0);
});

test('rateio: um dia de outubro é 1/31 do mês; ano atual conta até o mês corrente', () => {
  assert.deepEqual(monthShares({ days: ['2026-10-13'] }), [{ month: '2026-10', share: 1 / 31 }]);
  assert.equal(monthShares({ year: '2026', today: '2026-10-13' }).length, 10);
  const week = monthShares({ days: ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'] });
  assert.equal(week.length, 2);
});

test('lucro por feira desconta os custos lançados naquele local', () => {
  const rows = profitByPlace({
    sales: [sale({ scope: 'f1', total: 21000, cost: 9000, payments: [{ method: 'Pix', amount: 21000 }] })],
    expenses: [{ scope: 'f1', amount: 24000, kind: 'feira' }],
    settings: {}, nameOf: id => id,
  });
  assert.equal(rows[0].profit, 21000 - 9000 - 24000);
});

test('margem por produto reparte o desconto da venda', () => {
  const m = productMargins([{ total: 9000, subtotal: 10000, items: [{ productId: 'a', name: 'Queijo', total: 10000, costTotal: 6000, qty: 2 }] }]);
  assert.equal(m[0].revenue, 9000);
  assert.equal(Math.round(m[0].margin * 100), 33);
});

test('tipos de custo, meta sugerida e taxas configuráveis', () => {
  assert.equal(costKind({ category: 'Operação' }), 'feira');
  assert.equal(costKind({ kind: 'producao' }), 'producao');
  assert.equal(suggestedGoal([100000, 120000, -5000]), 121000);
  assert.equal(cardFeesOf([sale({ payments: [{ method: 'Débito', amount: 10000 }] })], financeSettings({ cardFees: { Débito: 1 } })), 100);
});

import { buildGuidance } from '../src/features/advisor/engine.js';
import { FINANCE_RULES, financeLines } from '../src/features/advisor/finance-rules.js';
const run = finance => FINANCE_RULES.flatMap(rule => rule({ finance, quality: {completeCosts:true} }));
const base = { mode: 'mes', general: true, revenue: 100000, contribution: 50000, contributionRate: 0.5, fees: 0, costs: { feira: 0, producao: 0, marketing: 0, retirada: 0 }, fixed: 0, draw: 0, result: 50000, salesCount: 10, monthlyFixed: 0, breakEven: null, places: [], margins: [], missingDays: [], fixedCount: 1, drawOn: true, goal: null };

test('agente: feira que não pagou os custos é urgente', () => {
  const out = run({ ...base, places: [{ id: 'f', name: 'Feira de Sexta', revenue: 21000, cmv: 9000, fees: 0, costs: 24000, profit: -12000 }] });
  const loss = out.find(d => d.id === 'fin-feira-prejuizo');
  assert.equal(loss.level, 'urgente');
  assert.match(loss.happened, /Faltaram R\$\s?120,00/);
});

test('agente: ponto de equilíbrio e custos faltando', () => {
  const out = run({ ...base, monthlyFixed: 60000, breakEven: 120000, missingDays: [{ name: 'Feira X', day: '2026-10-09' }] });
  assert.ok(out.some(d => d.id === 'fin-equilibrio' && /200,00/.test(d.title)));
  assert.ok(out.some(d => d.id === 'fin-custos-faltando'));
});

test('agente: margem baixa sugere preço para 40%', () => {
  const g = buildGuidance({dataContext:{type:'real'},periodLabel:'Teste',hasCost:true,products:[],events:[],current:{revenue:30000,cost:25000,result:5000,salesCount:10,ticket:3000,productsPerSale:1.5,rank:[],identified:10,clients:5,returning:3},finance:{...base,revenue:30000,margins:[{id:'q',name:'Queijo',revenue:30000,cost:25000,qty:10,margin:1/6,costKnown:true}]}});
  const m = g.all.find(d => d.id === 'campeao-margem');
  assert.match(m.todo, /R\$\s?41,90/); // custo 25,00 ÷ 0,6 = 41,67 → 41,90
});

test('agente responde em frases sobre o dinheiro', () => {
  assert.match(financeLines({ ...base, breakEven: 120000 }).join(' '), /Para empatar o mês/);
});

import { lossValue } from '../src/features/finance/finance.js';

test('auditoria: devolução entra no dia da devolução e estorna receita e custo, mas não a taxa', () => {
  const s = statement({
    sales: [sale({ total: 10000, cost: 4000, payments: [{ method: 'Crédito', amount: 10000 }] })],
    returns: [{ total: 10000, cost: 4000 }], expenses: [], settings: {}, shares: [],
  });
  assert.equal(s.revenue, 0);
  assert.equal(s.cmv, 0);
  assert.equal(s.fees, 498);
  assert.equal(s.result, -498); // a maquininha fica com a taxa
});

test('auditoria: perdas de estoque entram no resultado (quantidade × custo)', () => {
  const v = lossValue([{ kind: 'loss', qty: 3, productId: 'a' }, { kind: 'sale', qty: 9 }, { kind: 'loss', qty: 1, cost: 500 }], () => 1000);
  assert.equal(v, 3500);
  const s = statement({ sales: [sale()], expenses: [], losses: v, settings: {}, shares: [] });
  assert.equal(s.result, 10000 - 5000 - 3500);
  assert.equal(statement({ sales: [sale()], expenses: [], losses: v, settings: {}, shares: [], general: false }).losses, 0);
});

test('auditoria: retirada lançada substitui a planejada (sem contar duas vezes)', () => {
  const s = statement({ sales: [sale()], expenses: [{ amount: 150000, kind: 'retirada' }], settings: { drawOn: true, drawMonthly: 150000 }, shares: [{ month: '2026-10', share: 1 }] });
  assert.equal(s.draw, 150000);
});

test('auditoria: investimento sai do caixa mas não do resultado; imposto sobre venda entra', () => {
  const s = statement({ sales: [sale({ payments: [{ method: 'Dinheiro', amount: 10000 }] })], expenses: [{ amount: 80000, kind: 'investimento' }], settings: { salesTaxRate: 1.5 }, shares: [] });
  assert.equal(s.taxes, 150);
  assert.equal(s.result, 10000 - 5000 - 150);
  assert.equal(s.investments, 80000);
  assert.equal(s.cash, 10000 - 150 - 80000);
  assert.equal(s.received.Dinheiro, 10000);
  assert.ok(s.checks);
});

import { runAudit } from '../src/features/finance/audit.js';

test('conferência: dados corretos passam em tudo', () => {
  const a = runAudit({
    sales: [{ status: 'completed', date: '2026-10-13T10:00:00Z', total: 9000, discount: 1000, cost: 4000, payments: [{ method: 'Pix', amount: 9000 }], items: [{ productId: 'p', total: 10000, costTotal: 4000 }] }],
    products: [{ id: 'p', name: 'Café', price: 5000, cost: 2000, stock: 8 }],
    movements: [{ productId: 'p', date: '2026-10-13T10:00:00Z', after: 8 }],
    expenses: [{ title: 'Barraca', amount: 3000, date: '2026-10-13T12:00:00-03:00', scope: 'f' }],
    today: '2026-10-13', now: Date.parse('2026-10-13T12:00:00Z'), backupAt: '2026-10-12T10:00:00Z',
  });
  assert.equal(a.ok, a.total);
  assert.equal(a.errors, 0);
  assert.equal(a.warnings, 0);
});

test('conferência: aponta pagamento errado, estoque divergente, custo em dobro e data futura', () => {
  const a = runAudit({
    sales: [{ status: 'completed', date: '2026-10-13T10:00:00Z', total: 9000, payments: [{ method: 'Pix', amount: 8000 }], items: [] }],
    products: [{ id: 'p', name: 'Café', price: 5000, cost: 2000, stock: 5 }, { id: 'q', name: 'Mel', price: 3000, cost: 0, stock: -1 }],
    movements: [{ productId: 'p', date: '2026-10-13T10:00:00Z', after: 8 }],
    expenses: [{ title: 'Barraca', amount: 3000, date: '2026-10-13', scope: 'f' }, { title: 'barraca ', amount: 3000, date: '2026-10-13', scope: 'f' }, { title: 'Gelo', amount: 500, date: '2026-10-20' }],
    today: '2026-10-13', now: Date.parse('2026-10-13T12:00:00Z'),
  });
  const failed = a.checks.filter(c => !c.ok).map(c => c.id).sort();
  assert.deepEqual(failed, ['copia', 'duplicado', 'estoque', 'futuro', 'negativo', 'pagamentos']);
  assert.equal(a.errors, 3); // pagamentos, negativo, futuro
  assert.equal(a.warnings, 3); // estoque, duplicado, cópia
});

test('lucro por local usa o mesmo imposto do demonstrativo', () => {
  const sale = { scope: 'feira', total: 10000, cost: 4000, payments: [{ method: 'Pix', amount: 10000 }] };
  const settings = { salesTaxRate: 10 };
  const st = statement({ sales: [sale], expenses: [], settings, general: false });
  const [place] = profitByPlace({ sales: [sale], expenses: [], settings, nameOf: id => id });
  assert.equal(st.result, 5000);
  assert.equal(place.taxes, 1000);
  assert.equal(place.profit, st.result);
});

test('devolução em outro mês: setembro mantém a venda, outubro recebe o estorno', () => {
  const sale = { scope: 'feira', status: 'returned', date: '2026-09-10T10:00:00-03:00', returnedAt: '2026-10-05T10:00:00-03:00', total: 10000, subtotal: 10000, cost: 4000,
    payments: [{ method: 'Pix', amount: 10000 }], items: [{ productId: 'q', name: 'Queijo', total: 10000, costTotal: 4000, qty: 2 }] };
  const settings = {};
  const set = profitByPlace({ sales: [sale], returns: [], expenses: [], settings, nameOf: id => id });
  const out = profitByPlace({ sales: [], returns: [sale], expenses: [], settings, nameOf: id => id });
  assert.equal(set[0].revenue, statement({ sales: [sale], returns: [], expenses: [], settings, general: false }).revenue);
  assert.equal(out[0].revenue, -10000);
  assert.equal(out[0].profit, statement({ sales: [], returns: [sale], expenses: [], settings, general: false }).result);
  assert.equal(productMargins([sale], [])[0].qty, 2);
  assert.equal(productMargins([], [sale])[0].qty, -2);
  assert.equal(productMargins([sale], [sale]).length, 0);
});

test('retirada: a lançada substitui a planejada só no mês em que foi lançada', () => {
  const months = Array.from({ length: 3 }, (_, i) => ({ month: `2026-0${i + 1}`, share: 1 }));
  const s = statement({ sales: [], expenses: [{ amount: 50000, kind: 'retirada', date: '2026-02-10T12:00:00-03:00' }], settings: { drawOn: true, drawMonthly: 150000 }, shares: months });
  assert.equal(s.drawLogged, 50000);
  assert.equal(s.draw, 50000 + 2 * 150000); // janeiro e março seguem planejados
  assert.equal(s.drawForecast, 300000);
  assert.equal(s.cashForecast, 300000);
  assert.ok(s.checks);
});

test('taxa do cartão: padrão não salvo fica marcado como estimativa', () => {
  const card = sale({ payments: [{ method: 'Crédito', amount: 10000 }] });
  assert.equal(financeSettings({}).feesConfirmed.Crédito, false);
  assert.equal(statement({ sales: [card], expenses: [], settings: {}, shares: [] }).feesDefault, true);
  assert.equal(statement({ sales: [card], expenses: [], settings: { cardFees: { Crédito: 3 } }, shares: [] }).feesDefault, false);
  assert.equal(statement({ sales: [sale({ payments: [{ method: 'Pix', amount: 10000 }] })], expenses: [], settings: {}, shares: [] }).feesDefault, false);
});
