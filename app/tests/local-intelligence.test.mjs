import test from 'node:test';
import {isFinancialQuestion} from '../src/features/business-query.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { interpreterOrder, LOCAL_AI_POLICY, LOCAL_AI_GUIDANCE } from '../src/features/local-intelligence/policy.js';

// 0.12.148: Qwen removed. Gemini online → Gemini Nano → local engines.
test('interpretation order is Gemini online first, Nano offline second, and engines when nothing is available',()=>{
 assert.deepEqual(interpreterOrder({online:true,offline:true}),['gemini-online','gemini-nano']);
 assert.deepEqual(interpreterOrder({online:false,offline:true}),['gemini-nano']);
 assert.deepEqual(interpreterOrder({online:true,offline:false}),['gemini-online']);
 assert.deepEqual(interpreterOrder({}),[]);
 assert.deepEqual(Object.keys(LOCAL_AI_POLICY.providers),['geminiOnline','geminiNano','localEngines']);
});
test('no Qwen model, runtime or download remains in the app or the Android build',()=>{
 const root=new URL('../',import.meta.url);
 const read=p=>fs.readFileSync(new URL(p,root),'utf8');
 assert.doesNotMatch(read('android/app/build.gradle'),/litertlm|qwen/i);
 assert.doesNotMatch(read('android/settings.gradle'),/qwen/i);
 for(const f of ['android/app/src/main/java/br/com/territorio/gestao/QwenConversationConfig.java','android/app/src/main/java/br/com/territorio/gestao/ModelDownloadPolicy.java','android/app/src/main/java/br/com/territorio/gestao/LocalModelFile.java','android/qwenmodel','src/features/local-intelligence/service.js','public/knowledge/qwen-APACHE-2.0.txt'])assert.equal(fs.existsSync(new URL(f,root)),false,f);
 for(const f of ['android/app/src/codexTesteIa/java/br/com/territorio/gestao/AgroModelDiagnosticsPlugin.java','src/features/local-intelligence/index.js','src/features/local-intelligence/diagnostics.js','src/features/local-intelligence/comparison.js'])assert.doesNotMatch(read(f).replace(/\/\/.*|\/\*[\s\S]*?\*\//g,''),/qwen06|litertlm|Engine\(|huggingface/i,f);
 assert.match(read('android/app/src/main/java/br/com/territorio/gestao/AgroLocalIntelligencePlugin.java'),/qwen-agro-1\.litertlm/,'legacy private copies are cleaned on load');
 assert.ok(LOCAL_AI_GUIDANCE.some(t=>/Gemini online.*Gemini Nano.*motores/.test(t)));
});

test('financial questions use Gestão while culinary recipes and product ranking keep their specialists',()=>{
 for(const text of ['Qual minha receita hoje?', 'Quanto faturei hoje?', 'Qual o lucro bruto?', 'Quanto tenho a receber?', 'Quanto recebi hoje?', 'Mostre o total de taxas'])assert.equal(isFinancialQuestion(text),true,text);
 for(const text of ['Receita de bolo de banana', 'Uma receita culinária', 'Qual produto vendeu mais e qual deixou mais lucro bruto?', 'Como preparar geleia'])assert.equal(isFinancialQuestion(text),false,text);
});
