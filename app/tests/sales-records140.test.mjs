import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as R from '../src/features/sales-records/domain.js';
import * as F from '../src/features/finance/finance.js';
const source=fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8');
function model(){
  const c={Date,Intl,Math,JSON,TerritorioSalesRecords:R};c.window=c;vm.createContext(c);vm.runInContext(source,c);
  return new c.ERP.ERPModel({schema:1,dataContext:{id:'qa140',type:'real'},products:[{id:'coffee',name:'Café Especial',baseName:'Café',category:'Cafés',unit:'Pacote',weight:250,stock:20,min:1,price:4500,cost:0,costKnown:false}],sales:[],movements:[],clients:[],events:[],expenses:[],settings:{onboarding:'clean'}});
}
function sell(m,extra={}){return m.complete({operationId:'sale140',scope:'loja',items:[{productId:'coffee',rawQty:'1'}],payment:'Pix',discountMode:'R$',discountValue:'0',...extra});}
const amend=(sale,extra={})=>({saleId:sale.id,index:0,cost:2500,operationId:'cost140',expectedRevision:0,...extra});

test('post-sale cost corrects the historical margin without changing the charged amount, current catalog or stock',()=>{
  const m=model(),s=sell(m),stock=m.product('coffee').stock,moves=JSON.stringify(m.data.movements),catalog=JSON.stringify(m.data.products);
  assert.equal(F.productMargins([s])[0].costKnown,false);
  m.amendSaleCost(amend(s));const updated=m.data.sales[0];
  assert.equal(updated.total,4500);assert.equal(updated.items[0].price,4500);assert.equal(updated.cost,2500);
  assert.equal(F.productMargins([updated])[0].costKnown,true);assert.equal(F.productMargins([updated])[0].revenue-F.productMargins([updated])[0].cost,2000);
  assert.equal(m.product('coffee').stock,stock);assert.equal(JSON.stringify(m.data.products),catalog);assert.equal(JSON.stringify(m.data.movements),moves);
  assert.equal(updated.costCorrections.length,1);assert.equal(updated.costCorrections[0].before.costKnown,false);assert.equal(updated.costCorrections[0].after.cost,2500);
});
test('a repeated cost operation is idempotent and cannot be reused for another amount',()=>{
  const m=model(),s=sell(m),command=amend(s);m.amendSaleCost(command);const audit=m.data.domainAudit.length;
  m.amendSaleCost(command);assert.equal(m.data.sales[0].costCorrections.length,1);assert.equal(m.data.domainAudit.length,audit);
  assert.throws(()=>m.amendSaleCost({...command,cost:2600}),/outro custo/);
});
test('a subsequent correction keeps the original and intermediate costs and rejects stale revisions',()=>{
  const m=model(),s=sell(m);m.amendSaleCost(amend(s));assert.throws(()=>m.amendSaleCost(amend(s,{operationId:'cost2',cost:2700})),/mudou/);
  m.amendSaleCost(amend(s,{operationId:'cost2',cost:2700,expectedRevision:1}));const rows=m.data.sales[0].costCorrections;
  assert.equal(rows.length,2);assert.equal(rows[1].before.cost,2500);assert.equal(rows[1].after.cost,2700);
});
test('zero cost requires an explicit valid input and remains different from missing cost',()=>{
  assert.equal(R.parseCost('0'),0);assert.throws(()=>R.parseCost(''));assert.throws(()=>R.parseCost('abc'));assert.throws(()=>R.parseCost('-1'));assert.throws(()=>R.parseCost('2,345'));
  const m=model(),s=sell(m);m.amendSaleCost(amend(s,{cost:0}));assert.equal(m.data.sales[0].items[0].costKnown,true);assert.equal(m.data.sales[0].cost,0);
});
test('cost precision follows the historical quantity, including kilograms',()=>{
  const m=model();Object.assign(m.product('coffee'),{unit:'kg',stock:20});const s=sell(m,{items:[{productId:'coffee',rawQty:'1,5'}]});
  m.amendSaleCost(amend(s,{cost:1234}));assert.equal(m.data.sales[0].items[0].costTotal,1851);assert.equal(m.data.sales[0].cost,1851);
});
test('cost correction after a return reconciles without creating a second stock return',()=>{
  const m=model(),s=sell(m);m.refund(s.id);const movements=JSON.stringify(m.data.movements);m.amendSaleCost(amend(s));const updated=m.data.sales[0];
  assert.equal(updated.status,'returned');assert.equal(m.product('coffee').stock,20);assert.equal(JSON.stringify(m.data.movements),movements);assert.equal(F.productMargins([updated],[updated]).length,0);
});
test('cost changes reject another producer, invalid values, invalid item and training context',()=>{
  for(const kind of ['actor','amount','index','training']){const m=model(),s=sell(m),command=amend(s);if(kind==='actor')s.actorId='another';if(kind==='amount')command.cost=Infinity;if(kind==='index')command.index=3;if(kind==='training')m.data.training={version:1};const before=JSON.stringify(m.data);assert.throws(()=>m.amendSaleCost(command));assert.equal(JSON.stringify(m.data),before);}
});
test('history uses Brasília months, keeps old sales in one store and separates other producers',()=>{
  const m=model(),s=sell(m);s.date='2026-12-01T02:30:00Z';m.data.sales.push({...JSON.parse(JSON.stringify(s)),id:'other',actorId:'another',date:'2026-11-25T12:00:00Z'});
  const before=JSON.stringify(m.data),h=R.history(m.data,{month:'2026-11'});assert.equal(h.sales.length,1);assert.equal(h.days[0].date,'2026-11-30');assert.deepEqual(h.months,['2026-11']);assert.equal(JSON.stringify(m.data),before);
});
test('confirmed late sale day controls the archive month without replacing the recording timestamp',()=>{
  const m=model(),s=sell(m);Object.assign(s,{date:'2026-12-03T12:00:00Z',occurrenceDay:'2026-11-29',occurrenceConfirmed:true});assert.equal(R.history(m.data,{month:'2026-11'}).sales.length,1);assert.equal(s.date,'2026-12-03T12:00:00Z');
});
test('three credit installments distribute cents exactly and never change the sale total',()=>{
  const plan=R.installments({amount:1000,count:3,firstDate:'2027-01-10'},'2026-12-10');assert.deepEqual(plan.installments.map(p=>p.amount),[334,333,333]);assert.equal(plan.installments.reduce((n,p)=>n+p.amount,0),1000);
});
test('monthly schedules retain the 31st anchor through February and leap years',()=>{
  assert.deepEqual(R.installments({amount:300,count:3,firstDate:'2027-02-28',anchorDay:31},'2027-01-31').installments.map(p=>p.date),['2027-02-28','2027-03-31','2027-04-30']);
  assert.equal(R.addMonths('2028-01-31',1),'2028-02-29');
});
test('custom dates remain exact and reject invalid, repeated or reversed dates',()=>{
  const input={amount:900,count:3,firstDate:'2027-01-10',dates:['2027-01-10','2027-02-15','2027-04-20']};assert.deepEqual(R.installments(input,'2026-12-10').installments.map(p=>p.date),input.dates);
  for(const dates of [['2027-01-10','2027-01-10','2027-04-20'],['2027-01-10','2027-02-30','2027-04-20'],['2027-01-10','2027-01-09','2027-04-20']])assert.throws(()=>R.installments({...input,dates},'2026-12-10'));
});
test('invalid installment counts and changed credit amounts cannot be accepted',()=>{
  for(const count of [0,1.5,61,NaN])assert.throws(()=>R.installments({amount:1000,count,firstDate:'2027-01-10'},'2026-12-10'));
  const p=R.installments({amount:1000,count:3,firstDate:'2027-01-10'},'2026-12-10');assert.throws(()=>R.validatedPlan(p,1100,'2026-12-10'),/mudou/);
});
test('credit plan survives sale recording and exact retry but rejects a different plan for the same sale operation',()=>{
  const m=model(),cardPlan=R.installments({amount:4500,count:3,firstDate:R.addMonths(R.day(),1)}),draft={payment:'Crédito',cardPlan};
  const sale=sell(m,draft);assert.equal(sale.cardPlan.count,3);assert.equal(sale.payments[0].amount,4500);assert.equal(sell(m,draft).id,sale.id);assert.equal(m.data.sales.length,1);
  const other=R.installments({amount:4500,count:2,firstDate:cardPlan.firstDate});assert.throws(()=>sell(m,{payment:'Crédito',cardPlan:other}),/outros dados/);
});
test('split payment schedules cover only the credit portion and ordinary old credit records remain valid',()=>{
  const m=model(),cardPlan=R.installments({amount:1500,count:3,firstDate:R.addMonths(R.day(),1)}),s=sell(m,{split:true,parts:[{method:'Crédito',value:'15,00'},{method:'Pix',value:'30,00'}],cardPlan});assert.equal(s.cardPlan.installments.reduce((n,p)=>n+p.amount,0),1500);assert.equal(s.total,4500);
  const old=model();assert.equal(sell(old,{payment:'Crédito'}).cardPlan,undefined);
});
