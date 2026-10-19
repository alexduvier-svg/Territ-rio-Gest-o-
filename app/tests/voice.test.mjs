import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretSpeech, cleanSpeech, voiceHints } from '../src/features/voice/interpret.js';
import { createVoiceController } from '../src/features/voice/controller.js';
const catalog=[
 {id:'c250',name:'Café Especial',format:'Moído',unit:'Pacote',weight:250,stock:30,price:2500},
 {id:'c500',name:'Café Especial',format:'Moído',unit:'Pacote',weight:500,stock:30,price:4500},
 {id:'c1000',name:'Café Especial',format:'Moído',unit:'Pacote',weight:1000,stock:30,price:8000},
 {id:'g250',name:'Café Gourmet',format:'Moído',unit:'Pacote',weight:250,stock:30,price:1800},
 {id:'taioba',name:'Taioba',unit:'Maço',stock:10,price:300},
 {id:'serralha',name:'Serralha',unit:'Maço',stock:10,price:300},
 {id:'tomate',name:'Molho de tomate',unit:'Vidro',stock:10,price:1000},
 {id:'queijo',name:'Queijo Minas',unit:'kg',stock:10,price:4000},
];
for(const [phrase,id,qty] of [
 ['três cafés especiais de 250 gramas','c250',3],
 ['VENDI ３ CAFÉS ESPECIAIS DE ２５０ｇ','c250',3],
 ['dois café especial de 500 g','c500',2],
 ['um café especial de um quilo','c1000',1],
 ['vinte e cinco café gourmet de 250 gramas','g250',25],
 ['três taiobas','taioba',3],
 ['5 mói de serraia','serralha',5],
 ['dois molhos de tomate','tomate',2],
 ['meio quilo de queijo minas','queijo',0.5],
 ['3 kg de queijo minas','queijo',3],
 ['3 cafés gourmet 250','g250',3],
 ['3 cafés especiais 500','c500',3],
 ]) test(phrase,()=>{const p=interpretSpeech(phrase,catalog);assert.equal(p.productId,id,JSON.stringify(p));assert.equal(p.quantity,qty);assert.equal(p.status,'ready');});
for(const phrase of ['não vendi três taiobas','quanto dá três taiobas?','ontem vendi três taiobas','perdi três taiobas','cancela','três taiobas no pix','três taiobas a 5 reais','três taiobas e dois cafés','três abacates','250 gramas',''])test('no ready proposal: '+phrase,()=>assert.notEqual(interpretSpeech(phrase,catalog).status,'ready'));
test('ambiguous presentation does not choose the cheapest or most recent',()=>{const p=interpretSpeech('três cafés especiais',catalog);assert.equal(p.productId,null);assert.equal(p.candidates.length,3);});
test('packaging weight never becomes package count',()=>{const p=interpretSpeech('café especial de 250 gramas',catalog);assert.equal(p.quantity,null);assert.equal(p.status,'review');});
test('does not infer a default quantity or price from language seed',()=>{const p=interpretSpeech('taioba',catalog);assert.equal(p.quantity,null);assert.equal(p.status,'review');assert.equal(p.price,undefined);});
test('only the active catalog can resolve stock and product',()=>{assert.equal(interpretSpeech('três taiobas',[]).candidates.length,0);assert.equal(interpretSpeech('três taiobas',[{...catalog[4],active:false}]).candidates.length,0);assert.notEqual(interpretSpeech('onze taiobas',catalog).status,'ready');});
test('language processing leaves catalog and records intact',()=>{const before=JSON.stringify(catalog);interpretSpeech('três taiobas',catalog);assert.equal(JSON.stringify(catalog),before);});
test('Chinese keyboard cleanup preserves meaning without changing device locale',()=>assert.equal(cleanSpeech(' ３ｋｇ\u200b， café '),'3kg, café'));
test('hints have a bounded size and no prices or seed-only products',()=>{const hints=voiceHints(catalog);assert(hints.length<=60);assert(hints.every(h=>!h.includes('R$')));assert(!hints.some(h=>h.includes('abacate')));});
function fake(){let callback,resolveStart;const calls=[];return {calls,emit:e=>callback(e),transport:{listen:async fn=>{callback=fn;calls.push('listen');return {remove(){calls.push('remove');}};},start:options=>{calls.push(options);return new Promise(r=>{resolveStart=r;});},stop:async()=>calls.push('stop'),cancel:async()=>calls.push('cancel')},resolve:()=>resolveStart?.({engine:'vosk'})};}
const tick=()=>new Promise(r=>setImmediate(r));
test('partials and duplicate finals do not apply anything, terminal state is stable',async()=>{const f=fake(),states=[],c=createVoiceController(f.transport,s=>states.push(s));const start=c.start();await tick();const id=c.state().session;f.resolve();await start;f.emit({session:id,type:'state',state:'listening'});f.emit({session:id,type:'partial',text:'três taiobas'});assert.equal(c.state().phase,'listening');f.emit({session:id,type:'final',text:'três taiobas'});f.emit({session:id,type:'final',text:'outro'});assert.equal(c.state().text,'três taiobas');assert.equal(c.state().phase,'review');c.destroy();});
test('cancel fences late permission/results, and a new session has one listener',async()=>{const f=fake(),c=createVoiceController(f.transport,()=>{});const first=c.start();await tick();const old=c.state().session;c.cancel();f.resolve();await first;f.emit({session:old,type:'final',text:'três taiobas'});assert.equal(c.state().phase,'idle');const second=c.start();await tick();const id=c.state().session;f.resolve();await second;f.emit({session:old,type:'error',message:'old'});f.emit({session:id,type:'final',text:'nova'});assert.equal(c.state().text,'nova');assert.equal(f.calls.filter(x=>x==='listen').length,1);c.destroy();});
test('double start shares one session, manual stop and error always stop blue state',async()=>{const f=fake(),c=createVoiceController(f.transport,()=>{});const start=c.start();await tick();await c.start();assert.equal(f.calls.filter(x=>typeof x==='object').length,1);f.resolve();await start;const id=c.state().session;f.emit({session:id,type:'state',state:'listening'});await c.stop();assert.equal(c.state().phase,'processing');f.emit({session:id,type:'error',message:'Não ouvi'});assert.equal(c.state().phase,'error');assert.equal(c.state().level,0);c.destroy();});
test('denied permission and timeout remain recoverable',async()=>{const c=createVoiceController({listen:async()=>({remove(){}}),start:async()=>{throw Error('Permissão negada');},cancel:async()=>{}},()=>{});await c.start();assert.equal(c.state().phase,'error');assert.match(c.state().message,/Permissão/);c.destroy();const f=fake(),t=createVoiceController(f.transport,()=>{},{timeout:8});const p=t.start();await new Promise(r=>setTimeout(r,20));assert.equal(t.state().phase,'error');f.resolve();await p;t.destroy();});
