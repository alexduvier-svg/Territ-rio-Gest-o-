import { orderStockProducts } from './stock-order.js';

const normalize=value=>String(value||'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g,' ').trim();

// Families follow the stock panel's universes. Quantities keep their original unit;
// historical recorded amounts are used, never today's selling price.
export function familySales(rows, products=[]){
 const catalog=new Map(products.map(p=>[p.id,p])),groups=new Map();
 for(const row of rows||[]){
  const current=catalog.get(row.productId||row.id)||{},p={...current,...row,id:row.productId||row.id,category:row.category||current.category,baseName:row.baseName||row.catalogBase||current.catalogBase||current.baseName||row.name},name=normalize(p.baseName||p.name),category=normalize(p.category);
  let family=name,label=p.baseName||p.name||'Outros';
  if(category==='cafes'||/^cafes?\b/.test(name)){family='cafe';label='Cafés';p.category='Cafés';}
  else if(/^bananas?\b/.test(name)){family='banana';label='Bananas';}
  else if(/^fuba\b/.test(name)){family='fuba';label='Fubá';}
  else if(/^(mandioca|aipim|macaxeira)\b/.test(name)){family='mandioca';label='Mandioca';}
  const key=normalize(p.category)+'|'+family;
  let g=groups.get(key);if(!g){g={key,name:label,amount:0,units:new Map(),representative:p};groups.set(key,g);}
  g.amount+=Math.round(Number(row.amount)||0);
  const unit=String(row.unit||p.unit||'Unidade');g.units.set(unit,Math.round(((g.units.get(unit)||0)+(Number(row.qty)||0))*1000)/1000);
 }
 const order=new Map(orderStockProducts([...groups.values()].map(g=>({...g.representative,id:g.key}))).map((p,i)=>[p.id,i]));
 return [...groups.values()].sort((a,b)=>order.get(a.key)-order.get(b.key)).map(({representative,...g})=>({...g,units:[...g.units].map(([unit,qty])=>({unit,qty}))}));
}

// Current inventory only. Missing cost is never silently valued at zero; an
// explicit known zero cost remains a valid cost. Units are not added together.
export function categorySales(rows=[],products=[]){
 const byId=new Map(products.map(p=>[p.id,p])),groups=new Map();for(const row of rows){const p=byId.get(row.productId),category=p?.category||row.category||'Categoria não informada';if(!groups.has(category))groups.set(category,{key:category,name:category,amount:0,units:new Map()});const g=groups.get(category);g.amount+=Math.round(Number(row.amount)||0);const unit=row.unit||p?.unit||'Unidade';g.units.set(unit,Math.round(((g.units.get(unit)||0)+(Number(row.qty)||0))*1000)/1000);}
 return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')).map(g=>({...g,units:[...g.units].map(([unit,qty])=>({unit,qty}))}));
}
export function currentStockValue(products=[]){
 const rows=orderStockProducts(products).map(p=>{
  const qty=Number.isFinite(p.stock)?Math.max(0,p.stock):null,hasBalance=qty===null||qty>0;
  const costKnown=Number.isFinite(p.cost)&&p.cost>=0&&p.costKnown!==false&&(p.costKnown===true||p.cost>0),priceKnown=Number.isFinite(p.price)&&p.price>0;
  return {...p,qty,costValue:qty!==null&&costKnown?Math.round(qty*p.cost):null,retailValue:qty!==null&&priceKnown?Math.round(qty*p.price):null,costMissing:hasBalance&&(qty===null||!costKnown),priceMissing:hasBalance&&(qty===null||!priceKnown)};
 });
 const sum=key=>rows.reduce((n,p)=>n+(p[key]??0),0),withStock=rows.filter(p=>p.qty===null||p.qty>0);
 return {rows,cost:sum('costValue'),retail:sum('retailValue'),costMissing:rows.filter(p=>p.costMissing).length,priceMissing:rows.filter(p=>p.priceMissing).length,costKnown:withStock.filter(p=>p.costValue!==null).length,priceKnown:withStock.filter(p=>p.retailValue!==null).length,withStock:withStock.length};
}

export function stockEventsInSelection(events,selection={}){
 const selected=(events||[]).find(e=>e.id===selection.scope);if(selected)return [selected];
 if(!['all','events',undefined,''].includes(selection.scope))return [];
 let from='',until='';
 if(selection.days?.length){const days=[...selection.days].sort();from=days[0];until=days.at(-1);}
 else if(selection.month){from=selection.month+'-01';until=selection.month+'-31';}
 else if(selection.year){from=selection.year+'-01-01';until=selection.year+'-12-31';}
 return [...(events||[])].filter(e=>(!from||e.end>=from)&&(!until||e.start<=until)).sort((a,b)=>b.start.localeCompare(a.start));
}

function dateEpoch(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return NaN;
 const epoch=Date.parse(value+'T12:00:00Z');return Number.isFinite(epoch)&&new Date(epoch).toISOString().slice(0,10)===value?epoch:NaN;
}

// Event wall-clock times use the same Brasília offset as sales and event creation.
// There is no "starts now" fallback: a late install/save must not create a late alarm.
export function eventStartNotices(events,{now=Date.now(),loadCount=()=>0,includePast=false}={}){
 const out=[];
 for(const event of events||[]){
  if(!event?.id||event.status!=='active'||event.finishedAt||event.fairClosedAt)continue;
  const first=dateEpoch(event.start),last=dateEpoch(event.end||event.start),time=/^([01]\d|2[0-3]):[0-5]\d$/.test(event.from||'')?event.from:'08:00';
  if(!Number.isFinite(first)||!Number.isFinite(last)||last<first)continue;
  const count=loadCount(event)||0;
  for(let dayAt=first;dayAt<=last;dayAt+=86400000){
   const day=new Date(dayAt).toISOString().slice(0,10),startAt=Date.parse(day+'T'+time+':00-03:00'),at=startAt-3600000;
   if(!includePast&&at<=now)continue;
   out.push({id:event.id+':'+day,eventId:event.id,at,startAt,title:(event.name||'Seu evento')+' começa em 1 hora',body:time+' · '+(count?count+' '+(count===1?'produto separado':'produtos separados')+'. Toque para conferir o que vai levar.':'Toque para preparar o que vai levar.')});
  }
 }
 return out.sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));
}

export function notificationTime(notification){
 const explicit=Number(notification?.extra?.reminderAt);if(Number.isFinite(explicit)&&explicit>0)return explicit;
 const raw=notification?.schedule?.at;return raw?new Date(raw).getTime():NaN;
}

// IDs stay stable across edits; a changed timestamp or text replaces the pending
// alarm instead of leaving an old alarm or creating a duplicate.
export function notificationChanges(wanted,pending){
 const existing=new Map((pending||[]).map(n=>[n.id,n])),cancel=[],schedule=[];
 for(const n of pending||[])if(['fair','event-start'].includes(n.extra?.kind)&&!wanted.has(n.id))cancel.push({id:n.id});
 for(const [id,next] of wanted){
  const prior=existing.get(id);
  if(prior&&notificationTime(prior)===next.at&&prior.title===next.title&&prior.body===next.body)continue;
  if(prior)cancel.push({id});schedule.push(next);
 }
 return {cancel,schedule};
}
