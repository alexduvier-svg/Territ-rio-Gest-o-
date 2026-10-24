// A local workflow ledger, never a second stock/payment/order database.
import {day, validDay} from '../receivables/receivables.js';
const VERSION=1, terminal=p=>['done','cancelled'].includes(p), id=s=>typeof s==='string'&&s.length>0&&s.length<=160;
const hash=value=>{let h=2166136261;for(const c of JSON.stringify(value))h=Math.imul(h^c.charCodeAt(0),16777619);return(h>>>0).toString(16);};
const owner=d=>({actorId:d.actorId,dataOrigin:d.dataOrigin});
const sameOwner=(a,b)=>a?.actorId===b?.actorId&&a?.dataOrigin===b?.dataOrigin;
const reference=row=>[row.kind,row.entityId].join(':');
export const CONTINUITY_VERSION=VERSION;
export function continuityReport(input,previous,now=Date.now(),command={}){
 if(!id(input?.actorId)||!['real','demo','simulation'].includes(input.dataOrigin))throw Error('Confirme a origem dos registros antes de acompanhar tarefas.');
 if(!Array.isArray(input.rows)||input.rows.length>6000)throw Error('Acompanhamento adiado: use as áreas do app para consultar os registros.');
 const old=sameOwner(previous,input)&&previous.version===VERSION?previous:{version:VERSION,...owner(input),records:[],audit:[]};
 const records=new Map(),audit=Array.isArray(old.audit)?old.audit.slice(-160):[],seen=new Set(),today=day(now);
 for(const item of (old.records||[]).slice(-100))if(id(item.key)&&id(item.entityId)&&['order','credit','event'].includes(item.kind)&&typeof item.fingerprint==='string')records.set(item.key,{key:item.key,kind:item.kind,entityId:item.entityId,phase:item.phase,status:item.status,fingerprint:item.fingerprint,firstSeen:item.firstSeen,lastTransitionAt:item.lastTransitionAt,openedFingerprint:item.openedFingerprint||'',completedAt:item.completedAt||0});
 const tasks=[];
 const note=(record,event)=>{audit.push({key:record.key,event,phase:record.phase,status:record.status,sourceFingerprint:record.fingerprint,at:now,result:'verified'});};
 for(const row of input.rows){
  if(!id(row.entityId)||!['order','credit','event'].includes(row.kind))throw Error('Referência de tarefa inválida. Nenhuma operação foi executada.');
  const key=reference(row);if(seen.has(key))throw Error('Há referências duplicadas. Confira os registros antes de continuar.');seen.add(key);
  const prior=records.get(key);let phase,title,detail,action,args={id:row.entityId},due=Infinity,blocked=false,planned=false;
  if(row.kind==='order'){
   const labels={requested:['Novo Pedido','Conferir os produtos e iniciar o preparo.'],preparing:['Pedido Em Preparo','Conferir quando o pedido estiver pronto.'],ready:['Pedido Pronto','Confirmar a retirada ou a saída para entrega.'],out_for_delivery:['Pedido Em Entrega','Confirmar a entrega e a finalização do pedido.']};
   if(row.status==='cancelled')phase='cancelled';else if(row.status==='delivered'||row.registeredDelivery)phase='done';else if(labels[row.status]){phase=row.status;[title,detail]=labels[phase];action='store-orders';due=Number.isFinite(row.createdAt)?row.createdAt:now;}else{phase='invalid';blocked=true;}
  }else if(row.kind==='credit'){
   if(row.status==='returned'||row.status==='cancelled')phase='cancelled';
   else if(row.status!=='completed'||!row.integrity){phase='invalid';blocked=true;}
   else if(row.balance===0)phase='done';
   else if(!validDay(row.dueDate)){phase='invalid';blocked=true;}
   else{phase='receivable';title=row.dueDate<today?'Fiado Em Atraso':'Conferir Fiado';detail='Data combinada: '+row.dueDate.split('-').reverse().join('/')+'. Confirmar o recebimento exige sua decisão.';due=Date.parse(row.dueDate+'T09:00:00-03:00');planned=row.dueDate>today;action='receivable-open';}
  }else{
   const life=row.lifecycle;if(!life||typeof life.closed!=='boolean'){phase='invalid';blocked=true;}
   else if(life.cancelled)phase='cancelled';else if(life.closed)phase='done';
   else if(!Number.isFinite(row.startAt)||!Number.isFinite(row.endAt)||row.endAt<=row.startAt){phase='invalid';blocked=true;}
   else if(life.pending||now>=row.endAt){phase='review';title='Conferir o Evento';detail='Rever reposições, vendas não registradas e perdas, antes de encerrar.';action='event-detail';due=row.endAt;}
   else if(now>=row.startAt){phase='ongoing';title='Evento em Andamento';detail='Acompanhar a carga e as operações registradas neste evento.';action='event-detail';due=row.endAt;}
   else{phase=row.hasLoad?'prepared':'preparation';title=row.hasLoad?'Carga do Evento Salva':'Preparar o Evento';detail=row.hasLoad?'A carga está registrada. Confira o evento antes de sair.':'Informar o que vai levar, respeitando estoque e reservas.';action=row.hasLoad?'event-detail':'event-load';due=row.startAt;planned=row.startAt-now>5*86400000;}
  }
  const fingerprint=hash([row,phase]);
  if((terminal(phase)||planned)&&!prior)continue;
  const record={key,kind:row.kind,entityId:row.entityId,phase,status:terminal(phase)?phase:blocked?'blocked':planned?'planned':prior?.openedFingerprint===fingerprint?'waiting':'pending',fingerprint,firstSeen:prior?.firstSeen||now,lastTransitionAt:prior?.lastTransitionAt||now,openedFingerprint:prior?.openedFingerprint||'',completedAt:terminal(phase)?prior?.completedAt||now:0};
  if(!prior||prior.fingerprint!==fingerprint||prior.status!==record.status){record.lastTransitionAt=now;note(record,!prior?'connected':terminal(phase)?'completion-verified':'source-rechecked');}
  records.set(key,record);
  if(blocked){title='Conferir Integridade';detail='Dados incompletos impedem concluir esta tarefa. Abra a área de origem para conferir.';action=row.kind==='order'?'store-orders':row.kind==='credit'?'receivables':'event-detail';args=row.kind==='credit'?{}:args;}
  tasks.push({...record,title:title||(phase==='cancelled'?'Cancelada':'Concluída'),detail:detail||'Estado confirmado pelo registro de origem.',action:terminal(phase)?null:action,args,due,blocked});
 }
 for(const [key,prior]of records)if(!seen.has(key)&&!terminal(prior.phase)){
  const record={...prior,phase:'missing',status:'blocked',fingerprint:hash([key,'missing'])};if(prior.phase!=='missing'){record.lastTransitionAt=now;note(record,'source-missing');}records.set(key,record);tasks.push({...record,title:'Conferir a Origem',detail:'O registro não foi encontrado neste contexto. A tarefa não foi considerada concluída.',action:null,args:{},due:0,blocked:true});
 }
 let target=null;
 if(command.key){
  target=tasks.find(t=>t.key===command.key);
  if(!target||terminal(target.phase)||target.status==='planned'||target.blocked||!target.action||target.fingerprint!==command.fingerprint)throw Error('A pendência mudou. Atualize a lista antes de continuar.');
  if(command.operation==='opened'&&records.get(target.key).openedFingerprint!==target.fingerprint){const item=records.get(target.key);item.openedFingerprint=target.fingerprint;item.status='waiting';item.lastTransitionAt=now;note(item,'action-opened-verified');Object.assign(target,item);}
  else if(command.operation==='validate'){const last=audit.at(-1);if(last?.key!==target.key||last?.event!=='action-validated'||last?.sourceFingerprint!==target.fingerprint)note(records.get(target.key),'action-validated');}
  else if(command.operation!=='opened')throw Error('Ação de acompanhamento não autorizada.');
 }
 const active=tasks.filter(t=>!terminal(t.phase)&&t.status!=='planned').sort((a,b)=>Number(b.blocked)-Number(a.blocked)||a.due-b.due||a.key.localeCompare(b.key));
 const history=tasks.filter(t=>terminal(t.phase)).sort((a,b)=>b.completedAt-a.completedAt);
 const retained=[...records.values()].sort((a,b)=>Number(terminal(a.phase))-Number(terminal(b.phase))||b.lastTransitionAt-a.lastTransitionAt).slice(0,100);
 const memory={version:VERSION,...owner(input),records:retained,audit:audit.slice(-160)};
 return{memory,changed:JSON.stringify(memory)!==JSON.stringify(old),tasks:active,history,counts:{pending:active.filter(t=>t.status!=='waiting').length,waiting:active.filter(t=>t.status==='waiting').length,done:history.filter(t=>t.phase==='done').length},target,checkedAt:now};
}
