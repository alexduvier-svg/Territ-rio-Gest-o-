import test from 'node:test';
import assert from 'node:assert/strict';
import {clarificationResult} from '../src/features/agent/clarification.js';
import {answerQuery} from '../src/features/agent/core.js';
test('unknown questions request clarification instead of producing generic business observations',()=>{
 const r=answerQuery({products:[],sales:[]},{intent:'unsupported',text:'Quero entender essa situação'});
 assert.equal(r.needsClarification,true);assert.equal(r.intent,'clarification');assert.equal(r.specialists.length,0);assert.match(r.text,/se referindo\?/);assert.doesNotMatch(r.text,/Faça agora|Previsão:|Não faço conversa livre/);
});
test('clarification targets the missing reference or metric and preserves the actual question',()=>{
 assert.match(clarificationResult('Ele foi melhor?').text,/A qual produto/);
 assert.match(clarificationResult('Qual rendeu mais?').text,/quantidade vendida, faturamento ou lucro/);
 assert.match(clarificationResult('Quanto ficou?').text,/Qual valor/);
 assert.match(clarificationResult('Tem algo para receber?').text,/mercadorias.*valores a receber/);
});
