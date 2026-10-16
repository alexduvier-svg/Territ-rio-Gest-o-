import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildGuidance,priceFor} from '../src/features/advisor/engine.js';
import {answer} from '../src/features/advisor/agent.js';
const fixture = (over = {}) => ({
 dataContext:{type:'real',id:'isolated-test'}, periodLabel:'Outubro',hasCost:true,portfolioPublished:true,
 products:[{id:'p',name:'Café',price:5000,cost:100,stock:10,min:1}],events:[],previous:null,
 current:{revenue:10000,cost:8000,expense:0,result:2000,salesCount:10,ticket:1000,productsPerSale:2,identified:10,clients:5,returning:3,newClients:2,marketing:0,rank:[{id:'p',name:'Café',qty:10,amount:10000}]},
 finance:{revenue:10000,result:2000,contribution:2000,costs:{feira:0,producao:0,marketing:0},places:[],missingDays:[],margins:[{id:'p',name:'Café',qty:10,revenue:10000,cost:8000,costKnown:true,costCoverage:1}]},
 ...over,
});
test('pricing uses historical net prices and costs, not a changed catalog',()=>{
 const g=buildGuidance(fixture());const d=g.all.find(d=>d.id==='campeao-margem');
 assert(d);assert(d.numbers.some(n=>n.label==='Custo histórico por unidade'&&/8,00/.test(n.value)));
 assert(d.numbers.some(n=>n.label==='Preço sugerido'&&/13,90/.test(n.value)));
 assert.match(d.why,/cenário de análise/);
});
test('missing historical costs block definitive total profit despite a filled catalog',()=>{
 const f=fixture();f.finance.margins[0]={...f.finance.margins[0],cost:0,costKnown:false,costCoverage:0};
 const g=buildGuidance(f);assert.equal(g.quality.completeCosts,false);assert.equal(g.quality.costCoverage,0);
 assert(g.all.some(d=>d.id==='sem-custo'));assert(!g.all.some(d=>d.id==='campeao-margem'));assert.match(g.situation,/resultado parcial/);
});
test('audit errors suppress financial decisions until records are reconciled',()=>{
 const f=fixture({audit:{errors:[{problem:'Pagamento não confere.',help:'Revisar a venda.'}]}});
 const g=buildGuidance(f);assert.equal(g.actions[0].id,'fin-conferencia');assert(!g.all.some(d=>d.id==='campeao-margem'));
 assert.doesNotMatch(g.situation,/2[.,]000|20,00|lucro|Indo bem/);
 assert.match(answer('Devo subir o preço?',f),/conferência|inconsistências/);
});
test('unknown data origin generates no operational conclusion; demonstration is labeled',()=>{
 const unconfirmed=buildGuidance(fixture({dataContext:undefined}));assert.equal(unconfirmed.actions[0].id,'origem-dados');assert.equal(unconfirmed.all.length,1);
 assert.doesNotMatch(answer('Quanto vou vender?',fixture({dataContext:undefined})),/R\$/);
 const demo=buildGuidance(fixture({dataContext:{type:'demo'}}));assert.match(demo.situation,/Exemplo com dados fictícios/);
 assert.match(answer('preço',fixture({dataContext:{type:'demo'}})),/^Exemplo com dados fictícios/);
});
test('incomparable periods do not produce causal sales or ticket claims',()=>{
 const f=fixture({comparable:false,previous:{revenue:100000,salesCount:30,ticket:3333}});
 const g=buildGuidance(f);assert(!g.all.some(d=>['queda','alta'].includes(d.id)));assert.doesNotMatch(g.situation,/período anterior/);
});
test('invalid price scenarios fail explicitly',()=>{
 for(const [cost,margin] of [[NaN,.4],[-1,.4],[100,1],[100,Infinity]])assert.throws(()=>priceFor(cost,margin),RangeError);
});
