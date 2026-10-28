import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markupPrice, breakEvenUnits, periodIndicators, discountImpact, cardNet, cashOrTerm, quickCompare, restockPlan, cashCycle, harvestCost, convertMeasure, loanPayment, investmentReturn, parseBR } from '../src/features/finance/producer-calcs.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('preço pelo markup: despesas sobre o preço, por divisão', () => {
  const r = markupPrice({ cost: 9, margin: 20, card: 4.98, fair: 5, tax: 0 });
  assert.equal(r.status, 'ok');
  near(r.markup, 1 / (1 - 0.0998 - 0.2));
  near(r.price, 12.85347, 1e-4);
  near(r.profit, r.price * 0.2);
  near(r.expenses, r.price * 0.0998);
  near(r.price - r.expenses - r.profit, 9); // prova: o preço paga custo, despesas e lucro
  near(r.naive, 11.6982, 1e-3);
  near(r.naiveMargin, 0.130851, 1e-5); // somar as porcentagens deixa só ~13,1%
});

test('preço: margem vazia não vira zero; despesas e margem ≥ 100% é impossível', () => {
  assert.equal(markupPrice({ cost: 9, margin: NaN, card: 3 }), null);
  assert.equal(markupPrice({ cost: NaN, margin: 20 }), null);
  assert.equal(markupPrice({ cost: 9, margin: 80, card: 20 }).status, 'impossible');
  assert.equal(markupPrice({ cost: 9, margin: 20 }).status, 'ok'); // taxas vazias = sem taxa informada
});

test('ponto de equilíbrio e meta, arredondando para cima', () => {
  const r = breakEvenUnits({ fixed: 1200, price: 15, variable: 9, profit: 600 });
  assert.equal(r.units, 200);
  assert.equal(r.goalUnits, 300);
  near(r.contributionRate, 0.4);
  assert.equal(breakEvenUnits({ fixed: 1000, price: 15, variable: 9 }).units, 167);
  assert.equal(breakEvenUnits({ fixed: 1000, price: 9, variable: 9 }).status, 'no-margin');
});

test('indicadores do período: perdas só com levado e perdido', () => {
  const r = periodIndicators({ revenue: 3600, count: 180, previous: 3200, taken: 260, lost: 20 });
  near(r.ticket, 20);
  near(r.change, 0.125);
  near(r.lossRate, 20 / 260);
  assert.equal(periodIndicators({ revenue: 3600, count: 180 }).lossRate, null);
  assert.equal(periodIndicators({ revenue: 3600, count: 0 }), null);
});

test('desconto: quanto vender a mais e desconto máximo', () => {
  const r = discountImpact({ price: 15, variable: 9, discount: 10, qty: 300 });
  near(r.newPrice, 13.5);
  near(r.extra, 6 / 4.5 - 1);
  assert.equal(r.newQty, 400);
  near(r.maxDiscount, 0.4);
  near(r.marginCut, 0.25);
  assert.equal(discountImpact({ price: 15, variable: 9, discount: 40 }).status, 'loss');
});

test('taxa da maquininha: líquido e preço para o líquido desejado', () => {
  const r = cardNet({ value: 100, rate: 3.5, wanted: 100 });
  near(r.net, 96.5);
  near(r.fee, 3.5);
  near(r.grossFor, 100 / 0.965);
  assert.equal(cardNet({ rate: 3.5 }), null);
  assert.equal(cardNet({ value: 50, rate: 2 }).grossFor, null);
});

test('número em pt-BR; vazio é desconhecido', () => {
  assert.equal(parseBR('1.234,56'), 1234.56);
  assert.equal(parseBR('R$ 9'), 9);
  assert.equal(parseBR('4,98'), 4.98);
  assert.equal(parseBR('1.200'), 1200);
  assert.ok(Number.isNaN(parseBR('')));
  assert.equal(parseBR('0'), 0); // zero informado é conhecido
  assert.equal(parseBR('9.5'), 9.5);
  assert.equal(parseBR(',5'), 0.5);
  for (const bad of ['1.23.4', '12.34,5', '1,2,3', '1,', 'abc', '1.2.3,4', '--1']) assert.ok(Number.isNaN(parseBR(bad)), bad);
});

test('equilíbrio exato: nessa unidade os custos ficam pagos, a sobra começa na seguinte', () => {
  assert.equal(breakEvenUnits({ fixed: 1200, price: 15, variable: 9 }).exact, true);
  assert.equal(breakEvenUnits({ fixed: 1000, price: 15, variable: 9 }).exact, false);
  assert.equal(breakEvenUnits({ fixed: 0.3, price: 0.2, variable: 0.1 }).units, 3); // sem erro de arredondamento
});

