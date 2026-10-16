// node --test tests/  — motor de orientação e banco de produtos (sem navegador).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGuidance, guidanceText, priceFor } from '../src/features/advisor/engine.js';
import { TOPICS, CHECKLISTS, AI_GUIDE } from '../src/features/advisor/knowledge.js';
import { MARKET_CATALOG } from '../src/data/market-catalog.js';

const empty = { revenue: 0, cost: 0, expense: 0, result: 0, salesCount: 0, ticket: 0, productsPerSale: 0, rank: [], identified: 0, clients: 0, returning: 0, newClients: 0, marketing: 0, purchasesPerClient: 0, qrShown: 0, qrRead: 0 };
const product = (id, name, price, cost, stock = 10, min = 2) => ({ id, name, price, cost, stock, min, unitLabel: 'unidades' });
function input(over = {}) {
  return {
    dataContext:{type:'real',id:'test'}, periodLabel: 'Outubro de 2026', previousLabel: 'Setembro de 2026', hasCost: true, portfolioPublished: true,
    products: [], events: [], upcoming: null,
    ...over,
    current: { ...empty, ...over.current },
    previous: over.previous === null ? null : { ...empty, ...over.previous },
  };
}

test('preço sugerido termina em 90 e alcança 40% de lucro', () => {
  assert.equal(priceFor(1500), 2590);
  assert.ok((2590 - 1500) / 2590 >= 0.4);
  assert.equal(priceFor(1000) % 100, 90);
});

test('sem vendas: orienta a registrar, sem números inventados', () => {
  const g = buildGuidance(input());
  assert.match(g.situation, /Ainda não há vendas/);
  assert.equal(g.actions[0].id, 'sem-vendas');
});

test('campeão com pouco lucro gera ação de preço com o valor real', () => {
  const g = buildGuidance(input({
    products: [product('esp', 'Café Especial', 2000, 1500), product('gou', 'Café Gourmet', 1500, 800)],
    current: { revenue: 30000, cost: 20000, result: 10000, salesCount: 15, ticket: 2000, productsPerSale: 1.5, identified: 10, clients: 8, returning: 4,
      rank: [{ id: 'esp', name: 'Café Especial', qty: 12, amount: 24000 }, { id: 'gou', name: 'Café Gourmet', qty: 4, amount: 6000 }] },
  }));
  const d = g.all.find(x => x.id === 'campeao-margem');
  assert.ok(d, 'deve existir');
  assert.match(d.todo, /Café Especial de R\$\s20,00 para R\$\s25,90/);
  assert.ok(g.actions.includes(d), 'entra no "Faça agora"');
  assert.ok(d.numbers.some(n => n.label === 'Preço sugerido'));
});

test('prejuízo é urgente e diz quantas vendas faltaram', () => {
  const g = buildGuidance(input({
    products: [product('a', 'Queijo', 3000, 2000)],
    current: { revenue: 30000, cost: 20000, expense: 15000, result: -5000, salesCount: 10, ticket: 3000, productsPerSale: 1.5, identified: 8, clients: 6, returning: 3,
      rank: [{ id: 'a', name: 'Queijo', qty: 10, amount: 30000 }] },
  }));
  assert.equal(g.actions[0].id, 'prejuizo');
  assert.equal(g.actions[0].level, 'urgente');
  assert.match(g.actions[0].todo, /5 vendas para empatar/);
  assert.match(g.situation, /prejuízo/);
});

test('encalhe e esgotou por feira, com a sobra em reais', () => {
  const g = buildGuidance(input({
    products: [product('e', 'Café Especial', 2500, 1200), product('t', 'Café Tradicional', 1000, 500)],
    events: [{ id: 'f1', name: 'Feira de Sábado', items: [
      { productId: 't', name: 'Café Tradicional', taken: 5, left: 4, price: 1000 },
      { productId: 'e', name: 'Café Especial', taken: 10, left: 0, price: 2500 },
    ] }],
    current: { revenue: 26000, cost: 12500, result: 13500, salesCount: 11, ticket: 2364, productsPerSale: 1.4, identified: 9, clients: 7, returning: 3,
      rank: [{ id: 'e', name: 'Café Especial', qty: 10, amount: 25000 }, { id: 't', name: 'Café Tradicional', qty: 1, amount: 1000 }] },
  }));
  const stuck = g.all.find(x => x.id === 'encalhe-f1');
  assert.match(stuck.happened, /4 de 5 Café Tradicional/);
  assert.match(stuck.happened, /R\$\s40,00/);
  assert.match(stuck.todo, /avalie levar menos Café Tradicional e ofereça a sobra em combo com Café Especial/);
  assert.ok(g.all.find(x => x.id === 'esgotou-f1'));
});

