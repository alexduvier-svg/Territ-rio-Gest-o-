import { orderStockProducts } from '../stock-order.js';
import { heldLocal } from '../local-catalog/model.js';
import {scopedLots,eventLots,prepareEventLots,remainingLoad} from '../stock-lots/reservations.js';
import {publicLotProjection,eventLotProjection} from '../stock-lots/projection.js';
const round=n=>Math.round(n*1000)/1000;
const key=(event,id,unit)=>event+'|'+id+'|'+unit;
function loadBalances(data){
 if(data.stockLotsVersion===1){const products=new Map((data.products||[]).map(p=>[p.id,p]));return new Map((data.eventLoads||[]).map(l=>[l.eventId,(l.items||[]).filter(i=>{const p=products.get(i.productId);return p&&p.active!==false&&p.price>0&&p.unit===i.unit;}).map(i=>({productId:i.productId,quantity:remainingLoad(data,l.eventId,i.productId,i.unit)}))]));}
 const used=new Map();
 for(const s of data.sales||[])if(s.status==='completed')for(const i of s.items||[]){const k=key(s.scope,i.productId,i.unit);used.set(k,(used.get(k)||0)+i.qty);}
 for(const m of data.movements||[])if(m.kind==='loss'&&m.eventId){const k=key(m.eventId,m.productId,m.unit);used.set(k,(used.get(k)||0)+m.qty);}
 const products=new Map((data.products||[]).map(p=>[p.id,p]));
 return new Map((data.eventLoads||[]).map(l=>[l.eventId,(l.items||[]).filter(i=>{const p=products.get(i.productId);return p&&p.active!==false&&p.price>0&&p.unit===i.unit;}).map(i=>({productId:i.productId,quantity:Math.max(0,round(i.qty-(used.get(key(l.eventId,i.productId,i.unit))||0)))}))]));
}
const openAllocation=e=>!e.fairCancelled&&!e.cancelledByProducer&&(!e.fairClosedAt||e.surplusCheck?.conferido===false)&&(e.status==='active'||e.status==='finished'&&(e.closedAutomatically===true||e.surplusCheck?.conferido===false||e.lossReviewPending&&!e.lossReviewedAt));
export function allocatedStock(data){const balances=loadBalances(data),totals=new Map();for(const e of data.events||[])if(openAllocation(e))for(const i of balances.get(e.id)||[])totals.set(i.productId,round((totals.get(i.productId)||0)+i.quantity));return totals;}
export function heldOnline(data,id,eventId){const actor=data.dataContext?.id||data.productMemory?.scopeId,s=data.onlineShop;if(!s||s.actorId!==actor||s.slug!==data.portfolio?.slug)return 0;return(s.orders||[]).filter(o=>!['cancelled','delivered'].includes(o.status)&&!o.accountedSale&&!(data.sales||[]).some(v=>v.status==='completed'&&v.operationId==='order-'+o.id)&&(eventId===undefined?!o.event:o.event?.id===eventId)).flatMap(o=>o.items||[]).filter(i=>i.productId===id).reduce((n,i)=>n+i.quantity,0);}
export function stockPartition(data,id,{onDay}={}){const p=data.products?.find(p=>p.id===id),total=p?.stock||0,allocated=allocatedStock(data).get(id)||0,free=data.stockLotsVersion===1?scopedLots(data,id,{scope:'loja',onDay}).available:Math.max(0,total-allocated);return{total,allocated,home:Math.max(0,round(free-heldLocal(data,id)-heldOnline(data,id)))};}
export function prepareLoadLots(data,eventId,items,options={}){return prepareEventLots(data,eventId,items,{...options,held:id=>heldLocal(data,id)+heldOnline(data,id)+(data.events||[]).filter(e=>e.id!==eventId).reduce((n,e)=>n+heldOnline(data,id,e.id),0)});}
// `stock` remains the physical total. `homeStock` is the unallocated channel cap;
// the server subtracts online reservations once, atomically, within both caps.
export function shopSnapshot(data, comingSoonIds = [], description = () => '') {
 const soon=new Set(comingSoonIds),images=data.portfolio?.productImages||{},allocated=allocatedStock(data);
 return orderStockProducts(data.products||[]).filter(p=>p.active!==false&&p.price>0).map(p=>({
  productId:p.id,name:p.name,category:p.category,label:description(p),unit:p.unit,
  stock:Math.max(0,round(p.stock-heldLocal(data,p.id))),homeStock:Math.max(0,round(p.stock-heldLocal(data,p.id)-(allocated.get(p.id)||0))),
  price:p.price,image:images[p.id]||null,comingSoon:soon.has(p.id),...(data.stockLotsVersion===1?{lotStock:publicLotProjection(data,p.id,heldLocal(data,p.id)),eligibleStock:Math.max(0,round(scopedLots(data,p.id).available-heldLocal(data,p.id))),eligibleHomeStock:Math.max(0,round(scopedLots(data,p.id,{scope:'loja'}).available-heldLocal(data,p.id)))}:{})
 }));
}
export function eventPickupSnapshot(data,now=Date.now()){
 const balances=loadBalances(data);
 return(data.events||[]).filter(e=>e.status==='active'&&!e.fairClosedAt&&Date.parse(e.end+'T'+e.until+':00-03:00')>now).slice(0,100).map(e=>({id:e.id,name:e.name,place:e.place||'',start:e.start,end:e.end,from:e.from,until:e.until,products:(balances.get(e.id)||[]).map(i=>{if(data.stockLotsVersion!==1)return i;const selection=eventLots(data,e.id,i.productId,e.end);return{...i,lotSegments:selection.confirmed&&!selection.issues.length?eventLotProjection(selection.lots):[]};})}));
}
export function eventProductBalance(data,eventId,productId){return(loadBalances(data).get(eventId)||[]).find(i=>i.productId===productId)?.quantity||0;}
export function eventProductBalances(data,eventId){return new Map((loadBalances(data).get(eventId)||[]).map(i=>[i.productId,i.quantity]));}
