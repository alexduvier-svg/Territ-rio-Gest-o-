import test from 'node:test';
import assert from 'node:assert/strict';
import { forecastWindow,nextForecastPoint } from '../src/features/weather/forecast.js';
import '../src/legacy/erp-core.js';
const now=Date.parse('2026-10-20T08:00:00-03:00'),event={start:'2026-10-20',end:'2026-10-20',from:'09:00',until:'14:00'};
test('product names normalize every word and preserve measurement units',()=>{
 for(const input of ['queijo meia cura','QUEIJO MEIA CURA','Queijo meia cura'])assert.equal(ERP.productName(input),'Queijo Meia Cura');
 assert.equal(ERP.productName(' café  em GRÃOS 250 G '),'Café Em Grãos 250 g');
 const data=ERP.seed();data.settings={onboarding:'clean'};data.dataContext={id:'names-test',type:'real'};data.products=[{id:'cheese',name:'queijo meia cura',baseName:'queijo meia cura',category:'Laticínios',unit:'Pacote',stockGroup:'general',stock:3,price:300,cost:0,min:0}];
 const before=structuredClone(data.products[0]),model=new ERP.ERPModel(data),after=model.product('cheese');
 assert.deepEqual(after,{...before,name:'Queijo Meia Cura',baseName:'Queijo Meia Cura'});
 const reopened=new ERP.ERPModel(JSON.parse(JSON.stringify(model.data)));assert.equal(reopened.product('cheese').name,'Queijo Meia Cura');
});
test('event rain covers the event hours exactly and missing probabilities stay unknown',()=>{
 const data={points:[9,10,11,12,13].map(h=>({time:`2026-10-20T${h+3}:00:00Z`,hours:1,temp:24,rain:2,probability:null}))};
 const result=forecastWindow(data,event,now);assert.equal(result.ready,true);assert.equal(result.rain,10);assert.equal(result.probability,null);assert.equal(result.partial,false);
 assert.equal(forecastWindow({points:[]},event,now).ready,false);assert.equal(forecastWindow(data,{...event,start:'2026-11-20',end:'2026-11-20'},now).ready,false);
});
test('overlapping MET intervals never double count rainfall; partial periods are labelled estimates',()=>{
 const data={points:[{time:'2026-10-20T12:00:00Z',hours:6,rain:6,temp:24,probability:30},{time:'2026-10-20T13:00:00Z',hours:6,rain:12,temp:24,probability:50}]};
 const result=forecastWindow(data,event,now);assert.equal(result.ready,true);assert.equal(result.rain,5);assert.equal(result.partial,true);assert.equal(result.probability,30);
});
test('current weather must have a nearby forecast point, never substitute old temperature',()=>{
 assert.equal(nextForecastPoint({points:[{time:'2026-09-01T00:00:00Z',temp:25}]},now),null);
});
