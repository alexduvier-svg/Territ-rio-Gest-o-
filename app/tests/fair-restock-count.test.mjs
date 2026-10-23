import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {fairRestockSummary,buildFairReport} from '../src/features/fair-report.js';
import {recordFairActivity} from '../src/features/fair-activity.js';
const at='2026-10-23T13:00:00.000Z',later='2026-10-23T13:30:00.000Z';
const event={id:'fair',name:'Feira',status:'active',start:'2026-10-23',end:'2026-10-23',from:'09:00',until:'14:00'};
const row=(productId,restocks)=>({productId,name:productId,unit:'Pacote',qty:10,restocks});

test('initial load and repeated read-only summaries do not create replenishments',()=>{const load={createdAt:at,updatedAt:later,items:[row('coffee',undefined)]},before=JSON.stringify(load);for(let i=0;i<20;i++)assert.deepEqual(fairRestockSummary(load),{count:0,productEntries:0,complete:true,products:[]});assert.equal(JSON.stringify(load),before);});

test('one confirmation with several products counts once, duplicates do not increment it',()=>{const one={at,qty:2,operationId:'one'},two={at:later,qty:1,operationId:'two'},load={items:[row('coffee',[one,two,{...two}]),row('banana',[{...one,qty:3}])]};const s=fairRestockSummary(load);assert.equal(s.count,2);assert.equal(s.productEntries,3);assert.deepEqual(s.products,[{productId:'coffee',unit:'Pacote',count:2},{productId:'banana',unit:'Pacote',count:1}]);});

test('legacy timestamps group a batch across products and distinct explicit ids keep simultaneous confirmations separate',()=>{const s=fairRestockSummary({items:[row('coffee',[{at,qty:2},{at:'2026-10-23T10:00:00-03:00',qty:2},{at,qty:1,fairActivityId:'a'},{at,qty:1,fairActivityId:'b'}]),row('banana',[{at,qty:3}])]});assert.equal(s.count,3);assert.equal(s.productEntries,4);});

test('unknown or invalid history is partial and never fabricates confirmation times',()=>{const s=fairRestockSummary({items:[row('coffee',[{qty:2},{at,qty:0},{at,qty:-1},{at,qty:Infinity},{at:'invalid',qty:2},{at,qty:1}]),row('banana','bad')]});assert.equal(s.count,1);assert.equal(s.complete,false);assert.equal(s.products[0].count,1);});

test('fair report exposes counts without changing loaded balance, sales, revenue or history',()=>{const load={createdAt:at,updatedAt:later,items:[row('coffee',[{at:later,qty:2}])]},before=JSON.stringify(load),args={event,load,sales:[]},r=buildFairReport(args);assert.equal(r.totals.restockCount,1);assert.equal(r.totals.restockCountKnown,1);assert.equal(r.products[0].restockCount,1);assert.equal(r.products[0].restocked,2);assert.equal(r.totals.took,10);assert.equal(r.totals.left,10);assert.equal(r.totals.revenue,0);assert.deepEqual(buildFairReport(args).restockSummary,r.restockSummary);assert.equal(JSON.stringify(load),before);});

test('a legacy inferred replenishment cannot be presented as an exact count',()=>{const r=buildFairReport({event,load:{createdAt:at,updatedAt:later,items:[row('coffee',undefined)]},sales:[{id:'sale',scope:'fair',status:'completed',date:'2026-10-23T13:10:00Z',total:100,subtotal:100,payments:[],items:[{productId:'coffee',unit:'Pacote',qty:1,total:100}]}]});assert.equal(r.answers.reposicao,'CONSEGUI REPOR');assert.equal(r.restockSummary.count,0);assert.equal(r.restockSummary.complete,false);assert.equal(r.totals.restockCountKnown,0);});

const ctx={Date,Math,Intl,JSON};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8'),ctx);
test('confirmed activity retries and reopening preserve two replenishments without adding a parallel counter',()=>{const m=new ctx.ERP.ERPModel({schema:1,dataContext:{id:'qa',type:'real'},settings:{onboarding:'clean'},events:[event],products:[{id:'coffee',name:'Coffee',category:'Cafés',unit:'Pacote',weight:250,stock:10,price:2500,cost:1000}],eventLoads:[{eventId:'fair',items:[row('coffee',undefined)]}],sales:[],clients:[],movements:[],expenses:[]});const a={eventId:'fair',productId:'coffee',added:2,sold:0,source:'new',payment:'Pix',operationId:'a'};recordFairActivity(m,a);recordFairActivity(m,a);recordFairActivity(m,{...a,operationId:'b',added:1});const copy=new ctx.ERP.ERPModel(JSON.parse(JSON.stringify(m.data))),r=buildFairReport({event:copy.data.events[0],load:copy.data.eventLoads[0],sales:copy.data.sales});assert.equal(r.totals.restockCount,2);assert.equal(copy.product('coffee').stock,13);assert.equal(copy.data.movements.filter(x=>x.kind==='add').length,2);assert.equal(copy.data.eventLoads[0].items[0].qty,13);assert(!('restockCount' in copy.data.eventLoads[0]));});
