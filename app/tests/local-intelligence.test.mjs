import test from 'node:test';
import assert from 'node:assert/strict';
import { explanationRequest, validateExplanation, createLocalIntelligence, LOCAL_MODEL } from '../src/features/local-intelligence/service.js';

test('explanation rejects new amounts and percentages instead of changing canonical business facts', () => {
  const facts='Receita R$ 805,00. Lucro bruto R$ 305,00. Custos incompletos.';
  assert.equal(validateExplanation('Foram R$ 805,00 em receita; o resultado informado é parcial.',facts),'Foram R$ 805,00 em receita; o resultado informado é parcial.');
  for(const text of ['Você ganhou R$ 900,00.','O lucro cresceu 25%.','Lucro líquido de R$ 1.000,00.'])assert.throws(()=>validateExplanation(text,facts));
  assert.throws(()=>validateExplanation('<script>execute()</script>',facts));
});
test('only the calculated text crosses the model boundary, without business object or model tools', async () => {
  let received;
  const service=createLocalIntelligence({explain:async request=>{received=request;return {text:'O custo ainda está incompleto.'};}});
  await service.explain('Custos incompletos.');
  assert.deepEqual(received,{facts:'Custos incompletos.'});
  assert.ok(Object.isFrozen(received));
  assert.throws(()=>explanationRequest({sales:[]}));
  assert.throws(()=>explanationRequest('x'.repeat(4001)));
});
test('cancellation suppresses late explanations after leaving the result screen', async () => {
  let complete;
  const service=createLocalIntelligence({explain:()=>new Promise(resolve=>{complete=resolve;}),cancel:async()=>{}});
  const pending=service.explain('Estoque disponível.');
  await service.cancel();complete({text:'Estoque disponível para consulta.'});
  await assert.rejects(pending,/cancelada/);
});
test('the compatible download is immutable, hash pinned and separate from user data',()=>{
  assert.match(LOCAL_MODEL.url,/resolve\/[a-f0-9]{40}\//);
  assert.match(LOCAL_MODEL.sha256,/^[a-f0-9]{64}$/);
  assert.equal(LOCAL_MODEL.bytes,977184032);
});
