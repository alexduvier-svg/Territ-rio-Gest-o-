// node --test tests/forecast.test.mjs — agente de previsões local.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { forecastNextEvent, runOut, dailyRates, bestMoments } from '../src/features/advisor/forecast.js';
import { answer } from '../src/features/advisor/agent.js';
import { buildGuidance } from '../src/features/advisor/engine.js';

const empty = { revenue: 0, cost: 0, expense: 0, result: 0, salesCount: 0, ticket: 0, productsPerSale: 0, rank: [], identified: 0, clients: 0, returning: 0, newClients: 0, marketing: 0, purchasesPerClient: 0, qrShown: 0, qrRead: 0 };
const products = [
  { id: 'cafe', name: 'Café Especial', price: 2500, cost: 1200, stock: 8, min: 3, unitShort: 'pct', unitLabel: 'pacotes' },
  { id: 'queijo', name: 'Queijo', price: 3000, cost: 1800, stock: 20, min: 2, unitShort: 'un', unitLabel: 'unidades' },
];
const events = [
  { id: 'e3', name: 'Feira 3', start: '2026-10-03', days: 1, items: [{ productId: 'cafe', sold: 10, taken: 10, left: 0 }, { productId: 'queijo', sold: 4, taken: 8, left: 4 }] },
  { id: 'e2', name: 'Feira 2', start: '2026-09-26', days: 1, items: [{ productId: 'cafe', sold: 8, taken: 12, left: 4 }, { productId: 'queijo', sold: 5, taken: 8, left: 3 }] },
];
const daily = [
  { day: '2026-10-10', hour: 9, productId: 'cafe', qty: 3, amount: 7500 },
  { day: '2026-10-11', hour: 9, productId: 'cafe', qty: 4, amount: 10000 },
  { day: '2026-10-12', hour: 15, productId: 'queijo', qty: 1, amount: 3000 },
];
const base = { periodLabel: 'Outubro de 2026', hasCost: true, portfolioPublished: true, today: '2026-10-13', products, events: [], current: { ...empty }, previous: null, history: { events, daily }, upcoming: { name: 'Feira de Sábado', daysUntil: 3, days: 1 } };

test('previsão da próxima feira: ponderada, ajusta quando esgotou e aponta o que falta', () => {
  const f = forecastNextEvent(base);
  const cafe = f.lines.find(l => l.id === 'cafe');
  // (10×1,25×0,4 + 8×0,3) ÷ 0,7 = 10,57 → 11 pacotes; tem 8 → faltam 3
  assert.equal(cafe.take, 11);
  assert.equal(cafe.missing, 3);
  assert.match(cafe.basis, /esgotou/);
  assert.equal(f.confidence, 'média');
  assert.ok(f.low < f.revenue && f.revenue < f.high);
});

test('sem feiras no histórico usa o ritmo diário', () => {
  const f = forecastNextEvent({ ...base, history: { events: [], daily } });
  assert.ok(f.lines.length > 0);
  assert.equal(f.confidence, 'muito baixa');
  assert.match(f.lines[0].basis, /ritmo/);
});

test('ritmo diário e fim do estoque', () => {
  const rate = dailyRates(daily, '2026-10-13');
  assert.equal(Math.round(rate.get('cafe') * 7), 7); // 7 pacotes em 7 dias observados
  const r = runOut(base).find(x => x.id === 'cafe');
  assert.equal(Math.round(r.days), 8);
  assert.deepEqual(dailyRates([], '2026-10-13').size, 0);
});

test('melhor dia e horário', () => {
  const m = bestMoments(daily);
  assert.equal(m.hour, 9);
  assert.equal(m.day, 'domingo'); // 11/10/2026
});

test('orientação inclui a previsão com botão de repor', () => {
  const g = buildGuidance(base);
  const d = g.all.find(x => x.id === 'previsao-feira');
  assert.ok(d);
  assert.match(d.todo, /Café Especial \(faltam 3 pct\)/);
  assert.equal(d.cta.action, 'restock-ids');
});

test('agente responde ao assunto da pergunta', () => {
  assert.match(answer('O que levar para a feira?', base), /^Previsão\nPara a Feira de Sábado/);
  assert.match(answer('quando acaba o estoque?', base), /^Estoque\n/);
  assert.match(answer('qual meu melhor horário?', base), /das 9h às 10h/);
  assert.match(answer('', base), /Faça agora|Previsão:/);
});
