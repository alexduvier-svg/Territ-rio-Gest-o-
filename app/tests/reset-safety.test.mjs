import test from 'node:test';
import assert from 'node:assert/strict';
import * as Copies from '../src/features/reset/safety-copy.js';
import {replaceData} from '../src/features/reset/transaction.js';
const KEY='territorio-copias-antes-de-zerar';
function storage(){const values=new Map();globalThis.localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};return values;}
const json=n=>JSON.stringify({products:[{id:'synthetic-'+n}],sales:[],clients:[],events:[],expenses:[],settings:{}});
test('local safety copies keep the first and last three, verify content and survive rapid consecutive saves',async()=>{
 const values=storage();for(let i=0;i<7;i++)assert.equal(await Copies.save(json(i)),'saved');
 assert.equal(JSON.parse(values.get(KEY)).length,4);assert.equal((await Copies.load('original')).json,json(0));assert.equal((await Copies.load('latest')).json,json(6));
 const dates=await Copies.dates();assert(dates.original instanceof Date&&Number.isFinite(+dates.original));assert(dates.latest instanceof Date);
});
test('empty data does not displace copies; supplier-only, order-only and profile data are protected',async()=>{
 storage();assert.equal(await Copies.save('{}'),'skipped');
 for(const d of [{supplierBook:{suppliers:[{id:'qa'}]}},{localCommerce:{actors:{qa:{orders:[{}]}}}},{settings:{location:{code:'qa'}}}])assert.equal(Copies.isEmptyData(d),false);
});
test('copy refusal leaves the index and the original intact',async()=>{
 const values=storage();await Copies.save(json(0));const before=values.get(KEY);localStorage.setItem=()=>{throw Error('quota')};assert.equal(await Copies.save(json(1)),'failed');assert.equal(values.get(KEY),before);assert.equal((await Copies.load('original')).json,json(0));
});
test('corrupt index blocks copying, without treating unreadable history as an empty directory',async()=>{
 const values=storage();values.set(KEY,'{invalid');assert.equal(await Copies.save(json(1)),'failed');assert.equal(values.get(KEY),'{invalid');assert.equal(await Copies.load('original'),null);
});
test('concurrent copy requests retain exactly one original',async()=>{
 const values=storage();assert.deepEqual(await Promise.all([Copies.save(json(1)),Copies.save(json(2)),Copies.save(json(3))]),['saved','saved','saved']);assert.equal(JSON.parse(values.get(KEY)).filter(r=>r.name.startsWith('original-')).length,1);assert.equal((await Copies.load('original')).json,json(1));
});
test('replacement refuses the wrong owner and leaves records untouched',async()=>{
 let current={id:'qa'};const old=current;let writes=0;const ok=await replaceData({get:()=>current,set:x=>{current=x},save:()=>{writes++;return true}}, {},{});assert.equal(ok,false);assert.equal(current,old);assert.equal(writes,0);
});
test('failed durable replacement restores and resaves the previous model',async()=>{
 const old={id:'qa-old'},next={id:'qa-next'};let current=old,writes=[],calls=0;
 assert.equal(await replaceData({get:()=>current,set:x=>{current=x},save:()=>{writes.push(current.id);return true},durable:async()=>++calls>1},old,next),false);assert.equal(current,old);assert.deepEqual(writes,['qa-next','qa-old']);
});
test('successful replacement waits for durable storage before returning',async()=>{
 const old={},next={};let current=old,finish;const job=replaceData({get:()=>current,set:x=>{current=x},save:()=>true,durable:()=>new Promise(r=>{finish=r})},old,next);let done=false;job.then(()=>done=true);await Promise.resolve();assert.equal(done,false);finish(true);assert.equal(await job,true);assert.equal(current,next);
});
