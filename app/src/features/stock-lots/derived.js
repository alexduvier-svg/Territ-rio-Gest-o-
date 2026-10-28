import {lotSnapshot} from './model.js';
import {businessCalendar,reminderPlan,validityOverview} from './calendar.js';
import {civilDay} from './validity.js';
const caches=new WeakMap();
export function currentLots(data,today=civilDay()){
 if(data.stockLotsVersion!==1)return[];
 const flags=[(data.products||[]).map(p=>[p.id,p.active!==false,p.archived===true]),data.settings?.validityLeadDays||null];let cache=caches.get(data);if(cache&&cache.revision===data.stockLotsRevision&&cache.products===data.products&&cache.movements===data.movements&&cache.length===data.movements?.length&&cache.day===today&&cache.flags===JSON.stringify(flags))return cache.rows;
 const rows=[];for(const p of data.products||[]){const snapshot=lotSnapshot(data,p.id,today);if(snapshot.issues.length)continue;for(const l of snapshot.lots)rows.push({...l,archived:p.active===false||p.archived===true});}
 caches.set(data,{revision:data.stockLotsRevision,products:data.products,movements:data.movements,length:data.movements?.length,day:today,flags:JSON.stringify(flags),rows});return rows;
}
export function quoteDates(data){const book=data.supplierBook,actor=data.dataContext?.id||data.productMemory?.scopeId;if(book?.actorId!==actor)return[];return(book.comparisons||[]).flatMap(c=>(c.offers||[]).map(o=>({id:c.id+':'+o.id,supplierId:o.supplierId,validUntil:o.validUntil,archived:c.archived||book.suppliers?.find(s=>s.id===o.supplierId)?.archived,calendarReminders:o.calendarReminders===true,reminderTime:o.reminderTime||'08:00',dateConfirmedOn:o.dateConfirmedOn||''})));}
export function calendarEntries(data,today=civilDay()){return businessCalendar(currentLots(data,today).filter(l=>l.remaining>0),quoteDates(data),today);}
export function calendarNotices(data,now=Date.now()){if(data.training||data.stockLotsVersion!==1||data.settings?.validityReminders===false)return[];return reminderPlan(calendarEntries(data,civilDay(now)),{now}).desired;}
export function stockValidityOverview(data,today=civilDay()){return validityOverview(currentLots(data,today).filter(l=>!l.archived),today);}
export function stockValidityFacts(data,today=civilDay()){
 if(data.stockLotsVersion!==1)return null;
 const overview=stockValidityOverview(data,today),integrityIssues=(data.products||[]).filter(p=>p.active!==false&&!p.archived&&lotSnapshot(data,p.id,today).issues.length).length;
 return{...overview,today,integrityIssues};
}
export function lotMovementCSV(data){return[['ID do Movimento','ID do Produto','ID da Venda','ID do Evento','Tipo','Registrado em','Data Efetiva Confirmada','Revisão dos Lotes','Época da Unidade','ID do Lote','Operação no Lote','Quantidade'],...(data.movements||[]).flatMap(m=>{const a=m.lotAccounting;if(!a)return[];return[...(a.receipts||[]).map(r=>[r.id,'Entrada',r.quantity]),...(a.allocations||[]).map(r=>[r.lotId,'Saída',r.quantity])].map(([lotId,kind,quantity])=>[m.id,m.productId,m.saleId||'',m.eventId||'',m.kind,m.date,a.effectiveDay,a.revision??'',a.epoch||1,lotId,kind,quantity]);})];}
export function lotCSV(data){return[['ID do Produto','ID do Lote','Lote de Origem','Unidade','Quantidade Recebida','Saldo Físico do Lote','Estado da Validade','Data do Vencimento','Precisão','Mês Informado','Prazo Informado','Unidade do Prazo','Referência do Prazo','Data de Referência','Data de Recebimento','Data de Produção','Registrado em','Quarentena','Origem da Data','Revisão','Avisos Habilitados'],...currentLots(data).map(l=>{const v=l.validity;return[l.productId,l.id,l.rootLotId,l.unit,l.received,l.remaining,v.state,v.expiresOn,v.precision,v.expiryMonth||'',v.period??'',v.periodUnit||'',v.referenceType||'',v.referenceOn||'',l.receivedOn,v.manufacturedOn,l.recordedAt,l.quarantined?'Sim':'Não',v.source,v.reviewOn,v.reminders?'Sim':'Não'];})];}
