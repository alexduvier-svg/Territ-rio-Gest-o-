import test from 'node:test';
import assert from 'node:assert/strict';
import { orderStockProducts, setManualOrder, stockGroupKey } from '../src/features/stock-order.js';

const p = (id, name, category, extra = {}) => ({ id, name, baseName: name, category, unit: 'Unidade', price: 10, ...extra });
const products = [
  p('c1', 'Café Especial', 'Cafés', { type: 'Especial', weight: 250, unit: 'g' }),
  p('c2', 'Café Especial', 'Cafés', { type: 'Especial', weight: 500, unit: 'g' }),
  p('c3', 'Café Gourmet', 'Cafés', { type: 'Gourmet', weight: 250, unit: 'g' }),
  p('b1', 'Banana Nanica', 'Hortifruti-Granjeiro'),
  p('b2', 'Banana Prata', 'Hortifruti-Granjeiro'),
  p('q1', 'Queijo Minas', 'Laticínios'),
];
const ids = list => list.map(x => x.id);

test('without a manual order the catalog order stays as it was', () => {
  setManualOrder([]);
  const base = ids(orderStockProducts(products));
  assert.deepEqual(ids(orderStockProducts([...products].reverse())), base);
});

test('the producer order rearranges a family and keeps every family and category in its place', () => {
  setManualOrder([]);
  const base = ids(orderStockProducts(products));
  setManualOrder(['b2', 'b1', 'c3', 'c1', 'c2']);
  const manual = ids(orderStockProducts(products));
  assert.deepEqual(manual, ['c3', 'c1', 'c2', 'b2', 'b1', 'q1']);
  // Families are contiguous blocks in the same sequence as before.
  const blocks = list => [...new Set(list.map(id => stockGroupKey(products.find(x => x.id === id))))];
  assert.deepEqual(blocks(manual), blocks(base));
  setManualOrder([]);
});

test('a product never placed by hand comes after the placed ones of its family', () => {
  setManualOrder(['c2']);
  assert.deepEqual(ids(orderStockProducts(products)).slice(0, 3), ['c2', 'c1', 'c3']);
  setManualOrder([]);
});

test('an explicit order argument wins over the stored one and unknown ids are ignored', () => {
  setManualOrder(['c3']);
  assert.deepEqual(ids(orderStockProducts(products, ['gone', 'b2'])).slice(3, 5), ['b2', 'b1']);
  setManualOrder([]);
});
