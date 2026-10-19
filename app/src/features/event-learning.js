// Operational observations, scoped to an event. Registration time is not purchase time.
const key=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n/100);
const terminal=e=>['finished','closed'].includes(e.status)||!!e.finishedAt||!!e.fairClosedAt;
const matches=(data,r)=>{const type=data.dataContext?.type||data.settings?.onboarding,actor=data.dataContext?.id||data.productMemory?.scopeId;return (!r.actorId||r.actorId===actor)&&(!r.dataContext?.id||r.dataContext.id===actor)&&(!r.dataContext?.type||r.dataContext.type===type)&&(type!=='real'&&type!=='clean'||!r.demo&&!r.simulation&&!r.simulated&&!/^(demo-|exemplo-)/.test(r.id||''));};
export const eventGroup=e=>e.fairId?'fair:'+e.fairId:'local:'+key(e.name)+'|'+key(e.place)+'|'+key(e.city)+'|'+key(e.uf);
export function eventSales(data,id){const seen=new Set();return(data.sales||[]).filter(s=>matches(data,s)&&s.scope===id&&s.status==='completed'&&s.id&&!seen.has(s.id)&&seen.add(s.id));}
export function lastFairSummary(data,current){
 const all=(data.events||[]).filter(e=>matches(data,e)&&e.id!==current.id&&terminal(e)&&e.start<=current.start).sort((a,b)=>b.start.localeCompare(a.start)),same=all.filter(e=>eventGroup(e)===eventGroup(current)),previous=same[0]||all[0];if(!previous)return null;
 const sales=eventSales(data,previous.id),rows=new Map(),load=(data.eventLoads||[]).find(l=>l.eventId===previous.id);
 for(const i of load?.items||[]){const p=data.products.find(p=>p.id===i.productId);if(i.qty>0)rows.set(i.productId,{productId:i.productId,name:i.name||p?.name||'Produto',description:i.description||'',unit:i.unit,quantity:0,revenue:0,loaded:i.qty});}
 for(const s of sales){const items=s.items||[],exact=items.every(i=>Number.isInteger(i.netTotal))&&items.reduce((n,i)=>n+i.netTotal,0)===s.total;let remaining=s.total;items.forEach((i,n)=>{const amount=exact?i.netTotal:n===items.length-1?remaining:Math.min(remaining,Math.round((i.total||0)*(s.subtotal?s.total/s.subtotal:1)));remaining-=amount;const p=data.products.find(p=>p.id===i.productId),r=rows.get(i.productId)||{productId:i.productId,name:i.name||p?.name||'Produto',description:i.description||'',unit:i.unit,quantity:0,revenue:0};r.quantity=Math.round((r.quantity+i.qty)*1000)/1000;r.revenue+=amount;rows.set(i.productId,r);});}
 const ranked=[...rows.values()].sort((a,b)=>b.revenue-a.revenue||a.name.localeCompare(b.name,'pt-BR'));
 return {eventId:previous.id,name:previous.name,day:previous.start,sameGroup:same.length>0,sales:sales.length,total:sales.reduce((n,s)=>n+s.total,0),most:ranked.slice(0,3),least:[...ranked].sort((a,b)=>a.revenue-b.revenue||a.name.localeCompare(b.name,'pt-BR')).slice(0,3),hasLoad:!!load,ranking:'revenue',registrationTimeIgnored:true};
}
export function soldOutProducts(data,eventId){
 const sold=new Map(),sales=eventSales(data,eventId),ids=new Set(sales.map(s=>s.id));for(const s of sales)for(const i of s.items||[])sold.set(i.productId,(sold.get(i.productId)||0)+i.qty);
 const load=(data.eventLoads||[]).find(l=>l.eventId===eventId),out=new Set((load?.items||[]).filter(i=>i.qty>0&&(sold.get(i.productId)||0)>=i.qty).map(i=>i.productId));
 for(const m of data.movements||[])if(m.kind==='sale'&&m.after===0&&ids.has(m.saleId))out.add(m.productId);
 return [...out].map(id=>data.products.find(p=>p.id===id)).filter(Boolean).map(p=>({productId:p.id,name:p.name,unit:p.unit,weight:p.weight||0,format:p.format||'',sold:sold.get(p.id)||0}));
}
export function saveDemandObservation(data,eventId,items,now=Date.now()){
 const event=data.events.find(e=>e.id===eventId);if(!event||!matches(data,event)||!terminal(event))throw Error('Finalize a feira antes de registrar esta observação.');
 const allowed=new Set(soldOutProducts(data,eventId).map(p=>p.productId)),seen=new Set();const rows=items.map(i=>{if(!allowed.has(i.productId)||seen.has(i.productId))throw Error('Produto fora desta conferência.');seen.add(i.productId);const people=i.people===null||i.people===''?null:Number(i.people);if(![true,false,null].includes(i.askedMore)||people!==null&&(!Number.isInteger(people)||people<0||people>10000)||i.askedMore===true&&people===0)throw Error('Informe uma estimativa de pessoas ou escolha Não sei.');return{productId:i.productId,askedMore:i.askedMore,people:i.askedMore===true?people:null};});
 event.demandObservation={version:1,at:new Date(now).toISOString(),source:'producer-estimate',items:rows};return event.demandObservation;
}
export function demandSignals(data,current){
 const events=(data.events||[]).filter(e=>matches(data,e)&&terminal(e)&&eventGroup(e)===eventGroup(current)&&e.id!==current.id),byProduct=new Map();
 for(const e of events)for(const i of e.demandObservation?.items||[]){if(i.askedMore!==true||!Number.isInteger(i.people)||i.people<=0)continue;if(!byProduct.has(i.productId))byProduct.set(i.productId,[]);const rows=byProduct.get(i.productId);if(!rows.some(r=>r.eventId===e.id))rows.push({eventId:e.id,people:i.people});}
 return [...byProduct].filter(([,r])=>r.length>=3).map(([id,rows])=>{const values=rows.map(r=>r.people).sort((a,b)=>a-b),mid=Math.floor(values.length/2),median=values.length%2?values[mid]:(values[mid-1]+values[mid])/2;return{productId:id,name:data.products.find(p=>p.id===id)?.name||'Produto',events:rows.length,estimatedPeople:median,evidence:rows.map(r=>r.eventId),text:'Em '+rows.length+' feiras semelhantes, você registrou procura depois que '+(data.products.find(p=>p.id===id)?.name||'o produto')+' esgotou. A mediana declarada foi de '+median.toLocaleString('pt-BR')+' pessoas. Teste levar um pouco mais e acompanhe sobra e falta; pessoas não equivalem a unidades ou vendas garantidas.'};});
}
export function summaryText(summary){if(!summary)return 'Esta será sua primeira feira com histórico no app.';return summary.name+' · '+summary.sales+' vendas · '+money(summary.total)+'. Mais vendido por valor: '+(summary.most[0]?.name||'sem registro')+'. Menos vendido por valor: '+(summary.least[0]?.name||'sem registro')+'. Considera os registros vinculados ao evento, inclusive os lançados depois, sem comparar horários.';}
