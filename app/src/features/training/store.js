import {createSaveQueue} from '../../native/save-queue.js';
const validData=d=>d?.schema===1&&d.training?.version===1&&d.dataContext?.type==='demo'&&d.training.actorId===d.dataContext.id&&['products','sales','clients','events','movements','expenses'].every(k=>Array.isArray(d[k]));
const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return(h>>>0).toString(16);};
export function encodeRecord(record){const json=JSON.stringify(record);return JSON.stringify({seq:record.seq,length:json.length,checksum:checksum(json)})+'\n'+json;}
export function decodeRecord(raw){try{const i=raw.indexOf('\n'),h=JSON.parse(raw.slice(0,i)),json=raw.slice(i+1),r=JSON.parse(json);if(i<0||h.length!==json.length||h.checksum!==checksum(json)||!Number.isSafeInteger(r.seq)||r.seq<1||h.seq!==r.seq||r.version!==1||typeof r.active!=='boolean'||r.active&&!validData(r.data))return null;return r;}catch{return null;}}
// This journal never receives a production snapshot. A/B commits include the active marker.
export async function createTrainingStore(driver,events={}){
 const slots=await Promise.all(['a','b'].map(k=>driver.read(k))),valid=slots.map(s=>s?decodeRecord(s):null).filter(Boolean).sort((a,b)=>b.seq-a.seq);
 if(!valid.length&&slots.some(s=>s!==null))throw Error('O ambiente de teste não pôde ser conferido. Seus dados reais foram preservados.');
 let current=valid[0]||{version:1,seq:0,active:false,data:null},switching=false;
 async function commit(value){const record={...value,version:1,seq:current.seq+1},key=record.seq%2?'a':'b',raw=encodeRecord(record);await driver.write(key,raw);if(await driver.read(key)!==raw)throw Error('A gravação do modo teste não conferiu.');current=record;}
 const queue=createSaveQueue({write:async json=>{const data=JSON.parse(json);if(!validData(data)||!current.active||data.dataContext.id!==current.data.dataContext.id)throw Error('Contexto de treino inválido.');await commit({active:true,data});},...events});
 return{snapshot:()=>current,save:json=>{try{const d=JSON.parse(json);if(switching||!current.active||!validData(d)||d.dataContext.id!==current.data.dataContext.id)return false;return queue.save(json);}catch{return false;}},durable:()=>queue.durable(),status:()=>queue.status(),
 async enter(data){if(switching||current.active||!validData(data))throw Error('Não foi possível iniciar o modo teste.');switching=true;try{await commit({active:true,data});}catch(e){switching=false;throw e;}},
 async exit(){if(switching||!current.active)throw Error('Modo teste indisponível.');switching=true;try{if(!await queue.durable())throw Error('Aguarde a gravação do treino antes de sair.');await commit({active:false,data:null});await commit({active:false,data:null});}catch(e){switching=false;throw e;}}
 };
}
