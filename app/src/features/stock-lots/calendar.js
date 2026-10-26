// Derived business agenda, separate from sales fairs and municipal festivities.
import {validCivil,civilDay,shiftCivil,civilTimeEpoch,localZone,validityState} from './validity.js';
const qty=n=>Math.round(n*1000)/1000;
const reference=id=>typeof id==='string'&&id.length>0&&id.length<=240;
export function summarizeValidity(lots,today=civilDay()){
 const products=new Set(lots.map(l=>l.productId)),units=new Set(lots.map(l=>l.unit));
 if(products.size>1||units.size>1)throw Error('Confira validades por produto e unidade; quilos não se somam a pacotes.');
 let physical=0,eligible=0,unknown=0,needsConfirmation=0,notApplicable=0,expiring=0,expired=0,quarantine=0,estimated=0;const dates=[],eligibleDates=[],expiringDates=[];
 for(const l of lots){if(!Number.isFinite(l.remaining)||l.remaining<0)throw Error('Saldo do lote inválido.');if(!l.remaining)continue;
  const r=validityState(l.validity,today);physical+=l.remaining;
  if(l.quarantined)quarantine+=l.remaining;else if(!r.blocking)eligible+=l.remaining;
  if(r.blocking)expired+=l.remaining;else if(r.code==='unknown')unknown+=l.remaining;else if(r.code==='confirm_date')needsConfirmation+=l.remaining;else if(r.code==='not_applicable')notApplicable+=l.remaining;
  if(!l.quarantined&&['expiring','today'].includes(r.code)){expiring+=l.remaining;expiringDates.push(r.expiresOn);}if(r.estimated)estimated+=l.remaining;
  if(r.expiresOn){dates.push(r.expiresOn);if(!r.blocking&&!l.quarantined)eligibleDates.push(r.expiresOn);}
 }
 dates.sort();eligibleDates.sort();expiringDates.sort();return{productId:lots[0]?.productId||'',unit:lots[0]?.unit||'',physical:qty(physical),eligible:qty(eligible),unknown:qty(unknown),needsConfirmation:qty(needsConfirmation),notApplicable:qty(notApplicable),expiring:qty(expiring),expired:qty(expired),quarantine:qty(quarantine),estimated:qty(estimated),earliest:dates[0]||'',latest:dates.at(-1)||'',eligibleEarliest:eligibleDates[0]||'',eligibleLatest:eligibleDates.at(-1)||'',earliestExpiring:expiringDates[0]||''};
}
export function validityOverview(lots,today=civilDay()){
 const groups=new Map();for(const l of lots){const key=l.productId+'|'+l.unit;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(l);}
 const products=[...groups.values()].map(g=>summarizeValidity(g,today)).filter(s=>s.physical>0).sort((a,b)=>Number(b.expired>0)-Number(a.expired>0)||(a.earliest||'9999').localeCompare(b.earliest||'9999')||a.productId.localeCompare(b.productId));
 return{products,productCount:products.length,withExpired:products.filter(p=>p.expired>0).length,withUpcoming:products.filter(p=>p.expiring>0).length,withMissing:products.filter(p=>p.unknown>0).length};
}
export function businessCalendar(lots,quotes=[],today=civilDay()){
 if(!Array.isArray(lots)||lots.length>10000||!Array.isArray(quotes)||quotes.length>5000)throw Error('Muitos registros para a agenda atual. Consulte por produto.');
 const entries=[],seen=new Set();
 const add=(kind,entity,date,fields)=>{const id=kind+':'+entity;if(!reference(entity)||seen.has(id))throw Error('Referência de agenda inválida ou repetida.');seen.add(id);if(!validCivil(date))throw Error('Data da agenda inválida.');entries.push({id,kind,entityId:entity,date,...fields});};
 for(const l of lots){if(!reference(l.id)||!reference(l.productId)||!Number.isFinite(l.remaining)||l.remaining<0)throw Error('Confira a integridade do lote antes de agendar.');
  const v=l.validity||{},state=validityState(v,today),fields={productId:l.productId,unit:l.unit,remaining:l.remaining,active:l.remaining>0&&!l.archived,reminders:v.reminders!==false,time:v.reminderTime||'08:00',confirmedOn:l.dateConfirmedOn||'',estimated:v.source==='estimate'};
  if(v.state==='dated'&&v.confirmed&&validCivil(v.expiresOn))add('lot-expiry',l.id,v.expiresOn,{...fields,state:state.code});
  if(validCivil(v.reviewOn))add('lot-review',l.id,v.reviewOn,{...fields,state:v.reviewOn<today?'overdue':v.reviewOn===today?'today':'upcoming'});
 }
 for(const q of quotes){if(!q.validUntil)continue;add('quote-validity',q.id,q.validUntil,{supplierId:q.supplierId||'',active:q.archived!==true,reminders:q.calendarReminders===true,time:q.reminderTime||'08:00',confirmedOn:q.dateConfirmedOn||'',state:q.validUntil<today?'expired':q.validUntil===today?'today':'upcoming',estimated:false});}
 return entries.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
const fingerprint=value=>{let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(16);};
export function reminderPlan(entries,{now=Date.now(),zone=localZone(),limit=64}={}){
 const today=civilDay(now,zone),groups=new Map(),issues=[];
 for(const e of entries){if(!e.active||!e.reminders||e.date<today)continue;
  for(const offset of e.kind==='lot-review'?[0]:[-5,0]){
   const date=shiftCivil(e.date,offset);if(date<today)continue;const at=civilTimeEpoch(date,e.time,zone);
   if(at===null){issues.push({eventId:e.id,date,reason:'local-time-does-not-exist'});continue;}
   const key='business-calendar:'+date+':'+e.time;if(!groups.has(key))groups.set(key,{key,kind:'business-calendar',date,time:e.time,at,eventIds:[],allowSchedule:false});
   const group=groups.get(key);group.eventIds.push(e.id+':'+e.date+':'+offset);group.allowSchedule ||= at>now&&!(offset===-5&&date===today&&e.confirmedOn===today);
  }
 }
 const desired=[...groups.values()].sort((a,b)=>a.at-b.at||a.key.localeCompare(b.key)).map(g=>({...g,signature:fingerprint([zone,g.eventIds.sort()]),title:'Validades Para Conferir',body:'Confira os vencimentos, revisões e cotações na agenda do AGRO.'}));
 return{desired:desired.slice(0,limit),deferred:desired.length>limit,issues,current:entries.filter(e=>e.active&&e.date<=shiftCivil(today,5)).map(e=>e.id)};
}
