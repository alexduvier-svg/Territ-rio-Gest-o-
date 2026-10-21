import test from 'node:test';
import assert from 'node:assert/strict';
import { arrangeSalesProducts, moveSalesProduct } from '../src/features/sales-order.js';
import { installProductGesture } from '../src/features/workflows/product-gesture.js';

test('saved sales order tolerates deleted, duplicate and new products without mutating stock order', () => {
  const products = ['a','b','c'].map(id => ({id,stock:3}));
  assert.deepEqual(arrangeSalesProducts(products, ['b','deleted','b','a']).map(p=>p.id), ['b','a','c']);
  assert.deepEqual(products.map(p=>p.id), ['a','b','c']);
  assert.deepEqual(arrangeSalesProducts(products, null), products);
  const restored = JSON.parse(JSON.stringify({settings:{salesProductOrder:['c','a','b']}}));
  assert.equal(arrangeSalesProducts(products,restored.settings.salesProductOrder)[0].id,'c');
  assert.equal(arrangeSalesProducts(products,{}).length,3);
});
test('moving products handles boundaries, unknown ids and keeps each product once', () => {
  assert.deepEqual(moveSalesProduct(['a','b','c'],'a',2),['b','c','a']);
  assert.deepEqual(moveSalesProduct(['a','b','c'],'c',-8),['c','a','b']);
  assert.deepEqual(moveSalesProduct(['a','b','c'],'missing',1),['a','b','c']);
  assert.deepEqual(moveSalesProduct(['a','a','b'],'a',9),['b','a']);
});
function setup({edited=false}={}) {
  const calls=[], listeners={}; let page='Vender', selected=[], editing=false;
  globalThis.document={addEventListener:(name,fn)=>{listeners[name]=fn;}};
  globalThis.window={TerritorioSalesOrganization:{active:()=>editing},TerritorioSelection:{active:()=>selected.length>0,snapshot:()=>selected.slice(),begin:id=>{selected=[id];calls.push('select');},restore:ids=>{selected=ids;calls.push('restore');}}};
  const bridge={page:()=>page,openQuickCartPreview:id=>{calls.push('checkout:'+id);page='Venda';return()=>{if(edited)return false;page='Vender';calls.push('undo');return true;}},actions:{'stock-peek':({id})=>calls.push('stock:'+id)}};
  installProductGesture(bridge,{source:()=>({id:'source'}),restoreSource:()=>calls.push('origin')});
  const card={dataset:{id:'coffee'},disabled:false}, tap=(opts={})=>window.TerritorioProductGestures.handleClick({isTrusted:true,detail:1,clientX:20,clientY:30,preventDefault(){},stopImmediatePropagation(){},...opts},opts.card===null?null:card);
  return {calls,tap,listeners,select:ids=>{selected=ids;},selected:()=>selected,organize:()=>{editing=true;}};
}
test('single immediate checkout; double stock without requiring original DOM target', () => {
  const f=setup(); f.tap(); assert.deepEqual(f.calls,['checkout:coffee']);
  f.tap({card:null});assert.deepEqual(f.calls,['checkout:coffee','undo','origin','stock:coffee']);
  assert.deepEqual(f.selected(),[]);
});
test('edited draft is never undone by a following tap', () => {
  const f=setup({edited:true}); f.tap();f.tap({card:null});assert.deepEqual(f.calls,['checkout:coffee']);
});
test('keyboard activation cannot accidentally become a multiple physical tap', () => {
  const f=setup();f.tap({detail:0,isTrusted:false});f.tap({card:null});assert.deepEqual(f.calls,['checkout:coffee']);
});
test('double within existing selection restores the previous selected products', () => {
  const f=setup();f.select(['banana']);assert.equal(f.tap(),false);f.select(['banana','coffee']);
  f.tap();assert.deepEqual(f.selected(),['banana']);assert.equal(f.calls.at(-1),'stock:coffee');
});
test('organization mode bypasses sale gestures', () => {
  const f=setup();f.organize();assert.equal(f.tap(),false);assert.deepEqual(f.calls,[]);
});
test('scroll cancellation clears physical tap sequence', () => {
  const f=setup();f.tap();f.listeners.pointercancel();f.tap({card:null});assert.deepEqual(f.calls,['checkout:coffee']);
});

test('a tap on a different product is never mistaken for the same-product double gesture', () => {
  const f=setup();f.select(['banana']);f.tap();
  const other={dataset:{id:'cheese'},disabled:false};
  assert.equal(window.TerritorioProductGestures.handleClick({isTrusted:true,detail:1,clientX:20,clientY:30,preventDefault(){},stopImmediatePropagation(){}},other),false);
  assert.deepEqual(f.calls,[]);
});
