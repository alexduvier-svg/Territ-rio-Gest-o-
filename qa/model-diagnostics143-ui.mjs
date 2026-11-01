const {JSDOM}=await import(process.env.AGRO_QA_JSDOM_MODULE||'jsdom');
import assert from 'node:assert/strict';
import {installModelDiagnostics} from '../app/src/features/local-intelligence/diagnostics.js';
const dom=new JSDOM('<dialog id="dialog"><div id="content"></div><div id="controls"></div></dialog>',{pretendToBeVisual:true,url:'https://localhost'});
globalThis.document=dom.window.document;globalThis.window=dom.window;
let state={qwenSupported:true,qwenReady:false,nanoStatus:'unavailable'},downloads=0,tests=0,cancels=0,pending;
const provider={status:async()=>({...state}),cancel:async()=>{cancels++;},downloadQwen:async()=>{downloads++;state.qwenReady=true;},downloadNano:async()=>{downloads++;state.nanoStatus='available';},testModel:async({model,scenario})=>{tests++;return{model,scenario,synthetic:true,raw:scenario==='empty'?'{"situacao":"sem_registros","acao":"cadastrar_produtos","usaExemplos":false}':'{"estoque":true,"vendas":true,"cnpjs":true,"periodo":"mes_atual"}',elapsedMs:2500,before:{appPssKb:100000},after:{appPssKb:110000}};},addListener:async()=>({remove(){}})};
const notes=[],b={actions:{},escape:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'),toast:s=>notes.push(s),open:(title,body,controls,kind)=>{document.getElementById('dialog').dataset.kind=kind;document.getElementById('content').innerHTML=body;document.getElementById('controls').innerHTML=controls;}};
installModelDiagnostics(b,provider);
try{
 await b.actions['local-ai-model-tests']();assert.equal(downloads,0);assert.equal(tests,0);assert.match(document.body.textContent,/Indisponível/);
 await b.actions['local-ai-model-qwen-confirm']();assert.equal(downloads,0);assert.match(document.body.textContent,/498 MB/);
 await b.actions['local-ai-model-qwen-download']();await new Promise(r=>setTimeout(r,0));assert.equal(downloads,1);assert.equal(tests,0);assert.match(document.body.textContent,/Modelo verificado/);
 for(const model of ['qwen06','nano'])for(const scenario of ['compound','empty']){await b.actions['local-ai-model-run']({model,scenario});assert.match(document.body.textContent,/Aprovado neste cenário/);assert.match(document.body.textContent,/não mede o pico/);}
 provider.testModel=async({model,scenario})=>({model,scenario,synthetic:true,raw:'<img src=x onerror=alert(1)>',elapsedMs:20});await b.actions['local-ai-model-run']({model:'nano',scenario:'empty'});assert.match(document.body.textContent,/Falhou neste cenário/);assert.equal(document.querySelectorAll('img').length,0);
 provider.testModel=({model,scenario})=>{tests++;return new Promise(resolve=>{pending=()=>resolve({model,scenario,synthetic:true,raw:'{}',elapsedMs:20});});};
 const first=b.actions['local-ai-model-run']({model:'qwen06',scenario:'compound'});await new Promise(r=>setTimeout(r,0));const count=tests;await b.actions['local-ai-model-run']({model:'nano',scenario:'empty'});assert.equal(tests,count);
 await b.actions['local-ai-model-cancel']();pending();await first;assert.match(document.body.textContent,/Aguarde o encerramento/);assert.ok(cancels>0);
 const second=b.actions['local-ai-model-run']({model:'qwen06',scenario:'empty'});await new Promise(r=>setTimeout(r,0));document.dispatchEvent(new dom.window.CustomEvent('territorio:resource-policy',{detail:{intelligenceProfile:'essential'}}));pending();await second;assert.match(document.body.textContent,/perfil Essencial/);
 console.log('PASS: model diagnostic UI with mocked providers: explicit downloads, both scenarios/providers, strict rejection, safe output, single request, late cancellation, resource pressure. No real inference performed.');
}finally{dom.window.close();}
