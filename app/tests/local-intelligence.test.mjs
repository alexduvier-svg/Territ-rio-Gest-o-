import test from 'node:test';
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
test('a model selection cannot omit quantities, dates, units or a part of a compound answer',()=>{
  const facts='Demonstração · Outubro\nEstoque: 12 kg de tilápia.\nVendas: 8 kg.\nÚltima entrada: 20/10/2026.\nCNPJs distintos: 2.\nQuantidade pendente: 4 embalagens.';
  assert.equal(validateExplanation('{"trechos":[1]}',facts),facts.split('\n').join('\n\n'));
});
test('a cancelled operation retains its lease until the provider actually finishes',async()=>{
  let complete,calls=0;
  const s=createLocalIntelligence({explain:()=>{calls++;return new Promise(r=>complete=r);},cancel:async()=>{},installModel:async()=>{},removeModel:async()=>{}});
  const first=s.explain('Estoque: 2 kg.');await s.cancel();
  await assert.rejects(s.explain('Estoque: 3 kg.'),/encerramento/);
  await assert.rejects(s.installModel(),/encerramento/);
  await assert.rejects(s.removeModel(),/encerramento/);
  assert.equal(calls,1);complete({text:'{"trechos":[0]}'});await assert.rejects(first,/cancelada/);
  const next=s.explain('Estoque: 3 kg.');complete({text:'{"trechos":[0]}'});assert.equal(await next,'Estoque: 3 kg.');
});
test('failure cooldown is bounded, does not retry silently and keeps the deterministic answer available',async()=>{
 let at=1000,calls=0;const s=createLocalIntelligence({explain:async()=>{calls++;return {text:calls===1?'inventado':'{"trechos":[0]}'};}},{now:()=>at});
 await assert.rejects(s.explain('Estoque: 2 kg.'),/conferência/);
 await assert.rejects(s.explain('Estoque: 2 kg.'),/pausa/);assert.equal(calls,1);
 at+=120001;assert.equal(await s.explain('Estoque: 2 kg.'),'Estoque: 2 kg.');assert.equal(calls,2);
});
test('foreground and essential profile are checked before crossing the provider boundary',async()=>{
 let calls=0;const s=createLocalIntelligence({explain:async()=>{calls++;return{text:'{"trechos":[0]}'};}});
 await assert.rejects(s.explain('Estoque.',{foreground:false}),/Volte/);
 await assert.rejects(s.explain('Estoque.',{profile:'essential'}),/Essencial/);assert.equal(calls,0);
});
test('only the calculated text crosses the model boundary, without business object or model tools', async () => {
  let received;
  const service=createLocalIntelligence({explain:async request=>{received=request;return {text:'{"trechos":[0]}'};}});
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
