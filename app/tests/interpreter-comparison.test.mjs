import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {evaluateBenchmark,installInterpreterComparison} from '../src/features/local-intelligence/comparison.js';
const cases=JSON.parse(fs.readFileSync(new URL('../public/ai/interpreter-benchmark.json',import.meta.url))).cases;
const entry=cases.find(e=>e.id==='empresas');
const raw=(kind='cnpjs')=>JSON.stringify({type:'query',reference:'explicit',clarify:'none',tasks:[{kind,filter:'none',ids:[],period:'selected'}]});
const result=(extra={})=>({synthetic:true,model:'gemini-online',scenario:'benchmark:empresas',elapsedMs:100,raw:raw(),...extra});
test('valid JSON for the wrong business question fails instead of approving the model',()=>{
 assert.equal(evaluateBenchmark(result(), 'gemini-online',entry).passed,true);
 assert.equal(evaluateBenchmark(result({raw:raw('stock')}),'gemini-online',entry).passed,false);
 assert.equal(evaluateBenchmark(result({raw:'{"type":"query","reference":"ambiguous","clarify":"none","tasks":[]}'}),'gemini-online',entry).passed,false);
});
test('runtime provenance, question and provider must match; simulated or unrelated runs cannot pass',()=>{
 for(const change of [{synthetic:false},{model:'qwen06'},{scenario:'benchmark:estoque'},{elapsedMs:NaN}])assert.throws(()=>evaluateBenchmark(result(change),'gemini-online',entry));
});
test('correct intent with wrong entity, period or discount fails the comparison',()=>{
 const e=cases.find(e=>e.id==='hipotese'),make=t=>({synthetic:true,model:'qwen06',scenario:'benchmark:hipotese',elapsedMs:10,raw:JSON.stringify({type:'hypothesis',reference:'previous',clarify:'none',tasks:[{kind:'discount',filter:'product',ids:['coffee'],period:'selected',discountCents:200,...t}]})});
 assert.equal(evaluateBenchmark(make({}),'qwen06',e).passed,true);
 assert.equal(evaluateBenchmark(make({discountCents:2}),'qwen06',e).passed,false);
 assert.equal(evaluateBenchmark(make({ids:['fish']}),'qwen06',e).passed,false);
 const stock=cases.find(e=>e.id==='estoque');const r={synthetic:true,model:'qwen06',scenario:'benchmark:estoque',elapsedMs:10,raw:JSON.stringify({type:'query',reference:'explicit',clarify:'none',tasks:[{kind:'stock',filter:'product',ids:['fish'],period:'month'}]})};assert.equal(evaluateBenchmark(r,'qwen06',stock).passed,false);
});
test('the two providers receive the same fixed fiction including context, empty base and compound questions',()=>{
 assert.equal(cases.length,18);assert.equal(new Set(cases.map(c=>c.id)).size,18);
 for(const c of cases){assert.equal(typeof c.request,'string');assert.ok(c.request.includes(c.q));assert.ok(!c.request.includes('private-phone'));assert.ok(!c.request.includes('12345678000100'));}
 assert.equal(cases.find(c=>c.id==='vazia').envelope.catalog.product.length,0);
 assert.equal(cases.find(c=>c.id==='referencia').envelope.previous.entityIds[0],'coffee');
});
test('consent configures only the online test provider and clears the credential from the field',async()=>{
 const events=[],field={value:'fictional-test-key-not-a-real-secret'};
 globalThis.document={baseURI:'https://localhost/',addEventListener(){},getElementById:id=>id==='comparison-key'?field:null};
 const b={actions:{},escape:String,open(){},toast:m=>events.push(['error',m])};
 const online={cancel:async()=>{},status:async()=>({configured:true,enabled:true,model:'test'}),authorize:async a=>events.push(['authorized',a.consentVersion]),benchmarkCase:()=>events.push(['unexpected-query']),research:()=>events.push(['unexpected-search'])};
 const oldFetch=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>({version:1,synthetic:true,cases})});
 try{installInterpreterComparison(b,online,{cancel:async()=>{}});await b.actions['comparison-authorize']();assert.equal(field.value,'');assert.deepEqual(events,[['authorized',1]]);}finally{globalThis.fetch=oldFetch;delete globalThis.document;}
});
