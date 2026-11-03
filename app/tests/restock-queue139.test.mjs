import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Lots from '../src/features/stock-lots/domain.js';
const source=fs.readFileSync(new URL('../src/legacy/erp-ui.js',import.meta.url),'utf8'),start=source.indexOf('let restock=null;'),flow=source.slice(start,source.indexOf('function stockLevels()',start));
function harness(n=2){
 const ctx={Date,Math,JSON,Intl,Promise,Object,TerritorioStockLots:Lots,dialog:{open:false,dataset:{},addEventListener(){}},modal:null,paints:0,closed:0,toasts:[],writes:0,saveOK:true,durable:async()=>true};ctx.window=ctx;
 vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8'),ctx);ctx.E=ctx.ERP;
 const products=Array.from({length:n},(_,i)=>({id:i?'fish'+i:'coffee',name:i?'Peixe QA '+i:'Café QA',baseName:i?'Peixe':'Café',category:i?'Piscicultura':'Cafés',unit:i?'kg':'Pacote',stock:0,min:1,price:1000,cost:500,costKnown:true}));
 ctx.model=new ctx.E.ERPModel({schema:1,dataContext:{id:'qa-restock',type:'real'},products,sales:[],movements:[],clients:[],expenses:[],events:[],settings:{onboarding:'clean'}});
 ctx.persist=()=>{ctx.writes++;return ctx.saveOK;};ctx.TerritorioNative={durable:()=>ctx.durable()};ctx.toast=m=>ctx.toasts.push(m);ctx.closeModal=()=>{ctx.dialog.open=false;ctx.modal=null;ctx.closed++;};ctx.render=()=>{};ctx.grammarCount=(n,a,b)=>n+' '+(n===1?a:b);
 vm.runInContext(flow+`;paintRestock=()=>{if(!restockOwned(restock))return;paints++;dialog.open=true;dialog.dataset.kind='restock';modal={kind:'restock'};};this.queue={open:openRestock,save:finishRestock,skip:skipRestock,pick:pickRestock,page:pageRestock,state:()=>restock};`,ctx);
 const ids=products.map(p=>p.id);ctx.queue.open(ids);return {...ctx,ctx,ids,get model(){return ctx.model;},qty:v=>{ctx.queue.state().values[ctx.queue.state().active]=v;}};
}
test('saving coffee opens fish instead of ending the whole queue',async()=>{
 const h=harness();h.qty('1');await h.queue.save();assert.equal(h.model.product('coffee').stock,1);assert.equal(h.model.product('fish1').stock,0);assert.equal(h.queue.state().active,'fish1');assert.equal(h.ctx.closed,0);
 h.qty('1,5');await h.queue.save();assert.equal(h.model.product('fish1').stock,1.5);assert.equal(h.queue.state(),null);assert.equal(h.ctx.closed,1);assert.equal(h.model.data.movements.filter(m=>m.kind==='add').length,2);
});
test('Agora não opens the next product and leaves the skipped balance and lots unchanged',async()=>{
 const h=harness(),before=JSON.stringify(Lots.lotSnapshot(h.model.data,'coffee'));h.qty('7');h.queue.skip();assert.equal(h.queue.state().active,'fish1');assert.equal(h.model.product('coffee').stock,0);assert.equal(JSON.stringify(Lots.lotSnapshot(h.model.data,'coffee')),before);assert.equal(h.model.data.movements.length,0);
 h.queue.skip();assert.equal(h.queue.state(),null);assert.equal(h.ctx.writes,0);
});
test('an empty quantity keeps the queue open until save or an explicit skip',async()=>{
 const h=harness();await h.queue.save();assert.equal(h.queue.state().active,'coffee');assert.equal(h.ctx.closed,0);assert.equal(h.model.data.movements.length,0);
});
test('a synchronous persistence refusal restores stock, lots and history and allows one retry',async()=>{
 const h=harness(),before=JSON.stringify(h.model.data);h.qty('2');h.ctx.saveOK=false;await h.queue.save();assert.equal(JSON.stringify(h.model.data),before);assert.equal(h.queue.state().active,'coffee');assert.equal(h.queue.state().pendingApplied,undefined);
 h.ctx.saveOK=true;await h.queue.save();assert.equal(h.model.product('coffee').stock,2);assert.equal(h.model.data.movements.filter(m=>m.kind==='add').length,1);assert.equal(h.queue.state().active,'fish1');
});
test('durable confirmation retry and repeated taps do not add coffee twice',async()=>{
 const h=harness();h.qty('2');h.ctx.durable=async()=>false;await h.queue.save();assert.equal(h.model.product('coffee').stock,2);assert.equal(h.queue.state().active,'coffee');assert(h.queue.state().pendingApplied);h.queue.pick('fish1');h.queue.skip();assert.equal(h.queue.state().active,'coffee');
 h.ctx.durable=async()=>true;await Promise.all([h.queue.save(),h.queue.save()]);assert.equal(h.model.product('coffee').stock,2);assert.equal(h.model.data.movements.filter(m=>m.kind==='add').length,1);assert.equal(h.queue.state().active,'fish1');
});
test('more than four products remain reachable and deferred products can be revisited',async()=>{
 const h=harness(6);h.queue.page(1);assert.equal(h.queue.state().active,'fish4');h.queue.page(-1);assert.equal(h.queue.state().active,'coffee');h.queue.skip();h.queue.pick('coffee');assert.equal(h.queue.state().skipped.coffee,undefined);
 for(let i=0;i<6;i++)h.queue.skip();assert.equal(h.queue.state(),null);assert.equal(h.model.data.movements.length,0);
});
test('a changed producer model cannot receive movements from the old queue',async()=>{
 const h=harness();h.qty('2');const old=h.model;h.ctx.model=new h.E.ERPModel(JSON.parse(JSON.stringify(old.data)));const before=JSON.stringify(h.ctx.model.data);await h.queue.save();assert.equal(JSON.stringify(h.ctx.model.data),before);assert.equal(old.product('coffee').stock,0);
});
test('closing while durable storage is pending cannot reopen the queue',async()=>{
 const h=harness();let release;h.qty('1');h.ctx.durable=()=>new Promise(r=>{release=r;});const job=h.queue.save();h.ctx.closeModal();release(true);await job;assert.equal(h.ctx.dialog.open,false);assert.equal(h.model.product('coffee').stock,1);
});
