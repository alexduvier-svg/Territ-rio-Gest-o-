import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {recordFairActivity} from '../src/features/fair-activity.js';
import {stockPartition} from '../src/features/store/availability.js';
const c={Date,Math,Intl,JSON};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8'),c);
const at=Date.parse('2026-10-23T10:00:00-03:00'),base={id:'fair',name:'Feira',status:'active',start:'2026-10-23',end:'2026-10-23',from:'08:00',until:'18:00'};
test('feira oficial já fechada nunca volta a vender mesmo com status legado ativo',()=>{
 for(const patch of [{fairClosedAt:'2026-10-23T09:00:00-03:00'},{finishedAt:'2026-10-23T09:00:00-03:00'},{fairCancelled:true},{cancelledByProducer:true}])assert(!c.ERP.eventSellingNow({...base,fairId:'official',...patch},at));
 assert(c.ERP.eventSellingNow(base,at));
});
test('término não é encerramento conferido; adiamento antigo continua pendente',()=>{
 for(const e of [{...base,status:'finished'},{...base,fairClosedAt:'closed',surplusCheck:{conferido:false}},{...base,status:'finished',lossReviewPending:true}]){
  const phase=c.ERP.eventLifecycle(e);assert(phase.ended&&phase.pending&&!phase.closed);
 }
 const e={...base,fairClosedAt:'closed',surplusCheck:{conferido:true},lossReviewedAt:'checked'};assert(c.ERP.eventLifecycle(e).closed);
 assert(c.ERP.eventLifecycle(base,{closedAt:'legacy'}).closed);
});
test('cancelamento não exige conferência e consulta de estado não muda dados',()=>{
 const e={...base,cancelledByProducer:true,surplusCheck:{conferido:false}},before=JSON.stringify(e),phase=c.ERP.eventLifecycle(e);
 assert(phase.cancelled&&phase.closed&&!phase.pending);assert.equal(JSON.stringify(e),before);
});
function model(){return new c.ERP.ERPModel({settings:{onboarding:'clean'},dataContext:{id:'qa'},products:[{id:'coffee',name:'Café Especial',category:'Cafés',unit:'Pacote',stock:10,price:2500,cost:1000}],events:[{...base,status:'finished',fairClosedAt:'legacy',surplusCheck:{conferido:false}}],eventLoads:[{eventId:'fair',items:[{productId:'coffee',unit:'Pacote',qty:5}]}],sales:[],movements:[],clients:[],expenses:[]});}
test('conferência adiada retém carga sem alterar saldo; acerto é idempotente',()=>{
 const m=model();assert.deepEqual(stockPartition(m.data,'coffee'),{total:10,allocated:5,home:5});
 const input={eventId:'fair',productId:'coffee',added:0,sold:1,source:'existing',payment:'Pix',operationId:'pending-qa'};
 recordFairActivity(m,input);recordFairActivity(m,input);assert.equal(m.data.sales.length,1);assert.equal(m.product('coffee').stock,9);
 m.data.events[0].surplusCheck.conferido=true;m.data.events[0].lossReviewedAt='checked';assert(m.eventLifecycle('fair').closed);
 assert.throws(()=>recordFairActivity(m,{...input,operationId:'new'}));assert.equal(m.data.sales.length,1);
});
