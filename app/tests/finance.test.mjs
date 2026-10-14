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

import { FINANCE_RULES, financeLines } from '../src/features/advisor/finance-rules.js';
const run = finance => FINANCE_RULES.flatMap(rule => rule({ finance }));
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
  const out = run({ ...base, margins: [{ id: 'q', name: 'Queijo', revenue: 30000, cost: 25000, qty: 10, margin: 1 / 6 }] });
  const m = out.find(d => d.id === 'fin-margem-q');
  assert.match(m.todo, /R\$\s?41,90/); // custo 25,00 ÷ 0,6 = 41,67 → 41,90
});

test('agente responde em frases sobre o dinheiro', () => {
  assert.match(financeLines({ ...base, breakEven: 120000 }).join(' '), /Para empatar o mês/);
});
