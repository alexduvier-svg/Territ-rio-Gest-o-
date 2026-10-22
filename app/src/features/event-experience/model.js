import {eventPickupSnapshot} from '../store/availability.js';
import {printProducts} from '../print-list/model.js';
import {heldLocal,actorOf} from '../local-catalog/model.js';
import {orderStockProducts} from '../stock-order.js';
import {properName} from '../proper-name.js';
import {offerText} from '../print-list/text.js';

export const hasEventLoad=(data,id)=>(data.eventLoads||[]).some(l=>l.eventId===id&&l.items?.some(i=>i.qty>0));
export const needsEventLoad=(data,event)=>event.status==='active'&&!event.fairClosedAt&&!hasEventLoad(data,event.id);

export function cancelEvent(data,id,at=new Date().toISOString()){
 const event=data.events.find(e=>e.id===id);if(!event||event.status!=='active')throw Error('Este evento não está ativo.');
 if(data.sales?.some(s=>s.scope===id&&s.status==='completed'))throw Error('Este evento já tem vendas. Finalize para preservar a conferência e o histórico.');
 const shop=data.onlineShop,actor=actorOf(data);
 if(shop?.actorId===actor&&shop.slug===data.portfolio?.slug&&shop.orders?.some(o=>o.event?.id===id&&!['cancelled','delivered'].includes(o.status)))throw Error('Há pedidos para retirada neste evento. Resolva os pedidos antes de cancelar.');
 Object.assign(event,{status:'finished',fairCancelled:true,cancelledByProducer:true,finishedAt:at,fairClosedAt:at,closedAutomatically:false,lossReviewedAt:at});delete event.lossReviewPending;
 return event;
}

// A text invitation is a snapshot, never a reservation. Both the event allocation
// and the physical total must cover it, including reservations in other channels.
export function eventOffer(data,eventId,{description=()=>'',at=Date.now()}={}){
 const event=eventPickupSnapshot(data,at).find(e=>e.id===eventId);
 if(!event)throw Error('Este evento já terminou ou não está disponível.');
 const stock=new Map(printProducts(data,description).map(p=>[p.productId,p]));
 const caps=new Map(event.products.map(p=>[p.productId,p.quantity]));
 const holds=new Map(),globalHolds=new Map(),shop=data.onlineShop;
 const done=new Set((data.sales||[]).filter(s=>s.status==='completed').map(s=>s.operationId));
 if(shop?.actorId===actorOf(data)&&shop.slug===data.portfolio?.slug)for(const order of shop.orders||[]){
  if(['cancelled','delivered'].includes(order.status)||order.accountedSale||done.has('order-'+order.id))continue;
  for(const item of order.items||[]){globalHolds.set(item.productId,(globalHolds.get(item.productId)||0)+item.quantity);if(order.event?.id===eventId)holds.set(item.productId,(holds.get(item.productId)||0)+item.quantity);}
 }
 const items=orderStockProducts(data.products||[]).filter(p=>p.active!==false&&!p.archived&&p.price>0&&Math.min((caps.get(p.id)||0)-(holds.get(p.id)||0),p.stock-heldLocal(data,p.id)-(globalHolds.get(p.id)||0))>0).map(p=>({productId:p.id,name:properName(p.name),category:p.category,label:stock.get(p.id)?.label||description(p),unit:p.unit,price:p.price}));
 if(!items.length)throw Error('Nenhum produto da carga está disponível para retirada. Confira o estoque e as reservas.');
 return{brand:data.catalog?.title||data.settings?.businessName||'AGRO Gestão',at,items};
}
export function eventMessage(data,id,message,options){return message.trim()+'\n\n*Retirada no Evento*\n'+offerText(eventOffer(data,id,options));}

export function calendarPayload(event,actor){
 const start=Date.parse(event.start+'T'+event.from+':00-03:00'),end=Date.parse(event.end+'T'+event.until+':00-03:00');
 if(!actor||!event.id||!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw Error('Confira as datas e os horários do evento.');
 return{key:actor+'|'+event.id,title:properName(event.name),location:event.place||'',start,end,reminderMinutes:1440,description:'AGRO Gestão · Confira carga, transporte, troco e avise os clientes. Lembrete: 1 dia antes. Alterações no app só chegam à agenda ao salvar novamente.'};
}
