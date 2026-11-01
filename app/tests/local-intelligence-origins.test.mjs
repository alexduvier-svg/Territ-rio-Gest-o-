import test from 'node:test';
import assert from 'node:assert/strict';
import {AGENT_GUIDELINES} from '../src/data/agent-guidelines.js';
import {readQuery} from '../src/features/agent/read-queries.js';
import {ensureAgent,revisionOf} from '../src/features/agent/core.js';
import {createLocalIntelligence} from '../src/features/local-intelligence/service.js';
const now=Date.parse('2026-11-01T12:00:00-03:00');
function demo(){return {dataContext:{id:'producer',type:'demo'},settings:{onboarding:'demo'},products:[{id:'demo-tilapia',name:'Tilápia',category:'Piscicultura',unit:'kg',stock:12,demo:true}],sales:[],movements:[],clients:[],events:[],expenses:[]};}
test('the same engines answer demo stock and an empty real base without copying fictional facts',async()=>{
 const data=demo(),before=JSON.stringify(data),d=readQuery(data,'Quantos peixes tenho em estoque?',{now});
 assert.match(d.text,/12 kg/);assert.equal(JSON.stringify(data),before);
 const service=createLocalIntelligence({explain:async()=>({text:'{"trechos":[0]}'})});
 assert.match(await service.explain(d.text),/12 kg/);
 const oldRevision=revisionOf(data);data.dataContext.type='real';data.settings.onboarding='clean';data.products=[];
 assert.notEqual(revisionOf(data),oldRevision);
 for(const q of ['Quantos peixes tenho em estoque?','O que vendi mais?','Qual foi a última entrada de café?','Quanto comprei do fornecedor?']){
  const r=readQuery(data,q,{now});assert.match(r.text,/Ainda não há registros/);assert.match(r.text,/Cadastre/);assert.doesNotMatch(r.text,/12 kg|Tilápia/);
  assert.match(await service.explain(r.text),/Ainda não há registros/);
 }
});
test('real origin excludes retained demo records instead of answering from fictional stock',()=>{
 const data=demo();data.dataContext.type='real';data.settings.onboarding='clean';
 assert.match(readQuery(data,'Quantos peixes tenho em estoque?',{now}).text,/Ainda não há registros/);
});
test('origin, preferences and confirmed aliases invalidate revisions; audit alone does not',()=>{
 const data=demo();ensureAgent(data);const first=revisionOf(data);data.settings.hideValues=true;assert.notEqual(revisionOf(data),first);
 const second=revisionOf(data);data.agent.aliases.push({from:'peixe',to:'demo-tilapia'});assert.notEqual(revisionOf(data),second);
 const third=revisionOf(data);data.agent.audit.push({event:'queried'});assert.equal(revisionOf(data),third);
 data.dataContext.type='real';ensureAgent(data);assert.deepEqual(data.agent.aliases,[]);
});
test('existing agent knowledge is upgraded without discarding producer preferences or aliases',()=>{
 const data=demo();ensureAgent(data);data.agent.knowledge.version=1;data.agent.settings.rebuy=false;data.agent.aliases.push({from:'peixe',to:'demo-tilapia'});
 ensureAgent(data);assert.equal(data.agent.knowledge.version,AGENT_GUIDELINES.version);assert.equal(data.agent.settings.rebuy,false);assert.equal(data.agent.aliases.length,1);
});
