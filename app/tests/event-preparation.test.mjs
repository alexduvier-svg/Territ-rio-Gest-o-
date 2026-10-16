import test from 'node:test';
import assert from 'node:assert/strict';
import { createDraft, mergeProducts, snapshot, addStockEntries } from '../src/features/event-preparation.js';

const products = [{ productId: 'banana', name: 'Banana', unit: 'Dúzia' }, { productId: 'taioba', name: 'Taioba', unit: 'Maço' }];
test('rascunho separado por evento prevalece sobre carga, inclusive campo apagado', () => {
  const event = { id: 'a', preparation: { items: [{ productId: 'banana', unit: 'Dúzia', raw: '' }] } };
  const load = { items: [{ productId: 'banana', unit: 'Dúzia', qty: 8 }] };
  assert.equal(createDraft(event, products, load).products[0].raw, '');
  assert.equal(createDraft({ id: 'b' }, products, load).products[0].raw, '8');
});
test('novo cadastro preserva quantidades digitadas e acumula entrada somente no rascunho', () => {
  const draft = createDraft({ id: 'a' }, products, null);
  draft.products[0].raw = '7';
  const extended = mergeProducts(draft, [...products, { productId: 'cafe', name: 'Café', unit: 'Pacote' }]);
  const next = addStockEntries(extended, [{ productId: 'cafe', unit: 'Pacote', qty: 5 }, { productId: 'banana', unit: 'Dúzia', qty: 3 }]);
  assert.deepEqual(next.products.map(p => p.raw), ['10', '', '5']);
  assert.equal(draft.products[0].raw, '7');
  assert.equal(products[0].stock, undefined);
});
test('rascunho persiste com precisão decimal e não confunde apresentações', () => {
  const draft = createDraft({ id: 'a' }, [{ productId: 'cafe', unit: 'kg', raw: '' }, { productId: 'cafe', unit: 'Pacote' }], null);
  draft.products[0].raw = '1,2';
  const next = addStockEntries(draft, [{ productId: 'cafe', unit: 'kg', qty: 0.3 }]);
  const saved = JSON.parse(JSON.stringify(snapshot(next, '2026-10-16T12:00:00Z')));
  assert.equal(createDraft({ id: 'a', preparation: saved }, next.products, null).products[0].raw, '1,5');
  assert.equal(saved.items[1].raw, '');
});
test('não perde texto inválido digitado ao tentar adicionar ao mesmo produto', () => {
  const draft = createDraft({ id: 'a' }, products, null);draft.products[0].raw = '2,,3';
  assert.throws(() => addStockEntries(draft, [{ productId: 'banana', unit: 'Dúzia', qty: 2 }]), /Corrija a quantidade/);
  assert.equal(draft.products[0].raw, '2,,3');
});