test('fornecedor: à vista ou a prazo', () => {
  const r = cashOrTerm({ cash: 950, term: 1000, days: 30 });
  near(r.implicit, 1000 / 950 - 1);
  assert.equal(r.hasRate, false);
  const withRate = cashOrTerm({ cash: 950, term: 1000, days: 30, rate: 2 });
  near(withRate.today, 1000 / 1.02);
  assert.equal(withRate.best, 'cash'); // a prazo trazido para hoje ainda custa mais que 950
  assert.equal(cashOrTerm({ cash: 990, term: 1000, days: 60, rate: 3 }).best, 'term');
  assert.equal(cashOrTerm({ cash: 950, term: 1000, days: 0 }), null);
  assert.equal(cashOrTerm({ cash: NaN, term: 1000, days: 30 }), null);
});

test('estoque: quando pedir e quanto comprar', () => {
  const r = restockPlan({ daily: 4, onHand: 40, leadDays: 3, safetyDays: 2, coverDays: 7 });
  assert.equal(r.reorderAt, 20);
  assert.equal(r.daysLeft, 5);
  assert.equal(r.orderNow, false);
  assert.equal(r.quantity, 8); // 4 × (3 + 2 + 7) − 40
  assert.equal(restockPlan({ daily: 4, onHand: 10, leadDays: 3, coverDays: 7 }).orderNow, true);
  assert.equal(restockPlan({ daily: 0, onHand: 10, leadDays: 3, coverDays: 7 }), null);
});

test('ciclo de caixa e dinheiro de giro', () => {
  const r = cashCycle({ stockDays: 20, receiveDays: 15, payDays: 30, monthlyCost: 3000 });
  assert.equal(r.cycle, 5);
  near(r.working, 500);
  assert.equal(cashCycle({ stockDays: 5, receiveDays: 0, payDays: 30, monthlyCost: 3000 }).working, 0);
  assert.equal(cashCycle({ stockDays: 5, receiveDays: 0, payDays: 30 }).working, null);
});

test('custo da safra por unidade; campos vazios não viram zero, mas não impedem a conta', () => {
  const r = harvestCost({ inputs: 8000, labor: 6000, machines: 2000, other: NaN, produced: 40, price: 1200 });
  assert.equal(r.total, 16000);
  assert.equal(r.unit, 400);
  assert.equal(r.informed, 3);
  near(r.margin, 800 / 1200);
  near(r.breakEvenQty, 16000 / 1200);
  assert.equal(harvestCost({ inputs: NaN, labor: NaN, produced: 40 }), null);
});

test('medidas do campo', () => {
  const r = convertMeasure({ value: 3, from: 'saca' });
  assert.equal(r.rows.find(x => x.id === 'kg').value, 180);
  assert.equal(r.rows.find(x => x.id === 'arroba').value, 12);
  near(convertMeasure({ value: 1, from: 'alqmg' }).rows.find(x => x.id === 'ha').value, 4.84);
  assert.equal(convertMeasure({ value: 1, from: 'litro' }), null);
});

test('financiamento pela tabela Price e retorno do investimento', () => {
  const r = loanPayment({ principal: 10000, rate: 2, months: 12 });
  near(r.payment, 945.5960, 1e-3);
  near(r.interest, r.payment * 12 - 10000);
  near(loanPayment({ principal: 1200, rate: 0, months: 12 }).payment, 100);
  assert.equal(loanPayment({ principal: 1200, rate: 2, months: 1.5 }), null);
  const i = investmentReturn({ cost: 3000, monthlyGain: 250, lifeMonths: 60 });
  assert.equal(i.payback, 12);
  near(i.roi, 4);
  assert.equal(investmentReturn({ cost: 3000, monthlyGain: 0 }).status, 'no-return');
});

test('comparação rápida de fornecedores pelo custo por unidade com frete', () => {
  const r = quickCompare([{ price: 100, qty: 10, freight: 20 }, { price: 110, qty: 10, freight: 0 }, { price: NaN, qty: 5 }]);
  assert.equal(r.rows.length, 2);
  assert.equal(r.best, 1); // 11,00 contra 12,00 por unidade
  near(r.saving, 1 / 12);
  assert.equal(r.missingFreight, false);
  assert.equal(quickCompare([{ price: 100, qty: 10 }]), null);
  assert.equal(quickCompare([{ price: 100, qty: 10 }, { price: 50, qty: 5 }]).tie, true);
  assert.equal(quickCompare([{ price: 100, qty: 10 }, { price: 40, qty: 5 }]).missingFreight, true);
});
