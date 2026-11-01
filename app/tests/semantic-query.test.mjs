import test from 'node:test';
import assert from 'node:assert/strict';
import {interpretationRequest,validateInterpretation,executeInterpretation,semanticSnapshot} from '../src/features/agent/semantic-query.js';
const now=Date.parse('2026-11-01T12:00:00-03:00');
const task=(kind,extra={})=>({kind,filter:'product',ids:['coffee'],period:'month',...extra});
const plan=(tasks,extra={})=>({type:'query',reference:'explicit',clarify:'none',tasks,...extra});
function fixture(){return {dataContext:{id:'producer',type:'demo'},products:[{id:'coffee',name:'Café Especial',weight:250,unit:'Pacote',stock:10,price:2000,cost:1200}],sales:[{id:'s',status:'completed',scope:'loja',date:'2026-11-01T09:00:00-03:00',total:4000,customerId:'c',customerType:'PJ',customerDocument:'12345678000100',items:[{productId:'coffee',qty:2,unit:'Pacote',total:4000,costTotal:2400,costKnown:true}]}],movements:[],clients:[{id:'c',name:'Cliente QA',document:'12345678000100',phone:'private-phone'}],events:[],expenses:[]};}
test('language request contains bounded entity labels, no stock, price, documents or contact fields',()=>{
 const d=fixture(),r=interpretationRequest(d,'O que aconteceu com meu café?',{now});assert.ok(r.request.length<=4600);assert.ok(r.request.includes('Café Especial'));assert.ok(!r.request.includes('private-phone'));assert.ok(!r.request.includes('12345678000100'));assert.ok(!r.request.includes('"price"'));assert.ok(!r.request.includes('"stock"' + ':10'));
});
test('model cannot invent entities, tools, financial results or incompatible filters',()=>{
 const e=interpretationRequest(fixture(),'Meu café vendeu?',{now});
 for(const p of [plan([task('stock',{ids:['foreign']})]),plan([task('stock',{sql:'DELETE'})]),plan([task('finance',{filter:'product'})]),plan([task('sold',{discountCents:100})]),plan([task('discount',{discountCents:200})])])assert.throws(()=>validateInterpretation(JSON.stringify(p),e));
 assert.throws(()=>validateInterpretation('Resposta inventada',e));
});
test('one contextual plan reads stock, sales and distinct CNPJs through the canonical engines',async()=>{
 const d=fixture(),before=JSON.stringify(d),e=interpretationRequest(d,'Quantos pacotes tenho, quantos vendi neste mês e para quantos CNPJs?',{now}),p=validateInterpretation(JSON.stringify(plan([task('stock',{period:'today'}),task('sold'),task('cnpjs')])),e);
 const r=await executeInterpretation(d,p,e,{now});assert.match(r.text,/10 Pacote/);assert.match(r.text,/2 Pacote/);assert.match(r.text,/CNPJs distintos documentados.*1/);assert.equal(JSON.stringify(d),before);assert.equal(r.semanticUsed,true);
});
test('a unique previous product resolves a hypothetical discount without modifying its price',async()=>{
 const d=fixture(),previous={snapshot:semanticSnapshot(d),question:'Quanto tenho de Café Especial 250 g?',entityIds:['coffee'],plan:null},e=interpretationRequest(d,'E se eu baixar dois reais?',{previous,now});
 const p=validateInterpretation(JSON.stringify(plan([task('discount',{period:'selected',discountCents:200})],{type:'hypothesis',reference:'previous'})),e),before=JSON.stringify(d),r=await executeInterpretation(d,p,e,{now});
 assert.match(r.text,/Hipótese/);assert.match(r.text,/18,00/);assert.match(r.text,/Nenhum preço foi alterado/);assert.equal(JSON.stringify(d),before);
});
test('ambiguous references and history from another producer never silently select a product',()=>{
 const d=fixture(),previous={snapshot:semanticSnapshot(d),question:'Estes produtos',entityIds:['coffee','other'],plan:null},e=interpretationRequest(d,'E ele?',{previous,now});
 assert.throws(()=>validateInterpretation(JSON.stringify(plan([task('stock')],{reference:'previous'})),e),/referência/);
 previous.snapshot={...previous.snapshot,actorId:'other'};const fresh=interpretationRequest(d,'E ele?',{previous,now});assert.equal(fresh.previous,null);assert.throws(()=>validateInterpretation(JSON.stringify(plan([task('stock')],{reference:'previous'})),fresh),/anterior/);
});
test('data changes after interpretation block execution, including a reset to an empty real base',async()=>{
 const d=fixture(),e=interpretationRequest(d,'Meu café',{now}),p=validateInterpretation(JSON.stringify(plan([task('stock')])),e);d.products[0].stock--;
 await assert.rejects(executeInterpretation(d,p,e,{now}),/mudaram/);d.dataContext.type='real';d.products=[];
 await assert.rejects(executeInterpretation(d,p,e,{now}),/mudaram/);
});
test('clarification is not replaced with a general business summary',async()=>{
 const d=fixture(),e=interpretationRequest(d,'Ele?',{now}),p=validateInterpretation(JSON.stringify(plan([],{type:'clarify',reference:'ambiguous',clarify:'entity'})),e),r=await executeInterpretation(d,p,e,{now});
 assert.equal(r.needsClarification,true);assert.match(r.text,/A qual produto/);assert.equal(r.specialists.length,0);
});
test('the model cannot label an implicit singular reference as explicit and choose among two products',()=>{
 const d=fixture(),previous={snapshot:semanticSnapshot(d),question:'Compare estes produtos',entityIds:['coffee','other'],plan:null},e=interpretationRequest(d,'E ele?',{previous,now});
 assert.throws(()=>validateInterpretation(JSON.stringify(plan([task('stock')])),e),/referência/);
});
test('a causal assumption remains a hypothesis even when the model proposes a factual query',()=>{
 const d=fixture(),e=interpretationRequest(d,'Acho que meu café vendeu menos por causa da chuva',{now}),p=validateInterpretation(JSON.stringify(plan([task('sold')])),e);assert.equal(p.type,'hypothesis');
});
