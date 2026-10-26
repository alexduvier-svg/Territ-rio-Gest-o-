import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markupPrice, breakEvenUnits, periodIndicators, discountImpact, cardNet, cashOrTerm, parseBR } from '../src/features/finance/producer-calcs.js';

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
