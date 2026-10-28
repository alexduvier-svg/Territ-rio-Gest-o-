import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as Lots from '../src/features/stock-lots/domain.js';
import {installStockLotsUI} from '../src/features/stock-lots/ui.js';
import {statement,lossValue} from '../src/features/finance/finance.js';

const source=fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8');
const dated=expiresOn=>({state:'dated',expiresOn,confirmed:true});
function fixture({persist=()=>true,durable}={}){
 const ctx={Date,Math,console,crypto:globalThis.crypto,TerritorioStockLots:Lots};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(source,ctx);
 const m=new ctx.ERP.ERPModel({schema:1,inventoryRevision:20,dataContext:{id:'regression132-synthetic',type:'real'},products:[],sales:[],movements:[],clients:[],events:[],expenses:[],profiles:{},settings:{onboarding:'clean'}});
 const p=m.saveProducts({name:'Produto Fictício 132',category:'Outros'},[{unit:'Unidade',priceInput:'25',costInput:'10',stockInput:'0',minInput:'0'}])[0];
 const today=Lots.civilDay();m.move(p.id,'add',4,'Lote Fictício Vencido',{lotInput:dated(Lots.shiftCivil(today,-3))});m.move(p.id,'add',6,'Lote Fictício Válido',{lotInput:dated(Lots.addCivil(today,30))});
 const expired=Lots.lotSnapshot(m.data,p.id).lots.find(l=>l.status.blocking),toasts=[],opened=[],input={value:'10'};
 globalThis.window={ERP:ctx.ERP,...(durable?{TerritorioNative:{isNative:true,durable}}:{})};
 globalThis.document={addEventListener(){},querySelectorAll:()=>[],getElementById:id=>id==='lot-lead-days'?input:null};
 let modal=null,persistCalls=0;
 const b={actions:{},data:()=>m.data,lotModel:()=>m,modal:()=>modal,description:()=>'',quantity:String,icon:()=>'',button:(action,text)=>'<button data-action="'+action+'">'+text+'</button>',toast:text=>toasts.push(text),open(title,body,footer,kind){modal={kind};opened.push({title,body,footer});},close(){modal=null;},persist(){persistCalls++;return persist();}};
 installStockLotsUI(b);b.actions['lots-open']({id:p.id});
 return{m,p,expired,b,toasts,opened,input,persistCalls:()=>persistCalls};
}

test('configured fixed costs and planned draw affect projected cash without inventing a payment',()=>{
 const s=statement({sales:[],expenses:[],settings:{fixedCosts:[{title:'Energia',amount:30000}],drawOn:true,drawMonthly:60000},shares:[{month:'2026-10',share:1}]});
 assert.equal(s.cashIn,0);assert.equal(s.cashOut,0);assert.equal(s.cash,0);
 assert.equal(s.cashForecast,90000);assert.equal(s.cashProjectedOut,90000);assert.equal(s.cashProjected,-90000);
 assert.equal(s.result,-90000);assert(s.checks);
});

test('logged draw leaves cash once while unlogged months remain exclusively in its projection',()=>{
 const s=statement({sales:[],expenses:[{kind:'retirada',amount:50000,date:'2026-02-10'}],settings:{drawOn:true,drawMonthly:150000},shares:['01','02','03'].map(month=>({month:'2026-'+month,share:1}))});
 assert.equal(s.cashOut,50000);assert.equal(s.cash,-50000);assert.equal(s.cashForecast,300000);
 assert.equal(s.cashProjected,-350000);assert.equal(s.cashProjectedOut,350000);assert.equal(s.result,-350000);
});

test('cash projection preserves place filtering and does not subtract stock losses as cash payments',()=>{
 const s=statement({sales:[{total:10000,cost:4000,payments:[{method:'Pix',amount:10000}]}],expenses:[{kind:'producao',amount:2000},{kind:'investimento',amount:1000}],losses:5000,settings:{fixedCosts:[{title:'Energia',amount:30000}],drawOn:true,drawMonthly:60000},shares:[{month:'2026-10',share:1}],general:false});
 assert.equal(s.cashOut,3000);assert.equal(s.cash,7000);assert.equal(s.cashForecast,0);assert.equal(s.cashProjected,s.cash);
});

