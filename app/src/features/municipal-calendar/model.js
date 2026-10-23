// Municipal dates are planning references, not sales events, bookings or demand evidence.
export const LIMITS=Object.freeze({dates:240,documents:4,totalBase64:2800000,fileBytes:1000000});
const clean=s=>String(s||'').replace(/[\u0000-\u001f]/g,' ').trim();
const norm=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ');
export const cityKey=(city,uf)=>norm(city)+'|'+clean(uf).toUpperCase();
export function validDay(s){try{return /^\d{4}-\d{2}-\d{2}$/.test(s||'')&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}catch{return false;}}
export const identity=r=>[cityKey(r.city,r.uf),r.start,r.end,norm(r.name)].join('|');
export function normalizeDate(row){
 const name=clean(row.name).slice(0,120),city=clean(row.city).slice(0,80),uf=clean(row.uf).toUpperCase(),start=row.start,end=row.end||start,source=clean(row.source).slice(0,240);
 if(!name||!city||!/^[A-Z]{2}$/.test(uf)||!validDay(start)||!validDay(end)||end<start||!source)throw Error('Informe nome, município, UF, fonte e datas válidas.');
 return {name,city,uf,start,end,source,sourceUid:clean(row.sourceUid).slice(0,180),documentId:clean(row.documentId).slice(0,100),confirmed:true,status:['confirmed','cancelled','to-confirm'].includes(row.status)?row.status:'to-confirm'};
}
export function calendarState(data){const actorId=String(data.dataContext?.id||data.productMemory?.scopeId||''),origin=data.dataContext?.type||'unconfirmed',saved=data.municipalCalendar;return saved?.actorId===actorId&&saved.origin===origin?{...saved,dates:Array.isArray(saved.dates)?saved.dates:[],documents:Array.isArray(saved.documents)?saved.documents:[]}:{version:1,actorId,origin,dates:[],documents:[]};}
export function mergeCalendar(state,rows,document,now=Date.now()){
 const dates=[...state.dates],documents=[...state.documents],seen=new Set(dates.map(identity));let added=0,skipped=0;
 if(document&&!documents.some(d=>d.id===document.id)){
  if(documents.length>=LIMITS.documents||documents.reduce((n,d)=>n+d.base64.length,0)+document.base64.length>LIMITS.totalBase64)throw Error('Limite local de arquivos atingido. Guarde o documento no celular e cadastre apenas as datas.');
  documents.push({...document,addedAt:now});
 }
 for(const row of rows){const value=normalizeDate(row),key=identity(value);if(seen.has(key)){skipped++;continue;}if(dates.length>=LIMITS.dates)throw Error('A agenda comporta até 240 datas confirmadas. Importe um recorte menor.');seen.add(key);dates.push({...value,id:'municipal-'+encodeURIComponent(key),confirmedAt:now});added++;}
 return {state:{...state,dates:dates.sort((a,b)=>a.start.localeCompare(b.start)||a.name.localeCompare(b.name,'pt-BR')),documents},added,skipped};
}
const icsText=s=>s.replace(/\\[nN]/g,' ').replace(/\\([,;\\])/g,'$1');
const dateFrom=s=>{const m=String(s||'').match(/^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/);return m?m[1]+'-'+m[2]+'-'+m[3]:'';};
export function parseCalendarICS(text,context){
 if(typeof text!=='string'||text.length>500000||!/^BEGIN:VCALENDAR\s*$/mi.test(text))throw Error('Escolha um arquivo de agenda .ics válido, até 500 KB.');
 const unfolded=text.replace(/\r?\n[ \t]/g,''),blocks=unfolded.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g)||[];
 if(blocks.length>1000)throw Error('Arquivo muito extenso. Exporte apenas as datas do município.');
 const rows=[],warnings=[];
 for(const block of blocks){const fields={};for(const line of block.split(/\r?\n/)){const at=line.indexOf(':');if(at<0)continue;const full=line.slice(0,at),key=full.split(';')[0].toUpperCase();fields[key]={full,value:line.slice(at+1)};}
  if(fields.RRULE||fields['RECURRENCE-ID']||fields.STATUS?.value==='CANCELLED'){warnings.push('Recorrência, exceção ou data cancelada não importada. Revise manualmente.');continue;}
  let start=dateFrom(fields.DTSTART?.value),end=dateFrom(fields.DTEND?.value)||start;
  if(fields.DTEND?.full.includes('VALUE=DATE')&&validDay(end)){end=new Date(Date.parse(end+'T12:00:00Z')-86400000).toISOString().slice(0,10);}
  try{rows.push(normalizeDate({...context,name:icsText(fields.SUMMARY?.value||''),start,end,sourceUid:fields.UID?.value||''}));}catch{warnings.push('Uma data incompleta ou inválida foi ignorada.');}
 }
 if(rows.length>LIMITS.dates)throw Error('Escolha no máximo 240 datas por importação.');
 return {rows,warnings:[...new Set(warnings)]};
}
export function upcomingMunicipal(data,{city,uf,today,days=30}){
 if(!validDay(today))return [];
 const until=new Date(Date.parse(today+'T12:00:00Z')+Math.min(90,Math.max(1,days))*86400000).toISOString().slice(0,10);
 return calendarState(data).dates.filter(r=>r.confirmed&&r.status!=='cancelled'&&cityKey(r.city,r.uf)===cityKey(city,uf)&&r.end>=today&&r.start<=until).slice(0,6);
}
