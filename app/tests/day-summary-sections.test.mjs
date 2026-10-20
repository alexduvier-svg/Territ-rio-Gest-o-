import test from 'node:test';
import assert from 'node:assert/strict';
import {dailySaleSections,dailyItemTotals} from '../src/features/day-summary.js';
import {statement} from '../src/features/finance/finance.js';
const day='2026-10-20',event={id:'fair',name:'Feira do Inventário',start:day,end:day,from:'09:00',until:'14:00',status:'active'};
const sale=(id,time,scope='fair',total=1000)=>({id,date:day+'T'+time+':00-03:00',scope,status:'completed',total,cost:300,payments:[{method:'Pix',amount:total}],items:[]});
test('event starts at 09:00 and ends at 14:00; before and after remain separate without changing sales',()=>{
 const sales=[sale('early','08:59'),sale('start','09:00'),sale('during','13:59'),sale('end','14:00'),sale('late','17:00'),sale('store','10:00','loja')],before=JSON.stringify(sales);
 const groups=dailySaleSections({sales,events:[event],day});assert.deepEqual(groups.map(g=>g.kind),['event','outside','store']);
 assert.equal(groups[0].name,event.name);assert.deepEqual(groups[0].sales.map(s=>s.id),['start','during']);assert.deepEqual(groups[1].sales.map(s=>s.id),['early','end','late']);assert.equal(groups[2].sales[0].id,'store');assert.equal(JSON.stringify(sales),before);
 const all=statement({sales,expenses:[],general:false});assert.equal(groups.reduce((n,g)=>n+statement({...g,expenses:[],general:false}).revenue,0),all.revenue);
});
test('saved instant uses Brasília rather than phone locale; no guessed event from a Loja sale',()=>{
 const sales=[{...sale('utc','09:00'),date:day+'T12:00:00Z'},sale('store','09:00','loja'),{...sale('tomorrow','09:00'),date:'2026-10-21T09:00:00-03:00'},{...sale('draft','09:00'),status:'draft'}];
 const groups=dailySaleSections({sales,events:[event],day});assert.deepEqual(groups.flatMap(g=>g.sales.map(s=>s.id)),['utc','store']);
});
test('multiple events remain named; invalid schedule is explicit and completed event history remains attributable',()=>{
 const second={...event,id:'other',name:'Outra feira',status:'finished'},unknown={...event,id:'unknown',name:'Sem horário',from:''};
 const groups=dailySaleSections({sales:[sale('a','10:00'),sale('b','10:00','other'),sale('c','10:00','unknown')],events:[event,second,unknown],day});assert.equal(groups.length,3);assert.equal(groups.find(g=>g.eventId==='unknown').from,null);assert.equal(groups.find(g=>g.eventId==='other').kind,'event');
});
test('refunds use the refund date and reconcile section totals, without duplicating a sale from another day',()=>{
 const s={...sale('refund','10:00'),status:'returned',returnedAt:day+'T15:00:00-03:00'},old={...s,id:'old',date:'2026-10-19T10:00:00-03:00'};
 const groups=dailySaleSections({sales:[s,old],returns:[s,old],events:[event],day});assert.equal(groups[0].sales.length,1);assert.equal(groups[1].returns.length,2);
 assert.equal(groups.reduce((n,g)=>n+statement({...g,expenses:[],general:false}).revenue,0),-1000);
});
test('multi-day event applies the same daily window and item quantities keep distinct units',()=>{
 const multi={...event,start:'2026-10-19',end:'2026-10-21'},groups=dailySaleSections({sales:[sale('ok','12:00'),sale('out','18:00')],events:[multi],day});assert.deepEqual(groups.map(g=>g.kind),['event','outside']);
 const rows=[{productId:'b',name:'Banana',unit:'Dúzia',qty:3,amount:3000},{productId:'b',name:'Banana',unit:'Dúzia',qty:-1,amount:-1000},{productId:'b',name:'Banana',unit:'kg',qty:1.5,amount:500}];assert.deepEqual(dailyItemTotals(rows).map(r=>[r.unit,r.qty,r.amount]),[['Dúzia',2,2000],['kg',1.5,500]]);
});
