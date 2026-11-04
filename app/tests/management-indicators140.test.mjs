import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as M from '../src/features/kpi/management-indicators.js';
import * as F from '../src/features/finance/finance.js';
import * as R from '../src/features/sales-records/domain.js';
import {recordDay,recordClock,recordInstant} from '../src/features/record-date.js';
import {dailySaleSections} from '../src/features/day-summary.js';
const sale=(id,total,cost,customerId)=>({id,status:'completed',date:'2026-10-05T12:00:00Z',scope:'loja',customerId,total,cost:cost??0,discount:0,payments:[{method:'Pix',amount:total}],items:[{productId:'coffee',name:'Café',unit:'Pacote',qty:1,price:total,total,netTotal:total,cost:cost??0,costTotal:cost??0,costKnown:cost!==null}]});
const dto=(sales,returns=[],expenses=[])=>{const finance={...F.statement({sales,returns,expenses,shares:[{month:'2026-10',share:1}],settings:{}}),margins:F.productMargins(sales,returns),missingDays:[]};return {finance,sales,returns,dataContext:{type:'real'},audit:{errors:[]}};};
test('indicators share the canonical historical statement; cost repair reaches margin, contribution, ROI and missing products',()=>{
 const sales=[sale('a',4500,null,'client')],data={dataContext:{id:'qa',type:'real'},sales,expenses:[{id:'i',title:'Balança',kind:'investimento',amount:1000,date:'2026-10-01'}]};let input=dto(sales),facts=M.summary(input);assert.equal(facts.primary[0].value,null);assert.equal(R.missingCosts(data).lines,1);
 assert.throws(()=>M.investmentAssessment({data,investmentId:'i',finance:input.finance,quality:facts.quality,attributionBps:10000,confirmed:true,throughDay:'2026-10-31'}),/custos/);
 R.amendCost(data,{saleId:'a',index:0,cost:2500,operationId:'c'});input=dto(sales);facts=M.summary(input);assert.equal(facts.primary[1].value,2000);assert.equal(facts.primary[0].value,2000/4500*100);assert.equal(R.missingCosts(data).lines,0);
 const roi=M.investmentAssessment({data,investmentId:'i',finance:input.finance,quality:facts.quality,attributionBps:10000,confirmed:true,throughDay:'2026-10-31',monthShare:1,periodComplete:true});assert.equal(roi.roi,100);assert.equal(roi.payback,.5);assert.equal(roi.result,input.finance.result);assert.equal(sales[0].total,4500);
});
test('CRM uses stable identified IDs, weighted coverage and excludes full returns consistently with ticket',()=>{
 const rows=[sale('a',1000,100,'c1'),sale('b',3000,200,'c1'),sale('c',6000,400),sale('d',2000,100,'c2')];rows[3].status='returned';const facts=M.summary(dto(rows,[rows[3]]));assert.equal(facts.primary[2].value,Math.round(10000/3));assert.equal(facts.crm.frequency,2);assert.equal(facts.crm.clients,1);assert.equal(facts.crm.identifiedRevenueRate,40);assert.equal(facts.crm.repeatRate,100);assert.equal(facts.crm.identificationRate,2/3*100);
});
test('mixed unknown historical costs in one SKU stay partial even after current catalog cost exists',()=>{
 const rows=[sale('a',1000,100),sale('b',3000,null)],facts=M.summary(dto(rows));assert.equal(facts.quality.completeCosts,false);assert.equal(facts.quality.costCoverage,25);assert.equal(facts.primary[0].value,null);assert.equal(facts.primary[2].value,2000);
});
test('zero explicitly registered is known; empty bases do not fabricate ratios',()=>{
 const facts=M.summary(dto([sale('a',1000,0)]));assert.equal(facts.quality.completeCosts,true);assert.equal(facts.primary[0].value,100);const empty=M.summary(dto([]));assert.equal(empty.primary[2].value,null);assert.equal(empty.crm.frequency,null);assert.equal(empty.crm.identificationRate,null);
});
test('ROI cannot be detached from a recorded same-producer investment, complete costs and confirmed attribution',()=>{
 const data={dataContext:{id:'qa',type:'real'},expenses:[{id:'i',kind:'investimento',amount:10000,date:'2026-10-01'},{id:'other',kind:'investimento',amount:1,date:'2026-10-01',actorId:'x'},{id:'sim',kind:'investimento',amount:1,date:'2026-10-01',simulated:true}]};const base={data,investmentId:'i',finance:{result:5000},quality:{completeCosts:true},attributionBps:5000,confirmed:true,throughDay:'2026-10-31',monthShare:1,periodComplete:true};assert.deepEqual(M.investments(data).map(x=>x.id),['i']);const r=M.investmentAssessment(base);assert.equal(r.attributed,2500);assert.equal(r.roi,-75);assert.equal(r.payback,4);assert.equal(r.investmentId,'i');
 for(const patch of [{investmentId:'other'},{confirmed:false},{attributionBps:10001},{quality:{completeCosts:false}},{quality:{completeCosts:true,missingDays:1}},{quality:{completeCosts:true,errors:1}},{throughDay:'2026-09-30'}])assert.throws(()=>M.investmentAssessment({...base,...patch}));
 assert.equal(M.investmentAssessment({...base,finance:{result:-1000}}).payback,null);assert.equal(M.investmentAssessment({...base,periodComplete:false}).payback,null);
});
test('confirmed occurrence day is shared by archive, selected month and daily sections; a return keeps its own day',()=>{
 const s={...sale('late',4500,2500),date:'2026-11-04T12:00:00Z',occurrenceDay:'2026-10-31',occurrenceConfirmed:true};assert.equal(recordDay(s),'2026-10-31');assert.equal(recordClock(s),'');assert.equal(recordInstant(s),Date.parse('2026-10-31T12:00:00-03:00'));assert.equal(R.history({sales:[s]},{month:'2026-10'}).sales.length,1);
 assert.equal(dailySaleSections({sales:[s],day:'2026-10-31'}).flatMap(g=>g.sales).length,1);
 const source=fs.readFileSync(new URL('../src/legacy/erp-ui.js',import.meta.url),'utf8'),fn=source.match(/function matchesSelection\(record,sel\)\{[^\n]+/)[0],ctx={E:{recordDay},window:{TerritorioSalesRecords:R},matchesSource:()=>true};vm.createContext(ctx);vm.runInContext(fn,ctx);assert.equal(ctx.matchesSelection(s,{month:'2026-10'}),true);assert.equal(ctx.matchesSelection(s,{month:'2026-11'}),false);assert.equal(ctx.matchesSelection(s,{month:'2026-10',from:'08:00'}),false);
 assert.equal(ctx.matchesSelection({...s,date:'2026-11-05T12:00:00Z',occurrenceConfirmed:false},{month:'2026-11'}),true);
});
test('civil dates do not slip into the previous month in Brasília',()=>{assert.equal(recordDay({date:'2026-11-01'}),'2026-11-01');assert.equal(recordClock({date:'2026-11-01'}),'');assert.equal(R.parseCost('1.234,56'),123456);assert.equal(R.parseCost('12.34'),1234);});

test('invalid legacy dates remain visible in a separate archive group and never become a selected finance day',()=>{const s=sale('bad',1000,100);s.date='invalid';const h=R.history({sales:[s]},{month:'undated'});assert.equal(h.sales.length,1);assert.deepEqual(h.months,['undated']);assert.equal(recordDay(s),'');assert.equal(recordClock(s),'');});

import {answerQuestion} from '../src/features/agent/question-engine.js';
test('the local business question uses the same occurrence month and corrected historical cost as the report',()=>{const s={...sale('late-question',4500,2500),date:'2026-11-04T12:00:00Z',occurrenceDay:'2026-10-31',occurrenceConfirmed:true};const data={sales:[s],products:[],clients:[]},now=Date.parse('2026-11-04T15:00:00Z');assert.match(answerQuestion(data,'quanto vendi em outubro de 2026',{now}).text,/45,00/);assert.match(answerQuestion(data,'qual lucro em outubro de 2026',{now}).text,/20,00/);assert.doesNotMatch(answerQuestion(data,'quanto vendi em novembro de 2026',{now}).text,/45,00/);});

test('sales CSV carries the canonical business day, pending cost, corrections and planned installments from the sale itself',()=>{const source=fs.readFileSync(new URL('../src/legacy/erp-ui.js',import.meta.url),'utf8'),fn=source.match(/function saleCSVRows\(sales\)\{[^\n]+/)[0],ctx={E:{recordDay},window:{TerritorioSalesRecords:R},saleSourceName:()=> 'Loja',model:{data:{clients:[]}}};vm.createContext(ctx);vm.runInContext(fn,ctx);const s=sale('csv',4500,null);s.occurrenceDay='2026-09-30';s.occurrenceConfirmed=true;let row=ctx.saleCSVRows([s])[1];assert.equal(row[12],'');assert.equal(row[13],'');assert.equal(row[16],'2026-09-30');assert.match(row[17],/parcial/);s.items[0].costKnown=true;s.costRevision=1;s.cardPlan=R.installments({amount:4500,count:2,firstDate:'2026-11-10'},'2026-10-10');row=ctx.saleCSVRows([s])[1];assert.equal(row[12],'0.00');assert.equal(row[13],'45.00');assert.equal(row[18],1);assert.match(row[19],/2026-11-10.*22.50/);});

test('missing record dates remain unknown and do not become today or double the planned draw',()=>{for(const date of [undefined,null,'']){assert.equal(recordDay({date}),'');assert.equal(recordClock({date,occurrenceConfirmed:true,occurrenceDay:'2026-10-31'}),'');assert.equal(recordInstant({date,occurrenceConfirmed:true,occurrenceDay:'2026-10-31'}),Date.parse('2026-10-31T12:00:00-03:00'));const st=F.statement({sales:[],expenses:[{kind:'retirada',amount:150000,date}],settings:{drawOn:true,drawMonthly:150000},shares:[{month:'2026-10',share:1}]});assert.equal(st.draw,150000);assert.equal(st.drawForecast,0);}});
