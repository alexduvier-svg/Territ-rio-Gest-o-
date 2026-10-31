import { normalizePortuguese as norm } from '../portuguese.js';
import { productRankingRequest } from '../business-query.js';
// Deterministic offline tools. No network, executable document instructions or business writes.
import { interpretSpeech, cleanSpeech } from '../voice/interpret.js';
import { productNetItems } from '../product-period-reports.js';
import { INTELLIGENCE_HIERARCHY } from '../../data/intelligence-hierarchy.js';
import { AGENT_GUIDELINES } from '../../data/agent-guidelines.js';
export const AGENT_VERSION=2;
const DAY=86400000;
const date=s=>Date.parse(s), day=t=>new Date(t).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
const qty=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n),money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const milli=n=>Math.round(n*1000), median=values=>{const a=[...values].sort((a,b)=>a-b),m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
export function contextOf(data){const type=data.dataContext?.type||(data.settings?.onboarding==='clean'?'real':data.settings?.onboarding==='demo'?'demo':'unconfirmed');return {actorId:String(data.dataContext?.id||data.productMemory?.scopeId||'local-'+type),dataOrigin:type};}
export function revisionOf(data){let h=2166136261;const value=JSON.stringify([contextOf(data),data.products,data.sales,data.movements,data.clients,data.events,data.eventLoads,data.expenses,data.contacts,data.municipalCalendar?.dates,data.settings?.fairReports]);for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return (h>>>0).toString(16);}
export function emptyAgent(data){const ctx=contextOf(data);return {version:1,...ctx,proposals:[],audit:[],feedback:{},aliases:[],settings:{rebuy:true,excludedProducts:[],fairMinimumEvents:3,fairSurplusRatio:0.5,stagnantDays:AGENT_GUIDELINES.parameters.stagnantDays},knowledge:{...AGENT_GUIDELINES,sources:['Agro_Gestao_Agente_Inteligente_Instrucoes_Codex.md v1.1','VOZ-REVISAO-0.12.15.md','interface-guidelines v4'],authority:'reference_only'},lastReviewAt:0};}
export function ensureAgent(data,now=Date.now()){
 const ctx=contextOf(data);if(!data.agent||data.agent.actorId!==ctx.actorId||data.agent.dataOrigin!==ctx.dataOrigin)data.agent=emptyAgent(data);
 const agent=data.agent;if(agent.hierarchy?.version!==INTELLIGENCE_HIERARCHY.version)agent.hierarchy=JSON.parse(JSON.stringify(INTELLIGENCE_HIERARCHY));agent.proposals=Array.isArray(agent.proposals)?agent.proposals.slice(-50):[];agent.audit=Array.isArray(agent.audit)?agent.audit.slice(-200):[];agent.feedback=agent.feedback||{};agent.settings={...emptyAgent(data).settings,...agent.settings};agent.aliases=Array.isArray(agent.aliases)?agent.aliases:[];
 for(const p of agent.proposals)if(!['EXECUTED','CANCELLED','EXPIRED','FAILED'].includes(p.status)&&p.expiresAt<=now)p.status='EXPIRED';
 return agent;
}
export function audit(agent,requestId,event,details={},now=Date.now()){
 // Only IDs/state/tool metadata. Never transcript, full phone, name or raw audio.
 const safe={};for(const key of ['proposalId','receiptId','scopeId','intent','status','reason','dataRevision','queryContractVersion'])if(details[key]!=null)safe[key]=String(details[key]).slice(0,120);
 if(details.period&&Number.isFinite(details.period.start)&&Number.isFinite(details.period.end))safe.period={start:details.period.start,end:details.period.end};
 agent.audit.push({requestId:String(requestId).slice(0,120),event,at:now,engineVersion:AGENT_VERSION,ruleId:'agent.'+event,result:'recorded',...safe});agent.audit=agent.audit.slice(-200);
}
export function scopeMatches(record,scope='all'){if(scope==='all')return true;if(scope==='events')return record.scope&&record.scope!=='loja';if(scope==='individual-pf'||scope==='individual-pj')return(record.scope||'loja')==='loja'&&(record.customerType||record.recipientType||'PF')===(scope==='individual-pj'?'PJ':'PF');return (record.scope||'loja')===scope;}
export function eligible(record,ctx){return !!record&&(!record.actorId||record.actorId===ctx.actorId)&&(!record.dataContext?.id||record.dataContext.id===ctx.actorId)&&(!record.dataContext?.type||record.dataContext.type===ctx.dataOrigin)&&(ctx.dataOrigin!=='real'||(!record.demo&&!record.simulation&&!record.simulated&&!/^(demo-|exemplo-)/.test(record.id||'')));}
export function scopeSales(data,scope,now=Date.now()){const ctx=contextOf(data),seen=new Set();return(data.sales||[]).filter(s=>s.id&&eligible(s,ctx)&&scopeMatches(s,scope)&&['completed','returned'].includes(s.status)&&Number.isFinite(date(s.date))&&date(s.date)<=now&&!seen.has(s.id)&&seen.add(s.id));}
function activeProducts(data){const c=contextOf(data);return(data.products||[]).filter(p=>eligible(p,c)&&p.active!==false&&!p.archived);}
export function productIndex(data){const rows=activeProducts(data).map(p=>({id:p.id,name:p.name,type:p.type||'',format:p.format||'',unit:p.unit,weight:p.weight||0,volume:p.volume||0})),fingerprint=JSON.stringify(rows);let hash=0;for(let i=0;i<fingerprint.length;i++)hash=Math.imul(hash^fingerprint.charCodeAt(i),31);return {version:1,actorId:contextOf(data).actorId,hash:(hash>>>0).toString(16),rows};}
export function parseRequest(text,data,{scopeId='all',source='text',requestId='',now=Date.now()}={}){
 const cleaned=cleanSpeech(text),key=norm(cleaned);let intent='unsupported';
 if(productRankingRequest(cleaned))intent='management';
 else if(/^(?:quero (?:saber|entender)|vendi (?:mais|menos))|(?:quanto.*(?:receb|entrou)|quanto.*(?:para|pra) receber)/.test(key))intent='management';
 else if(!/^(?:(?:eu )?vendi|vende|vender|adicion|quero|coloc|\d|um\b|uma\b|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte|meio)/.test(key)&&/chuva|chover|clima|tempo.*(?:hoje|amanha)|receita culinaria|receitas?|artesan|parceria|embalagem|fatur|receita|lucro|margem|produto.*(?:caro|barato|vendeu)|qual.*(?:deixou|vendeu)|banana madura/.test(key))intent='management';
 else if(/estoque|quanto.*tenho|quantos.*tenho|repor|acabou|sem moviment/.test(key))intent='stock';
 else if(/como.*feira|resultado.*feira|sobr|como.*evento|anal.*feira/.test(key))intent='fair';
 else if(/recompra|clientes?.*(avis|compr|volt)|quem.*avis/.test(key))intent='rebuy';
 else if(/^(?:quero (?:saber|entender)|vendi (?:mais|menos))|(?:quanto.*(?:receb|entrou)|quanto.*(?:para|pra) receber)/.test(key))intent='management';
 else if(!/^(?:(?:eu )?vendi|vende|vender|adicion|quero|coloc|\d|um\b|uma\b|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte|meio)/.test(key)&&/\b(kpis?|indicador(?:es)?|conversao|estatistica|pdv|banca|crm|ticket|desconto|giro)\b|exposi|fidel|como.*marca|produto.*contrib/.test(key))intent='management';
 else if(/lucro|margem|resultado|financ|quanto.*vend|resumo/.test(key))intent='finance';
 else if(/gerente|visao geral|como esta (?:meu|o) negocio|o que.*(?:fazer|preciso)|situacao (?:do|da|minha)|analise geral|\bvalores\b|\bdados (?:do|no|que estao no) (?:app|aplicativo|negocio)\b|quanto (?:ganhei|ganhamos)/.test(key)&&!/^(?:(?:eu )?vendi|vender|adicion|coloc|apague|exclua|zere)/.test(key))intent='overview';
 else if(/^(?:(?:eu )?vendi|vende|vender|adicion|quero|coloc|\d|um\b|uma\b|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte|meio)/.test(key))intent='sale';
 const request={requestId,actorId:contextOf(data).actorId,scopeId,source,text:cleaned,createdAt:now};
 if(intent!=='sale')return {...request,intent,items:[],unresolvedFields:[],parserVersion:1};
 const aliases=data.agent?.actorId===request.actorId?data.agent.aliases||[]:[];let input=cleaned;
 for(const a of aliases)if(a.confirmed===true&&a.alias&&a.productId){const product=data.products.find(p=>p.id===a.productId);if(product)input=input.replace(new RegExp('(?<![\\p{L}])'+a.alias.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\p{L}])','giu'),()=>product.name);}
 // Split only a connector followed by a new quantity; never split "um quilo e meio".
 const products=activeProducts(data),parts=[];let offset=0;
 for(const match of input.matchAll(/(?:,\s+|\s+e\s+)(?=(?:\d+(?:[.,]\d+)?|um|uma|dois|duas|três|tres|quatro|cinco|seis|sete|oito|nove|dez|vinte)\b)/giu)){const prefix=input.slice(offset,match.index),probe=interpretSpeech(prefix,products);if(probe.quantity!==null||probe.candidates.length){parts.push(prefix);offset=match.index+match[0].length;}}
 parts.push(input.slice(offset));if(parts.length>10)return {...request,intent:'unsupported',items:[],unresolvedFields:['limit:10'],parserVersion:1};
 const items=parts.map(part=>{const r=interpretSpeech(part,products);return {productId:r.productId,quantity:r.quantity,unit:r.candidates.find(p=>p.id===r.productId)?.unit||null,candidates:r.candidates.map(p=>({productId:p.id,name:p.name,unit:p.unit,weight:p.weight||0,format:p.format||'',price:p.price,stock:p.stock})),message:r.message,ready:r.status==='ready'};});
 return {...request,intent,items,unresolvedFields:items.flatMap((i,n)=>[...(!i.productId?[`items.${n}.productId`]:[]),...(!Number.isFinite(i.quantity)||i.quantity<=0?[`items.${n}.quantity`]:[])]),parserVersion:1};
}
export function proposeSale(data,interpretation,{proposalId,now=Date.now()}={}){
 const ctx=contextOf(data),agent=ensureAgent(data,now);if(interpretation.actorId!==ctx.actorId)throw Error('O produtor mudou. Abra a consulta novamente.');
 const old=agent.proposals.find(p=>p.requestId===interpretation.requestId);if(old)return old;
 const p={engineVersion:AGENT_VERSION,idempotencyKey:proposalId,origin:interpretation.source==='text'?'producer_text':'producer_review',rules:['identity','scope','quantity','stock','price','producer_confirmation'],requiresConfirmation:true,proposalId,requestId:interpretation.requestId,actorId:ctx.actorId,dataOrigin:ctx.dataOrigin,scopeId:interpretation.scopeId,type:'sale',payload:{items:interpretation.items},dataRevision:revisionOf(data),expiresAt:now+15*60000,status:interpretation.items.length&&interpretation.items.every(i=>i.ready)?'READY':'NEEDS_CLARIFICATION',createdAt:now};
 agent.proposals.push(p);agent.proposals=agent.proposals.slice(-50);audit(agent,p.requestId,'proposed',{proposalId,status:p.status,scopeId:p.scopeId,intent:'sale'},now);return p;
}
export function validateProposal(data,p,{scopeId,now=Date.now()}={}){
 if(!p||p.actorId!==contextOf(data).actorId||p.dataOrigin!==contextOf(data).dataOrigin||p.scopeId!==scopeId)throw Error('O produtor ou local mudou. Prepare novamente.');
 if(p.expiresAt<=now||['CANCELLED','EXPIRED','FAILED','EXECUTED'].includes(p.status))throw Error('Esta proposta não está disponível. Prepare novamente.');
 if(p.dataRevision!==revisionOf(data))throw Error('Preço, estoque ou registros mudaram. Confira uma nova prévia.');
 if(!p.payload?.items?.length)throw Error('Adicione um produto à prévia.');
 const aggregate=new Map();for(const i of p.payload.items){const product=data.products.find(v=>v.id===i.productId);if(!product||product.active===false||product.archived||!eligible(product,contextOf(data))||typeof product.unit!=='string'||!product.unit.trim()||!Number.isFinite(product.stock)||!Number.isSafeInteger(product.price)||product.price<=0||!Number.isFinite(i.quantity)||i.quantity<=0||Math.abs(i.quantity-milli(i.quantity)/1000)>1e-9||!['kg','g','Litro','ml'].includes(product.unit)&&!Number.isInteger(i.quantity))throw Error('Confira o produto, unidade, preço e quantidade.');aggregate.set(product.id,(aggregate.get(product.id)||0)+milli(i.quantity));}
 for(const [id,q] of aggregate)if(q>milli(data.products.find(v=>v.id===id).stock))throw Error('Estoque insuficiente. Confira a quantidade.');
 return [...aggregate].map(([productId,q])=>({productId,quantity:q/1000}));
}
function insight(data,ctx,ruleId,entity,observation,nextAction,extra={}){
 const period=extra.period||ctx.period||{start:ctx.now-30*DAY,end:ctx.now};const id=[contextOf(data).actorId,ctx.scopeId,ruleId,entity,day(period.start),day(period.end)].join('|');
 return {id,ruleId,ruleVersion:1,scope:ctx.scopeId,entityRefs:[entity],severity:'attention',observation,nextAction,period,sampleSize:0,generatedAt:ctx.now,expiresAt:ctx.now+DAY,status:'active',dataOrigin:contextOf(data).dataOrigin,evidenceRefs:[],...extra};
}
export function fairFacts(data,eventId,now=Date.now()){
 const ctx=contextOf(data),event=(data.events||[]).find(e=>e.id===eventId&&eligible(e,ctx)),load=(data.eventLoads||[]).find(e=>e.eventId===eventId&&eligible(e,ctx));
 if(!event)return {eventId,rows:[],reason:'Evento não disponível neste produtor.'};
 const at=date(event.surplusCheckAt),counts=data.settings?.fairReports?.[eventId]?.counts,check=event.surplusCheck;
 if(!load?.items?.length)return {eventId,name:event.name,rows:[],reason:'Sem carga registrada. O saldo geral não informa a sobra da feira.'};
 if(!check?.conferido||!Number.isFinite(at)||!counts)return {eventId,name:event.name,rows:[],reason:'Carga registrada, mas sobra real ainda não conferida por apresentação.'};
 const sales=scopeSales(data,eventId,now),moves=(data.movements||[]).filter(m=>m.eventId===eventId&&eligible(m,ctx));
 if(sales.some(s=>Math.max(date(s.registeredAt||s.date),date(s.returnedAt)||0)>at)||moves.some(m=>date(m.date)>at))return {eventId,name:event.name,rows:[],reason:'Há registros posteriores à conferência. Reconcilie novamente a sobra antes de comparar.'};
 const sold=new Map(),loss=new Map();for(const s of sales.filter(s=>s.status==='completed'))for(const i of s.items||[])sold.set(i.productId,(sold.get(i.productId)||0)+milli(i.qty));for(const m of moves.filter(m=>m.kind==='loss'))loss.set(m.productId,(loss.get(m.productId)||0)+milli(m.qty));
 const rows=[];for(const i of load.items){const taken=milli(i.qty),qSold=sold.get(i.productId)||0,qLoss=loss.get(i.productId)||0,left=counts[i.productId];
  // Zero is accepted only for a fully sold/lost item under an explicit completed check.
  const real=Number.isFinite(left)?milli(left):taken===qSold+qLoss?0:null;
  if(!taken||real===null||real+qSold+qLoss!==taken)continue;
  rows.push({productId:i.productId,name:i.name||data.products.find(p=>p.id===i.productId)?.name||'Produto',unit:i.unit,taken:taken/1000,sold:qSold/1000,loss:qLoss/1000,real:real/1000,ratio:real/taken,checkedAt:at});
 }
 return {eventId,name:event.name,rows,reason:rows.length?'':'Faltam quantidades reconciliadas por apresentação.',comparableGroup:event.agentComparableGroup||event.fairId||'',duration:event.from&&event.until?(date(event.end+'T'+event.until+':00-03:00')-date(event.start+'T'+event.from+':00-03:00'))/3600000:null};
}
export function rebuyFacts(data,scopeId='all',now=Date.now()){
 if(data.agent?.settings?.rebuy===false)return [];
 const ctx=contextOf(data),products=new Map(activeProducts(data).map(p=>[p.id,p])),clients=new Map((data.clients||[]).filter(c=>eligible(c,ctx)&&c.noticeConsent===true).map(c=>[c.id,c])),groups=new Map();
 for(const s of scopeSales(data,scopeId,now).filter(s=>s.status==='completed'&&clients.has(s.customerId)))for(const i of s.items||[]){const p=products.get(i.productId);if(!p||p.stock<=0||data.agent?.settings?.excludedProducts?.includes(p.id))continue;const key=s.customerId+'|'+p.id;if(!groups.has(key))groups.set(key,{clientId:s.customerId,productId:p.id,name:p.name,days:new Set(),saleIds:new Set()});groups.get(key).days.add(day(date(s.date)));groups.get(key).saleIds.add(s.id);}
 const out=[];for(const g of groups.values()){const days=[...g.days].sort(),intervals=days.slice(1).map((d,i)=>(date(d+'T12:00:00Z')-date(days[i]+'T12:00:00Z'))/DAY).filter(n=>n>0);if(days.length<AGENT_GUIDELINES.parameters.minimumBuyingDays||intervals.length<3)continue;const cadence=median(intervals),elapsed=(date(day(now)+'T12:00:00Z')-date(days.at(-1)+'T12:00:00Z'))/DAY;if(elapsed<AGENT_GUIDELINES.parameters.rebuyElapsedMultiplier*cadence)continue;out.push({...g,days,intervalDays:cadence,elapsedDays:elapsed,sampleSize:days.length,saleIds:[...g.saleIds],dueAt:date(days.at(-1)+'T12:00:00Z')+AGENT_GUIDELINES.parameters.rebuyElapsedMultiplier*cadence*DAY});}return out.sort((a,b)=>b.elapsedDays/b.intervalDays-a.elapsedDays/a.intervalDays);
}
export function analyze(data,{scopeId='all',period,now=Date.now()}={}){
 const context=contextOf(data),ctx={scopeId,period,now},sales=scopeSales(data,scopeId,now),valid=sales.filter(s=>s.status==='completed'),insights=[],products=activeProducts(data),sold=new Map();
 const end=Math.min(period?.end||now,now),days=data.agent?.settings?.stagnantDays||30,start=period?.start||now-days*DAY,stagnantStart=Math.max(start,end-days*DAY),periodSales=valid.filter(s=>date(s.date)>=stagnantStart&&date(s.date)<=end);
 for(const s of periodSales)for(const i of s.items||[])sold.set(i.productId,(sold.get(i.productId)||0)+i.qty);
 // Global balances must not masquerade as event balances.
 const eventScope=!['all','loja','events'].includes(scopeId),eventIds=new Set((data.eventLoads||[]).filter(l=>scopeId==='events'||l.eventId===scopeId).flatMap(l=>l.items.map(i=>i.productId)));
 for(const p of products.filter(p=>!eventScope&&scopeId!=='events'||eventIds.has(p.id))){
  if(Number.isFinite(p.stock)&&Number.isFinite(p.min)&&p.min>=0&&p.stock<=p.min)insights.push(insight(data,ctx,'stock-low',p.id,`${p.name}: ${qty(p.stock)} ${p.unit} no saldo geral; mínimo configurado ${qty(p.min)}.`,p.stock===0?'Confira disponibilidade antes de oferecer. Saldo zero não mede demanda perdida.':'Confira o histórico antes de repor.',{severity:p.stock===0?'urgent':'attention',evidenceRefs:[{type:'product',id:p.id}],sampleSize:1}));
  const observedSince=Math.max(stagnantStart,date(p.createdAt)||stagnantStart);if(observedSince<=end&&!sold.has(p.id))insights.push(insight(data,ctx,'no-sale',p.id,`${p.name}: nenhuma venda concluída registrada neste recorte observado (até ${days} dias).`, 'Confira cadastro, disponibilidade e exposição; teste uma mudança por vez.',{severity:'info',period:{start:observedSince,end},evidenceRefs:[{type:'product',id:p.id}],hypothesis:'Os registros não comprovam falta de procura nem histórico completo. Pode ter faltado exposição, disponibilidade ou registro.',sampleSize:periodSales.length}));
 }
 const fairs=(data.events||[]).filter(e=>eligible(e,context)&&(eventScope?e.id===scopeId:(scopeId==='all'||scopeId==='events')&&date(e.end+'T23:59:59-03:00')>=start&&date(e.start+'T00:00:00-03:00')<=end)).map(e=>fairFacts(data,e.id,now));
 for(const f of fairs)for(const r of f.rows.filter(r=>r.real>0))insights.push(insight(data,ctx,'fair-left',f.eventId+'~'+r.productId,`${f.name}: levou ${qty(r.taken)} ${r.unit}, vendeu ${qty(r.sold)}, conferiu ${qty(r.real)} de sobra (${qty(r.ratio*100)}%).`, 'Teste uma carga menor em evento comparável e acompanhe sobra e falta; não alteramos sua carga.',{severity:r.ratio>=.5?'attention':'info',hypothesis:'A quantidade levada pode ter superado a procura neste evento; uma feira não prova tendência.',evidenceRefs:[{type:'event',id:f.eventId},{type:'product',id:r.productId}],sampleSize:1,metrics:r}));
 const minimumFairs=Math.max(3,data.agent?.settings?.fairMinimumEvents||AGENT_GUIDELINES.parameters.minimumComparableFairs),surplusRatio=Math.min(1,Math.max(.1,data.agent?.settings?.fairSurplusRatio||AGENT_GUIDELINES.parameters.surplusRatio));const repeated=new Map();for(const f of fairs.filter(f=>f.comparableGroup&&f.duration>0))for(const r of f.rows.filter(r=>r.ratio>=surplusRatio)){const k=f.comparableGroup+'|'+r.productId;if(!repeated.has(k))repeated.set(k,[]);repeated.get(k).push({f,r});}
 for(const [k,rows] of repeated){const base=rows[0].f.duration,similar=rows.filter(x=>x.f.duration/base>=.8&&x.f.duration/base<=1.25);if(similar.length>=minimumFairs)insights.push(insight(data,ctx,'fair-repeat',k,`${similar[0].r.name}: sobra conferida de pelo menos ${qty(surplusRatio*100)}% em ${similar.length} feiras do mesmo grupo e duração semelhante.`, 'Planeje um teste de carga menor e meça sobra e falta, sem mudança automática.',{hypothesis:'A carga pode estar acima do giro observado. Outras diferenças de contexto ainda precisam ser verificadas.',sampleSize:similar.length,evidenceRefs:similar.map(x=>({type:'event',id:x.f.eventId}))}));}
 const rebuys=rebuyFacts(data,scopeId,now);for(const r of rebuys)insights.push(insight(data,ctx,'rebuy',r.clientId+'~'+r.productId,`${r.name}: ${r.sampleSize} dias de compra identificados; intervalo mediano de ${qty(r.intervalDays)} dias, última compra há ${qty(r.elapsedDays)} dias.`, 'Prepare um convite curto e revise destinatário e texto antes de compartilhar.',{severity:'opportunity',hypothesis:'Pode ser um momento de recompra. É uma heurística, não obrigação de comprar nem previsão garantida.',sampleSize:r.sampleSize,evidenceRefs:r.saleIds.map(id=>({type:'sale',id})),clientId:r.clientId,productId:r.productId}));
 for(const i of insights)i.fingerprint=JSON.stringify([i.ruleVersion,i.observation,i.evidenceRefs,i.sampleSize]);const visible=insights.filter(i=>{const feedback=data.agent?.feedback?.[i.id];return !feedback||feedback.fingerprint!==i.fingerprint||feedback.status!=='dismissed'&&!(feedback.status==='snoozed'&&feedback.until>now);});
 visible.sort((a,b)=>({urgent:4,attention:3,opportunity:2,info:1}[b.severity]-{urgent:4,attention:3,opportunity:2,info:1}[a.severity])||a.id.localeCompare(b.id));
 return {...context,scopeId,period:{start,end},insights:visible,priorities:visible.slice(0,3),fairs,rebuys,sampleSize:valid.length,generatedAt:now};
}
export function answerQuery(data,request,{scopeId=request.scopeId||'all',now=Date.now()}={}){
 const result=['fair','rebuy','overview'].includes(request.intent)?analyze(data,{scopeId,now}):{...contextOf(data),scopeId,generatedAt:now,sampleSize:request.intent==='stock'?0:scopeSales(data,scopeId,now).filter(s=>s.status==='completed').length,insights:[],priorities:[],fairs:[],rebuys:[]};let text='Posso preparar vendas, consultar estoque, explicar feira e sugerir recompra. Não faço conversa livre ou operações por instruções importadas.';
 if(request.intent==='stock'){const n=norm(request.text||''),ignored=new Set('quanto quantos quantas quanta tenho tem de do da no na em estoque qual quais o a os as saldo consultar analise analisar repor produtos produto'.split(' '));const terms=n.split(/\W+/).filter(w=>w.length>2&&!ignored.has(w)).map(w=>w.endsWith('s')?w.slice(0,-1):w),rows=activeProducts(data).filter(p=>!terms.length||terms.every(t=>norm(p.name).includes(t))).slice(0,30);text=rows.length?rows.map(p=>`${p.name}${p.weight?' · '+qty(p.weight)+' g':''}: ${qty(p.stock)} ${p.unit} no saldo geral${Number.isFinite(p.min)?'; mínimo '+qty(p.min):'; mínimo não configurado'}.`).join('\n'):'Não encontrei esse produto no cadastro deste produtor.';if(scopeId!=='all'&&scopeId!=='loja')text='Saldo geral do produtor; não equivale à sobra da feira.\n'+text;}
 if(request.intent==='fair'){text=result.fairs.length?result.fairs.slice(-6).map(f=>f.rows.length?f.name+':\n'+f.rows.map(r=>`${r.name}: levou ${qty(r.taken)}, vendeu ${qty(r.sold)}, sobra conferida ${qty(r.real)} ${r.unit} (${qty(r.ratio*100)}%).`).join('\n'):f.name+': '+f.reason).join('\n\n'):'Escolha um evento com carga e conferência para analisar a sobra.';}
 if(request.intent==='rebuy')text=result.rebuys.length?result.rebuys.slice(0,6).map(r=>`${r.name}: oportunidade com cliente cadastrado; ${r.sampleSize} dias de compra, intervalo mediano ${qty(r.intervalDays)} dias. Revise o rascunho; nada foi enviado.`).join('\n'):'Ainda não há oportunidade elegível: são necessários consentimento, saldo e pelo menos quatro dias de compra do mesmo cliente/produto. Você pode desativar as sugestões.';
 if(request.intent==='finance'){const sales=scopeSales(data,scopeId,now).filter(s=>s.status==='completed'),items=sales.flatMap(productNetItems),revenue=sales.reduce((n,s)=>n+s.total,0),known=items.every(i=>i.historicalCost!==null);text=sales.length?`${sales.length} vendas concluídas neste local (histórico disponível), ${money(revenue)} em vendas. ${known?'Lucro bruto dos produtos: '+money(revenue-items.reduce((n,i)=>n+i.historicalCost,0))+', antes de despesas e taxas.':'Custo histórico incompleto: lucro bruto e margem não disponíveis.'} Ticket: ${money(Math.round(revenue/sales.length))}. Consulte Finanças para o demonstrativo por competência, despesas e devoluções por data.`:'Sem vendas concluídas neste recorte. Não há ticket ou margem a calcular.';}
 const specialists={stock:[{name:'Estoque',source:'ERPModel · saldo e cadastro local'}],finance:[{name:'Finanças',source:'Demonstrativo canônico · finance.statement na interface'}],fair:[{name:'Feiras',source:'Carga, vendas vinculadas e conferência de sobra'}],rebuy:[{name:'Clientes',source:'Consentimento e histórico de compras'}],overview:[{name:'Finanças',source:'Demonstrativo canônico · finance.statement na interface'},{name:'Estoque',source:'ERPModel · saldo e cadastro local'},{name:'Feiras',source:'Carga e sobra conferida'},{name:'Clientes',source:'Histórico com consentimento'}]}[request.intent]||[];
 return {...result,intent:request.intent,text,interpretation:request,specialists,confidence:result.sampleSize?'Baseado nos registros disponíveis; hipóteses precisam de conferência.':'Não há vendas suficientes para concluir sobre desempenho.'};
}
