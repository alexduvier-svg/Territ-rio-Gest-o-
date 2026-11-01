import test from 'node:test';import assert from 'node:assert/strict';
import {readQuery} from '../src/features/agent/read-queries.js';
import {interpretationRequest,validateInterpretation,executeInterpretation} from '../src/features/agent/semantic-query.js';
const now=Date.parse('2026-11-01T15:00:00Z');
const fixture=()=>({dataContext:{id:'qa',type:'real'},products:[{id:'a',name:'Café Especial',weight:250,stock:0,unit:'pacote'},{id:'b',name:'Café Gourmet',weight:500,stock:7,unit:'pacote'},{id:'c',name:'Goiabada',stock:0,unit:'kg'},{id:'demo-foreign',name:'Café Fictício',demo:true,stock:0,unit:'pacote'}],sales:[],movements:[],events:[],clients:[],expenses:[]});
test('the exact screenshot and natural variants list only the exhausted coffee presentations',()=>{
 const d=fixture(),before=JSON.stringify(d);
 for(const q of ['Qual Café acabou','Tem algum café esgotado?','Qual café está sem estoque?','Qual café zerou?','Não tenho mais café?']){
  const r=readQuery(d,q,{now});assert.equal(r.needsClarification,false);assert.match(r.text,/Café Especial · 250 g: 0 pacote/);assert.doesNotMatch(r.text,/Gourmet|Goiabada|Fictício/);
 }assert.equal(JSON.stringify(d),before);
});
test('positive balances, unknown products, missing balances and erased data are not confused with zero',()=>{
 const d=fixture();d.products[0].stock=2;assert.match(readQuery(d,'Qual café acabou?',{now}).text,/Nenhum dos produtos consultados/);
 assert.match(readQuery(d,'Qual mel acabou?',{now}).text,/Não identifiquei/);delete d.products[0].stock;assert.throws(()=>readQuery(d,'Qual café acabou?',{now}),/saldo ou a unidade/);
 d.products=[];assert.match(readQuery(d,'Qual café acabou?',{now}).text,/Ainda não há registros/);
});
test('all-products scope is explicit and just arrived is not interpreted as exhausted',()=>{
 const d=fixture();const r=readQuery(d,'Quais produtos estão sem estoque?',{now});assert.match(r.text,/Goiabada/);assert.match(r.text,/Café Especial/);assert.doesNotMatch(r.text,/Gourmet|Fictício/);
 assert.equal(readQuery(d,'Qual café acabou de chegar?',{now}),null);
});
test('the model plan for exhausted stock uses the same engine and cannot omit named presentations',async()=>{
 const d=fixture(),e=interpretationRequest(d,'Qual café acabou?',{now}),p={type:'query',reference:'explicit',clarify:'none',tasks:[{kind:'stock_empty',filter:'product',ids:['a','b'],period:'today'}]},before=JSON.stringify(d);
 const r=await executeInterpretation(d,validateInterpretation(JSON.stringify(p),e),e,{now});assert.match(r.text,/Café Especial/);assert.doesNotMatch(r.text,/Goiabada|Gourmet/);assert.equal(JSON.stringify(d),before);
 p.tasks[0].ids=['a'];assert.throws(()=>validateInterpretation(JSON.stringify(p),e),/apresentações/);
});
test('a follow-up refers to the exhausted coffee actually shown, rather than every coffee in the question',async()=>{
 const d=fixture(),r=readQuery(d,'Qual café acabou?',{now});assert.deepEqual(r.referenceProductIds,['a']);
 const {semanticSnapshot}=await import('../src/features/agent/semantic-query.js');
 const previous={snapshot:semanticSnapshot(d),question:'Qual café acabou?',plan:null,entityIds:['a','b'],referenceProductIds:r.referenceProductIds};
 const e=interpretationRequest(d,'E dele, quanto vendi neste mês?',{now,previous}),p={type:'query',reference:'previous',clarify:'none',tasks:[{kind:'sold',filter:'product',ids:['a'],period:'month'}]};
 assert.equal(validateInterpretation(JSON.stringify(p),e).reference,'previous');p.tasks[0].ids=['b'];assert.throws(()=>validateInterpretation(JSON.stringify(p),e),/referência/);
});
