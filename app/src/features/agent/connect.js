import {balance,principal,paid} from '../receivables/receivables.js';
import {activeOrders} from '../followups.js';
import {hasEventLoad} from '../event-experience/model.js';
// Read-only DTOs. No photos, contact details, imported text, order addresses or second stock store.
import { contextOf } from './core.js';
import {scopedLots,orderHolds} from '../stock-lots/reservations.js';
const recordKeys=['id','actorId','demo','simulation','simulated'];
const pick=(record,keys)=>Object.fromEntries(keys.filter(k=>['string','boolean','number'].includes(typeof record?.[k])).map(k=>[k,record[k]]));
function record(row,keys){const out=pick(row,[...recordKeys,...keys]);if(row.dataContext)out.dataContext=pick(row.dataContext,['id','type']);return out;}
export function readAgentContext(data,{type='analyze',intent='',profile='essential',scopeId='all'}={}){
 const simple=type==='index'||intent==='stock',tables=simple?['products']:['products','sales','clients','events','eventLoads','movements'];
 const limit=profile==='balanced'?60000:6000;
 if(tables.reduce((n,k)=>n+(data[k]?.length||0),0)>limit)throw Error('Histórico grande para a análise atual. Consulte o estoque ou os relatórios por período.');
 const ctx=contextOf(data),out={dataContext:{id:ctx.actorId,type:ctx.dataOrigin},settings:{onboarding:data.settings?.onboarding,fairReports:{}},products:[],sales:[],clients:[],events:[],eventLoads:[],movements:[],expenses:[]};
 out.products=(data.products||[]).map(p=>record(p,['name','type','format','unit','weight','volume','stock','min','price','cost','costKnown','active','archived','createdAt']));
 if(data.stockLotsVersion===1)out.products=out.products.map(p=>({...p,physicalStock:p.stock,stock:Math.max(0,Math.round((scopedLots(data,p.id,{scope:scopeId}).available-orderHolds(data,p.id))*1000)/1000)}));
 if(simple)return out;
 let items=0;
 out.sales=(data.sales||[]).map(s=>{items+=s.items?.length||0;if(items>limit*3)throw Error('Muitas apresentações para esta análise. Use um relatório por período.');return {...record(s,['date','registeredAt','returnedAt','status','scope','customerType','recipientType','customerId','total','subtotal','discount','cost']),items:(s.items||[]).map(i=>pick(i,['productId','qty','unit','total','netTotal','cost','costTotal','costKnown']))};});
 out.clients=(data.clients||[]).map(c=>record(c,['noticeConsent']));
 out.events=(data.events||[]).map(e=>({...record(e,['name','start','end','from','until','fairId','agentComparableGroup','surplusCheckAt']),surplusCheck:{conferido:e.surplusCheck?.conferido===true}}));
 out.eventLoads=(data.eventLoads||[]).map(l=>({...record(l,['eventId']),items:(l.items||[]).map(i=>pick(i,['productId','name','qty','unit']))}));
 out.movements=(data.movements||[]).map(m=>record(m,['eventId','productId','kind','qty','date']));
 for(const e of out.events){const counts=data.settings?.fairReports?.[e.id]?.counts;if(counts)out.settings.fairReports[e.id]={counts:Object.fromEntries(Object.entries(counts).filter(([,v])=>Number.isFinite(v)))};}
 out.agent={actorId:ctx.actorId,settings:pick(data.agent?.settings,['rebuy','fairMinimumEvents','fairSurplusRatio','stagnantDays']),feedback:{}};
 out.agent.settings.excludedProducts=(data.agent?.settings?.excludedProducts||[]).filter(x=>typeof x==='string').slice(0,limit);
 for(const [id,f] of Object.entries(data.agent?.feedback||{}).slice(-200))out.agent.feedback[id]=pick(f,['fingerprint','status','until']);
 if(JSON.stringify(out).length>(profile==='balanced'?8:1)*1024*1024)throw Error('Análise adiada para poupar memória. Use as consultas diretas do app.');
 return out;
}

// Bounded DTO for the shared local worker; no addresses, names, photos, phone or GPS.
export function readContinuityContext(data,{lifecycle,profile='essential'}={}){
 const ctx=contextOf(data),count=(data.sales?.length||0)+(data.events?.length||0)+(data.onlineShop?.orders?.length||0)+(data.eventLoads?.length||0);
 if(count>6000)throw Error('Histórico grande para o acompanhamento automático. Consulte as áreas de origem.');
 const rows=[],own=r=>(!r.actorId||r.actorId===ctx.actorId)&&(!r.dataContext?.id||r.dataContext.id===ctx.actorId)&&(!r.dataContext?.type||r.dataContext.type===ctx.dataOrigin)&&(ctx.dataOrigin!=='real'||!r.demo&&!r.simulation&&!r.simulated&&!/^(demo-|exemplo-)/.test(r.id||''));
 const shop=data.onlineShop,shopActor=data.dataContext?.id||data.productMemory?.scopeId;
 if(shop?.actorId===shopActor&&shop.slug===data.portfolio?.slug){const active=new Set(activeOrders(data).map(o=>o.id));for(const o of shop.orders||[])if(own(o))rows.push({kind:'order',entityId:o.id,status:o.status,createdAt:typeof o.createdAt==='number'?o.createdAt:Date.parse(o.createdAt),updatedAt:o.updatedAt||null,registeredDelivery:!active.has(o.id)&&!['delivered','cancelled'].includes(o.status)});}
 for(const sale of data.sales||[])if(own(sale)&&(sale.payments||[]).some(p=>p.method==='Fiado')){const total=principal(sale),received=paid(sale);rows.push({kind:'credit',entityId:sale.id,status:sale.status,dueDate:sale.credit?.dueDate||'',balance:balance(sale),integrity:Number.isSafeInteger(total)&&total>0&&Number.isSafeInteger(received)&&received>=0&&received<=total&&(sale.payments||[]).every(p=>p.method!=='Fiado'||Number.isSafeInteger(p.amount)&&p.amount>0)&&(sale.credit?.receipts||[]).every(p=>Number.isSafeInteger(p.amount)&&p.amount>0)});}
 for(const event of data.events||[])if(own(event)){if(typeof lifecycle!=='function')throw Error('Conferência do evento indisponível.');const phase=lifecycle(event.id),load=(data.eventLoads||[]).find(l=>l.eventId===event.id);rows.push({kind:'event',entityId:event.id,lifecycle:phase,startAt:Date.parse(event.start+'T'+(event.from||'00:00')+':00-03:00'),endAt:Date.parse((event.end||event.start)+'T'+(event.until||'23:59')+':00-03:00'),hasLoad:hasEventLoad(data,event.id),loadStamp:load?.updatedAt||null,preparationStamp:event.preparation?.updatedAt||null});}
 return{...ctx,rows};
}
