// Civil dates only. No network, inferred shelf life, stock writes or food-safety diagnosis.
export const VALIDITY_VERSION=1;
export const localZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Sao_Paulo';
export function validCivil(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
 const year=Number(value.slice(0,4)),d=new Date(value+'T12:00:00Z');
 return year>=1900&&year<=2199&&Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;
}
export function civilDay(at=Date.now(),zone=localZone()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at));
 const part=key=>parts.find(p=>p.type===key)?.value;return part('year')+'-'+part('month')+'-'+part('day');
}
export function addCivil(value,count,unit='days'){
 if(!validCivil(value)||!Number.isInteger(count)||count<0||!['days','months'].includes(unit)||count>(unit==='days'?36500:1200))throw Error('Confira o período e sua data de referência.');
 const [y,m,d]=value.split('-').map(Number);let result;
 if(unit==='days')result=new Date(Date.UTC(y,m-1,d+count,12)).toISOString().slice(0,10);
 else{const last=new Date(Date.UTC(y,m-1+count+1,0,12)),day=Math.min(d,last.getUTCDate());result=new Date(Date.UTC(last.getUTCFullYear(),last.getUTCMonth(),day,12)).toISOString().slice(0,10);}
 if(!validCivil(result))throw Error('A data calculada está fora do intervalo permitido.');return result;
}
export function shiftCivil(value,days){if(!validCivil(value)||!Number.isInteger(days))throw Error('Data inválida.');const [y,m,d]=value.split('-').map(Number),out=new Date(Date.UTC(y,m-1,d+days,12)).toISOString().slice(0,10);if(!validCivil(out))throw Error('Data fora do intervalo.');return out;}
export const civilDistance=(from,to)=>{if(!validCivil(from)||!validCivil(to))throw Error('Data inválida.');return Math.round((Date.parse(to+'T12:00:00Z')-Date.parse(from+'T12:00:00Z'))/86400000);};
function checkDate(value,label){if(value&&!validCivil(value))throw Error('Confira '+label+'.');return value||'';}
function monthDate(month,convention){
 if(!/^\d{4}-\d{2}$/.test(month||'')||!validCivil(month+'-01'))throw Error('Confira o mês e o ano da validade.');
 if(convention==='first_day')return month+'-01';
 if(convention==='last_day'){const [y,m]=month.split('-').map(Number);return month+'-'+new Date(Date.UTC(y,m,0,12)).getUTCDate();}
 return '';
}
export function normalizeValidity(raw={}){
 const state=raw.state||'unknown';if(!['unknown','dated','not_applicable'].includes(state))throw Error('Escolha o estado da validade.');
 const out={version:1,state,lotCode:String(raw.lotCode||'').trim().slice(0,120),manufacturedOn:checkDate(raw.manufacturedOn,'a fabricação ou produção'),reviewOn:checkDate(raw.reviewOn,'a data de revisão'),notes:String(raw.notes||'').trim().slice(0,500),source:['label','supplier','own_production','estimate'].includes(raw.source)?raw.source:'unspecified',reminders:raw.reminders!==false,reminderTime:raw.reminderTime||'08:00',precision:'none',expiresOn:'',confirmed:false};
 if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(out.reminderTime))throw Error('Confira o horário dos avisos.');
 if(state!=='dated')return out;
 const mode=raw.mode||'date';if(!['date','period','month'].includes(mode))throw Error('Escolha como informar a validade.');out.mode=mode;
 if(mode==='month'){
  out.precision='month';out.expiryMonth=raw.expiryMonth;const proposed=monthDate(raw.expiryMonth,raw.monthConvention);
  if(!proposed)return out;out.monthConvention=raw.monthConvention;
  if(raw.confirmed!==true||raw.confirmedExpiresOn!==proposed)throw Error('Confirme a convenção e a data do rótulo antes de ativar avisos exatos.');out.expiresOn=proposed;
 }else if(mode==='period'){
  if(!['days','months'].includes(raw.periodUnit))throw Error('Escolha dias ou meses para o período.');
  if(!['production','received','explicit'].includes(raw.referenceType)||!validCivil(raw.referenceOn))throw Error('Informe uma referência explícita para calcular o período. Recebimento não é fabricação.');
  if(raw.referenceType==='production'&&(!out.manufacturedOn||out.manufacturedOn!==raw.referenceOn))throw Error('A referência precisa corresponder à produção informada.');
  const proposed=addCivil(raw.referenceOn,raw.period,raw.periodUnit);
  if(raw.expiresOn&&raw.expiresOn!==proposed){const error=Error('A data exata e o período divergem. Confira qual informação está correta.');error.code='EXPIRY_DATE_CONFLICT';throw error;}
  if(raw.confirmed!==true||raw.confirmedExpiresOn!==proposed)throw Error('Confira e confirme a data calculada antes de salvar.');
  Object.assign(out,{precision:'day',expiresOn:proposed,period:raw.period,periodUnit:raw.periodUnit,referenceType:raw.referenceType,referenceOn:raw.referenceOn});
 }else{
  if(!validCivil(raw.expiresOn))throw Error('Informe uma data de validade válida.');if(raw.confirmed!==true)throw Error('Confirme a data informada antes de salvar.');out.expiresOn=raw.expiresOn;out.precision='day';
 }
 out.confirmed=true;out.confirmedExpiresOn=out.expiresOn;return out;
}
export function validityState(record,today=civilDay()){
 if(!validCivil(today))throw Error('Data de consulta inválida.');
 const r=record||{},base={blocking:false,expiresOn:'',daysLeft:null,estimated:r.source==='estimate'};
 if(r.state==='not_applicable')return{...base,code:'not_applicable',label:'Não Se Aplica'};
 if(r.state!=='dated')return{...base,code:'unknown',label:'Validade Não Informada'};
 if(!r.confirmed||!validCivil(r.expiresOn)){
  // A whole past month is past regardless of its day convention; no exact day is invented.
  if(r.precision==='month'&&/^\d{4}-\d{2}$/.test(r.expiryMonth||'')&&r.expiryMonth<today.slice(0,7))return{...base,code:'expired_month',blocking:true,label:'Validade Mensal Ultrapassada'};
  return{...base,code:'confirm_date',label:'Confirmar a Data da Validade'};
 }
 const daysLeft=civilDistance(today,r.expiresOn);return{...base,expiresOn:r.expiresOn,daysLeft,blocking:daysLeft<0,code:daysLeft<0?'expired':daysLeft===0?'today':daysLeft<=5?'expiring':'valid',label:daysLeft<0?'Vencido':daysLeft===0?'Vence Hoje':daysLeft<=5?'Vence em '+daysLeft+(daysLeft===1?' Dia':' Dias'):'Validade Informada'};
}
// Returns null for a nonexistent local time (DST), rather than inventing another civil day.
export function civilTimeEpoch(day,time='08:00',zone=localZone()){
 if(!validCivil(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw Error('Data ou horário inválidos.');
 const [y,m,d]=day.split('-').map(Number),[h,min]=time.split(':').map(Number),target=Date.UTC(y,m-1,d,h,min),fmt=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
 let guess=target;const values=at=>{const p=fmt.formatToParts(new Date(at)),v=k=>Number(p.find(x=>x.type===k).value);return[v('year'),v('month'),v('day'),v('hour'),v('minute')];};
 for(let i=0;i<4;i++){const [a,b,c,e,f]=values(guess),delta=target-Date.UTC(a,b-1,c,e,f);if(delta===0)return guess;guess+=delta;}
 const out=values(guess);return out.every((n,i)=>n===[y,m,d,h,min][i])?guess:null;
}

export function parseCivilInput(text){
 const value=String(text||'').trim();if(validCivil(value))return value;
 const match=value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/)||value.match(/^(\d{2})(\d{2})(\d{4})$/);if(!match)return '';
 const result=match[3]+'-'+match[2].padStart(2,'0')+'-'+match[1].padStart(2,'0');return validCivil(result)?result:'';
}
export function parseValidityPeriod(text){const m=String(text||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/^(\d{1,5})\s*(dias?|mes|meses)$/);if(!m)return null;const count=Number(m[1]),unit=m[2].startsWith('dia')?'days':'months';return count<=(unit==='days'?36500:1200)?{count,unit}:null;}
export function periodLabel(record){if(record?.mode!=='period'||!Number.isInteger(record.period)||!['days','months'].includes(record.periodUnit))return '';return record.period+' '+(record.periodUnit==='months'?(record.period===1?'Mês':'Meses'):(record.period===1?'Dia':'Dias'));}
export const formatCivil=value=>validCivil(value)?value.split('-').reverse().join('/'):'';