for(const failure of ['false','throw']){
 const persist=()=>{if(failure==='throw')throw Error('Falha Fictícia de Gravação');return false;};
 test('lead-day preference rolls the whole model back when persistence returns '+failure,async()=>{
  const {m,b,toasts}=fixture({persist}),before=JSON.stringify(m.data),original=m.data;
  await b.actions['lots-lead-save']();
  assert.equal(m.data,original);assert.equal(JSON.stringify(m.data),before);assert(!toasts.some(t=>/^Aviso 10/.test(t)));
 });
 test('selected-lot loss rolls stock, allocations and audit back when persistence returns '+failure,async()=>{
  const {m,p,expired,b,toasts}=fixture({persist}),before=JSON.stringify(m.data),original=m.data;
  b.actions['lots-loss']({id:expired.id});await b.actions['lots-loss-confirm']({id:expired.id});
  assert.equal(m.data,original);assert.equal(JSON.stringify(m.data),before);assert.equal(m.product(p.id).stock,10);
  assert.equal(Lots.lotSnapshot(m.data,p.id).lots.find(l=>l.id===expired.id).remaining,4);assert(!toasts.some(t=>/^Perda registrada/.test(t)));
 });
}

test('after a rejected save the selected-lot loss can be retried and charges only the expired lot',async()=>{
 let fail=true;const f=fixture({persist:()=>!fail});f.b.actions['lots-loss']({id:f.expired.id});
 await f.b.actions['lots-loss-confirm']({id:f.expired.id});fail=false;await f.b.actions['lots-loss-confirm']({id:f.expired.id});
 assert.equal(f.m.product(f.p.id).stock,6);assert.equal(f.m.data.movements.filter(m=>m.kind==='loss').length,1);
 assert.equal(lossValue(f.m.data.movements,()=>1000),4000);assert.equal(Lots.lotSnapshot(f.m.data,f.p.id).available,6);
 assert(f.toasts.some(t=>/^Perda registrada/.test(t)));
});

test('native pending loss waits for durability and retries confirmation without applying the loss again',async()=>{
 let saved=false,calls=0;const f=fixture({durable:async()=>{calls++;return saved;}});f.b.actions['lots-loss']({id:f.expired.id});
 await f.b.actions['lots-loss-confirm']({id:f.expired.id});
 assert.equal(f.m.product(f.p.id).stock,6);assert.equal(f.persistCalls(),1);assert(!f.toasts.some(t=>/^Perda registrada/.test(t)));
 saved=true;await f.b.actions['lots-loss-confirm']({id:f.expired.id});
 assert.equal(calls,2);assert.equal(f.persistCalls(),1);assert.equal(f.m.data.movements.filter(m=>m.kind==='loss').length,1);
 assert(f.toasts.some(t=>/^Perda registrada/.test(t)));
});

test('a native storage exception retains the accepted loss for an idempotent confirmation retry',async()=>{
 let fail=true;const f=fixture({durable:async()=>{if(fail)throw Error('Dispositivo Fictício Indisponível');return true;}});f.b.actions['lots-loss']({id:f.expired.id});
 await f.b.actions['lots-loss-confirm']({id:f.expired.id});assert.equal(f.m.product(f.p.id).stock,6);assert(!f.toasts.some(t=>/^Perda registrada/.test(t)));
 fail=false;await f.b.actions['lots-loss-confirm']({id:f.expired.id});assert.equal(f.persistCalls(),1);assert.equal(f.m.data.movements.filter(m=>m.kind==='loss').length,1);assert(f.toasts.some(t=>/^Perda registrada/.test(t)));
});

test('double confirmation during native storage keeps a single pending loss',async()=>{
 let release;const f=fixture({durable:()=>new Promise(resolve=>release=resolve)});f.b.actions['lots-loss']({id:f.expired.id});
 const first=f.b.actions['lots-loss-confirm']({id:f.expired.id});await f.b.actions['lots-loss-confirm']({id:f.expired.id});
 assert.equal(f.persistCalls(),1);assert.equal(f.m.data.movements.filter(m=>m.kind==='loss').length,1);assert(!f.toasts.some(t=>/^Perda registrada/.test(t)));
 release(true);await first;assert(f.toasts.some(t=>/^Perda registrada/.test(t)));
});

test('native lead preference reports success only after durable storage confirms it',async()=>{
 let saved=false;const f=fixture({durable:async()=>saved});await f.b.actions['lots-lead-save']();
 assert.equal(f.m.data.settings.validityLeadDays[f.p.id],10);assert(!f.toasts.some(t=>/^Aviso 10/.test(t)));
 saved=true;await f.b.actions['lots-lead-save']();assert(f.toasts.some(t=>/^Aviso 10/.test(t)));
});

test('a producer change while storage is pending cannot redraw the previous producer view',async()=>{
 let release;const f=fixture({durable:()=>new Promise(resolve=>release=resolve)}),before=f.opened.length;
 const pending=f.b.actions['lots-lead-save']();f.m.data={...f.m.data,dataContext:{id:'another-synthetic-producer',type:'real'}};
 release(true);await pending;assert.equal(f.opened.length,before);assert(!f.toasts.some(t=>/^Aviso 10/.test(t)));
});
