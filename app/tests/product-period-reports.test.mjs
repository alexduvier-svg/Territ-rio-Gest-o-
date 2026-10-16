import test from 'node:test';
import assert from 'node:assert/strict';
import { reportContext, realProductSales, productNetItems, productPeriod, buildProductPeriodReport, rankProductRows, reconcileProductPeriods, productPeriodNotices, reportExplanation } from '../src/features/product-period-reports.js';

const DAY=86400000,anchor=Date.parse('2026-08-01T10:00:00-03:00');
const product=(id,unit='Pacote')=>({id,name:'Produto '+id,unit,stock:0,price:999999,cost:999999,createdAt:new Date(anchor-DAY).toISOString()});
const sale=(id,offset,items,status='completed',extra={})=>({id,date:new Date(anchor+offset*DAY).toISOString(),status,items:items.map(([productId,qty,price,cost,unit='Pacote',known=true])=>({productId,name:'Produto '+productId,unit,qty,price,total:qty*price,cost,costTotal:qty*cost,costKnown:known})),subtotal:items.reduce((n,i)=>n+i[1]*i[2],0),total:items.reduce((n,i)=>n+i[1]*i[2],0),payments:[{method:'Pix',amount:99999999}],...extra});
const data=(sales=[],products=[])=>({schema:1,dataContext:{type:'real',id:'producer-a'},settings:{onboarding:'clean'},sales,products,events:[],movements:[]});
const report=(d,kind='weekly',now=anchor+7*DAY)=>buildProductPeriodReport(d,productPeriod(d,kind,now),now);

test('only confirmed real context and real completed/full-return facts establish an anchor',()=>{
 const base=data([sale('a',0,[['a',1,100,50]]),sale('exemplo-1',-30,[['a',1,100,50]]),sale('sim',-10,[['a',1,100,50]],'completed',{simulation:true}),sale('draft',-5,[['a',1,100,50]],'draft'),sale('hidden',-2,[['a',1,100,50]],'completed',{dataContext:{type:'unconfirmed'}}),sale('a',0,[['a',99,100,50]])]);
 assert.deepEqual(realProductSales(base,anchor+DAY).map(s=>s.id),['a']);
 for(const type of ['demo','simulation','unconfirmed'])assert.deepEqual(realProductSales({...base,dataContext:{type}},anchor+DAY),[]);
 assert.equal(reportContext({...base,dataContext:undefined}).type,'real');
 assert.equal(reportContext({settings:{}}).type,'unconfirmed');
 base.events=[{id:'demo-event',demo:true}];base.sales.push(sale('event-demo',-2,[['a',1,100,50]],'completed',{scope:'demo-event'}));
 assert.equal(realProductSales(base,anchor+DAY).length,1);
});

test('seven and thirty entire days mature independently and boundaries are end-exclusive',()=>{
 const d=data([sale('first',0,[['a',1,100,50]])]);
 assert.equal(productPeriod(d,'weekly',anchor+7*DAY-1),null);
 assert.equal(productPeriod(d,'monthly',anchor+29*DAY),null);
 const weekly=productPeriod(d,'weekly',anchor+7*DAY),monthly=productPeriod(d,'monthly',anchor+30*DAY);
 assert.equal(weekly.end-weekly.start,7*DAY);assert.equal(monthly.end-monthly.start,30*DAY);
 d.sales.push(sale('boundary',7,[['a',7,100,50]]));
 assert.equal(buildProductPeriodReport(d,weekly,anchor+7*DAY).rows[0].quantity,1);
});

test('cent allocation uses historical item totals and discounts, never payments or current prices',()=>{
 const s=sale('first',0,[['a',1,101,50],['b',1,101,50],['c',1,101,50]],'completed',{total:301,discount:2});
 assert.deepEqual(productNetItems(s).map(i=>i.amount),[100,100,101]);
 const r=report(data([s],[product('a'),product('b'),product('c')]));
 assert.equal(r.rows.reduce((n,p)=>n+p.revenue,0),301);
 assert.equal(r.rows.find(p=>p.id==='a').grossProfit,50);
 s.items.forEach((i,index)=>i.netTotal=[99,101,101][index]);
 assert.deepEqual(productNetItems(s).map(i=>i.amount),[99,101,101]);
});

test('quantity units remain separate without box, kilo, dozen or package conversion',()=>{
 const d=data([sale('first',0,[['a',12,100,50,'kg'],['b',2,200,100,'Dúzia'],['c',1,500,250,'Caixa'],['d',4,100,50,'Pacote']])],[product('a','kg'),product('b','Dúzia'),product('c','Caixa'),product('d','Pacote')]);
 const r=report(d);
 assert.deepEqual(new Set(r.units.map(g=>g.unit)),new Set(['kg','Dúzia','Caixa','Pacote']));
 assert.equal(r.units.find(g=>g.unit==='Dúzia').top[0].quantity,2);
 assert.equal(r.units.find(g=>g.unit==='Caixa').top[0].quantity,1);
});

