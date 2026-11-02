// 148 · bateria de perguntas do "Pergunte sobre seu negócio" respondidas só pelos motores locais
// (sem Gemini e sem internet), sobre os dados de demonstração do próprio app.
import fs from 'node:fs';import vm from 'node:vm';
import {readQuery} from '../app/src/features/agent/read-queries.js';
const root=new URL('../app/',import.meta.url);
const ctx={window:{},console,Date,Math,JSON,Intl};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('src/legacy/erp-core.js',root),'utf8'),ctx);
const data=new ctx.ERP.ERPModel().data;data.settings.onboarding='demo';data.dataContext={id:'qa148',type:'demo'};
const qs=process.argv.slice(2).length?process.argv.slice(2):JSON.parse(fs.readFileSync(new URL('./questions148.json',import.meta.url))).questions;
let answered=0,clar=0,fail=0;const rows=[];
for(const q of qs){let r;try{r=readQuery(data,q,{now:Date.now()});}catch(e){r={error:e.message};}
 const kind=r?.error?'erro':!r?'sem rota':r.needsClarification?'esclarecimento':'resposta';
 if(kind==='resposta')answered++;else if(kind==='esclarecimento')clar++;else fail++;
 rows.push({q,kind,intent:r?.intent,text:(r?.text||r?.error||'').replace(/\s+/g,' ').slice(0,160)});}
for(const r of rows)console.log(`[${r.kind}${r.intent?' · '+r.intent:''}] ${r.q}\n    → ${r.text}`);
console.log(`\nRespondidas ${answered}/${qs.length} · esclarecimento ${clar} · sem rota/erro ${fail}`);
