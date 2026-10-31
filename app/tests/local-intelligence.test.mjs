import test from 'node:test';
import { MODEL_KNOWLEDGE } from '../src/features/local-intelligence/knowledge.js';
import {isFinancialQuestion} from '../src/features/business-query.js';
import assert from 'node:assert/strict';
import { explanationRequest, validateExplanation, createLocalIntelligence, LOCAL_MODEL } from '../src/features/local-intelligence/service.js';

test('Qwen selects canonical passages; amounts, labels, scope and caveats cannot be rewritten or omitted', () => {
  const facts='Outubro de 2026 · Loja\nReceita R$ 805,00.\nLucro bruto R$ 305,00; antes de despesas.\nCustos incompletos.\nEstoque de café disponível.';
  const result=validateExplanation('{"trechos":[4]}',facts);
  assert.equal(result, facts.split('\n').join('\n\n'));
  for(const text of ['Não há informações sobre receitas.', '{"trechos":[99]}', '{"trechos":[-1]}', '{"trechos":[1.5]}', '{"trechos":[1,1]}', '{"trechos":[]}', '<script>execute()</script>', '{"trechos":["1"]}'])assert.throws(()=>validateExplanation(text,facts));
});
test('selection preserves unavailable profit and never inserts a proposed amount',()=>{
  const facts='Loja · Hoje\nVendas R$ 805,00.\nCusto histórico incompleto: lucro bruto indisponível.\nConferir o estoque.';
  const result=validateExplanation('{"trechos":[3],"resposta":"Lucro R$ 900,00"}',facts);
  assert.ok(result.includes('Vendas R$ 805,00.'));
  assert.ok(result.includes('lucro bruto indisponível'));
  assert.ok(!result.includes('900'));
});
test('only the calculated text crosses the model boundary, without business object or model tools', async () => {
  let received;
  const service=createLocalIntelligence({explain:async request=>{received=request;return {text:'{"trechos":[0]}'};}});
  await service.explain('Custos incompletos.');
  assert.deepEqual(received,{facts:'Custos incompletos.',knowledge:MODEL_KNOWLEDGE});
  const policy=JSON.parse(received.knowledge);assert.equal(policy.idioma,'pt-BR');assert(policy.setores.includes('Loja'));assert(policy.setores.includes('Qwen'));assert.equal(policy.matematica,7);
  assert.ok(Object.isFrozen(received));
  assert.throws(()=>explanationRequest({sales:[]}));
  assert.throws(()=>explanationRequest('x'.repeat(4001)));
});
test('cancellation suppresses late explanations after leaving the result screen', async () => {
  let complete;
  const service=createLocalIntelligence({explain:()=>new Promise(resolve=>{complete=resolve;}),cancel:async()=>{}});
  const pending=service.explain('Estoque disponível.');
  await service.cancel();complete({text:'{"trechos":[0]}'});
  await assert.rejects(pending,/cancelada/);
});
test('the compatible download is immutable, hash pinned and separate from user data',()=>{
  assert.equal(LOCAL_MODEL.delivery,'play-install-time');
  assert.equal(LOCAL_MODEL.assetPath,'qwen/model.litertlm');
  assert.equal(LOCAL_MODEL.url,undefined);
  assert.match(LOCAL_MODEL.sha256,/^[a-f0-9]{64}$/);
  assert.equal(LOCAL_MODEL.bytes,977184032);
});

test('financial questions use Gestão while culinary recipes and product ranking keep their specialists',()=>{
 for(const text of ['Qual minha receita hoje?', 'Quanto faturei hoje?', 'Qual o lucro bruto?', 'Quanto tenho a receber?', 'Quanto recebi hoje?', 'Mostre o total de taxas'])assert.equal(isFinancialQuestion(text),true,text);
 for(const text of ['Receita de bolo de banana', 'Uma receita culinária', 'Qual produto vendeu mais e qual deixou mais lucro bruto?', 'Como preparar geleia'])assert.equal(isFinancialQuestion(text),false,text);
});

test('Qwen summary keeps ranking headings attached to the unchanged monetary rows',()=>{
 const facts='Loja · Hoje\nVendas no recorte: 6; devoluções no recorte: 0.\nCritério: quantidade líquida.\nQuantidade · Pacote\nMais: 3 produtos (até 3)\n1. Café A: 9 Pacote; R$ 90,00.\nMenos: 3 produtos (até 3)\n1. Café B: 0 Pacote; R$ 0,00.';
 assert.equal(validateExplanation('{"trechos":[0]}',facts),facts.split('\n').join('\n\n'));
});