test('high volume, high turnover and gross contribution lead different supported rankings',()=>{
 const d=data([sale('first',0,[['cheap',20,100,90],['expensive',2,1000,900],['contributor',3,500,100]])],[product('cheap'),product('expensive'),product('contributor')]);
 const r=report(d);
 assert.equal(r.units[0].top[0].id,'cheap');
 // Equal revenue is tied by stable Portuguese name, never by current selling price.
 assert.equal(r.revenue.top[0].revenue,2000);
 assert.equal(r.profit.top[0].id,'contributor');
 assert.equal(r.profit.top[0].grossProfit,1200);
 assert.match(reportExplanation(r,'revenue'),/Faturamento maior não garante lucro maior/);
 assert.match(reportExplanation(r,'profit'),/custos fixos ficam fora/);
});

test('explicit false vetoes positive cost placeholders; known zero is valid; unsold has no profit basis',()=>{
 const d=data([sale('first',0,[['unknown',1,1000,999,'Pacote',false],['zero',1,500,0,'Pacote',true]])],[product('unknown'),product('zero'),product('unsold')]);
 const r=report(d),unknown=r.rows.find(p=>p.id==='unknown'),zero=r.rows.find(p=>p.id==='zero'),unsold=r.rows.find(p=>p.id==='unsold');
 assert.equal(unknown.grossProfit,null);assert.equal(unknown.costKnown,false);
 assert.equal(zero.grossProfit,500);assert.equal(zero.costKnown,true);
 assert.equal(unsold.noSale,true);assert.equal(unsold.grossProfit,null);
 assert.equal(r.missingCostProducts,1);assert.equal(r.profit.eligible,1);
 assert.ok(![...r.profit.top,...r.profit.bottom].some(p=>p.id==='unknown'||p.id==='unsold'));
});

test('a same-window full return cancels quantity/revenue/frequency without a false missing-cost gap',()=>{
 const returned=sale('first',0,[['a',3,100,0,'Pacote',false]],'returned',{returnedAt:new Date(anchor+2*DAY).toISOString()});
 const r=report(data([returned],[product('a')]));
 assert.equal(r.rows[0].quantity,0);assert.equal(r.rows[0].revenue,0);assert.equal(r.rows[0].frequency,0);
 assert.equal(r.missingCostProducts,0);assert.equal(r.profit.eligible,0);
});

test('legacy returned record without returnedAt offsets on original date rather than becoming a sale',()=>{
 const r=report(data([sale('first',0,[['a',3,100,50]],'returned')],[product('a')]));
 assert.equal(r.rows[0].quantity,0);assert.equal(r.rows[0].revenue,0);assert.equal(r.returnsCount,1);
 assert.equal(r.rows[0].grossProfit,null);
});

test('returns in a later closed window deduct historic amount and cost on the return date',()=>{
 const returned=sale('first',0,[['a',2,1000,200]],'returned',{returnedAt:new Date(anchor+9*DAY).toISOString()});
 const d=data([returned,sale('next',8,[['b',1,500,100]])],[product('a'),product('b')]),r=report(d,'weekly',anchor+14*DAY);
 assert.equal(r.rows.find(p=>p.id==='a').revenue,-2000);assert.equal(r.rows.find(p=>p.id==='a').grossProfit,-1600);
 assert.equal(r.rows.reduce((n,p)=>n+p.revenue,0),-1500);assert.equal(r.returnsCount,1);
});

test('three high/low groups have stable ties and never duplicate products in small samples',()=>{
 for(let size=1;size<=8;size++){
  const rows=Array.from({length:size},(_,i)=>({id:String(i),name:'Produto '+i,revenue:100,quantity:1,grossProfit:50}));
  const r=rankProductRows(rows),ids=[...r.top,...r.bottom].map(p=>p.id);
  assert.equal(new Set(ids).size,ids.length);assert.ok(r.top.length<=3&&r.bottom.length<=3);
  if(size>=6){assert.equal(r.top.length,3);assert.equal(r.bottom.length,3);}
  assert.deepEqual(rankProductRows([...rows].reverse()).top,r.top);
 }
});

test('late product registration cannot appear as unsold in an earlier closed window',()=>{
 const d=data([sale('first',0,[['a',1,100,50]])],[product('a'),{...product('late'),createdAt:new Date(anchor+8*DAY).toISOString()},{...product('legacy-late'),createdAt:undefined}]);
 d.movements=[{id:'registered',productId:'legacy-late',kind:'initial',date:new Date(anchor+8*DAY).toISOString()}];
 assert.deepEqual(report(d).rows.map(p=>p.id),['a']);
});

