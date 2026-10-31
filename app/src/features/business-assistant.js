import {normalizePortuguese as norm} from './portuguese.js';
import {contextOf,eligible,scopeSales,fairFacts} from './agent/core.js';
import {answerProductRanking} from './product-ranking-query.js';
import {productNetItems} from './product-period-reports.js';
import {balance,outstanding,day,validDay} from './receivables/receivables.js';
import {book,identity} from './suppliers/model.js';
import {stages as orderStages} from './local-catalog/model.js';
const qty=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const cash=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
export const READ_AREAS=Object.freeze(['produtos','estoque','financeiro','clientes','eventos','fornecedores','orientacao','clima','esclarecer']);
export function validateReadPlan(value){
 let p;try{p=typeof value==='string'?JSON.parse(value):value;}catch{}
 if(!p||Object.keys(p).length!==1||!READ_AREAS.includes(p.area))throw Error('Não foi possível identificar a consulta. Informe o assunto ou o nome cadastrado.');
 return Object.freeze({area:p.area});
}
const words=s=>' '+norm(s).replace(/[?!.,;:]/g,' ')+' ';
const namedClients=(text,data)=>{
 const q=words(text),all=(data.clients||[]).filter(c=>eligible(c,contextOf(data)));
 const exact=all.filter(c=>norm(c.name)&&q.includes(' '+norm(c.name)+' '));
 return exact.length?exact:all.filter(c=>norm(c.name).split(' ').some(w=>w.length>=3&&q.includes(' '+w+' ')));
};
export function productReferences(question,data,describe=()=> ''){
 const q=words(question),ctx=contextOf(data),ps=(data.products||[]).filter(p=>eligible(p,ctx)&&p.active!==false&&!p.archived);
 const aliases=(data.agent?.actorId===ctx.actorId?data.agent.aliases||[]:[]).filter(a=>a.confirmed&&q.includes(' '+norm(a.alias)+' '));
 let matched=ps.filter(p=>norm(p.name)&&q.includes(' '+norm(p.name)+' ')||aliases.some(a=>a.productId===p.id));
 matched=matched.filter(p=>!matched.some(o=>norm(o.name)!==norm(p.name)&&norm(o.name).includes(norm(p.name))));
 let rows=matched.length?matched:ps.filter(p=>norm(p.name).split(' ').some(w=>w.length>=4&&(q.includes(' '+w+' ')||q.includes(' '+w+'s '))));
 const had=rows.length>0;
 const measures=value=>[...norm(value).matchAll(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|ml|litros?|l)\b/g)].map(m=>(m[2]==='kg'||m[2]==='g'?'g:':'ml:')+Math.round(Number(m[1].replace(',','.'))*(m[2]==='kg'||m[2]==='l'||m[2].startsWith('litro')?1000:1)*1000));
 const requested=measures(question);if(requested.length)rows=rows.filter(p=>requested.every(m=>measures(describe(p)).includes(m)));
 rows.unresolved=had&&!rows.length;return rows;
}
export function requestedBusinessScope(question,data,current='all'){
 const q=norm(question),ctx=contextOf(data);
 if(/todos os locais|negocio inteiro/.test(q))return 'all';
 if(/(?:na|da|pela|minha) loja\b/.test(q))return 'loja';
 const matches=(data.events||[]).filter(e=>eligible(e,ctx)&&norm(e.name).length>3&&q.includes(norm(e.name)));
 if(matches.length>1)throw Error('Há mais de um evento com esse nome. Selecione o evento na Gestão.');
 if(matches.length===1)return matches[0].id;
 if(/(?:nas|das|todas as) feiras\b/.test(q))return 'events';
 if(/(?:na|da|nessa|nesta) feira\b/.test(q)&&['all','loja','events','individual-pf','individual-pj'].includes(current))throw Error('Selecione a feira na Gestão ou informe seu nome cadastrado.');
 return null;
}
export function readBusinessRequest(question,data,describe){
 const q=norm(question);
 if(/^(?:(?:eu )?vendi|(?:quero|vou) vender|vender|adicion(?:e|ar)?|coloc(?:a|ar|ue)|registr(?:e|ar)|anot(?:e|ar)|apagu(?:e|ar)|exclu(?:a|ir)|zer(?:e|ar))\b/.test(q))return null;
 if(/chuva|chover|clima|temperatura|previsao do tempo|tempo.*(?:hoje|amanha)/.test(q))return {area:'clima'};
 if(/receita.*(?:bolo|geleia|doce|pao)/.test(q))return null;
 if(/como.*(?:feira|evento)|\bsobra(?:s|ram|ndo|ou)?\b|\bcarga\b/.test(q))return {area:'eventos'};
 if(/fornece|fornecedor|cotac|orcamento.*compra/.test(q))return {area:'fornecedores'};
 if(/cliente|pedido|entrega|retirada|quem.*(?:deve|compr|gast|fiado)|devedor|quanto.*deve|divida d[oa]/.test(q)||namedClients(question,data).length)return {area:'clientes'};
 if(/estoque|repor|reposic|acab(?:ou|ando)|disponiv|quanto.*tenho/.test(q))return {area:'estoque'};
 const refs=productReferences(question,data,describe);
 if(/produto|itens|mercadoria|(?:vendi|vendeu|vendas|saldo|preco|custo|lucro) de /.test(q)||refs.length||refs.unresolved)return {area:'produtos'};
 if(/fatur|receit|vendas?|vendemos|vendi|lucro|margem|caixa|saldo|receb|fiado|taxa|imposto|despesa|custo|gasto|retirada|finance|dinheiro|ticket/.test(q))return {area:'financeiro'};
 if(/feira|evento|agenda/.test(q))return {area:'eventos'};
 if(/negocio|situacao|resumo|visao geral|orient|melhorar|o que.*(?:fazer|preciso)/.test(q))return {area:'orientacao'};
 return null;
}
export function answerBusinessRecords(data,{plan,text='',sales=[],returns=[],receipts=[],expectedCollections,label='',scopeId='all',now=Date.now(),end=now+1,describe=()=>'',money=cash,expectedRevenue,financialAnswer,orientationAnswer}={}){
 plan=validateReadPlan(plan);const ctx=contextOf(data),q=norm(text);
 if(!['real','demo','simulation'].includes(ctx.dataOrigin))throw Error('Confirme a origem dos registros antes de consultar.');
 const report=answerProductRanking(data,{sales,returns,text:'Quais produtos mais e menos vendidos?',label,now,end,describe,money,expectedRevenue}).report;
 const lines=[label||'Recorte selecionado na Gestão'],header=p=>p.name+(describe(p)?' · '+describe(p):'');
 const result=()=>({text:lines.filter(Boolean).join('\n'),intent:'management',generatedAt:now,specialists:[{name:'Motor interno · '+plan.area,source:'Cadastros e registros locais · demonstrativo, estoque, histórico e conferência'}],confidence:'Valores consultados nos registros locais. Períodos e informações ausentes são identificados.'});
 if(plan.area==='financeiro')lines.push(financialAnswer(text));
 else if(plan.area==='orientacao')lines.push(financialAnswer(text),orientationAnswer?.(text)||'');
 else if(['produtos','estoque'].includes(plan.area)){
  const refs=productReferences(text,data,describe),ids=new Set(refs.map(p=>p.id));
  const unknown=!refs.length&&/(?:quanto.*(?:vendi|vendeu|tenho|custa).*(?: de | do | da )|(?:situacao|saldo|preco|lucro|vendas|custo) d[oa] )/.test(q)&&!/(?:meus? produtos?|minha loja|meu negocio|saldo do estoque|periodo|mes|dia|feira|evento)/.test(q);
  if(refs.unresolved||unknown||(!refs.length&&plan.area==='produtos'&&!/produt|itens|mercadoria/.test(q))){lines.push('Não encontrei essa apresentação com segurança no cadastro. Confira o nome, peso ou volume; não usei os totais de outro produto.');return result();}
  if(/receb|pag[oa]|caixa/.test(q))lines.push('Os recebimentos não são rateados por produto. Valor vendido não equivale a dinheiro recebido.');
  if(/lucro liquido/.test(q))lines.push('Despesas gerais não são rateadas por produto nesta consulta. Mostro lucro bruto, sem afirmar lucro líquido.');
  if(plan.area==='estoque'){
   lines.push('Estoque atual geral do produtor; não representa reserva ou sobra da feira.');
   let ps=(data.products||[]).filter(p=>eligible(p,ctx)&&p.active!==false&&!p.archived&&(!ids.size||ids.has(p.id)));
   if(/repor|reposic|baix|acab(?:ou|ando)|falt|minimo/.test(q))ps=ps.filter(p=>Number.isFinite(p.stock)&&Number.isFinite(p.min)&&p.stock<=p.min);
   for(const p of ps.slice(0,30))lines.push(header(p)+': '+(Number.isFinite(p.stock)?qty(p.stock)+' '+p.unit:'saldo não informado')+'; mínimo '+(Number.isFinite(p.min)?qty(p.min)+' '+p.unit:'não configurado')+'.');
   if(!ps.length)lines.push('Nenhum produto encontrado nesse filtro. Mínimo não configurado não equivale a zero.');
   if(ps.length>30)lines.push('Exibidos 30 de '+ps.length+' produtos. Informe o nome para detalhar.');
  }else{
   let rows=report.rows.filter(r=>!ids.size||ids.has(r.id));if(/sem venda|nao vend|parad|encalh/.test(q))rows=rows.filter(r=>r.noSale);
   for(const r of rows.slice(0,20)){
    const p=data.products.find(p=>p.id===r.id),units=r.units.map(u=>qty(u.qty)+' '+u.unit).join(' + ')||'0 '+(p?.unit||r.unit||'unidade');
    lines.push(r.name+(r.description?' · '+r.description:'')+': quantidade líquida '+units+'; valor vendido '+money(r.revenue)+'; custo histórico '+(r.costKnown?money(r.cost):'incompleto')+'; lucro bruto '+(r.grossProfit===null?'custo histórico incompleto':money(r.grossProfit))+(r.margin===null?'':'; margem bruta '+qty(r.margin*100)+'%')+'.');
    if(p)lines.push('Cadastro atual de '+header(p)+': preço '+(Number.isSafeInteger(p.price)?money(p.price):'não informado')+'; saldo geral '+(Number.isFinite(p.stock)?qty(p.stock)+' '+p.unit:'não informado')+'.');
   }
   if(!rows.length)lines.push('Nenhum produto com esse filtro no recorte.');
   if(rows.length>20)lines.push('Exibidos 20 de '+rows.length+' produtos. Informe o nome para detalhar.');
   lines.push('Descontos, devoluções e custos são históricos; preço e estoque atuais são identificados separadamente. Lucro bruto é antes de taxas e despesas.');
   if(/por que|porque|motivo|causa/.test(q))lines.push('Os registros mostram resultados, mas não comprovam suas causas. Confira exposição, disponibilidade e procura.');
  }
 }else if(plan.area==='clientes'){
  const clients=(data.clients||[]).filter(c=>eligible(c,ctx)),named=namedClients(text,data),selected=new Set(named.map(c=>c.id)),all=scopeSales(data,scopeId,now);
  if(named.length>1)throw Error('Encontrei mais de um cliente com esse nome: '+named.map(c=>c.name).slice(0,5).join(', ')+'. Confira o nome completo ou o cadastro.');
  if(!named.length&&/quanto.*deve|divida d[oa]|fiado d[oa]/.test(q))throw Error('Não encontrei esse cliente. Informe seu nome cadastrado.');
  const refs=productReferences(text,data,describe),ids=new Set(refs.map(p=>p.id));if(refs.unresolved)throw Error('Confirme a apresentação do produto antes de consultar os clientes.');
  if(/pedido|entrega|retirada|preparo|em rota/.test(q)){
   if(!named.length)throw Error('Informe o nome do cliente para conferir seus pedidos.');
   const orders=(data.localCommerce?.actors?.[ctx.actorId]?.orders||[]).filter(o=>selected.has(o.clientId));lines.push('Pedidos registrados; pedido não equivale a venda nem a pagamento.');
   for(const o of orders.slice(0,20))lines.push(named[0].name+' · pedido '+String(o.id).slice(0,8)+': '+(orderStages[o.status]||'estado não reconhecido')+'.');
   if(!orders.length)lines.push('Nenhum pedido registrado para esse cliente.');
  }else if(/ultima|historico|o que.*compr|acoes|atividade|comprou/.test(q)&&named.length){
   const last=/ultima/.test(q),rows=(last?all:sales).filter(s=>selected.has(s.customerId)&&s.status==='completed').sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
   lines.push(last?'Última compra concluída no histórico deste local, considerando todas as datas:':'Compras concluídas no período selecionado:');
   for(const s of rows.slice(0,last?1:10)){
    if(!Number.isSafeInteger(s.total)||s.total<0||s.items?.some(i=>!Number.isFinite(i.qty)||i.qty<=0||!Number.isSafeInteger(i.total)))throw Error('Confira os itens do histórico do cliente.');
    lines.push(named[0].name+' · '+new Date(s.date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' · total da venda '+money(s.total)+'.');
    for(const i of productNetItems(s)){const p=data.products.find(p=>p.id===i.productId);lines.push((i.name||p?.name||'Produto sem cadastro')+(i.description?' · '+i.description:p?' · '+describe(p):'')+': '+qty(i.qty)+' '+i.unit+'; valor vendido '+money(i.amount)+'.');}
   }
   if(!rows.length)lines.push('Não há compra concluída nesse recorte para esse cliente.');
   if(!last&&rows.length>10)lines.push('Exibidas as 10 compras mais recentes de '+rows.length+'.');
   lines.push('Compra não comprova pagamento; consulte o fiado e os recebimentos separadamente.');
  }else if(/quantos.*clientes|total de clientes|clientes.*cadastrad/.test(q))lines.push('Cadastro atual: '+clients.length+' cliente(s). Não equivale a clientes que compraram no período.');
  else if(/pagou|pagaram|recebi|recebido|recebimentos/.test(q)){
   const seen=new Set();for(const r of receipts){const key=r.saleId+'|'+r.id;if(!r.id||seen.has(key)||!all.some(s=>s.id===r.saleId)||!Number.isSafeInteger(r.amount)||r.amount<0)throw Error('Confira os recebimentos antes de consultar.');seen.add(key);}
   if(expectedCollections!=null&&receipts.reduce((n,r)=>n+r.amount,0)!==expectedCollections)throw Error('Os recebimentos não fecharam com o demonstrativo.');
   if(ids.size)lines.push('Recebimentos não são rateados por produto. Informe somente o cliente para consultar o fiado recebido.');
   else{const rows=receipts.filter(r=>!selected.size||selected.has(r.customerId));lines.push('Recebimentos de fiado registrados no período: '+money(rows.reduce((n,r)=>n+r.amount,0))+'.');for(const r of rows.slice(0,30))lines.push((clients.find(c=>c.id===r.customerId)?.name||'Cliente sem cadastro vinculado')+': '+money(r.amount)+'.');lines.push('Compras pagas no ato e estornos são tratados separadamente no Caixa. Esses registros não comprovam liquidação bancária.');}
  }else if(/dev|fiado|receb|pend|atras|venc/.test(q)){
   const debts=outstanding(all).filter(s=>(!selected.size||selected.has(s.customerId))&&(!ids.size||s.items.some(i=>ids.has(i.productId))));
   if(debts.some(s=>!Number.isSafeInteger(balance(s))))throw Error('Confira os recebimentos do fiado.');
   lines.push('Fiado em aberto agora: todas as datas do local selecionado.','A receber: '+money(debts.reduce((n,s)=>n+balance(s),0))+'.');
   if(ids.size)lines.push('Saldo integral das vendas que contêm o produto; pagamento parcial não é rateado entre itens.');
   for(const s of debts.slice(0,30))lines.push((clients.find(c=>c.id===s.customerId)?.name||s.customerName||'Cliente sem cadastro vinculado')+': '+money(balance(s))+'; vencimento '+(validDay(s.credit?.dueDate)?s.credit.dueDate+(s.credit.dueDate<day(now)?' · vencido':''):'não informado')+'.');
   if(!debts.length)lines.push('Sem fiado em aberto nesses registros.');if(debts.length>30)lines.push('Exibidas 30 de '+debts.length+' vendas com saldo.');
  }else{
   const groups=new Map();for(const [rs,sign] of [[sales,1],[returns,-1]])for(const s of rs){const id=s.customerId||'';if(selected.size&&!selected.has(id)||ids.size&&!s.items.some(i=>ids.has(i.productId)))continue;const a=groups.get(id)||{name:clients.find(c=>c.id===id)?.name||'Vendas sem cliente identificado',value:0};a.value+=sign*(ids.size?productNetItems(s).filter(i=>ids.has(i.productId)).reduce((n,i)=>n+i.amount,0):s.total);groups.set(id,a);}
   lines.push('Valor vendido por cliente no período, após devoluções. Não significa dinheiro recebido.');const rows=[...groups.values()].sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name));for(const c of rows.slice(0,20))lines.push(c.name+': '+money(c.value)+'.');if(!rows.length)lines.push('Sem vendas vinculadas a esse filtro no período.');if(rows.length>20)lines.push('Exibidos 20 de '+rows.length+' grupos.');
  }
 }else if(plan.area==='eventos'){
  let rows=(data.events||[]).filter(e=>eligible(e,ctx));if(!['all','events','loja','individual-pf','individual-pj'].includes(scopeId))rows=rows.filter(e=>e.id===scopeId);
  const start=e=>e.start||e.date||e.startDate;
  if(/proxim|futur|amanha/.test(q))rows=rows.filter(e=>validDay(start(e))&&start(e)>=day(now)).sort((a,b)=>String(start(a)).localeCompare(String(start(b))));
  lines.push('Agenda cadastrada; não confirma presença, realização nem pagamento.');for(const e of rows.slice(0,20))lines.push((e.name||'Evento')+': '+(start(e)||'data não informada')+'.');
  if(/como|sobr|carga|resultado/.test(q)){lines.push('Conferência operacional da feira inteira; não representa apenas os dias do recorte financeiro.');for(const e of rows.slice(0,6)){const f=fairFacts(data,e.id,now);lines.push(e.name+': '+(f.rows.length?f.rows.map(r=>r.name+': levou '+qty(r.taken)+', vendeu '+qty(r.sold)+', sobra conferida '+qty(r.real)+' '+r.unit+'.').join(' '):f.reason));}}
  if(!rows.length)lines.push('Nenhum evento cadastrado nesse contexto.');if(rows.length>20)lines.push('Exibidos 20 de '+rows.length+' eventos.');
 }else if(plan.area==='fornecedores'){
  const refs=productReferences(text,data,describe);if(refs.unresolved)throw Error('Confirme a apresentação antes de consultar fornecedores.');const ids=new Set(refs.map(p=>p.id)),rows=book(data).suppliers.filter(s=>!s.archived&&(!ids.size||s.productIds?.some(id=>ids.has(id))));
  lines.push('Fornecedores cadastrados e vínculos; cadastro não confirma disponibilidade ou preço atual.');for(const s of rows.slice(0,20))lines.push(identity(data,s).name+(s.category?' · '+s.category:'')+': '+(s.productIds||[]).map(id=>data.products.find(p=>p.id===id)).filter(Boolean).map(header).join(', ')+'.');
  if(!rows.length)lines.push('Nenhum fornecedor vinculado a esse filtro.');if(rows.length>20)lines.push('Exibidos 20 de '+rows.length+' fornecedores.');
  if(/barat|melhor|compensa|custo|preco|compar/.test(q))lines.push('Compare em Fornecedores uma cotação com quantidade, apresentação, frete, descontos e validade confirmados. Não infiro esses valores do cadastro.');
 }else lines.push('Não tenho registro suficiente para responder essa pergunta com segurança. Informe o assunto, produto ou cliente cadastrado. Informações externas ao app não são confirmadas por este Gerente.');
 return result();
}
