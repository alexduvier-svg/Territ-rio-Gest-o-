import {investmentReturn} from '../finance/producer-calcs.js';
import {costKind} from '../finance/finance.js';
import {evidenceQuality} from '../advisor/quality.js';
import {itemCostKnown,day,validDay} from '../sales-records/domain.js';
const ratio=(n,d)=>Number.isFinite(n)&&Number.isFinite(d)&&d>0?n/d*100:null;
const metric=(id,title,value,unit,formula,meaning,action)=>({id,title,value:Number.isFinite(value)?value:null,unit,formula,meaning,action});

// The finance statement and its selected sales are the controlling sources.
// Do not infer a return on investment from all business profit or this month's purchases.
export function summary({finance:f,sales=[],returns=[],periodLabel='',dataContext,audit}) {
  const returned=new Set(returns.map(s=>s.id));
  const eligible=sales.filter(s=>s.status==='completed'&&!returned.has(s.id));
  const revenue=eligible.reduce((n,s)=>n+s.total,0),identified=eligible.filter(s=>!!s.customerId);
  const buyers=new Map();for(const s of identified)buyers.set(s.customerId,(buyers.get(s.customerId)||0)+1);
  const repeat=[...buyers.values()].filter(count=>count>=2).length;
  const q=evidenceQuality({finance:f,current:{salesCount:eligible.length},dataContext,audit});
  const missingItems=[...sales,...returns].flatMap(s=>s.items).filter(i=>!itemCostKnown(i));
  const complete=!missingItems.length&&q.completeCosts&&!q.errors;
  const gross=f.revenue-f.cmv;
  const primary=[
    metric('gross-margin','Margem bruta',complete?ratio(gross,f.revenue):null,'percent','(Receita após devoluções − custo histórico) ÷ receita após devoluções × 100.','Quanto da receita sobra depois do custo dos produtos, antes de taxas e despesas.',complete?'Compare as apresentações em Produtos e Margens.':'Informe os custos das vendas antes de concluir sobre lucro.'),
    metric('contribution','Margem de contribuição',complete?f.contribution:null,'money','Receita após devoluções − custo histórico − taxas − impostos variáveis.','Valor disponível para os demais custos do negócio. Taxas e tributos seguem os valores configurados no demonstrativo.',complete?'Confira também custos fixos, operação e retirada.':'Complete os custos históricos e confira taxas e impostos.'),
    metric('ticket','Ticket médio',eligible.length&&!q.errors?Math.round(revenue/eligible.length):null,'money','Valor das vendas elegíveis ÷ número dessas vendas. Exclui vendas integralmente devolvidas.','Média das compras concluídas e não devolvidas. Devoluções de vendas antigas continuam no demonstrativo, sem alterar esta base de compras.',eligible.length?'Avalie combinações de produtos; desconto sozinho pode reduzir a margem.':'Registre vendas para formar a base.')
  ];
  const drivers=[
    metric('operating-result','Resultado gerencial',complete&&!q.missingDays?f.result:null,'money','Margem de contribuição − operação − perdas − fixos rateados − retirada do recorte.','Resultado pelos registros e critérios de Finanças. Custos não lançados tornam a análise incompleta.','Confira o demonstrativo e os custos extras.'),
    metric('contribution-rate','Margem de contribuição (%)',complete?ratio(f.contribution,f.revenue):null,'percent','Margem de contribuição ÷ receita após devoluções × 100.','Taxa agregada pelas somas, sem fazer média das margens dos produtos.','Use a mesma base econômica ao comparar períodos.'),
    metric('break-even','Ponto de equilíbrio mensal',complete?f.breakEven:null,'money','Fixos mensais de referência ÷ taxa positiva de margem de contribuição.','Estimativa mensal com o mix observado e os fixos informados; não é o total de vendas do período selecionado.','Confira a referência mensal e a composição de custos.'),
    metric('lines-per-sale','Linhas por venda',eligible.length?eligible.reduce((n,s)=>n+s.items.length,0)/eligible.length:null,'number','Linhas de produtos das vendas elegíveis ÷ número dessas vendas.','Permite ler cestas com unidades diferentes sem somar quilos com pacotes ou dúzias.','Consulte Produtos e Margens para estudar o mix.')
  ];
  const crm={sales:eligible.length,identified:identified.length,clients:buyers.size,repeat,
    identificationRate:ratio(identified.length,eligible.length),
    identifiedRevenueRate:ratio(identified.reduce((n,s)=>n+s.total,0),revenue),
    frequency:buyers.size?identified.length/buyers.size:null,
    repeatRate:ratio(repeat,buyers.size)};
  return {version:1,periodLabel,primary,drivers,crm,
    quality:{completeCosts:complete,costCoverage:missingItems.length&&q.costCoverage===1?null:q.costCoverage===null?null:q.costCoverage*100,missingProducts:new Set(missingItems.map(i=>i.productId)).size,feesEstimated:!!f.feesDefault,recordedCostsOnly:true,errors:q.errors,missingDays:q.missingDays,status:q.status},
    roi:{value:null,reason:'Escolha o investimento registrado e confirme o vínculo com o resultado deste recorte.',formula:'(Resultado gerencial atribuído do recorte − investimento registrado) ÷ investimento registrado × 100.'},
    source:'finance.statement + selected historical sale items + stable customer IDs',
    limits:['Custos, taxas e retiradas dependem dos registros e da configuração.','Recompra no período não é retenção de coorte ou previsão de fidelidade.']};
}

