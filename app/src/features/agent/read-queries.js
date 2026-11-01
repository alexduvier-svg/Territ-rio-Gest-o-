import {contextOf,eligible,scopeSales,analyze} from './core.js';
import {normalize,productMatches,queryPeriod,entryAnswer,isEntryQuestion} from '../stock-entries.js';
import {productMargins} from '../finance/finance.js';
import {rankProductRows} from '../product-period-reports.js';
import {book,identity,purchaseReceiptState} from '../suppliers/model.js';
const qty=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const within=(date,p)=>Number.isFinite(Date.parse(date))&&Date.parse(date)>=p.start&&Date.parse(date)<=p.end;
const totalUnits=rows=>{const totals=new Map();for(const r of rows){if(!r.unit||!Number.isFinite(r.quantity))throw Error('Unidade ou quantidade não registrada; confira a origem.');totals.set(r.unit,(totals.get(r.unit)||0)+Math.round(r.quantity*1000));}return [...totals].map(([u,n])=>qty(n/1000)+' '+u).join('; ')||'0 unidades registradas';};
// Read plans over original tables and existing finance engines. No tool/model writes.
export function readQuery(data,text,{scopeId='all',period=null,now=Date.now(),financialComparison=null}={}){
 const q=normalize(text),ctx=contextOf(data);
 if(!['real','demo','simulation'].includes(ctx.dataOrigin))throw Error('Confirme a origem dos registros antes de consultar.');
 if(/(?:receita|faturamento).*(?:aument|caiu|compar|mes passado)/.test(q)&&financialComparison)return {intent:'integrated-read',text:financialComparison(text),generatedAt:now,specialists:[{name:'Gestão e Finanças',source:'finance.statement e kpi.periodChange'}],confidence:'Mesmos demonstrativos e limites da Gestão.',rebuys:[]};
 if(/produto.*(?:parado|sem venda)/.test(q)){const facts=analyze(data,{scopeId,now}).insights.filter(i=>i.ruleId==='no-sale');return {intent:'integrated-read',text:facts.map(i=>i.observation+' '+i.nextAction).join('\n')||'Nenhum produto atende aos critérios atuais de estoque sem venda. Confira as preferências da Inteligência.',generatedAt:now,specialists:[{name:'Estoque',source:'Motor proativo existente; critério configurado pelo produtor'}],confidence:'Observações dos registros, sem comprovação de causa.',rebuys:[]};}
 const stock=/estoque|quant[oa]s?.*tenho|quantos.*tenho/.test(q),sold=/\bvendi\b|\bvendidos\b|venderam|vendeu|mais vendido|menos vendido/.test(q),buyers=/clientes?.*compr|cnpjs?/.test(q),ranking=/mais|menos|lucrativ/.test(q)&&/produto|vendi|vendeu/.test(q),supplier=/comprei|compras?|recebimentos?|pendente/.test(q)&&/fornecedor/.test(q);
 if(!stock&&!sold&&!buyers&&!ranking&&!supplier&&!isEntryQuestion(q))return null;
 // Assertions and sales commands stay in the existing confirmed proposal flow.
 if(/^(?:eu )?vendi \d|^(?:adicione|registre|apague|exclua|zere|vender)\b/.test(q))return null;
 // An empty current base is a valid state. Never fill it from demo/history caches.
 const hasRecords=['products','sales','movements','clients','events','expenses'].some(key=>(data[key]||[]).some(row=>eligible(row,ctx)))||(data.supplierBook?.purchases||[]).some(row=>eligible(row,ctx));
 if(!hasRecords)return {intent:'integrated-read',text:'Ainda não há registros nesta base. Não há histórico suficiente para informar vendas, estoque, entradas ou compras.\nCadastre seus produtos e registre a primeira entrada ou venda para começar. Os dados fictícios e as bases anteriores não são usados para preencher esta consulta.',generatedAt:now,specialists:[{name:'Registros locais',source:'Base atual do produtor; nenhuma recuperação automática de dados anteriores'}],confidence:'Ausência de registros; não representa uma medição do negócio.',insights:[],rebuys:[]};
 if(!['real','demo','simulation'].includes(ctx.dataOrigin))throw Error('Confirme a origem dos registros antes de consultar.');
 if(['products','sales','movements'].reduce((n,k)=>n+(data[k]?.length||0),0)>60000)throw Error('Histórico grande para esta consulta conjunta. Use os relatórios por período.');
 const sections=[],products=(data.products||[]).filter(p=>eligible(p,ctx)),matched=productMatches(data,q),ids=new Set(matched.map(p=>p.id)),p=queryPeriod(q,now,period),allProducts=/\bprodutos?\b|o que vendi|vendi (?:mais|menos)|\bcnpjs?\b/.test(q)&&!matched.length;
 const relevant=id=>allProducts||ids.has(id),name=id=>products.find(p=>p.id===id)?.name||'Produto removido',sources=[];
 if(isEntryQuestion(q)){sections.push(entryAnswer(data,text,{now}));sources.push('Movimentações e cadastro de produtos');}
 if(stock){const rows=matched.length?matched:allProducts?products:[];sections.push(rows.length?'Estoque físico atual · geral do produtor\n'+rows.map(r=>r.name+(r.weight?' · '+r.weight+' g':'')+': '+qty(r.stock)+' '+r.unit).join('\n')+'\nTotal por unidade: '+totalUnits(rows.map(r=>({quantity:r.stock,unit:r.unit}))):'Não identifiquei o produto com segurança. Informe seu nome cadastrado.');sources.push('Saldo físico canônico de produtos; não representa sobra de um evento');}
 if(sold||buyers||ranking){
  const seen=new Set();for(const s of data.sales||[])if(eligible(s,ctx)&&['completed','returned'].includes(s.status)){if(!s.id||seen.has(s.id))throw Error('Vendas duplicadas ou sem identificação; confira a Gestão.');seen.add(s.id);}
  const history=scopeSales(data,scopeId,now),sales=history.filter(s=>within(s.date,p)),returns=history.filter(s=>s.status==='returned'&&within(s.returnedAt||s.date,p));
  for(const s of [...sales,...returns]){if(!Number.isSafeInteger(s.total)||s.total<0||!s.items?.length||s.items.some(i=>!Number.isFinite(i.qty)||i.qty<=0||!i.unit||!Number.isSafeInteger(i.total)||i.total<0))throw Error('Há valores ou quantidades inválidos no histórico de vendas. Confira a Gestão.');}
  const units=new Map();for(const s of [...sales,...returns])for(const i of s.items){if(!units.has(i.productId))units.set(i.productId,new Set());units.get(i.productId).add(i.unit);}
  const costCoverage=rows=>rows.map(s=>({...s,items:s.items.map(i=>({...i,costKnown:i.costKnown!==false&&Number.isSafeInteger(i.costTotal)&&i.costTotal>=0&&(i.costKnown===true||i.costTotal>0)}))}));
  const margins=productMargins(costCoverage(sales),costCoverage(returns)).filter(r=>relevant(r.id));
  if([...units].some(([id,u])=>relevant(id)&&u.size!==1))throw Error('O histórico mistura unidades do mesmo produto. Consulte as apresentações separadamente.');
  if(sold&&!ranking)sections.push('Vendas líquidas · '+p.label+'\n'+(margins.length?margins.map(r=>name(r.id)+': '+qty(r.qty)+' '+[...units.get(r.id)][0]).join('\n')+'\nTotal por unidade: '+totalUnits(margins.map(r=>({quantity:r.qty,unit:[...units.get(r.id)][0]}))):'Nenhuma venda encontrada para o produto e o período.'));
  if(buyers){const bought=sales.filter(s=>s.status==='completed'&&s.items.some(i=>relevant(i.productId))),pj=/cnpj/.test(q),identified=new Set(),unknown=[];
   for(const s of bought){const c=data.clients?.find(c=>c.id===s.customerId&&eligible(c,ctx));if(pj){const type=s.customerType||s.recipientType||c?.type;if(type!=='PJ'&&type!=='CNPJ')continue;const document=String(s.customerDocument||c?.cnpj||c?.document||'').replace(/\D/g,'');if(document.length===14)identified.add(document);else unknown.push(s.id);}else if(c)identified.add(c.id);else unknown.push(s.id);}
   sections.push((pj?'CNPJs distintos documentados':'Clientes cadastrados distintos')+' · '+p.label+': '+identified.size+'.\n'+(unknown.length?unknown.length+' vendas sem identificação suficiente para esta contagem. ':'')+'Compras concluídas; clientes anônimos e vendas totalmente devolvidas não são presumidos.');
  }
  if(ranking){const rows=margins.map(r=>({id:r.id,name:name(r.id),description:r.description||'',quantity:r.qty,revenue:r.revenue,grossProfit:r.costKnown?r.revenue-r.cost:null,unit:[...units.get(r.id)][0]})),criterion=/lucr|lucrativ/.test(q)?'profit':'quantity',groups=criterion==='quantity'?[...new Set(rows.map(r=>r.unit))]:['lucro bruto'];
   sections.push('Produtos · '+p.label+'\n'+(groups.length?groups.map(group=>{const result=rankProductRows(criterion==='quantity'?rows.filter(r=>r.unit===group):rows,criterion),line=r=>r.name+(r.description?' · '+r.description:'')+': '+(criterion==='profit'?money(r.grossProfit)+' de lucro bruto, antes das despesas':qty(r.quantity)+' '+r.unit);return group+'\nMais: '+(result.top.map(line).join('; ')||'sem base')+'\nMenos: '+(result.bottom.map(line).join('; ')||'sem outros produtos para comparar')+(result.excluded?'\nCustos ausentes: '+result.excluded+' produtos fora da classificação de lucro.':'');}).join('\n'):'Não há vendas para classificar.')+'\nClassificação por apresentação; quantidades de unidades diferentes ficam separadas. Produtos sem vendas no período não entram neste ranking de vendas.');
  }
  sources.push('Vendas/devoluções por data; finance.productMargins e product-period-reports.rankProductRows');
 }
 if(supplier){const directory=book(data),suppliers=directory.suppliers.filter(s=>q.includes(normalize(identity(data,s).name)));
  if(suppliers.length!==1)sections.push('Informe o nome completo de um fornecedor cadastrado para consultar suas compras.');
  else{const rows=(directory.purchases||[]).filter(r=>r.supplierId===suppliers[0].id&&!r.voidedAt&&within(r.occurredOn+'T12:00:00-03:00',p));sections.push('Compras de '+identity(data,suppliers[0]).name+' · '+p.label+'\n'+(rows.length?rows.map(r=>{const state=purchaseReceiptState(r);return r.occurredOn+' · '+r.item.name+' · '+r.quantity+' '+r.item.unit+' · '+money(r.total)+' · '+state.status+(state.known?' · Recebido '+qty(state.received)+' · Pendente '+qty(state.pending):'');}).join('\n'):'Nenhuma compra registrada no período.'));}sources.push('supplierBook.purchases; recebimentos vinculados');
 }
 if(/agenda|calendario|eventos?|feiras?/.test(q))sections.push('A parte sobre agenda/eventos exige consultar o calendário ou selecionar a feira. Esta resposta não presume esses registros.');
 return {intent:'integrated-read',text:sections.join('\n\n'),generatedAt:now,specialists:sources.map(source=>({name:'Consulta local validada',source})),confidence:'Somente registros deste produtor e do local selecionado. Informações ausentes permanecem explícitas.',insights:[],rebuys:[]};
}