test('period state is reload-stable, keeps seen/notified markers and revalidates late historical edits',()=>{
 const d=data([sale('first',0,[['a',1,1000,200]])],[product('a')]),first=reconcileProductPeriods(d,anchor+7*DAY);
 assert.equal(first.changed,true);d.productPeriodReports=JSON.parse(JSON.stringify(first.state));
 d.productPeriodReports.entries.weekly.seenAt='seen';d.productPeriodReports.entries.weekly.lastNotifiedAt='sent';
 assert.equal(reconcileProductPeriods(d,anchor+7*DAY+9000).changed,false);
 d.sales.push(sale('late-entry',1,[['a',1,1000,200]]));
 const next=reconcileProductPeriods(d,anchor+7*DAY+10000);
 assert.equal(next.changed,true);assert.equal(next.state.entries.weekly.seenAt,'seen');assert.equal(next.state.entries.weekly.lastNotifiedAt,'sent');
 assert.equal(next.state.entries.weekly.revenue.top[0].revenue,2000);
 const later=reconcileProductPeriods({...d,productPeriodReports:next.state},anchor+14*DAY);
 assert.notEqual(later.state.entries.weekly.id,next.state.entries.weekly.id);assert.equal(later.state.entries.weekly.seenAt,'');
});

test('reset, demo switch and changed first-sale anchor invalidate state without changing business records',()=>{
 const d=data([sale('first',0,[['a',1,100,50]])],[product('a')]);d.productPeriodReports=reconcileProductPeriods(d,anchor+7*DAY).state;
 const before=JSON.stringify(d),r=reconcileProductPeriods({...d,sales:[]},anchor+40*DAY);
 assert.equal(r.state.contextKey,'');assert.deepEqual(r.state.entries,{});assert.equal(JSON.stringify(d),before);
 assert.equal(reconcileProductPeriods({...d,dataContext:{type:'demo'}},anchor+40*DAY).state.contextKey,'');
 d.sales.push(sale('older',-1,[['a',1,100,50]]));
 assert.notEqual(reconcileProductPeriods(d,anchor+7*DAY).state.contextKey,d.productPeriodReports.contextKey);
});

test('native invitations cover bounded eight-week/three-month horizon and due markers deduplicate',()=>{
 const d=data([sale('first',0,[['a',1,100,50]])],[product('a')]);
 const initial=productPeriodNotices(d,anchor+DAY);
 assert.equal(initial.notices.length,11);assert.ok(initial.notices.every(n=>!n.due));
 assert.equal(initial.notices.filter(n=>n.kind==='weekly').length,8);assert.equal(initial.notices.filter(n=>n.kind==='monthly').length,3);
 assert.equal(new Set(initial.notices.map(n=>n.id)).size,11);
 d.productPeriodReports=reconcileProductPeriods(d,anchor+30*DAY).state;
 let current=productPeriodNotices(d,anchor+30*DAY);assert.equal(current.notices.filter(n=>n.due).length,2);
 d.productPeriodReports.entries.weekly.seenAt='seen';d.productPeriodReports.entries.monthly.deferredAt='later';
 current=productPeriodNotices(d,anchor+30*DAY);assert.equal(current.notices.filter(n=>n.due).length,0);assert.equal(current.notices.length,11);
 assert.deepEqual(productPeriodNotices({...d,sales:[]},anchor+30*DAY),{notices:[],validIds:[]});
});

test('notification taps can open their own earlier completed window, never future or another context',()=>{
 const d=data([sale('first',0,[['a',1,100,50]])],[product('a')]),first=productPeriod(d,'weekly',anchor+7*DAY);
 assert.equal(productPeriod(d,'weekly',anchor+28*DAY,first.id).id,first.id);
 assert.equal(productPeriod(d,'weekly',anchor+28*DAY,first.id.replace(/:0$/,':4')),null);
 assert.equal(productPeriod({...d,dataContext:{type:'real',id:'other'}},'weekly',anchor+28*DAY,first.id),null);
 assert.equal(productPeriod(d,'weekly',anchor+28*DAY,first.id.replace(/:0$/,':00')),null);
});

test('same product repeated in one receipt counts once while distinct real unregistered sale counts',()=>{
 const d=data([sale('first',0,[['a',1,100,50],['a',2,100,50]]),sale('unregistered',1,[['a',1,100,50]],'completed',{unregistered:true})],[product('a')]);
 const r=report(d);assert.equal(r.rows[0].frequency,2);assert.equal(r.rows[0].quantity,4);assert.equal(r.rows[0].revenue,400);
});
