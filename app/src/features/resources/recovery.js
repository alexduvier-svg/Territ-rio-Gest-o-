export const RECOVERY_VERSION=1,MAX_RECOVERY_BYTES=128*1024;
// IDs and operation keys, never a reconstructed stock balance or a financial result.
export function recoveryRecord(snapshot,now=Date.now()){
 const record={version:RECOVERY_VERSION,savedAt:now,entry:snapshot?JSON.parse(JSON.stringify(snapshot)):null};
 const raw=JSON.stringify(record);if(new TextEncoder().encode(raw).length>MAX_RECOVERY_BYTES)throw Error('Rascunho muito grande para a recuperação automática.');return record;
}
export function inspectRecovery(record,{actorId,productIds,sales=[]}){
 if(record?.version!==RECOVERY_VERSION||!record.entry)return{status:'empty'};
 const e=record.entry,d=e.draft;if(e.actorId!==actorId)return{status:'other_actor'};
 if(!d&&e.form&&['product','client','business','event-load'].includes(e.form.kind)&&e.form.value&&typeof e.form.value==='object')return{status:'form',entry:JSON.parse(JSON.stringify(e))};
 if(!d||typeof d.operationId!=='string'||!d.operationId||!Array.isArray(d.items)||!d.items.length||d.items.length>200)return{status:'invalid'};
 const sale=sales.find(s=>s.operationId===d.operationId);if(sale)return{status:'committed',saleId:sale.id};
 if(d.items.some(i=>!productIds.includes(i.productId)||typeof i.rawQty!=='string'||i.rawQty.length>32))return{status:'unavailable'};
 return{status:'draft',entry:JSON.parse(JSON.stringify(e))};
}
export function installRecovery(){
 const b=window.TerritorioWorkflowBridge;if(!b?.recovery)return;const native=window.TerritorioNative?.recovery,key='territorio-recovery-v1';let timer=0,last='',warned=false,ready=false;
 const read=()=>{try{return native?.initialRecord||JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
 const write=async record=>{const raw=JSON.stringify(record);if(native){if(!native.save(raw))return false;return native.durable();}try{localStorage.setItem(key,raw);return localStorage.getItem(key)===raw;}catch{return false;}};
 async function flush(){clearTimeout(timer);timer=0;if(!ready)return true;try{const snapshot=b.recovery.capture(),fingerprint=JSON.stringify(snapshot);if(last===fingerprint)return native?native.durable():true;const record=recoveryRecord(snapshot);const ok=await write(record);if(ok){last=fingerprint;warned=false;}else if(!warned){warned=true;b.toast('Não foi possível guardar o rascunho. Libere espaço antes de continuar.');}return ok;}catch{if(!warned){warned=true;b.toast('A recuperação do rascunho está pendente. Confira o espaço do aparelho.');}return false;}}
 const schedule=()=>{if(!ready)return;clearTimeout(timer);timer=setTimeout(()=>void flush(),300);};
 const prior=read();ready=true;
 if(prior?.entry){const outcome=b.recovery.restore(prior);if(outcome==='other_actor'){last=JSON.stringify(b.recovery.capture());}else void flush();}
 else last=JSON.stringify(b.recovery.capture());
 for(const type of ['input','change','click','keyup'])document.addEventListener(type,schedule);
 new MutationObserver(schedule).observe(document.getElementById('app'),{childList:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)void flush();});window.addEventListener('pagehide',()=>void flush());window.addEventListener('territorio:pause',()=>void flush());
 window.TerritorioRecovery=Object.freeze({flush,snapshot:()=>b.recovery.capture(),diagnostics:()=>({ready,pending:!!timer||!!native?.status?.().pending,failed:warned})});
}
