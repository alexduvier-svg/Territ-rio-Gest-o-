import test from 'node:test';
import assert from 'node:assert/strict';
import {readQuery} from '../src/features/agent/read-queries.js';
import {expandAbbreviations} from '../src/features/agent/offline-answers.js';
import {queryPeriod} from '../src/features/stock-entries.js';
import {isFinancialQuestion} from '../src/features/business-query.js';
import {parseRequest} from '../src/features/agent/core.js';
const now=Date.parse('2026-11-04T15:00:00-03:00'); // quarta-feira
function data(){
 const p=(id,name,price,stock,extra={})=>({id,name,unit:'Pacote',price,cost:Math.round(price/2),stock,category:'Cafés',...extra});
 const sale=(id,date,total,method,items,customerId)=>({id,date,status:'completed',scope:'loja',total,subtotal:total,payments:[{method,amount:total}],customerId,items:items.map(([productId,qty,t])=>({productId,qty,unit:'Pacote',total:t,costTotal:Math.round(t/2),costKnown:true}))});
 return {dataContext:{id:'qa',type:'demo'},settings:{onboarding:'demo'},
  products:[p('a','Café Especial',4000,10),p('b','Café Gourmet',2500,1),p('c','Café Tradicional',1500,0),p('d','Mel',3000,5,{category:'Apicultura',unit:'Pote'})],
  movements:[{productId:'b',kind:'initial',after:20,date:'2026-10-01T09:00:00-03:00'}],
  clients:[{id:'c1',name:'Ana'},{id:'c2',name:'Bruno'}],
  sales:[sale('s1','2026-11-02T09:30:00-03:00',8000,'Pix',[['a',2,8000]],'c1'),sale('s2','2026-11-03T10:15:00-03:00',2500,'Dinheiro',[['b',1,2500]],'c2'),sale('s3','2026-11-03T10:40:00-03:00',4000,'Pix',[['a',1,4000]],'c1'),sale('s4','2026-10-20T11:00:00-03:00',1500,'Dinheiro',[['c',1,1500]])],
  events:[],expenses:[]};
}
const ask=(q,o={})=>readQuery(data(),q,{now,...o});
test('148: abreviações de celular viram palavras completas',()=>{assert.equal(expandAbbreviations('Qto de mel vc tem hj?'),'quanto de mel voce tem hoje?');});
test('148: semana atual e semana passada têm período próprio; intervalos explícitos continuam pedindo datas',()=>{
 const w=queryPeriod('quanto vendi esta semana',now);assert.equal(w.start,Date.parse('2026-11-02T00:00:00-03:00'));assert.match(w.label,/02\/11\/2026/);
 const l=queryPeriod('vendas da semana passada',now);assert.equal(l.start,Date.parse('2026-10-26T00:00:00-03:00'));assert.equal(l.end,Date.parse('2026-11-01T23:59:59.999-03:00'));
 assert.throws(()=>queryPeriod('desde semana passada',now),/Selecione/);
 assert.equal(queryPeriod('vendi',now,{start:1,end:2}).label,'período selecionado na Gestão');
});
test('148: forma de pagamento soma por método e aponta a mais usada',()=>{const r=ask('Em qual forma de pagamento mais vendi este mês?');assert.match(r.text,/Pix: R\$\s?120,00/);assert.match(r.text,/Mais usada: Pix/);});
test('148: mais caro e mais barato usam o preço cadastrado, não o ranking de vendas',()=>{const r=ask('Qual o produto mais caro?');assert.match(r.text,/Mais caros: Café Especial/);assert.match(r.text,/Mais baratos: Café Tradicional/);});
test('148: produtos com estoque e sem venda no período',()=>{const r=ask('Quais produtos não venderam este mês?');assert.match(r.text,/Mel/);assert.doesNotMatch(r.text,/Café Especial:/);});
test('148: clientes que mais compraram, com anônimos separados',()=>{const r=ask('Quem mais comprou de mim este mês?');assert.match(r.text,/1\. Ana: R\$\s?120,00 em 2 compras/);});
test('148: dia da semana e horário',()=>{assert.match(ask('Qual dia da semana vendo mais este mês?').text,/Melhor dia: segunda-feira/);assert.match(ask('Em que horário vendo mais este mês?').text,/09h às 10h/);});
test('148: acabando e repor usam esgotado e o critério de 25% do Estoque',()=>{const r=ask('O que está acabando?');assert.match(r.text,/Esgotados \(1\): Café Tradicional/);assert.match(r.text,/Estoque baixo \(1\): Café Gourmet/);});
test('148: valor do estoque pelo custo e pelo preço',()=>{const r=ask('Qual o valor do meu estoque?');assert.match(r.text,/Pelo custo: R\$\s?287,50/);assert.match(r.text,/Pelo preço de venda: R\$\s?575,00/);});
test('148: quantos produtos cadastrados por categoria',()=>{const r=ask('Quantos produtos tenho cadastrados?');assert.match(r.text,/ativos: 4/);assert.match(r.text,/Cafés: 3/);});
test('148: comparação mensal usa o demonstrativo da Gestão',()=>{const r=ask('Vendi mais que no mês passado?',{financialComparison:()=>'COMPARATIVO'});assert.equal(r.text,'COMPARATIVO');});
test('148: "a receber", fiado, custos e ticket vão para Finanças, não para o estoque',()=>{
 assert.equal(ask('Quanto tenho a receber?'),null);
 for(const q of ['Quem está devendo?','Quais fiados estão em aberto?','Quais são meus custos do mês?','Qual o ticket médio?','Quanto gastei com custos fixos?']){assert.equal(isFinancialQuestion(q),true,q);assert.equal(parseRequest(q,data()).intent,'management',q);}
});
test('148: execução de plano (productIds) não é desviada pelas respostas rápidas',()=>{const r=readQuery(data(),'quantos produtos tenho em estoque',{now,productIds:['a']});assert.match(r.text,/Café Especial: 10 Pacote/);});
