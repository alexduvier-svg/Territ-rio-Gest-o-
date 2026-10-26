// Public availability protocol contains quantities/dates only, never lot ids,
// notes, supplier details or manufacturer codes. The server rechecks civil dates.
import {fairReservations} from './reservations.js';
import {localZone,civilDay} from './validity.js';
const round=n=>Math.round(n*1000)/1000;
export function publicLotProjection(data,productId,localHeld=0){
 const book=fairReservations(data,productId),today=civilDay(),groups=rows=>{
  const out=new Map();for(const l of rows)if(l.remaining>0&&!l.quarantined&&(!l.receivedOn||l.receivedOn<=today)){const v=l.validity,key=JSON.stringify([v.confirmed?v.expiresOn:'',!v.confirmed&&v.precision==='month'?v.expiryMonth:'']);const old=out.get(key);if(old)old.quantity=round(old.quantity+l.remaining);else out.set(key,{quantity:l.remaining,expiresOn:v.confirmed?v.expiresOn:'',expiryMonth:!v.confirmed&&v.precision==='month'?v.expiryMonth:''});}
  if(out.size>512)throw Error('Há muitas datas neste produto. Confira os lotes antes de publicar a lista.');return[...out.values()];
 };
 const held=new Map();for(const e of book.events)for(const a of e.allocations)held.set(a.lotId,round((held.get(a.lotId)||0)+a.quantity));
 return{version:1,zone:localZone(),segments:book.snapshot.issues.length?[]:groups(book.snapshot.lots),homeSegments:book.snapshot.issues.length?[]:groups(book.snapshot.lots.map(l=>({...l,remaining:Math.max(0,round(l.remaining-(held.get(l.id)||0)))}))),localHeld,unidentifiedHeld:round(book.events.reduce((n,e)=>n+e.unidentified,0))};
}
export function eventLotProjection(rows){
 const groups=new Map();for(const l of rows)if(l.remaining>0&&!l.quarantined){const v=l.validity,expiresOn=v.confirmed?v.expiresOn:'',expiryMonth=!v.confirmed&&v.precision==='month'?v.expiryMonth:'',key=expiresOn+'|'+expiryMonth,old=groups.get(key);if(old)old.quantity=round(old.quantity+l.remaining);else groups.set(key,{quantity:l.remaining,expiresOn,expiryMonth});}
 if(groups.size>512)throw Error('Confira as datas da carga antes de publicar.');return[...groups.values()];
}
