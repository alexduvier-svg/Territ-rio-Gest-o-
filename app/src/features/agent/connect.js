// Read-only DTOs. No photos, contact details, imported text, order addresses or second stock store.
import { contextOf } from './core.js';
const recordKeys=['id','actorId','demo','simulation','simulated'];
const pick=(record,keys)=>Object.fromEntries(keys.filter(k=>['string','boolean','number'].includes(typeof record?.[k])).map(k=>[k,record[k]]));
function record(row,keys){const out=pick(row,[...recordKeys,...keys]);if(row.dataContext)out.dataContext=pick(row.dataContext,['id','type']);return out;}
export function readAgentContext(data,{type='analyze',intent='',profile='essential'}={}){
 const simple=type==='index'||intent==='stock',tables=simple?['products']:['products','sales','clients','events','eventLoads','movements'];
 const limit=profile==='balanced'?60000:6000;
 if(tables.reduce((n,k)=>n+(data[k]?.length||0),0)>limit)throw Error('Histórico grande para a análise atual. Consulte o estoque ou os relatórios por período.');
 const ctx=contextOf(data),out={dataContext:{id:ctx.actorId,type:ctx.dataOrigin},settings:{onboarding:data.settings?.onboarding,fairReports:{}},products:[],sales:[],clients:[],events:[],eventLoads:[],movements:[],expenses:[]};
 out.products=(data.products||[]).map(p=>record(p,['name','type','format','unit','weight','volume','stock','min','price','cost','costKnown','active','archived','createdAt']));
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
