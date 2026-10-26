// Fair reservations name physical lots; they never decrement the stock balance.
import {lotSnapshot,allocateLots,lotMovements} from './model.js';
import {civilDay,validCivil} from './validity.js';
const round=n=>Math.round(n*1000)/1000;
const owner=d=>d.dataContext?.id||d.productMemory?.scopeId||'';
const fail=message=>{throw Error(message);};
const caches=new WeakMap();
export function invalidateReservations(data){caches.delete(data);}
export function commitReservationDelta(data,plan){
 const c=caches.get(data);if(!c)return;if(c.revision!==plan.revision){caches.delete(data);return;}
 for(const change of plan.changes){const m=change.movement;let event=m.eventId,q=m.qty;if(m.kind==='return'){const sale=data.sales?.find(s=>s.id===m.saleId);event=sale?.scope;q=-q;}if(!event||!['sale','loss','return'].includes(m.kind))continue;const key=JSON.stringify([event,m.productId,m.unit]);c.used.set(key,Math.max(0,round((c.used.get(key)||0)+q)));}
 Object.assign(c,{revision:data.stockLotsRevision,sales:data.sales,salesLength:data.sales?.length,movements:data.movements,movesLength:data.movements?.length,claims:new WeakMap()});
}
function usage(data){let c=caches.get(data);if(c&&c.revision===data.stockLotsRevision&&c.sales===data.sales&&c.salesLength===data.sales?.length&&c.movements===data.movements&&c.movesLength===data.movements?.length)return c;
 const used=new Map(),add=(event,id,unit,q)=>{const key=JSON.stringify([event,id,unit]);used.set(key,round((used.get(key)||0)+q));};
 for(const s of data.sales||[])if(s.status==='completed')for(const i of s.items||[])add(s.scope,i.productId,i.unit,i.qty);
 for(const m of data.movements||[])if(m.kind==='loss'&&m.eventId)add(m.eventId,m.productId,m.unit,m.qty);
 c={revision:data.stockLotsRevision,sales:data.sales,salesLength:data.sales?.length,movements:data.movements,movesLength:data.movements?.length,used,claims:new WeakMap()};caches.set(data,c);return c;
}
export const openLotAllocation=e=>!e.fairCancelled&&!e.cancelledByProducer&&(!e.fairClosedAt||e.surplusCheck?.conferido===false)&&(e.status==='active'||e.status==='finished'&&(e.closedAutomatically===true||e.surplusCheck?.conferido===false||e.lossReviewPending&&!e.lossReviewedAt));
export function saleLotContext(data,draft,now=Date.now()){
 const scope=draft.scope||'loja',onDay=draft.occurrenceDay||civilDay(now);
 if(draft.occurrenceDay){const e=data.events?.find(e=>e.id===scope);if(!draft.occurrenceConfirmed||!validCivil(onDay)||onDay>civilDay(now)||!e||onDay<e.start||onDay>e.end||e.fairCancelled||e.cancelledByProducer)fail('Confirme a data em que a venda aconteceu, dentro do período da feira.');}
 return{scope,onDay};
}
export function orderHolds(data,productId,{exceptOrder,exceptEvent}={}){
 const actor=owner(data),local=data.localCommerce?.actors?.[actor]?.orders||[],s=data.onlineShop,online=s&&s.actorId===actor&&s.slug===data.portfolio?.slug?s.orders||[]:[];
 return round([...local,...online].filter(o=>o.id!==exceptOrder&&(!exceptEvent||o.event?.id!==exceptEvent)&&!['review','cancelled'].includes(o.status)&&(o.status!=='delivered'||local.includes(o))&&!o.accountedSale&&!(data.sales||[]).some(s=>(s.localOrderId===o.id||s.operationId==='order-'+o.id)&&s.status==='completed')).flatMap(o=>o.items||[]).filter(i=>i.productId===productId).reduce((n,i)=>n+i.quantity,0));
}
export function remainingLoad(data,eventId,productId,unit){
 const item=data.eventLoads?.find(l=>l.eventId===eventId)?.items.find(i=>i.productId===productId&&i.unit===unit);
 return Math.max(0,round((item?.qty||0)-(usage(data).used.get(JSON.stringify([eventId,productId,unit]))||0)));
}
function claims(data,eventId,productId,unit){
 const load=data.eventLoads?.find(l=>l.eventId===eventId),plan=load?.lotPlan;
 if(!plan||plan.version!==1||plan.actorId!==owner(data)||!Number.isSafeInteger(plan.baselineRevision)||plan.baselineRevision<0||plan.baselineRevision>data.stockLotsRevision)return null;
 const row=plan.products?.find(p=>p.productId===productId&&p.unit===unit);
 if(!row||!Array.isArray(row.allocations))return null;
 const cache=usage(data).claims;if(cache.has(row))return cache.get(row);
 const values=new Map();for(const a of row.allocations){if(typeof a.lotId!=='string'||values.has(a.lotId)||!Number.isFinite(a.quantity)||a.quantity<0||round(a.quantity)!==a.quantity)return null;values.set(a.lotId,a.quantity);}
 for(const m of lotMovements(data,productId)){if((m.lotAccounting?.revision??-1)<=plan.baselineRevision)break;if(m.unit===unit&&m.eventId===eventId&&m.after<m.before)for(const a of m.lotAccounting.allocations||[])if(values.has(a.lotId))values.set(a.lotId,Math.max(0,round(values.get(a.lotId)-a.quantity)));}
 const result={baselineRevision:plan.baselineRevision,allocations:[...values].map(([lotId,quantity])=>({lotId,quantity})).filter(a=>a.quantity>0)};cache.set(row,result);return result;
}
// Reconcile named claims against remaining physical lots. Missing/legacy plans
// remain an unidentified hold; a date is never assigned to such a reservation.
export function fairReservations(data,productId,onDay=civilDay(),excludeEvent=''){
 const snapshot=lotSnapshot(data,productId,onDay),p=data.products.find(p=>p.id===productId),remaining=new Map(snapshot.lots.map(l=>[l.id,l.remaining])),events=[];
 const rows=(data.events||[]).filter(e=>e.id!==excludeEvent&&openLotAllocation(e)).map(e=>({e,claim:claims(data,e.id,productId,p.unit)})).sort((a,b)=>(a.claim?.baselineRevision??Infinity)-(b.claim?.baselineRevision??Infinity)||a.e.id.localeCompare(b.e.id));
 for(const {e,claim}of rows){const desired=remainingLoad(data,e.id,productId,p.unit);if(!desired)continue;let need=desired;const allocations=[];
  if(claim)for(const a of claim.allocations){const take=Math.min(need,a.quantity,remaining.get(a.lotId)||0);if(take>0){allocations.push({lotId:a.lotId,quantity:take});remaining.set(a.lotId,round(remaining.get(a.lotId)-take));need=round(need-take);}}
  events.push({eventId:e.id,desired,allocations,unidentified:claim?0:need,shortfall:claim?need:0,confirmed:!!claim});
 }
 return{snapshot,events,remaining};
}
export function scopedLots(data,productId,{scope='all',onDay=civilDay()}={}){
 if(scope==='all')return lotSnapshot(data,productId,onDay);
 const book=fairReservations(data,productId,onDay,scope==='loja'?'':scope),held=new Map();let unidentified=0;
 for(const event of book.events){unidentified+=event.unidentified;for(const a of event.allocations)held.set(a.lotId,round((held.get(a.lotId)||0)+a.quantity));}
 const lots=book.snapshot.lots.map(l=>({...l,remaining:Math.max(0,round(l.remaining-(held.get(l.id)||0)))}));
 // An old load without lot references conservatively holds eligible units.
 const eligible=lots.filter(l=>!l.quarantined&&!l.status.blocking).sort((a,b)=>(a.status.expiresOn||'9999').localeCompare(b.status.expiresOn||'9999')||a.id.localeCompare(b.id));
 for(const l of eligible){const take=Math.min(l.remaining,unidentified);l.remaining=round(l.remaining-take);unidentified=round(unidentified-take);}
 const available=book.snapshot.issues.length?0:round(lots.filter(l=>!l.quarantined&&!l.status.blocking&&(!l.receivedOn||l.receivedOn<=onDay)).reduce((n,l)=>n+l.remaining,0));
 return{...book.snapshot,lots,available,reservations:book.events};
}
export function allocateScopedLots(data,productId,quantity,{scope='all',onDay=civilDay(),selections,commercial=true}={}){
 if(!commercial)return allocateLots(lotSnapshot(data,productId,onDay),quantity,{commercial:false,selections});
 const snapshot=scopedLots(data,productId,{scope,onDay});
 if(selections)return allocateLots(snapshot,quantity,{selections});
 const own=scope!=='all'&&scope!=='loja'?claims(data,scope,productId,data.products.find(p=>p.id===productId)?.unit):null;
 if(!own)return allocateLots(snapshot,quantity);
 let need=quantity;const result=[];
 for(const a of own.allocations){const row=snapshot.lots.find(l=>l.id===a.lotId);if(!row||row.quarantined||row.status.blocking||row.receivedOn&&row.receivedOn>onDay)continue;const take=Math.min(need,a.quantity,row.remaining);if(take>0){result.push({lotId:row.id,quantity:take});row.remaining=round(row.remaining-take);need=round(need-take);}}
 if(need)for(const a of allocateLots(snapshot,need)){const found=result.find(r=>r.lotId===a.lotId);if(found)found.quantity=round(found.quantity+a.quantity);else result.push(a);}
 return result;
}
// Same capacity for preparation UI and reservation commit; a fair's own load is not subtracted twice.
export function eventLoadLimit(data,eventId,productId,{onDay,held=id=>orderHolds(data,id,{exceptEvent:eventId})}={}){
 const event=data.events?.find(e=>e.id===eventId),p=data.products?.find(p=>p.id===productId);
 if(!event||!p||!validCivil(onDay||event.end))return{available:0,used:0,maxTotal:0,issues:['invalid-context']};
 const before=data.eventLoads?.find(l=>l.eventId===eventId)?.items.find(i=>i.productId===p.id&&i.unit===p.unit)?.qty||0;
 const used=Math.max(0,round(before-remainingLoad(data,eventId,p.id,p.unit))),snapshot=scopedLots(data,p.id,{scope:eventId,onDay:onDay||event.end});
 const available=p.active===false||p.archived||snapshot.issues.length?0:Math.max(0,round(snapshot.available-held(p.id)));
 return{available,used,maxTotal:round(used+available),issues:snapshot.issues,until:onDay||event.end};
}
export function prepareEventLots(data,eventId,items,{now=Date.now(),onDay,historicalConfirmed=false,held=id=>orderHolds(data,id,{exceptEvent:eventId})}={}){
 const event=data.events?.find(e=>e.id===eventId);if(!event||!openLotAllocation(event)||!validCivil(event.end)||event.end<civilDay(now)&&!historicalConfirmed)fail('Confira a carga na data da feira. Para um evento passado, registre o ocorrido na conferência.');
 const day=onDay||event.end;if(!validCivil(day)||day<event.start||day>event.end||onDay&&(!historicalConfirmed||day>civilDay(now)))fail('Confirme a data efetiva da carga dentro do período da feira.');
 const seen=new Set(),products=[];
 for(const item of items){const p=data.products.find(p=>p.id===item.productId);if(!p||p.unit!==item.unit||seen.has(p.id)||!Number.isFinite(item.qty)||item.qty<0||round(item.qty)!==item.qty)fail('Confira os produtos e quantidades da carga.');seen.add(p.id);
  const limit=eventLoadLimit(data,eventId,p.id,{onDay:day,held}),quantity=round(item.qty-limit.used);if(quantity<0)fail('O total levado deve cobrir as vendas e perdas já registradas.');
  const snapshot=scopedLots(data,p.id,{scope:eventId,onDay:day});if(quantity>limit.available)fail('A carga de '+p.name+' supera o estoque elegível até o fim da feira. Confira os lotes, as reservas e a validade.');
  products.push({productId:p.id,unit:p.unit,allocations:quantity?allocateLots(snapshot,quantity):[]});
 }
 return{version:1,actorId:owner(data),baselineRevision:data.stockLotsRevision,onDay:day,...(historicalConfirmed?{historicalConfirmed:true}:{}),products};
}
export function eventLots(data,eventId,productId,onDay){
 const e=data.events?.find(e=>e.id===eventId),book=fairReservations(data,productId,onDay||e?.end||civilDay()),row=book.events.find(e=>e.eventId===eventId);
 if(!row)return{confirmed:false,lots:[],issues:book.snapshot.issues};
 const lots=row.allocations.map(a=>({...book.snapshot.lots.find(l=>l.id===a.lotId),remaining:a.quantity}));
 return{...row,lots,issues:book.snapshot.issues};
}
