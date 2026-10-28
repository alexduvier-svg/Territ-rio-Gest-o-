import test from 'node:test';
import assert from 'node:assert/strict';
import {quickCompare, breakEvenUnits, parseBR} from '../src/features/finance/producer-calcs.js';
import {calculatorInputs} from '../src/features/producer-calculator/model.js';

test('supplier comparison with unknown freight cannot select a final winner or claim savings', () => {
 const offers=[{price:100,qty:10,freight:NaN},{price:110,qty:10,freight:0}];
 const before=JSON.stringify(offers), partial=quickCompare(offers);
 assert.equal(partial.missingFreight,true);
 assert.equal(partial.best,null);
 assert.equal(partial.saving,null);
 assert.equal(partial.rows[0].freightKnown,false);
 assert.equal(JSON.stringify(offers),before);
 const complete=quickCompare([{price:100,qty:10,freight:20},offers[1]]);
 assert.equal(complete.best,1);
 assert.equal(complete.missingFreight,false);
 assert.equal(complete.rows[1].freightKnown,true);
});

test('supplier comparison distinguishes confirmed free freight from invalid freight', () => {
 assert.equal(quickCompare([{price:100,qty:10,freight:Infinity},{price:110,qty:10,freight:0}]),null);
 const result=quickCompare([{price:100,qty:10,freight:0},{price:110,qty:10,freight:0}]);
 assert.equal(result.best,0);
 assert.equal(result.missingFreight,false);
});

test('merged decimal parsing and break-even keep both renderer contracts', () => {
 assert.equal(parseBR(',5'),.5);
 assert(Number.isNaN(parseBR('12 34')));
 const exact=breakEvenUnits({fixed:.3,price:.2,variable:.1});
 assert.equal(exact.exact,true);
 assert.equal(exact.units,3);
 assert.equal(exact.firstSurplusUnit,4);
 assert.equal(breakEvenUnits({fixed:1000,price:15,variable:9}).exact,false);
});

test('cash-cycle source uses the whole previous month without inventing an incomplete comparison cut', () => {
 const data={dataContext:{id:'source-test',type:'real'},settings:{finance:{}},products:[],sales:[{
  id:'late-month',status:'completed',date:'2026-09-29T12:00:00Z',subtotal:2000,total:2000,cost:700,
  payments:[{method:'Pix',amount:2000}],
  items:[{productId:'p',name:'Café',unit:'Pacote',qty:1,total:2000,netTotal:2000,costTotal:700,costKnown:true}]
 }]};
 const before=JSON.stringify(data);
 const projection=calculatorInputs(data,'',{now:Date.parse('2026-10-26T18:00:00Z'),dayKey:value=>new Date(value).toISOString().slice(0,10)});
 assert.equal(projection.previousMonthCost,7);
 assert.equal(projection.period.previousUntil,'2026-09-26');
 assert.equal(projection.fields.period.previous,undefined);
 assert.equal(JSON.stringify(data),before);
});
