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
function setup() {
  const calls=[], listeners={}, jobs=new Map(); let page='Vender', selected=[], editing=false, modal=null, time=0, sequence=0;
  const clock={now:()=>time,set:(fn,ms)=>{const id=++sequence;jobs.set(id,{fn,at:time+ms});return id;},clear:id=>jobs.delete(id)};
  const advance=ms=>{const end=time+ms;for(;;){const next=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;time=next[1].at;jobs.delete(next[0]);next[1].fn();}time=end;};
  globalThis.document={addEventListener:(name,fn)=>{listeners[name]=fn;}};
  globalThis.window={TerritorioSalesOrganization:{active:()=>editing},TerritorioSelection:{active:()=>selected.length>0,snapshot:()=>selected.slice(),restore:ids=>{selected=ids;calls.push('restore');}}};
  const bridge={page:()=>page,modal:()=>modal,openQuickCartPreview:()=>{throw Error('Checkout preview must never run');},actions:{'sell-product':({id})=>{calls.push('quantity:'+id);page='Venda';},'stock-peek':({id})=>calls.push('stock:'+id)}};
  installProductGesture(bridge,{clock,source:()=>({id:'source'}),restoreSource:()=>calls.push('origin')});
  const card={dataset:{id:'coffee'},disabled:false};
  const event=(opts={})=>({isTrusted:true,detail:1,clientX:20,clientY:30,preventDefault(){},stopImmediatePropagation(){},...opts});
  const tap=(opts={})=>window.TerritorioProductGestures.handleClick(event(opts),opts.card===null?null:opts.card||card);
  return {calls,tap,advance,card,event,listeners,jobs,select:ids=>{selected=ids;},selected:()=>selected,organize:()=>{editing=true;},page:p=>{page=p;},modal:m=>{modal=m;},down:()=>window.TerritorioProductGestures.suspend(event(),card)};
}

test('single tap waits only for disambiguation then opens quantity, never checkout',()=>{
  const f=setup();f.tap();assert.deepEqual(f.calls,[]);f.advance(279);assert.deepEqual(f.calls,[]);f.advance(1);assert.deepEqual(f.calls,['origin','quantity:coffee']);f.advance(1000);assert.equal(f.jobs.size,0);
});
test('double tap opens only stock, with no intermediate sale action',()=>{
  const f=setup();f.tap();f.advance(90);f.down();f.tap();assert.deepEqual(f.calls,['origin','stock:coffee']);f.advance(1000);assert.deepEqual(f.calls,['origin','stock:coffee']);assert.deepEqual(f.selected(),[]);
});
test('second finger-down suppresses the pending single while finger stays down',()=>{
  const f=setup();f.tap();f.advance(250);f.down();f.advance(200);assert.deepEqual(f.calls,[]);f.listeners.pointerup();f.tap();assert.equal(f.calls.at(-1),'stock:coffee');f.advance(1000);assert(!f.calls.some(c=>c.startsWith('quantity')));
});
test('long hold cancellation discards the pending tap rather than opening any sale',()=>{
  const f=setup();f.tap();f.down();f.advance(600);window.TerritorioProductGestures.cancelPending();f.select(['coffee']);f.advance(1000);assert.deepEqual(f.calls,[]);
});
test('keyboard activation opens quantity immediately without starting a physical double',()=>{
  const f=setup();f.tap({detail:0,isTrusted:false});assert.deepEqual(f.calls,['quantity:coffee']);f.tap({card:null});f.advance(1000);assert.deepEqual(f.calls,['quantity:coffee']);
});
test('double within existing selection restores its previous list and opens stock',()=>{
  const f=setup();f.select(['banana']);assert.equal(f.tap(),false);f.select(['banana','coffee']);f.advance(80);f.down();f.tap();assert.deepEqual(f.selected(),['banana']);assert.deepEqual(f.calls,['restore','origin','stock:coffee']);
});
test('organization mode cancels deferred sales and bypasses gestures',()=>{
  const f=setup();f.tap();f.organize();assert.equal(f.tap(),false);f.advance(1000);assert.deepEqual(f.calls,[]);
});
test('pointer cancellation or scrolling on the second press cancels the pending sale',()=>{
  for(const type of ['pointercancel','pointermove']){const f=setup();f.tap();f.down();f.listeners[type](f.event({clientY:80}));f.advance(1000);assert.deepEqual(f.calls,[]);}
});
test('different products do not form a double; only the latest pending tap can open quantity',()=>{
  const f=setup();f.tap();f.advance(80);f.tap({card:{dataset:{id:'banana'},disabled:false}});f.advance(280);assert.deepEqual(f.calls,['origin','quantity:banana']);
});
test('navigation and another modal fence the pending single',()=>{
  for(const change of [f=>f.page('Estoque'),f=>f.modal({kind:'settings'})]){const f=setup();f.tap();change(f);f.advance(1000);assert.deepEqual(f.calls,[]);}
});
test('hiding or clicking outside cancels pending work',()=>{
  for(const type of ['visibilitychange','pointerdown']){const f=setup();f.tap();f.listeners[type]({target:{closest:()=>null}});f.advance(1000);assert.deepEqual(f.calls,[]);}
});
