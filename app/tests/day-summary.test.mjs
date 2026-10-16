import test from 'node:test';
import assert from 'node:assert/strict';
import { familySales, eventStartNotices, notificationChanges, currentStockValue, stockEventsInSelection } from '../src/features/day-summary.js';
import { buildFairReport } from '../src/features/fair-report.js';

test('family totals retain historical net amounts and keep dissimilar units separate',()=>{
 const products=[{id:'coffee',category:'Cafés',name:'Café Especial',price:9900},{id:'banana-dz',category:'Hortifruti-Granjeiro',name:'Banana Prata'},{id:'banana-kg',category:'Hortifruti-Granjeiro',name:'Banana Nanica'}];
 const rows=[{productId:'banana-dz',name:'Banana Prata',unit:'Dúzia',qty:2,amount:1800},{productId:'coffee',name:'Café Especial',unit:'Pacote',qty:3,amount:7500},{productId:'banana-kg',name:'Banana Nanica',unit:'kg',qty:1.5,amount:750},{productId:'coffee',name:'Café Especial',unit:'Pacote',qty:1,amount:2200}];
 const before=JSON.stringify({rows,products}),families=familySales(rows,products);
 assert.deepEqual(families.map(f=>[f.name,f.amount]),[['Cafés',9700],['Bananas',2550]]);
 assert.deepEqual(families[1].units,[{unit:'Dúzia',qty:2},{unit:'kg',qty:1.5}]);
 assert.equal(JSON.stringify({rows,products}),before);
});

test('families group stock universes including additional coffees, fubá and mandioca',()=>{
 const rows=[{id:'1',name:'Fubá mimoso',baseName:'Fubá mimoso',category:'Grãos',unit:'Pacote',qty:1,amount:300},{id:'2',name:'Café Descafeinado',category:'Cafés',unit:'Pacote',qty:1,amount:1200},{id:'3',name:'Aipim',category:'Hortifruti-Granjeiro',unit:'kg',qty:2,amount:400},{id:'4',name:'Mandioca',category:'Hortifruti-Granjeiro',unit:'kg',qty:1,amount:200},{id:'5',name:'Fubá de milho branco',category:'Grãos',unit:'Pacote',qty:1,amount:400}];
 const families=familySales(rows);
 assert.deepEqual(families.map(f=>[f.name,f.amount]),[['Cafés',1200],['Mandioca',600],['Fubá',700]]);
});

test('returns are signed rows without repricing or mixing units',()=>{
 const rows=[{id:'c',name:'Café Especial',category:'Cafés',unit:'Pacote',qty:3,amount:7500},{id:'c',name:'Café Especial',category:'Cafés',unit:'Pacote',qty:-1,amount:-2500},{id:'b',name:'Banana Prata',unit:'Dúzia',qty:-1,amount:-1000}];
 const families=familySales(rows);
 assert.equal(families.reduce((sum,f)=>sum+f.amount,0),4000);
 assert.deepEqual(families.find(f=>f.name==='Cafés').units,[{unit:'Pacote',qty:2}]);
});

const event={id:'e',name:'Feira do Inventário',status:'active',start:'2026-10-16',end:'2026-10-16',from:'12:00'};
test('event alarm is scheduled exactly one hour before Brasília wall time',()=>{
 const notices=eventStartNotices([event],{now:Date.parse('2026-10-16T10:00:00-03:00'),loadCount:()=>2});
 assert.equal(notices.length,1);
 assert.equal(notices[0].at,Date.parse('2026-10-16T11:00:00-03:00'));
 assert.equal(notices[0].startAt-notices[0].at,3600000);
 assert.equal(notices[0].id,'e:2026-10-16');
 assert.match(notices[0].body,/2 produtos separados/);
});

test('late creation/update has no retroactive or starts-now alarm',()=>{
 assert.deepEqual(eventStartNotices([event],{now:Date.parse('2026-10-16T11:30:00-03:00')}),[]);
 assert.deepEqual(eventStartNotices([event],{now:Date.parse('2026-10-16T11:00:00-03:00')}),[]);
 assert.equal(eventStartNotices([event],{now:Date.parse('2026-10-16T13:00:00-03:00'),includePast:true}).length,1);
});

test('each day is stable, midnight alarms land on the preceding day and closed events vanish',()=>{
 const notices=eventStartNotices([{...event,start:'2026-10-17',end:'2026-10-18',from:'00:15'}],{now:Date.parse('2026-10-16T10:00:00-03:00')});
 assert.equal(notices.length,2);
 assert.equal(notices[0].at,Date.parse('2026-10-16T23:15:00-03:00'));
 assert.deepEqual(eventStartNotices([{...event,status:'finished'},{...event,id:'closed',fairClosedAt:'2026-10-16T10:00:00-03:00'},{...event,id:'bad',start:'2026-02-31'}],{now:0}),[]);
});

