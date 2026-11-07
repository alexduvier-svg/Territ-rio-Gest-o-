import test from 'node:test';
import assert from 'node:assert/strict';
import {statement, monthShares, rangeMonthShares} from '../src/features/finance/finance.js';
import {recordDay,recordClock} from '../src/features/record-date.js';
import {dailyRevenue,hourlyPurchases,investmentReturn} from '../src/features/management-hub/domain.js';
import {rankWeekdays,rankHours,rankPayments,salesPatterns} from '../src/features/management-hub/ranking.js';
import {questionPeriod} from '../src/features/agent/question-engine.js';
import {rfmSegments} from '../src/features/advisor/council-rules.js';
import {purchaseMatrix} from '../src/features/suppliers/model.js';

const addDays=(day,n)=>{const d=new Date(day+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
const late={id:'late',status:'completed',date:'2026-11-06T15:00:00Z',occurrenceConfirmed:true,occurrenceDay:'2026-10-31',total:4500,customerId:'c',items:[{productId:'p',name:'Café',qty:1}],payments:[{method:'Pix',amount:4500}]};

test('late sale day is shared by daily revenue, weekday and CRM; its unknown hour is excluded',()=>{
 assert.deepEqual(dailyRevenue([late],[]),[{date:'2026-10-31',amount:4500}]);
 assert.deepEqual(hourlyPurchases([late]),{rows:[],unknown:1});
 assert.equal(rankWeekdays([late],(_at,s)=>recordDay(s))[0].weekday,6);
 assert.deepEqual(rankHours([late],(_at,s)=>recordClock(s)),{rows:[],unknown:1});
 const crm=rfmSegments([late],'2026-12-01',(_at,s)=>recordDay(s));
 assert.equal(crm.fresh,0);
});
test('a later refund uses its own civil day, even when the sale was entered late',()=>{
 const returned={...late,status:'returned',returnedAt:'2026-11-05T15:00:00Z'};
 assert.deepEqual(dailyRevenue([returned],[returned]),[{date:'2026-10-31',amount:4500},{date:'2026-11-05',amount:-4500}]);
});
test('a purchase expense affects result once; cash follows the payment date without duplicating it',()=>{
 const purchase={id:'buy',total:10000,settlement:{status:'open',dueDate:'2026-11-20'}};
 const expenses=[{id:'cost',purchaseId:'buy',kind:'producao',amount:10000,date:'2026-10-31'}];
 const base={sales:[],expenses,settings:{},purchases:[purchase]};
 const open=statement(base);assert.equal(open.result,-10000);assert.equal(open.cash,0);
 const samePeriod=statement({...base,purchasesPaid:10000});
 assert.equal(samePeriod.result,-10000);assert.equal(samePeriod.cash,-10000);
 const nextPeriod=statement({...base,expenses:[],purchasesPaid:10000});
 assert.equal(nextPeriod.result,0);assert.equal(nextPeriod.cash,-10000);
 assert.equal(statement({...base,purchases:[]}).cash,-10000,'independent legacy expense retains its cash semantics');
});
test('cash reserves remain separate when a paid purchase and a planned draw are present',()=>{
 const x=statement({sales:[],expenses:[],purchasesPaid:10000,settings:{fixedCosts:[{title:'Energia',amount:9000}],drawOn:true,drawMonthly:30000},shares:monthShares({month:'2026-11'})});
 assert.equal(x.cash,-10000);assert.equal(x.cashForecast,39000);assert.equal(x.cashAfterForecast,-49000);
 assert.equal(x.result,-39000);
});
test('range proration matches civil days across leap February and adjacent months',()=>{
 const start='2024-02-27',end='2024-03-02',days=[];
 for(let d=start;d<=end;d=addDays(d,1))days.push(d);
 assert.deepEqual(rangeMonthShares(start,end),monthShares({days}));
 assert.deepEqual(rangeMonthShares('2026-12-31','2027-01-01'),[{month:'2026-12',share:1/31},{month:'2027-01',share:1/31}]);
 assert.deepEqual(rangeMonthShares('2026-11-05','2026-11-01'),[]);
});
test('finance questions keep explicit historical years and named month periods',()=>{
 const now=Date.parse('2026-11-06T15:00:00Z');
 assert.deepEqual(questionPeriod('qual foi o resultado no ano de 2025?',now),{from:'2025-01-01',to:'2025-12-31',label:'em 2025',explicit:true});
 assert.equal(questionPeriod('qual foi o caixa em outubro de 2025?',now).from,'2025-10-01');
 assert.equal(questionPeriod('qual foi o resultado?',now).explicit,false);
});
test('payment ranking counts a method once per sale while retaining every cent',()=>{
 const x={...late,payments:[{method:'Pix',amount:2000},{method:'Pix',amount:2500},{method:'Dinheiro',amount:100}]};
 assert.deepEqual(rankPayments([x]),[{method:'Pix',count:1,amount:4500},{method:'Dinheiro',count:1,amount:100}]);
});
test('patterns use exactly ninety civil days; absent hours never become midnight',()=>{
 const today='2026-11-06',sales=Array.from({length:5},(_,i)=>({...late,id:'p'+i,date:addDays(today,-90+i)+'T15:00:00Z',occurrenceConfirmed:false}));
 const out=salesPatterns(sales,{today,addDays,dayOf:(_at,s)=>recordDay(s),clockOf:(_at,s)=>recordClock(s)});
 assert.equal(out.rows.length,0,'the first sale is outside the ninety-day window, leaving fewer than five');
 assert.equal(rfmSegments([{...late,date:'2099-01-01',occurrenceConfirmed:false}],'2026-11-06',(_at,s)=>recordDay(s)).clients,0);
});
test('the imported return helper agrees with the Codex net ROI equation',()=>{
 assert.equal(investmentReturn({amount:1000,result:2000,percent:100}).roi,1);
 assert.equal(investmentReturn({amount:1000,result:500,percent:100}).roi,-.5);
});

test('purchasing risk keeps distinct product identifiers and units separate',()=>{
 const purchases=['a','b','c'].flatMap((id,index)=>[0,1].map(n=>({id:id+n,supplierId:'vendor-'+id,total:1000,item:{productId:id,name:'Mesmo nome',specification:'Mesma descrição',unit:index===2?'kg':'Unidade'}})));
 const data={dataContext:{id:'a'},supplierBook:{version:1,actorId:'a',suppliers:[],comparisons:[],purchases}};
 const r=purchaseMatrix(data);assert.equal(r.items,3);assert.equal(r.available,true);assert(r.rows.every(row=>row.suppliers===1));
});
