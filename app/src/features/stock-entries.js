import {contextOf,eligible} from './agent/core.js';
export const normalize=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().trim();
const qty=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const day=n=>new Date(n).toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'});
const months=['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
export function queryPeriod(text,now=Date.now(),fallback=null){
 const q=normalize(text),today=day(now),year=Number(today.slice(0,4)),month=Number(today.slice(5,7));
 const one=d=>({start:Date.parse(d+'T00:00:00-03:00'),end:Math.min(now,Date.parse(d+'T23:59:59.999-03:00')),label:d});
 if(/\bontem\b/.test(q))return one(day(now-86400000));
 if(/\bhoje\b/.test(q)&&!/mes|semana/.test(q))return one(today);
 const named=months.findIndex(m=>new RegExp('\\b'+m+'\\b').test(q)),past=/mes passado/.test(q);
 if(named>=0||past||/(?:neste|nesse|este|esse|deste|do) mes|mes atual/.test(q)){
  let y=Number(q.match(/\b(20\d\d)\b/)?.[1]||year),m=named>=0?named+1:past?month-1:month;
  if(m===0){m=12;y--;}
  const prefix=y+'-'+String(m).padStart(2,'0'),next=m===12?(y+1)+'-01':y+'-'+String(m+1).padStart(2,'0');
  return{start:Date.parse(prefix+'-01T00:00:00-03:00'),end:Math.min(now,Date.parse(next+'-01T00:00:00-03:00')-1),label:prefix};
 }
 if(/semana|ano passado|anteontem|\bentre\b|\bdesde\b|\b\d{1,2}[/-]\d/.test(q))throw Error('Selecione as datas na Gestão para este período; não consegui interpretá-lo com segurança.');
 return fallback||{start:0,end:now,label:'histórico disponível'};
}
export function productMatches(data,text){
 const q=normalize(text),ctx=contextOf(data),products=(data.products||[]).filter(p=>eligible(p,ctx)),aliases=data.agent?.actorId===ctx.actorId?data.agent.aliases||[]:[];
 const ignored=new Set(['com','para','sem','dos','das','tipo','produto','produtos']);
 const wordsOf=p=>[...new Set(normalize([p.name,p.baseName,p.type,p.format].filter(Boolean).join(' ')).split(/\s+/).filter(w=>w.length>2&&!ignored.has(w)))];
 const inQuestion=w=>new RegExp('\\b'+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'s?\\b').test(q);
 const named=[...new Set(products.flatMap(wordsOf))].filter(inQuestion),fish=/\bpeixes?\b/.test(q);
 const matches=products.filter(p=>{
  const words=wordsOf(p),alias=aliases.some(a=>a.confirmed&&a.productId===p.id&&q.includes(normalize(a.alias)));
  return alias||(!fish||normalize(p.category)==='piscicultura')&&(named.length?named.every(w=>words.includes(w)):fish);
 });
 const weight=q.match(/\b(\d+)\s*(?:g|gramas?)\b/);
 return weight?matches.filter(p=>Number(p.weight)===Number(weight[1])):matches;
}
export function stockEntries(data,{productIds=null,start=0,end=Date.now(),now=Date.now()}={}){
 const ctx=contextOf(data);if(!['real','demo','simulation'].includes(ctx.dataOrigin))throw Error('Confirme a origem dos registros antes de consultar.');
 const seen=new Set(),rows=[];
 for(const m of data.movements||[]){
  if(!eligible(m,ctx)||!['initial','add'].includes(m.kind)||productIds&&!productIds.includes(m.productId))continue;
  const occurrence=m.lotOccurrenceConfirmed&&m.lotEffectiveDay?m.lotEffectiveDay+'T12:00:00-03:00':m.date;const at=Date.parse(occurrence);if(!Number.isFinite(at))throw Error('Há uma entrada sem data válida. Confira o histórico.');if(at<start||at>end||at>now)continue;
  if(!m.id||seen.has(m.id))throw Error('Há entradas sem identificação ou duplicadas. Confira o histórico.');seen.add(m.id);
  if(!Number.isFinite(m.qty)||m.qty<0)throw Error('Há uma entrada com quantidade inválida. Confira o histórico.');
  const p=data.products?.find(p=>p.id===m.productId),lot=m.lotInput||{},supplierId=m.supplierId||lot.supplierId||'',supplier=(data.supplierBook?.actorId===ctx.actorId?data.supplierBook.suppliers:[])?.find(s=>s.id===supplierId),person=supplier?.clientId?data.clients?.find(c=>c.id===supplier.clientId):supplier;
  rows.push({id:m.id,productId:m.productId,date:occurrence,recordedAt:m.date,name:m.name||p?.name||'Produto removido',quantity:m.qty,unit:m.unit||p?.unit||'unidade não registrada',presentation:m.description||[p?.weight?p.weight+' g':'',p?.format||''].filter(Boolean).join(' · '),supplier:person?.name||m.supplierName||lot.supplier||'',origin:m.origin||lot.origin||'',kind:m.kind,purchaseId:m.purchaseId||'',note:m.note||''});
 }
 return rows.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)||a.id.localeCompare(b.id));
}
export function formatStockEntries(rows,{latest=false,label='histórico disponível'}={}){
 const shown=latest?rows.slice(0,1):rows.slice(0,100),totals=new Map();for(const r of rows){const key=r.unit;totals.set(key,(totals.get(key)||0)+Math.round(r.quantity*1000));}
 return 'Entradas de estoque · '+label+'\n'+(rows.length?[...totals].map(([u,n])=>qty(n/1000)+' '+u).join('; ')+' registrados.\n'+shown.map(r=>new Date(r.date).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})+' · '+r.name+(r.presentation?' · '+r.presentation:'')+' · '+qty(r.quantity)+' '+r.unit+' · Fornecedor: '+(r.supplier||'não registrado')+' · Origem: '+(r.origin||'não registrada')).join('\n')+(rows.length>shown.length?'\nExibindo '+shown.length+' de '+rows.length+' entradas.':''):'Nenhuma entrada encontrada neste recorte. Isso não comprova que nunca houve recebimento.')+'\nReposições e entradas iniciais registradas; correções e devoluções não são novas compras. A apresentação atual é usada quando a entrada não a preservou.';
}
export function entryAnswer(data,text,{now=Date.now(),productId=''}={}){
 const matches=productId?[{id:productId}]:productMatches(data,text),period=queryPeriod(text,now);
 if(text.trim()&&!matches.length)return 'Não identifiquei o produto com segurança. Informe o nome cadastrado e, se necessário, a apresentação. Nenhuma entrada foi presumida.';
 return formatStockEntries(stockEntries(data,{productIds:matches.length?matches.map(p=>p.id):null,...period,now}),{label:period.label,latest:/ultima|mais recente/.test(normalize(text))});
}
export const isEntryQuestion=text=>/\b(?:entrada|entradas|entraram|entrou|recebi|chegaram|chegou|entregou)\b/.test(normalize(text))&&!/dinheiro|receita|caixa|pagamento/.test(normalize(text));
