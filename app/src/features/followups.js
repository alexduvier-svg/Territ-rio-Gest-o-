import {day,balance,outstanding,validDay} from './receivables/receivables.js';
export const terminal=order=>['delivered','cancelled'].includes(order.status);
export function activeOrders(data){const actor=data.dataContext?.id||data.productMemory?.scopeId,s=data.onlineShop;if(!s||s.actorId!==actor||s.slug!==(data.portfolio?.slug||''))return[];return(s.orders||[]).filter(o=>!terminal(o)&&!((s.finishOnSale||[]).includes(o.id)&&(data.sales||[]).some(v=>v.operationId==='order-'+o.id&&v.status==='completed')));}
export function dueReceivables(sales,now=Date.now()){return outstanding(sales||[]).filter(s=>s.credit?.dueDate<=day(now));}
export function nextOrderStatus(order){if(order.status==='requested')return'preparing';if(order.status==='preparing')return'ready';if(order.status==='ready')return order.customer?.fulfillment==='pickup'?'delivered':'out_for_delivery';if(order.status==='out_for_delivery')return'delivered';return null;}
export function followupNotices(data,now=Date.now()){
 const result=[],orders=activeOrders(data),today=day(now);
 if(orders.length)result.push({key:'orders',kind:'order-followup',at:now+1000,title:'Pedidos para acompanhar',body:'Confira os pedidos pendentes e atualize a próxima etapa.',signature:orders.map(o=>o.id+':'+o.status).sort().join('|')});
 const groups=new Map();for(const sale of outstanding(data.sales||[])){const date=sale.credit?.dueDate;if(!validDay(date))continue;const key=date<=today?today:date;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(sale);}
 for(const [date,rows]of [...groups].sort().slice(0,32)){const at=Date.parse(date+'T09:00:00-03:00');result.push({key:'credit:'+date,kind:'credit-followup',at:Math.max(now+1000,at),title:'Pagamento de Fiado para conferir',body:'O cliente já pagou? Abra o AGRO e confirme antes de dar baixa.',signature:rows.map(s=>s.id+':'+s.credit.dueDate).sort().join('|'),date});}
 return result;
}
