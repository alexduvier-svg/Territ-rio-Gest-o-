// Versioned public stock protocol: no private lot identities or inferred dates.
export const LOT_AVAILABILITY_VERSION=1;
export function lotShopCapabilities(env){return{version:1,available:!!env.SHOPS,lotAvailability:LOT_AVAILABILITY_VERSION};}
const round=n=>Math.round(n*1000)/1000;
const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&s>='1900-01-01'&&s<='2199-12-31'&&Number.isFinite(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const quantity=n=>Number.isFinite(n)&&n>=0&&n<=10000000&&round(n)===n;
function invalid(){const e=Error('Confira os lotes e atualize a disponibilidade no aplicativo.');e.status=400;throw e;}
export function normalizeLotSegments(rows){
 if(!Array.isArray(rows)||rows.length>512)invalid();
 return rows.map(s=>{if(!s||!quantity(s.quantity)||s.expiresOn&&!validDay(s.expiresOn)||s.expiryMonth&&(!/^\d{4}-\d{2}$/.test(s.expiryMonth)||!validDay(s.expiryMonth+'-01'))||s.expiresOn&&s.expiryMonth)invalid();return{quantity:s.quantity,expiresOn:s.expiresOn||'',expiryMonth:s.expiryMonth||''};});
}
export function normalizeLotStock(raw,stock,homeStock){
 if(raw===undefined)return undefined;
 if(!raw||raw.version!==LOT_AVAILABILITY_VERSION||typeof raw.zone!=='string'||raw.zone.length>80||!quantity(raw.localHeld)||!quantity(raw.unidentifiedHeld))invalid();
 try{new Intl.DateTimeFormat('en',{timeZone:raw.zone}).format(0);}catch{invalid();}
 const segments=normalizeLotSegments(raw.segments),homeSegments=normalizeLotSegments(raw.homeSegments),total=segments.reduce((n,s)=>round(n+s.quantity),0),home=homeSegments.reduce((n,s)=>round(n+s.quantity),0);
 if(home>total||total>round(stock+raw.localHeld)||home>round(homeStock+raw.localHeld+raw.unidentifiedHeld))invalid();
 // Every home segment must be a subset of the global pool with the same date.
 const global=new Map();for(const s of segments){const k=s.expiresOn+'|'+s.expiryMonth;global.set(k,round((global.get(k)||0)+s.quantity));}
 for(const s of homeSegments){const k=s.expiresOn+'|'+s.expiryMonth;global.set(k,round((global.get(k)||0)-s.quantity));if(global.get(k)<0)invalid();}
 return{version:1,zone:raw.zone,segments,homeSegments,localHeld:raw.localHeld,unidentifiedHeld:raw.unidentifiedHeld};
}
function localDay(at,zone){const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at)),v=k=>p.find(p=>p.type===k).value;return v('year')+'-'+v('month')+'-'+v('day');}
export function eligibleSegments(segments,onDay){return round((segments||[]).filter(s=>(!s.expiresOn||s.expiresOn>=onDay)&&(!s.expiryMonth||s.expiryMonth>=onDay.slice(0,7))).reduce((n,s)=>n+s.quantity,0));}
export function lotChannelCaps(product,event,now=Date.now()){
 const l=product.lotStock;if(!l)return{global:product.stock,channel:event?(event.products.find(i=>i.productId===product.productId)?.quantity||0):(product.homeStock??product.stock)};
 const today=localDay(now,l.zone),day=event&&event.end>today?event.end:today,global=Math.max(0,Math.min(product.stock,round(eligibleSegments(l.segments,day)-l.localHeld)));
 if(event){const row=event.products.find(i=>i.productId===product.productId);return{global,channel:Math.max(0,Math.min(row?.quantity||0,eligibleSegments(row?.lotSegments||[],day)))};}
 return{global,channel:Math.max(0,Math.min(product.homeStock??product.stock,round(eligibleSegments(l.homeSegments,day)-l.localHeld-l.unidentifiedHeld)))};
}
