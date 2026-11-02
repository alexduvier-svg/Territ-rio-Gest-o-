import {registerHooks} from 'node:module';
registerHooks({load(url,context,next){if(url.endsWith('.css'))return {format:'module',source:'export default {};',shortCircuit:true};const result=next(url,context);if(url.endsWith('.js')&&result.source){const source=String(result.source);if(source.includes('import.meta.env'))return {...result,source:source.replaceAll('import.meta.env','({})')};}return result;}});
import fs from 'node:fs';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
const require=createRequire((process.env.AGRO_QA_NODE_MODULES||process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)+'/runtime.cjs'),{JSDOM}=require('jsdom');
const root=new URL('../app/',import.meta.url).pathname,dom=new JSDOM(fs.readFileSync(root+'index.html','utf8'),{url:'http://localhost',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
for(const key of ['window','document','navigator','MutationObserver','Event','CustomEvent','HTMLElement','HTMLDialogElement','localStorage'])Object.defineProperty(globalThis,key,{value:w[key],configurable:true});
w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){},addListener(){}});w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.URL.createObjectURL=()=>'';w.URL.revokeObjectURL=()=>{};
w.TERRITORIO_ASSETS={profilePhoto:'',appLogo:'',catalogPhotos:''};w.TERRITORIO_VERSION=JSON.parse(fs.readFileSync(root+'package.json','utf8')).version;w.TerritorioWorkspace={active:false};
const main=fs.readFileSync(root+'src/main.js','utf8');
for(const m of main.matchAll(/import \* as (\w+) from '([^']+\.js)'/g))try{w[m[1]]=await import(pathToFileURL(root+'src/'+m[2]));}catch{}
for(const m of main.matchAll(/import \{([^}]+)\} from '([^']+\.js)'/g))try{const lib=await import(pathToFileURL(root+'src/'+m[2]));for(const name of m[1].split(',').map(s=>s.trim()))if(/^\w+$/.test(name))w[name]=lib[name];}catch{}
for(const m of main.matchAll(/import '([^']+\.js)'/g))try{await import(pathToFileURL(root+'src/'+m[1]));}catch{}
for(const m of main.matchAll(/window\.(\w+) = ([^;\n]+);/g))try{w.eval(m[0]);}catch{}
w.eval(fs.readFileSync(root+'src/legacy/erp-core.js','utf8'));const seed=new w.ERP.ERPModel().data;seed.settings.onboarding='demo';seed.dataContext={id:'dom-qa',type:'demo'};w.localStorage.setItem('territorio-gestao-prototipo-v1',JSON.stringify(seed));

w.TerritorioKpi=await import(pathToFileURL(root+'src/features/kpi/kpi-engine.js'));
const workerScope={};globalThis.self=workerScope;await import(pathToFileURL(root+'src/features/agent/worker.js'));
class DomWorker{postMessage(data){queueMicrotask(()=>{workerScope.postMessage=payload=>this.onmessage?.({data:payload});workerScope.onmessage({data:structuredClone(data)});});}terminate(){}}
globalThis.Worker=DomWorker;w.Worker=DomWorker;
w.TerritorioStockLots=await import(pathToFileURL(root+'src/features/stock-lots/domain.js'));
w.TerritorioStockLotsUI=await import(pathToFileURL(root+'src/features/stock-lots/ui.js'));
w.eval(fs.readFileSync(root+'src/legacy/erp-ui.js','utf8'));w.TerritorioStockLotsUI.installStockLotsUI(w.TerritorioWorkflowBridge);w.installAgent();
Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});
globalThis.fetch=async()=>{throw Error('Rede bloqueada no teste offline');};w.fetch=globalThis.fetch;
const A=w.ERPPreview.actions;A.nav({page:'Gestão'});
const questions=JSON.parse(fs.readFileSync(new URL('./questions148.json',import.meta.url),'utf8')).questions,rows=[];
for(const question of questions){A['close-modal']();await w.TerritorioAgent.ask(question,'management');const text=w.document.getElementById('dialog').textContent.replace(/\s+/g,' ').trim();rows.push({question,text});}
fs.writeFileSync(new URL('./gerente148-offline-results.json',import.meta.url),JSON.stringify({kind:'Gerente real em DOM; módulo worker real executado em fila, sem thread; rede bloqueada, sem provedor de IA; fixtures demonstrativas',count:rows.length,rows},null,2));
console.log(JSON.stringify({questions:rows.length,unresolved:rows.filter(r=>/Análise local indisponível|Nenhum intérprete contextual|Não foi possível concluir a interpretação|Não consegui identificar|ainda precisa ser conferida|Sem rota/.test(r.text)).map(r=>r.question)}));process.exit(0);
