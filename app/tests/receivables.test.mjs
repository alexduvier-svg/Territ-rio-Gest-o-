import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as R from '../src/features/receivables/receivables.js';
import {statement,profitByPlace} from '../src/features/finance/finance.js';
import {recoveryRecord,inspectRecovery} from '../src/features/resources/recovery.js';
const ctx={Date,Math,JSON,Intl,TerritorioReceivables:R};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js',import.meta.url),'utf8'),ctx);const E=ctx.ERP;
const today=R.day(),tomorrow=new Date(Date.parse(today+'T12:00Z')+864e5).toISOString().slice(0,10);
const model=()=>{const data=E.seed();for(const k of ['sales','clients','movements','expenses','events','eventLoads'])data[k]=[];data.products=[{id:'coffee',name:'Café Gourmet',category:'Cafés',unit:'Pacote',weight:250,price:1800,cost:800,costKnown:true,stock:10,min:0}];return new E.ERPModel(data);};
const draft=()=>({operationId:'credit-sale',scope:'loja',items:[{productId:'coffee',rawQty:'3'}],discountMode:'R$',discountValue:'0',payment:'Fiado',split:false,clientName:'Maria Silva',uf:'MG',creditDueDate:tomorrow});
const command=sale=>({saleId:sale.id,operationId:'receipt-1',method:'Pix',date:today});
const st=(sales,receipts=[],returns=[])=>statement({sales,receipts,returns,expenses:[],settings:{},shares:[]});
test('Fiado exige cliente, data real e não aceita divisão; falhas não alteram estoque/clientes',()=>{
 for(const patch of [{clientName:''},{creditDueDate:''},{creditDueDate:'2026-02-30'},{creditDueDate:'2020-01-01'},{split:true,parts:[{method:'Pix',value:'27'},{method:'Fiado',value:'27'}]}]){const m=model(),before=JSON.stringify(m.data);assert.throws(()=>m.complete({...draft(),...patch}));assert.equal(JSON.stringify(m.data),before);}
});
test('venda Fiado cria cliente, conserva vencimento e só baixa estoque uma vez após reinício',()=>{
 let m=model();const s=m.complete(draft());assert.equal(m.product('coffee').stock,7);assert.equal(m.data.clients.length,1);assert.equal(s.customerName,'Maria Silva');assert.equal(s.credit.dueDate,tomorrow);assert.equal(s.payments[0].method,'Fiado');
 m=new E.ERPModel(JSON.parse(JSON.stringify(m.data)));assert.equal(m.complete(draft()).id,s.id);assert.equal(m.product('coffee').stock,7);assert.equal(m.data.sales.length,1);assert.throws(()=>m.complete({...draft(),creditDueDate:today}),/outros dados/);
});
test('Fiado é receita e margem, mas não recebimento nem saldo de caixa',()=>{
 const s=model().complete(draft()),f=st([s]);assert.equal(f.revenue,5400);assert.equal(f.result,3000);assert.equal(f.creditSold,5400);assert.equal(f.cash,0);assert.deepEqual(f.received,{});assert.equal(f.fees,0);
});
test('baixa paga saldo integral, não altera venda/estoque, é idempotente e resiste a reload',()=>{
 let m=model();let s=m.complete(draft());const before=JSON.stringify({stock:m.product('coffee').stock,movements:m.data.movements,clients:m.data.clients});R.settle(m.data.sales,command(s));m=new E.ERPModel(JSON.parse(JSON.stringify(m.data)));s=m.data.sales[0];const receipt=R.settle(m.data.sales,command(s));assert.equal(receipt.amount,5400);assert.equal(R.balance(s),0);assert.equal(m.data.sales.length,1);assert.equal(R.collections(m.data.sales).length,1);assert.equal(before,JSON.stringify({stock:m.product('coffee').stock,movements:m.data.movements,clients:m.data.clients}));assert.throws(()=>R.settle(m.data.sales,{...command(s),method:'Dinheiro'}),/outros dados/);assert.throws(()=>R.settle(m.data.sales,{...command(s),operationId:'duplicate'}),/não tem valor/);
});
test('recebimento em período posterior entra apenas no caixa desse período, não duplica receita',()=>{
 const m=model(),s=m.complete(draft());s.date='2026-09-20T12:00:00-03:00';R.settle(m.data.sales,command(s));const old=st([s]),current=st([],R.collections(m.data.sales,r=>r.date.slice(0,7)===today.slice(0,7)));assert.equal(old.revenue,5400);assert.equal(old.cash,0);assert.equal(current.revenue,0);assert.equal(current.cash,5400);assert.equal(current.collected,5400);assert.equal(current.received.Pix,5400);
});
test('baixa valida método, data e venda antes de qualquer alteração',()=>{
 const m=model(),s=m.complete(draft());for(const patch of [{method:'Fiado'},{date:'2026-02-30'},{date:'2020-01-01'},{date:tomorrow},{saleId:'inexistente'},{operationId:''}]){const before=JSON.stringify(m.data);assert.throws(()=>R.settle(m.data.sales,{...command(s),...patch}));assert.equal(JSON.stringify(m.data),before);}
});
test('devolver Fiado não pago anula dívida e restaura estoque sem inventar saída de caixa',()=>{
 const m=model(),s=m.complete(draft());m.refund(s.id);assert.equal(R.balance(s),0);assert.equal(R.outstanding(m.data.sales).length,0);assert.equal(m.product('coffee').stock,10);assert.equal(st([],[],[s]).cash,0);assert.equal(st([],[],[s]).revenue,-5400);assert.throws(()=>R.settle(m.data.sales,command(s)),/não tem valor/);
});
test('devolver Fiado já recebido desconta o dinheiro pago e não apaga histórico',()=>{
 const m=model(),s=m.complete(draft());R.settle(m.data.sales,command(s));m.refund(s.id);const f=st([],[],[s]);assert.equal(f.cashRefunded,5400);assert.equal(f.cash,-5400);assert.equal(R.collections(m.data.sales).length,1);assert.equal(R.balance(s),0);
});
test('baixa com cartão considera taxa no período do recebimento e no local da venda',()=>{
 const m=model(),s=m.complete(draft());s.scope='fair';R.settle(m.data.sales,{...command(s),method:'Crédito'});const receipts=R.collections(m.data.sales),f=st([],receipts);assert.equal(f.fees,269);assert.equal(f.cash,5131);assert.equal(f.result,-269);const p=profitByPlace({sales:[],returns:[],expenses:[],receipts,settings:{},nameOf:id=>id});assert.equal(p[0].id,'fair');assert.equal(p[0].profit,-269);
});
test('pagamentos à vista e divididos preservam caixa, receita e total',()=>{
 for(const method of R.CASH_METHODS){const m=model(),s=m.complete({...draft(),payment:method});assert(!s.credit);const f=st([s]);assert.equal(f.revenue,5400);assert.equal(f.received[method],5400);assert.equal(f.cash,5400-f.fees);}
 const m=model(),s=m.complete({...draft(),payment:'Pix',split:true,parts:[{method:'Pix',value:'20'},{method:'Dinheiro',value:'34'}]});assert.equal(st([s]).cash,5400);
});
test('rascunho com Fiado mantém cliente/vencimento e não reaplica venda já registrada',()=>{
 const d=draft(),record=recoveryRecord({actorId:'producer',draft:d}),args={actorId:'producer',productIds:['coffee'],sales:[]};const restored=inspectRecovery(record,args);assert.equal(restored.entry.draft.creditDueDate,tomorrow);assert.equal(restored.entry.draft.clientName,'Maria Silva');const m=model();m.complete(restored.entry.draft);assert.equal(inspectRecovery(record,{...args,sales:m.data.sales}).status,'committed');
});
test('ordem de vencimento e filtro por cliente mantêm valores separados',()=>{
 const m=model(),s=m.complete(draft());m.complete({...draft(),operationId:'second',clientName:'João',creditDueDate:today});const rows=R.outstanding(m.data.sales);assert.equal(rows[0].customerName,'João');assert.equal(R.outstanding(m.data.sales,s.customerId).length,1);assert.equal(R.balance(s),5400);
});
