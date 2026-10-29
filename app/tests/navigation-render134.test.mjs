import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the actual legacy route selector with an instrumented detailed renderer. Rendering an
// invisible product list used to construct all rows/lots even when the result was only area cards.
const source = fs.readFileSync(new URL('../src/legacy/erp-ui.js', import.meta.url), 'utf8');
const start = source.lastIndexOf('feiraStockList=function()');
const route = source.slice(start, source.indexOf('// Entrar e voltar:', start));
function harness(overrides = {}) {
  const calls = { detailed: 0, filtered: [] }, products = [{ id: 'coffee-a' }, { id: 'coffee-b' }, { id: 'banana' }];
  const context = {
    page: 'Estoque', query: '', stockArea: null, stockSub: null,
    feiraStockListBeforeAreas: () => { calls.detailed++; return '<all-detailed-rows>'; },
    stockAreasHome: () => '<area-cards>', stockLotsEntry: () => '<validities>', stockFoot: '<back-to-areas>',
    stockAreas: () => [{ key: 'coffee', label: 'Cafés', items: products }],
    stockSubgroups: () => [{ key: 'special', label: 'Especiais', items: products.slice(0, 2) }, { key: 'banana', label: 'Banana', items: products.slice(2) }],
    stockHead: (_action, _back, title) => '<heading:' + title + '>',
    stockCard: (_action, key) => '<subgroup:' + key + '>',
    stockRowsFor: (html, items, title) => { assert.equal(html, '<all-detailed-rows>'); calls.filtered.push(items.map(p => p.id)); return '<rows:' + title + '>'; },
    ...overrides,
  };
  vm.createContext(context); vm.runInContext(route, context);
  return { context, calls, render: () => context.feiraStockList() };
}

test('opening stock areas does not build discarded product rows or lot summaries', () => {
  const h = harness(); assert.equal(h.render(), '<area-cards><validities>'); assert.equal(h.calls.detailed, 0);
});
test('a subgroup-only page does not build products that are not displayed', () => {
  const h = harness({ stockArea: 'coffee', stockSubgroups: () => [{ key: 'a', items: [{ id: '1' }, { id: '2' }] }, { key: 'b', items: [{ id: '3' }, { id: '4' }] }] });
  assert.match(h.render(), /<subgroup:a><subgroup:b>/); assert.equal(h.calls.detailed, 0); assert.equal(h.calls.filtered.length, 0);
});
test('a subgroup with loose products builds detailed content once and retains the correct subset', () => {
  const h = harness({ stockArea: 'coffee' }); assert.match(h.render(), /<rows:Outros produtos>/);
  assert.equal(h.calls.detailed, 1); assert.deepEqual(h.calls.filtered, [['banana']]);
});
test('opening a selected subgroup still shows its product rows, validities and back control', () => {
  const h = harness({ stockArea: 'coffee', stockSub: 'special' });
  assert.equal(h.render(), '<heading:Especiais><rows:Especiais><validities><back-to-areas>');
  assert.equal(h.calls.detailed, 1); assert.deepEqual(h.calls.filtered, [['coffee-a', 'coffee-b']]);
});
test('search, non-stock consumers and the single-area fallback retain detailed rendering', () => {
  for (const overrides of [{ query: 'Café' }, { page: 'Vender' }, { stockAreasHome: () => null }]) {
    const h = harness(overrides); assert.equal(h.render(), '<all-detailed-rows>'); assert.equal(h.calls.detailed, 1);
  }
});
test('a removed area clears its old subgroup and returns to current area cards without stale rows', () => {
  const h = harness({ stockArea: 'removed', stockSub: 'old' }); assert.equal(h.render(), '<area-cards>');
  assert.equal(h.context.stockArea, null); assert.equal(h.context.stockSub, null); assert.equal(h.calls.detailed, 0);
});

test('replacing a stock transition cancels both compositor animations and restores its own origin', () => {
  const lifecycle = source.slice(source.indexOf('let stockMotion=null,stockMotionSerial=0;'), source.indexOf("document.addEventListener('territorio:before-page',clearStockMotion,true);"));
  const context = {}; vm.createContext(context); vm.runInContext(lifecycle, context);
  const make = name => { const row = { name, cancelled: 0, removed: 0, list: { style: { transformOrigin: name } }, origin: 'original-' + name }; row.old = { remove() { row.removed++; } }; row.animations = [{ cancel() { row.cancelled++; } }, { cancel() { row.cancelled++; } }]; return row; };
  context.first = make('first'); vm.runInContext('first.token=stockMotionSerial;stockMotion=first;clearStockMotion();', context);
  assert.equal(context.first.cancelled, 2); assert.equal(context.first.removed, 1); assert.equal(context.first.list.style.transformOrigin, 'original-first');
  context.next = make('next'); vm.runInContext('next.token=stockMotionSerial;stockMotion=next;completeStockMotion(first.token);', context);
  assert.equal(context.next.cancelled, 0); assert.equal(context.next.removed, 0); assert.equal(context.next.list.style.transformOrigin, 'next');
  vm.runInContext('completeStockMotion(next.token);completeStockMotion(next.token);', context);
  assert.equal(context.next.cancelled, 2); assert.equal(context.next.removed, 1); assert.equal(context.next.list.style.transformOrigin, 'original-next');
});
