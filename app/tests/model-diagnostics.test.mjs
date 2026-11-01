import test from 'node:test';
import assert from 'node:assert/strict';
import {validateModelDiagnostic,QWEN_TEST_MODEL} from '../src/features/local-intelligence/diagnostics.js';
const result=(model,scenario,raw)=>({model,scenario,raw,synthetic:true,elapsedMs:3000});
test('both providers must interpret all parts of the same fictional compound question',()=>{
 for(const model of ['qwen06','nano']){
  assert.equal(validateModelDiagnostic(result(model,'compound','{"estoque":true,"vendas":true,"cnpjs":true,"periodo":"mes_atual"}'),model,'compound').passed,true);
  assert.equal(validateModelDiagnostic(result(model,'compound','{"estoque":true,"vendas":true,"cnpjs":false,"periodo":"mes_atual"}'),model,'compound').passed,false);
 }
});
test('empty-base benchmark rejects invented examples, amounts and hidden extra keys',()=>{
 for(const raw of ['{"situacao":"sem_registros","acao":"cadastrar_produtos","usaExemplos":true}','{"situacao":"sem_registros","acao":"cadastrar_produtos","usaExemplos":false,"vendas":100}','Não há vendas.','```json\n{}\n```'])assert.equal(validateModelDiagnostic(result('nano','empty',raw),'nano','empty').passed,false);
 assert.equal(validateModelDiagnostic(result('nano','empty','{"situacao":"sem_registros","acao":"cadastrar_produtos","usaExemplos":false}'),'nano','empty').passed,true);
});
test('provider identity, scenario and synthetic evidence are required before a benchmark can pass',()=>{
 assert.throws(()=>validateModelDiagnostic(result('qwen06','empty','{}'),'nano','empty'),/corresponde/);
 assert.throws(()=>validateModelDiagnostic({...result('nano','empty','{}'),synthetic:false},'nano','empty'),/corresponde/);
 assert.throws(()=>validateModelDiagnostic({...result('nano','empty','{}'),elapsedMs:NaN},'nano','empty'),/corresponde/);
});
test('lightweight Qwen export is pinned independently of the preserved 1.7B model',()=>{
 assert.equal(QWEN_TEST_MODEL.bytes,497516544);assert.equal(QWEN_TEST_MODEL.sha256,'7900eb4e7362d88c58782c6f9999bb7a129e03544aa98b8f338ea0cc5d8c22c1');assert.match(QWEN_TEST_MODEL.revision,/^[a-f0-9]{40}$/);
});