export function investments(data){
  const actor=data.dataContext?.id||data.productMemory?.scopeId;
  return data.expenses.filter(x=>costKind(x)==='investimento'&&(!x.actorId||x.actorId===actor)&&(!x.dataContext?.id||x.dataContext.id===actor)&&!(data.dataContext?.type==='real'&&(x.demo||x.simulated||x.simulation)));
}
export function investmentAssessment({data,investmentId,finance,quality,attributionBps,confirmed,throughDay,monthShare,periodComplete}){
  const investment=investments(data).find(x=>x.id===investmentId);
  if(!investment)throw Error('Escolha um investimento registrado em Custos.');
  if(!Number.isSafeInteger(investment.amount)||investment.amount<=0)throw Error('Confira o valor do investimento em Custos.');
  const investedOn=day(investment.date);
  if(!investedOn||!validDay(throughDay)||investedOn>throughDay)throw Error('O investimento precisa ter data válida até o fim do recorte.');
  if(quality?.errors)throw Error('Confira as inconsistências dos registros antes de avaliar o retorno.');
  if(quality?.completeCosts!==true)throw Error('Complete os custos das vendas deste recorte antes de avaliar o retorno.');
  if(quality?.missingDays)throw Error('Confira os custos dos dias pendentes deste recorte antes de avaliar o retorno.');
  if(!Number.isSafeInteger(finance.result))throw Error('O resultado do demonstrativo não está disponível.');
  if(!Number.isInteger(attributionBps)||attributionBps<0||attributionBps>10000||confirmed!==true)throw Error('Informe de 0 a 100% e confirme o vínculo deste resultado com o investimento.');
  const attributed=Math.round(finance.result*attributionBps/10000),net=attributed-investment.amount;
  if(!Number.isSafeInteger(attributed)||!Number.isSafeInteger(net))throw Error('Confira os valores do investimento e do resultado.');
  const rate=periodComplete&&Number.isFinite(monthShare)&&monthShare>0&&attributed>0?investmentReturn({cost:investment.amount/100,monthlyGain:attributed/monthShare/100}):null;
  return {kind:'linked-managerial-assessment',investmentId,investment:investment.amount,investedOn,result:finance.result,attributionBps,attributed,net,
    roi:net/investment.amount*100,payback:rate?.status==='ok'?rate.payback:null,
    formula:'(Resultado gerencial atribuído do recorte − investimento registrado) ÷ investimento registrado × 100.',
    assumption:'Atribuição confirmada pelo produtor. Payback é estimativa pelo ritmo médio de um recorte encerrado, sem garantia de repetição. Não é retorno bancário comprovado.'};
}
