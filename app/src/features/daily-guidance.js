import {TOPICS} from './advisor/knowledge.js';
const areas=['branding','pdv','crm','kpi'];
const hash=s=>{let n=2166136261;for(const c of String(s||''))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
export const guidanceDay=at=>Math.floor(Date.parse(new Date(at).toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'})+'T00:00:00Z')/86400000);
export function guidanceLibrary(){
 const groups=areas.map(area=>Object.entries(TOPICS).filter(([id,t])=>t.area===area&&id!=='conversao'&&t.what&&t.how?.length).sort(([a],[b])=>a.localeCompare(b)));
 const length=Math.max(...groups.map(g=>g.length)),out=[];
 for(let i=0;i<length;i++)for(const g of groups){if(!g.length)continue;const[id,t]=g[i%g.length];out.push({id,title:t.title,body:'Ideia para Avaliar: '+t.what+' '+t.how[0],area:t.area});}
 return out.slice(0,120);
}
export function dailyPractice(data,{now=Date.now(),area}={}){const items=guidanceLibrary().filter(t=>!area||t.area===area),seed=hash(data.dataContext?.id||'local')%100000;if(!items.length)return null;return items[((guidanceDay(now)+seed)%items.length+items.length)%items.length];}
export function dailyGuidanceConfig(data){return{enabled:data.settings?.dailyGuidanceEnabled===true&&data.dataContext?.type==='real',actorHash:hash(data.dataContext?.id||'local').toString(16),seed:hash(data.dataContext?.id||'local')%100000,topics:guidanceLibrary()};}
