import test from 'node:test';
import assert from 'node:assert/strict';
import { bestFirst } from '../src/features/advisor/engine.js';

const families = [
  { id: 'e250', name: 'Café Especial 250 g', family: 'cafes|cafe' },
  { id: 'e500', name: 'Café Especial 500 g', family: 'cafes|cafe' },
  { id: 'b1', name: 'Banana Nanica', family: 'horti|banana' },
];
const input = rank => ({ productFamilies: families, current: { rank } });

test('o mais vendido da família, se não está em primeiro, vira dica com botão', () => {
  const [tip] = bestFirst(input([{ id: 'e500', qty: 12 }, { id: 'e250', qty: 3 }, { id: 'b1', qty: 1 }]));
  assert.equal(tip.id, 'ordem-mais-vendidos:e500');
  assert.equal(tip.cta.action, 'order-best-first');
  assert.equal(tip.cta.data.id, 'e500');
  assert.match(tip.happened, /12/);
});

test('sem dica quando o primeiro já é o mais vendido, a diferença é pequena ou há poucas vendas', () => {
  assert.deepEqual(bestFirst(input([{ id: 'e250', qty: 12 }, { id: 'e500', qty: 3 }])), []);
  assert.deepEqual(bestFirst(input([{ id: 'e500', qty: 6 }, { id: 'e250', qty: 5 }])), []);
  assert.deepEqual(bestFirst(input([{ id: 'e500', qty: 4 }, { id: 'e250', qty: 0 }, { id: 'b1', qty: 1 }])), []);
});

test('famílias de um só produto nunca geram dica', () => {
  assert.deepEqual(bestFirst({ productFamilies: [families[2], { id: 'q', name: 'Queijo', family: 'lat|queijo' }], current: { rank: [{ id: 'q', qty: 40 }, { id: 'b1', qty: 2 }] } }), []);
});