test('produto vendido sem custo pede o custo antes de falar de lucro', () => {
  const g = buildGuidance(input({
    products: [product('m', 'Mel silvestre', 3500, 0)],
    current: { revenue: 35000, cost: 0, result: 35000, salesCount: 10, ticket: 3500, productsPerSale: 1.5, identified: 9, clients: 5, returning: 2,
      rank: [{ id: 'm', name: 'Mel silvestre', qty: 10, amount: 35000 }] },
  }));
  const d = g.all.find(x => x.id === 'sem-custo');
  assert.match(d.todo, /Mel silvestre/);
  assert.equal(d.cta.action, 'nav');
});

test('feira chegando abre o checklist da banca', () => {
  const g = buildGuidance(input({ upcoming: { name: 'Feira do Inventário', daysUntil: 2 } }));
  const d = g.all.find(x => x.id === 'preparar');
  assert.equal(d.level, 'atencao');
  assert.match(d.happened, /em 2 dias/);
  assert.deepEqual(d.cta, { label: 'Abrir checklist da banca', action: 'advisor-checklist', data: { id: 'banca' } });
});

test('no máximo três ações e texto corrido coerente', () => {
  const g = buildGuidance(input({
    products: [product('a', 'A', 1000, 950, 0, 2), product('b', 'B', 1000, 400), product('c', 'C', 1000, 400), product('d', 'D', 1000, 400)],
    current: { revenue: 50000, cost: 40000, expense: 20000, result: -10000, salesCount: 20, ticket: 2500, productsPerSale: 1, identified: 2, qrShown: 10, qrRead: 1,
      rank: [{ id: 'a', name: 'A', qty: 40, amount: 40000 }, { id: 'b', name: 'B', qty: 5, amount: 5000 }, { id: 'c', name: 'C', qty: 3, amount: 3000 }, { id: 'd', name: 'D', qty: 2, amount: 2000 }] },
    previous: { revenue: 80000, salesCount: 30, ticket: 2666 },
  }));
  assert.ok(g.actions.length <= 3);
  const text = guidanceText(g);
  assert.match(text, /Faça agora:/);
  assert.match(text, /1\. /);
});

test('memória do material não traz os números fictícios do estudo de caso', () => {
  const all = JSON.stringify({ TOPICS, CHECKLISTS, AI_GUIDE });
  for (const fictional of ['Café das Matas', '255', '7,14', '18,21', '179', 'R$']) assert.ok(!all.includes(fictional), `não deve conter "${fictional}"`);
  for (const t of Object.values(TOPICS)) assert.ok(t.title && t.what && Array.isArray(t.how));
});

test('banco de produtos: áreas válidas e "aba" no hortifruti não traz itens de outras áreas', () => {
  const units = ['Pacote', 'Dúzia', 'Caixa', 'Unidade', 'Vidro', 'Pote', 'kg', 'Litro', 'Sacola', 'Maço', 'Bandeja', 'Garrafa', 'Frasco', 'Bisnaga', 'Saco', 'Lata', 'Barra', 'Peça', 'Par', 'Pedaço', 'Fatia', 'Kit', 'Rolo'];
  let total = 0;
  for (const [area, group, unit, names] of MARKET_CATALOG) {
    assert.ok(area && group && units.includes(unit), `${group}: unidade ${unit}`);
    total += names.split('|').length;
  }
  assert.ok(total >= 1400, `total ${total}`);
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const hortifruti = MARKET_CATALOG.filter(([a]) => a === 'Hortifruti-Granjeiro').flatMap(([, , , n]) => n.split('|')).filter(n => norm(n).startsWith('aba'));
  assert.ok(hortifruti.includes('Abacate') && hortifruti.includes('Abacaxi'));
});
