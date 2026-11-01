import test from 'node:test';
import assert from 'node:assert/strict';
import {readQuery} from '../src/features/agent/read-queries.js';
import {isIncomingQuestion} from '../src/features/agent/incoming-purchases.js';
const now=Date.parse('2026-11-01T12:00:00-03:00');
function fixture(){return {dataContext:{id:'qa',type:'demo'},products:[{id:'p',name:'Tilápia',category:'Piscicultura',unit:'kg',stock:5}],sales:[],movements:[],clients:[],events:[],expenses:[],supplierBook:{version:1,actorId:'qa',suppliers:[{id:'s',name:'João Silva'}],comparisons:[],purchases:[{id:'order',supplierId:'s',item:{productId:'p',name:'Tilápia',specification:'Peixe fresco',unit:'kg'},quantity:'100',occurredOn:'2026-09-01',expectedOn:'2026-11-02',receivedKnown:true,receipts:[{id:'receipt',quantity:60000,occurredOn:'2026-10-01'}]}]}};}
test('the exact screenshot question and common variations consult pending purchases without requiring fornecedor',()=>{
 for(const q of ['Tem produto pra chegar?','Tem produto para chegar?','Há alguma mercadoria a chegar?','Tenho compras pendentes?','O que falta receber?','Quais pedidos estão atrasados?'])assert.equal(isIncomingQuestion(q),true,q);
 const d=fixture(),before=JSON.stringify(d),r=readQuery(d,'Tem produto pra chegar?',{now,period:{start:Date.parse('2026-10-01'),end:Date.parse('2026-10-31')}});
 assert.equal(r.intent,'integrated-read');assert.match(r.text,/falta receber: 40 kg/);assert.match(r.text,/João Silva/);assert.match(r.text,/02\/11\/2026/);assert.match(r.contextLabel,/sem filtro pelo mês/);assert.equal(JSON.stringify(d),before);assert.equal(d.products[0].stock,5);
});
test('fully received and voided orders are not reported as stock to arrive',()=>{
 const d=fixture();d.supplierBook.purchases[0].receipts[0].quantity=100000;assert.match(readQuery(d,'Tem produto pra chegar?',{now}).text,/Não há saldo pendente confirmado/);
 d.supplierBook.purchases[0].voidedAt='2026-11-01';assert.doesNotMatch(readQuery(d,'Tem produto pra chegar?',{now}).text,/Peixe fresco/);
});
test('empty base and legacy unknown received balances have explicit, different answers',()=>{
 const d=fixture();delete d.supplierBook.purchases[0].receivedKnown;const r=readQuery(d,'Tem produto pra chegar?',{now});assert.match(r.text,/não conferidos/);assert.doesNotMatch(r.text,/falta receber: 100/);
 d.products=[];d.supplierBook.purchases=[];assert.match(readQuery(d,'Tem produto pra chegar?',{now}).text,/Não há compras cadastradas/);
});
test('future filters refer to expected delivery, not purchase date or the selected sales month',()=>{
 const d=fixture();assert.match(readQuery(d,'Tem produto pra chegar amanhã?',{now}).text,/40 kg/);assert.doesNotMatch(readQuery(d,'Tem produto pra chegar hoje?',{now}).text,/Peixe fresco/);
 d.supplierBook.purchases[0].expectedOn='2026-10-30';assert.match(readQuery(d,'Tenho pedidos atrasados?',{now}).text,/prazo informado já passou/);
 delete d.supplierBook.purchases[0].expectedOn;assert.match(readQuery(d,'Tem produto pra chegar amanhã?',{now}).text,/sem previsão registrada/);
 assert.throws(()=>readQuery(d,'Tem produto pra chegar nesta semana?',{now}),/Outros períodos/);
});
test('product filtering, source ownership and canonical receipt validation prevent contradictory results',()=>{
 const d=fixture();assert.match(readQuery(d,'Tem tilápia pra chegar?',{now}).text,/40 kg/);assert.match(readQuery(d,'Tem goiabada pra chegar?',{now}).text,/Não identifiquei o produto/);
 d.supplierBook.purchases[0].receipts[0].quantity=101000;assert.throws(()=>readQuery(d,'Tem produto pra chegar?',{now}),/superam/);
 d.supplierBook.actorId='other';assert.throws(()=>readQuery(d,'Tem produto pra chegar?',{now}),/outro contexto/);
});
test('real queries exclude example orders and do not confuse customer receivables with incoming goods',()=>{
 const d=fixture();d.dataContext.type='real';d.supplierBook.purchases[0].source='system-example';assert.doesNotMatch(readQuery(d,'Tem produto pra chegar?',{now}).text,/Peixe fresco/);
 for(const q of ['Tenho recebimento pendente de clientes?','Registre recebimento de produto','Quando entraram minhas tilápias?'])assert.equal(isIncomingQuestion(q),false,q);
});
