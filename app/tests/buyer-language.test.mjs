import test from 'node:test';
import assert from 'node:assert/strict';
import {readQuery} from '../src/features/agent/read-queries.js';
const now=Date.parse('2026-11-01T12:00:00-03:00');
function fixture(){
 const item={productId:'coffee',qty:1,unit:'pacote',total:1000,costTotal:500,costKnown:true};
 const sale=(id,extra={})=>({id,status:'completed',scope:'loja',date:'2026-11-01T09:00:00-03:00',total:1000,customerType:'PJ',customerDocument:'12345678000100',items:[{...item}],...extra});
 return {dataContext:{id:'qa',type:'real'},products:[{id:'coffee',name:'Café',unit:'pacote',stock:4},{id:'fish',name:'Tilápia',unit:'kg',stock:3}],sales:[sale('one'),sale('repeat'),sale('two',{customerDocument:'98765432000100'}),sale('old',{date:'2026-10-20T09:00:00-03:00',customerDocument:'11223344000100'}),sale('returned',{status:'returned',returnedAt:'2026-11-01T10:00:00-03:00',customerDocument:'22334455000100'}),sale('anonymous',{customerType:'',customerDocument:''}),sale('incomplete',{customerDocument:''}),sale('pf',{customerType:'PF',customerDocument:'12345678900'})],clients:[],events:[],expenses:[],movements:[]};
}
test('business purchaser synonyms count distinct documented companies, not sales or registrations',()=>{
 const d=fixture(),before=JSON.stringify(d);
 for(const q of ['Quantas empresas compraram de mim?','Vendi para quantas pessoas jurídicas?','Para quantos CNPJs vendi?']){
  const r=readQuery(d,q,{now,period:{start:Date.parse('2026-11-01T00:00:00-03:00'),end:now,label:'este mês'}});assert.ok(r);assert.match(r.text,/CNPJs distintos documentados.*2/);assert.match(r.text,/2 vendas sem identificação/);assert.equal(r.needsClarification,false);
 }
 assert.equal(JSON.stringify(d),before);
});
test('business purchaser filters retain product, place, time and original data boundaries',()=>{
 const d=fixture();assert.match(readQuery(d,'Quantas empresas compraram tilápia de mim?',{now}).text,/documentados.*0/);
 assert.match(readQuery(d,'Quantas empresas compraram de mim em todo o histórico?',{now}).text,/documentados.*3/);
 assert.match(readQuery(d,'Quantas empresas compraram de mim?',{now,scopeId:'other'}).text,/documentados.*0/);
 d.sales.push({...d.sales[0],id:'demo-foreign',customerDocument:'33445566000100',demo:true});assert.match(readQuery(d,'Quantas empresas compraram de mim neste mês?',{now}).text,/documentados.*2/);
});
test('companies are not confused with supplier orders, customer creation or an erased database',()=>{
 const d=fixture();assert.equal(readQuery(d,'Cadastre minha empresa',{now}),null);
 d.sales=[];d.products=[];assert.match(readQuery(d,'Quantas empresas compraram de mim?',{now}).text,/Ainda não há registros/);
});
