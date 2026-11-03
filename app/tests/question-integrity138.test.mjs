import test from 'node:test';
import assert from 'node:assert/strict';
import {answerQuestion} from '../src/features/agent/question-engine.js';
const now=Date.parse('2026-11-03T15:00:00-03:00'),p={id:'p',name:'Produto QA',unit:'Unidade',stock:3,category:'Outros'};
const sale=(id,extra={})=>({id,date:'2026-11-03T10:00:00-03:00',scope:'loja',status:'completed',total:1000,subtotal:1000,items:[{productId:'p',name:'Produto QA',unit:'Unidade',qty:1,total:1000,netTotal:1000,costTotal:500,costKnown:true}],payments:[{method:'Pix',amount:1000}],...extra});
const data=sales=>({products:[p],clients:[],sales});
test('direct questions respect Loja versus fair scope',()=>{
 const d=data([sale('a'),sale('b',{scope:'feira',total:9000})]);
 assert.match(answerQuestion(d,'quanto vendi hoje',{now,scopeId:'loja'}).text,/R\$ 10,00 em 1 venda/);
 assert.match(answerQuestion(d,'quanto vendi hoje',{now,scopeId:'feira'}).text,/R\$ 90,00 em 1 venda/);
});
test('future records on the same day are excluded and explicit month/year is honored',()=>{
 const d=data([sale('a'),sale('f',{date:'2026-11-03T20:00:00-03:00'}),sale('old',{date:'2025-10-03T12:00:00-03:00',total:2500})]);
 assert.match(answerQuestion(d,'quanto vendi hoje',{now}).text,/R\$ 10,00 em 1 venda/);
 const r=answerQuestion(d,'quanto vendi em outubro de 2025',{now});assert.equal(r.period.from,'2025-10-01');assert.match(r.text,/R\$ 25,00/);
});
test('unnamed purchases do not become distinct buyers or presumed people',()=>{
 const r=answerQuestion(data([sale('a'),sale('b')]),'vendi para quantas pessoas físicas hoje',{now});assert.match(r.text,/0 compradores, 0 vendas/);
});
test('the historical customer name is recognized without a directory entry',()=>{
 const r=answerQuestion(data([sale('a',{customerName:'Nome Fictício'})]),'quantos clientes compraram hoje',{now});assert.match(r.text,/1 cliente identificado/);
});
test('zero revenue never produces NaN or infinite profit margins',()=>{
 const s=sale('a',{total:0,subtotal:1000});s.items[0].netTotal=0;
 const r=answerQuestion(data([s]),'qual o lucro hoje',{now});assert(!/NaN|Infinity|∞/.test(r.text));assert.match(r.text,/receita zero/);
});
test('an unknown named product cannot receive totals from all other products',()=>{
 const d=data([sale('a')]);for(const q of ['quanto vendi de dragão hoje','qual o produto dragão mais vendido hoje'])assert.match(answerQuestion(d,q,{now}).text,/Não encontrei/);
});
test('a decimal unit remains distinct from a different historical unit of the same ID',()=>{
 const a=sale('a'),b=sale('b');b.items[0].unit='kg';b.items[0].qty=.5;
 const r=answerQuestion(data([a,b]),'quanto vendi de Produto QA hoje',{now});assert.match(r.text,/1 unidade · 0,5 kg/);
});
test('payments distinguish use count from largest amount and do not promise settlement',()=>{
 const a=sale('a'),b=sale('b'),c=sale('c',{payments:[{method:'Fiado',amount:9000}],total:9000});
 const r=answerQuestion(data([a,b,c]),'qual a forma de pagamento mais usada hoje',{now});assert.match(r.text,/Mais usada: Pix/);assert.match(r.text,/Fiado pode estar pendente/);
});
