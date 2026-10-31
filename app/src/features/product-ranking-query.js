import { buildSelectedProductReport, rankProductRows } from './product-period-reports.js';
import { contextOf, eligible } from './agent/core.js';
import { productRankingRequest } from './business-query.js';
const quantity=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const cash=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
// Read-only adapter. Selection belongs to the same demonstrativo used by Gestão.
export function answerProductRanking(data,{sales=[],returns=[],text='',label='',now=Date.now(),end=now+1,describe=()=>'',money=cash,expectedRevenue}={}){
 const request=productRankingRequest(text),ctx=contextOf(data);
 if(!request||!['real','demo','simulation'].includes(ctx.dataOrigin))throw Error('Confirme a pergunta e a origem dos registros antes de comparar os produtos.');
 for(const [rows,isReturn] of [[sales,false],[returns,true]]){
  const seen=new Set();
  for(const row of rows){
   const at=Date.parse(isReturn?(row.returnedAt||row.date):row.date);
   if(!row.id||seen.has(row.id)||!eligible(row,ctx)||!['completed','returned'].includes(row.status)||(isReturn&&row.status!=='returned')||!Number.isFinite(at)||at>now||!Number.isSafeInteger(row.total)||row.total<0||!Array.isArray(row.items)||!row.items.length||row.items.some(i=>!i.productId||!Number.isFinite(i.qty)||i.qty<=0||!Number.isSafeInteger(i.total)||i.total<0||(i.netTotal!=null&&(!Number.isSafeInteger(i.netTotal)||i.netTotal<0))))throw Error('A conferência das vendas falhou. Confira origem, datas e itens na Gestão.');
   seen.add(row.id);
  }
 }
 const products=(data.products||[]).filter(p=>eligible(p,ctx)).map(p=>({...p,description:p.description||describe(p)}));
 const report=buildSelectedProductReport({products,movements:(data.movements||[]).filter(r=>eligible(r,ctx))},{sales,returns,now,end});
 if(expectedRevenue!=null&&(!Number.isSafeInteger(expectedRevenue)||report.rows.reduce((n,r)=>n+r.revenue,0)!==expectedRevenue))throw Error('Os valores dos produtos não fecharam com o demonstrativo. Confira os itens na Gestão.');
 const lines=[label||'Recorte atual da Gestão',`Vendas no recorte: ${report.salesCount}; devoluções no recorte: ${report.returnsCount}.`];
 if(!sales.length&&!returns.length)lines.push('Sem vendas ou devoluções registradas neste recorte. Os produtos abaixo estão empatados em zero; isso não comprova falta de demanda.');
 const rowText=(r,i)=>`${i+1}. ${r.name}${r.description?' · '+r.description:''}: ${r.units.map(u=>quantity(u.qty)+' '+u.unit).join(' + ')||'0 '+(r.unit||'unidade')}; valor vendido ${money(r.revenue)}; lucro bruto ${r.grossProfit===null?(r.noSale?'sem venda registrada':'custo histórico incompleto'):money(r.grossProfit)}.${r.noSale?' Sem venda líquida registrada.':''}`;
 const section=(rank,heading)=>{
  lines.push(heading);
  const selection=request.top&&request.bottom||rank.eligible>=6?rank:rankProductRows([...rank.top,...rank.bottom],rank.criterion,{disjoint:false});
  for(const [show,rows,title] of [[request.top,selection.top,'Mais'],[request.bottom,selection.bottom,'Menos']])if(show){lines.push(`${title}: ${rows.length} produto${rows.length===1?'':'s'} (até 3)`);lines.push(...(rows.length?rows.map(rowText):['Sem outro produto elegível neste grupo; a amostra é pequena.']));}
  if(request.top&&request.bottom&&rank.eligible<6)lines.push(`Amostra com ${rank.eligible} produto(s) elegível(is): o mesmo produto não é repetido nos dois grupos.`);
 };
 for(const criterion of request.criteria){
  if(criterion==='quantity'){
   lines.push('Critério: quantidade líquida. Unidades diferentes ficam separadas, como no relatório do app.');
   if(!report.units.length)lines.push('Nenhum produto elegível no recorte.');
   for(const group of report.units)section(group,'Quantidade · '+group.unit);
  }else{
   section(criterion==='profit'?report.profit:report.revenue,criterion==='profit'?'Critério: lucro bruto histórico, antes de taxas e despesas':'Critério: valor vendido após descontos e devoluções');
   if(criterion==='profit'&&report.missingCostProducts)lines.push(`${report.missingCostProducts} produto(s) com custo histórico incompleto ficam fora da classificação de lucro. Custo ausente não é zero.`);
  }
 }
 lines.push('Descontos e devoluções usam os valores históricos. Empates seguem valor vendido, nome e apresentação. Sem venda registrada não prova falta de demanda; confira disponibilidade e exposição.');
 return {text:lines.join('\n'),report,request};
}