test('reconciliation replaces changed event time/text and cancels deleted events without duplicate alarms',()=>{
 const wanted=new Map([[1,{id:1,at:2000,title:'Feira começa em 1 hora',body:'Novo local'}],[2,{id:2,at:3000,title:'Outro evento',body:'Prepare os produtos'}]]);
 const pending=[{id:1,title:'Feira começa em 1 hora',body:'Local antigo',extra:{kind:'event-start',reminderAt:1000}},{id:9,extra:{kind:'event-start',reminderAt:4000}},{id:77,extra:{kind:'stock'}}];
 const delta=notificationChanges(wanted,pending);
 assert.deepEqual(delta.cancel,[{id:9},{id:1}]);
 assert.deepEqual(delta.schedule.map(n=>n.id),[1,2]);
 const saved=delta.schedule.map(n=>({...n,extra:{kind:'event-start',reminderAt:n.at}}));
 assert.deepEqual(notificationChanges(wanted,saved),{cancel:[],schedule:[]});
});

test('current stock valuation distinguishes partial/missing cost from a known zero cost',()=>{
 const products=[{id:'c',name:'Café',category:'Cafés',unit:'Pacote',stock:2,price:2500,cost:1200,costKnown:true},{id:'b',name:'Banana',unit:'Dúzia',stock:1,price:1000,cost:0,costKnown:false},{id:'f',name:'Fubá',unit:'Pacote',stock:3,price:400,cost:0,costKnown:true},{id:'out',name:'Esgotado',stock:0,price:0,cost:0}];
 const before=JSON.stringify(products),value=currentStockValue(products);
 assert.equal(value.cost,2400);
 assert.equal(value.retail,7200);
 assert.equal(value.costMissing,1);
 assert.equal(value.costKnown,2);
 assert.equal(value.priceMissing,0);
 assert.equal(value.withStock,3);
 assert.equal(value.rows.find(p=>p.id==='b').costValue,null);
 assert.equal(value.rows.find(p=>p.id==='f').costValue,0);
 assert.equal(JSON.stringify(products),before);
 const unknown=currentStockValue([{id:'u',stock:4,cost:0,price:0,costKnown:false}]);
 assert.equal(unknown.costKnown,0);assert.equal(unknown.costMissing,1);assert.equal(unknown.priceMissing,1);
 const explicitUnknown=currentStockValue([{id:'u',stock:4,cost:2000,price:3000,costKnown:false}]);
 assert.equal(explicitUnknown.costKnown,0);assert.equal(explicitUnknown.costMissing,1);assert.equal(explicitUnknown.cost,0);assert.equal(explicitUnknown.rows[0].costValue,null);
});

test('stock event scope selects its full fair, while broad scopes use overlapping period and Loja excludes fairs',()=>{
 const events=[{id:'old',start:'2026-09-30',end:'2026-10-02'},{id:'now',start:'2026-10-16',end:'2026-10-17'},{id:'future',start:'2026-11-01',end:'2026-11-02'}];
 assert.deepEqual(stockEventsInSelection(events,{scope:'all',month:'2026-10'}).map(e=>e.id),['now','old']);
 assert.deepEqual(stockEventsInSelection(events,{scope:'now',month:'2026-09'}).map(e=>e.id),['now']);
 assert.deepEqual(stockEventsInSelection(events,{scope:'events',days:['2026-10-01']}).map(e=>e.id),['old']);
 assert.deepEqual(stockEventsInSelection(events,{scope:'loja',month:'2026-10'}),[]);
});

test('fair leftovers use authoritative load totals once and deduct event loss once, per unit',()=>{
 const load={items:[{productId:'b',name:'Banana Prata',unit:'Dúzia',qty:10,restocks:[{qty:3}]},{productId:'b',name:'Banana Prata',unit:'kg',qty:7}]};
 const sales=[{status:'completed',date:'2026-10-16T12:30:00-03:00',total:5000,subtotal:5000,items:[{productId:'b',name:'Banana Prata',unit:'Dúzia',qty:4,total:4000},{productId:'b',name:'Banana Prata',unit:'kg',qty:2,total:1000}],payments:[]}];
 const losses=[{eventId:'e',kind:'loss',productId:'b',unit:'Dúzia',qty:1},{eventId:'another',kind:'loss',productId:'b',unit:'kg',qty:99}];
 const before=JSON.stringify({load,sales,losses}),report=buildFairReport({event,load,sales,losses});
 assert.deepEqual(report.products.map(p=>[p.unit,p.left]),[['Dúzia',5],['kg',5]]);
 assert.equal(JSON.stringify({load,sales,losses}),before);
});
