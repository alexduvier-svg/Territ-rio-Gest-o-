// Lot quantities are allocations of canonical stock movements, never a second writable balance.
import {normalizeValidity,validityState,civilDay,validCivil} from './validity.js';
const indexes=new WeakMap(),round=n=>Math.round(n*1000)/1000,validQty=n=>Number.isFinite(n)&&n>=0&&Number.isSafeInteger(Math.round(n*1000))&&Math.abs(n-round(n))<1e-8;
const owner=d=>d.dataContext?.id||d.productMemory?.scopeId||'';
const fail=(rule,message='Confira os lotes antes de movimentar o estoque.')=>{const e=Error(message);e.code='LOT_AUDIT';e.ruleId='lots.'+rule;throw e;};
const id=v=>typeof v==='string'&&v.length>0&&v.length<=240;
export function invalidateLots(data){indexes.delete(data);}
export function lotMovements(data,productId){return index(data).byProduct.get(productId)||[];}
export function initializeLots(data,now=Date.now()){
 const issues=[];let changed=false;
 if(data.stockLotsVersion>1)return{changed:false,issues:[{rule:'newer-version'}]};
 const accounted=new Set((data.movements||[]).filter(m=>m.lotAccounting).map(m=>m.productId));
 if(data.stockLotsVersion!==1&&accounted.size)return{changed:false,issues:[{rule:'missing-version'}]};
 for(const p of data.products||[])if(!p.lotOrigin){
  if(!id(p.id)||!validQty(p.stock)||accounted.has(p.id)||p.actorId&&p.actorId!==owner(data)){issues.push({productId:p.id,rule:'origin-needs-review'});continue;}
  p.lotOrigin={version:1,id:'origin:'+p.id,actorId:owner(data),quantity:p.stock,unit:p.unit,validity:normalizeValidity(),recordedAt:new Date(now).toISOString(),legacy:true,epoch:1};changed=true;
 }
 if(data.stockLotsVersion!==1){data.stockLotsVersion=1;changed=true;}if(!Number.isSafeInteger(data.stockLotsRevision)||data.stockLotsRevision<0){data.stockLotsRevision=0;changed=true;}
 if(changed)invalidateLots(data);return{changed,issues};
}
function index(data){
 let ix=indexes.get(data);if(ix&&ix.ref===data.movements&&ix.length===(data.movements?.length||0)&&ix.revision===data.stockLotsRevision)return ix;
 if((data.movements?.length||0)>200000)fail('capacity','Histórico grande para conferir os lotes neste aparelho. Consulte a revisão do estoque.');
 const byProduct=new Map(),duplicates=new Set(),movementIds=new Set();for(const m of data.movements||[]){if(movementIds.has(m.id))duplicates.add(m.id);movementIds.add(m.id);if(m.lotAccounting){if(!byProduct.has(m.productId))byProduct.set(m.productId,[]);byProduct.get(m.productId).push(m);}}
 for(const rows of byProduct.values())rows.sort((a,b)=>(b.lotAccounting.revision??-1)-(a.lotAccounting.revision??-1));
 ix={ref:data.movements,length:data.movements?.length||0,revision:data.stockLotsRevision,byProduct,duplicates,movementIds,cache:new Map()};indexes.set(data,ix);return ix;
}
function physicalLots(data,productId){
 const ix=index(data),p=data.products?.find(p=>p.id===productId);if(!p)fail('identity','Produto não encontrado.');
 const cached=ix.cache.get(productId);if(cached&&cached.stock===p.stock&&cached.origin===p.lotOrigin)return cached;
 const errors=[],rows=new Map(),refs=new Map(),error=rule=>errors.push(rule),add=(receipt,quantity,location)=>{
  if(!receipt||!id(receipt.id)||rows.has(receipt.id)||!validQty(quantity)||receipt.actorId!==owner(data)||receipt.unit!==p.unit||receipt.receivedOn&&!validCivil(receipt.receivedOn)){error('receipt-identity');return;}
  let validity;try{validity=normalizeValidity(receipt.validity||{});}catch{error('validity');return;}
  rows.set(receipt.id,{id:receipt.id,productId:p.id,unit:p.unit,received:quantity,remaining:quantity,validity,quarantined:receipt.quarantined===true,rootLotId:receipt.rootLotId||receipt.id,recordedAt:receipt.recordedAt||'',dateConfirmedOn:receipt.dateConfirmedOn||'',legacy:receipt.legacy===true,receivedOn:receipt.receivedOn||''});refs.set(receipt.id,location);
 };
 if(p.actorId&&p.actorId!==owner(data))error('product-owner');
 if(data.stockLotsVersion!==1||!p.lotOrigin)error('origin');else add(p.lotOrigin,p.lotOrigin.quantity,{kind:'origin',product:p,receipt:p.lotOrigin});
 const movements=(ix.byProduct.get(productId)||[]).filter(m=>(m.lotAccounting.epoch||1)===(p.lotOrigin?.epoch||1));
 for(const m of movements){const a=m.lotAccounting,delta=round(m.after-m.before);if(a.version!==1||a.actorId!==owner(data)||m.unit!==p.unit||!validQty(m.qty)||!validQty(m.before)||!validQty(m.after)||Math.abs(delta)!==m.qty||ix.duplicates.has(m.id)){error('movement');continue;}
  const receipts=a.receipts||[],allocations=a.allocations||[];
  if(!Array.isArray(receipts)||!Array.isArray(allocations)){error('allocation-schema');continue;}
  if(delta>0){if(allocations.length||round(receipts.reduce((n,r)=>n+(validQty(r.quantity)?r.quantity:NaN),0))!==delta)error('receipt-total');for(const r of receipts)add(r,r.quantity,{kind:'movement',movement:m,receipt:r});}
  else if(delta<0){if(receipts.length||round(allocations.reduce((n,r)=>n+(validQty(r.quantity)?r.quantity:NaN),0))!==-delta)error('allocation-total');}
  else if(receipts.length||allocations.length)error('zero-movement');
 }
 for(const m of movements)if(m.after<m.before){const seen=new Set();for(const allocation of Array.isArray(m.lotAccounting.allocations)?m.lotAccounting.allocations:[]){const row=rows.get(allocation.lotId);if(!row||seen.has(allocation.lotId)||!validQty(allocation.quantity)||allocation.quantity<=0){error('allocation-reference');continue;}seen.add(allocation.lotId);row.remaining=round(row.remaining-allocation.quantity);if(row.remaining<0)error('negative-lot');}}
 const lots=[...rows.values()],computed=round(lots.reduce((n,l)=>n+l.remaining,0));if(!validQty(p.stock)||computed!==p.stock)error('physical-total');
 const result={stock:p.stock,origin:p.lotOrigin,lots,refs,computed,errors:[...new Set(errors)]};ix.cache.set(productId,result);return result;
}
export function lotSnapshot(data,productId,onDay=civilDay()){
 const r=physicalLots(data,productId),lots=r.lots.map(l=>({...l,validity:{...l.validity},status:validityState(l.validity,onDay)}));
 return{productId,onDay,physical:r.stock,computed:r.computed,issues:r.errors.slice(),lots,available:r.errors.length?0:round(lots.filter(l=>!l.quarantined&&!l.status.blocking&&(!l.receivedOn||l.receivedOn<=onDay)).reduce((n,l)=>n+l.remaining,0))};
}
export function allocateLots(snapshot,quantity,{commercial=true,selections}={}){
 if(snapshot.issues.length)fail('integrity');if(!validQty(quantity)||quantity<=0)fail('quantity','Informe uma quantidade válida.');
 const eligible=l=>l.remaining>0&&(!commercial||!l.quarantined&&!l.status.blocking&&(!l.receivedOn||l.receivedOn<=(snapshot.onDay||civilDay()))),available=snapshot.lots.filter(eligible);
 if(selections){if(!Array.isArray(selections)||!selections.length)fail('selection');const used=new Set(),result=[],whole=!['kg','g','Litro','ml'].includes(snapshot.lots[0]?.unit);for(const s of selections){const l=available.find(l=>l.id===s.lotId);if(!l||used.has(s.lotId)||!validQty(s.quantity)||whole&&!Number.isInteger(s.quantity)||s.quantity<=0||s.quantity>l.remaining)fail('selection','O lote selecionado não tem quantidade elegível suficiente. Confira também a unidade.');used.add(s.lotId);result.push({lotId:l.id,quantity:s.quantity});}if(round(result.reduce((n,r)=>n+r.quantity,0))!==quantity)fail('selection-total','A soma dos lotes precisa corresponder à quantidade.');return result;}
 // Undated lots remain explicitly unknown; they are not labelled fresher or safer.
 available.sort((a,b)=>(a.status.expiresOn||'9999').localeCompare(b.status.expiresOn||'9999')||a.recordedAt.localeCompare(b.recordedAt)||a.id.localeCompare(b.id));
 let remaining=quantity;const result=[];for(const l of available){const take=Math.min(l.remaining,remaining);if(take>0)result.push({lotId:l.id,quantity:take});remaining=round(remaining-take);if(!remaining)break;}
 if(remaining>0)fail('insufficient',commercial?'Quantidade maior que o estoque elegível. Lotes vencidos ou em avaliação não podem ser vendidos.':'A quantidade é maior que o saldo físico dos lotes.');return result;
}
function newReceipt(data,m,quantity,validity,at,suffix='',extra={}){return{version:1,id:'lot:'+m.id+(suffix?':'+suffix:''),actorId:owner(data),unit:m.unit,quantity,validity,recordedAt:new Date(at).toISOString(),dateConfirmedOn:validity.confirmed?civilDay(at):'',...extra};}
export function prepareLotMovements(data,moves,{now=Date.now(),effectiveDay=civilDay(now),allocator,scopeSnapshot}={}){
 if(data.stockLotsVersion!==1)fail('version');const seen=new Set(),movementIds=new Set(),changes=[];
 for(const m of moves){if(!['initial','add','sale','return','loss','correct'].includes(m.kind)||movementIds.has(m.id))fail('movement-kind-or-id');movementIds.add(m.id);if(seen.has(m.productId))fail('duplicate-product');seen.add(m.productId);const p=data.products?.find(p=>p.id===m.productId),day=m.lotEffectiveDay||effectiveDay,event=m.eventId&&data.events?.find(e=>e.id===m.eventId);
  if(!validCivil(day)||day>civilDay(now)||day!==effectiveDay&&(!m.lotOccurrenceConfirmed||!event||day<event.start||day>event.end))fail('effective-day','Confirme a data em que a movimentação aconteceu, dentro do período da feira.');
  const before=lotSnapshot(data,m.productId,day),delta=round(m.after-m.before);
  if(index(data).movementIds.has(m.id))fail('duplicate-movement');
  if(!p||m.before!==p.stock||m.unit!==p.unit||before.issues.length||!id(m.id)||!validQty(m.qty)||!validQty(m.after)||Math.abs(delta)!==m.qty)fail('movement-input');
  let receipts=[],allocations=[];
  if(delta>0&&m.kind==='return'){
   const original=(data.movements||[]).find(x=>x.kind==='sale'&&x.saleId===m.saleId&&x.productId===m.productId),prior=original?.lotAccounting?.allocations;
   if(prior&&round(prior.reduce((n,a)=>n+a.quantity,0))===delta){receipts=prior.map((a,i)=>{const source=before.lots.find(l=>l.id===a.lotId);if(!source)fail('return-origin');return newReceipt(data,m,a.quantity,{...source.validity},now,String(i),{quarantined:true,receivedOn:civilDay(now),rootLotId:source.rootLotId,sourceLotId:source.id,dateConfirmedOn:source.dateConfirmedOn});});}
   else receipts=[newReceipt(data,m,delta,normalizeValidity(),now,'',{quarantined:true,receivedOn:civilDay(now),sourceSaleId:m.saleId||''})];
  }else if(delta>0){const validity=normalizeValidity(m.lotInput||{}),reference=validity.mode==='period'&&validity.referenceType==='received'?validity.referenceOn:'',receivedOn=m.lotInput?.receivedOn||reference||'';if(receivedOn&&(!validCivil(receivedOn)||receivedOn>civilDay(now))||reference&&receivedOn!==reference)fail('receipt-day','Confira a data efetiva da entrada e a referência do recebimento.');if(validity.manufacturedOn&&(validity.manufacturedOn>civilDay(now)||receivedOn&&validity.manufacturedOn>receivedOn||validity.expiresOn&&validity.manufacturedOn>validity.expiresOn))fail('production-day','Confira a produção, o recebimento e o vencimento informados.');receipts=[newReceipt(data,m,delta,validity,now,'',{receivedOn})];}
  else if(delta<0){if(m.lotInput)fail('negative-validity','Edite a validade no lote, sem alterar o saldo para isso.');const scope=m.eventId||m.scope||'all',choices=scopeSnapshot?scopeSnapshot(data,m.productId,{scope,onDay:day}):before;if(m.kind==='sale'&&day<civilDay(now)&&!m.lotSelections&&choices.lots.filter(l=>l.remaining>0&&!l.quarantined&&!l.status.blocking&&(!l.receivedOn||l.receivedOn<=day)).length>1)fail('historic-selection','Há mais de um lote elegível para essa venda antiga. Informe quais lotes foram vendidos.');allocations=allocator?allocator(data,m.productId,-delta,{scope,onDay:day,commercial:m.kind==='sale',selections:m.lotSelections}):allocateLots(before,-delta,{commercial:m.kind==='sale',selections:m.lotSelections});}
  const accounting={version:1,epoch:p.lotOrigin.epoch||1,actorId:owner(data),revision:data.stockLotsRevision+1,effectiveDay:day,receipts,allocations};changes.push({movement:m,productId:p.id,before:p.stock,after:m.after,previous:m.lotAccounting,previousInput:m.lotInput,previousSelections:m.lotSelections,accounting});
 }
 return{version:1,actorId:owner(data),revision:data.stockLotsRevision,changes};
}
export function applyLotPlan(data,plan){
 if(plan.actorId!==owner(data)||plan.revision!==data.stockLotsRevision)fail('stale','O estoque mudou. Confira os lotes novamente.');
 for(const c of plan.changes){const p=data.products.find(p=>p.id===c.productId);if(p?.stock!==c.after||!data.movements.includes(c.movement))fail('commit-order');}
 for(const c of plan.changes){c.movement.lotAccounting=c.accounting;delete c.movement.lotInput;delete c.movement.lotSelections;}
 data.stockLotsRevision++;
 const ix=indexes.get(data);if(ix){for(const c of plan.changes){const rows=ix.byProduct.get(c.productId)||[];rows.unshift(c.movement);ix.byProduct.set(c.productId,rows);ix.movementIds.add(c.movement.id);
   const old=ix.cache.get(c.productId),product=data.products.find(p=>p.id===c.productId);
   if(old&&old.stock===c.before&&old.origin===product.lotOrigin&&!old.errors.length){
    const used=new Map(c.accounting.allocations.map(a=>[a.lotId,a.quantity])),lots=old.lots.map(l=>used.has(l.id)?{...l,remaining:round(l.remaining-used.get(l.id))}:l),refs=new Map(old.refs);
    for(const r of c.accounting.receipts){lots.push({id:r.id,productId:c.productId,unit:r.unit,received:r.quantity,remaining:r.quantity,validity:r.validity,quarantined:r.quarantined===true,rootLotId:r.rootLotId||r.id,recordedAt:r.recordedAt||'',dateConfirmedOn:r.dateConfirmedOn||'',legacy:r.legacy===true,receivedOn:r.receivedOn||''});refs.set(r.id,{kind:'movement',movement:c.movement,receipt:r});}
    const computed=round(lots.reduce((n,l)=>n+l.remaining,0)),errors=computed!==c.after||lots.some(l=>!validQty(l.remaining))?['physical-total']:[];ix.cache.set(c.productId,{stock:c.after,origin:product.lotOrigin,lots,refs,computed,errors});
   }else ix.cache.delete(c.productId);
  }ix.ref=data.movements;ix.length=data.movements.length;ix.revision=data.stockLotsRevision;}
}
export function verifyLotPlan(data,plan){for(const c of plan.changes){const r=lotSnapshot(data,c.productId);if(r.issues.length||r.physical!==c.after||c.movement.lotAccounting!==c.accounting)fail('postcommit');}}
export function rollbackLotPlan(data,plan){for(const c of plan.changes){if(c.previous===undefined)delete c.movement.lotAccounting;else c.movement.lotAccounting=c.previous;if(c.previousInput!==undefined)c.movement.lotInput=c.previousInput;if(c.previousSelections!==undefined)c.movement.lotSelections=c.previousSelections;}data.stockLotsRevision=plan.revision;invalidateLots(data);}

export function prepareLotEdit(data,productId,lotId,input,{now=Date.now(),condition,reviewConfirmed=false,dateCorrectionConfirmed=false,reason=''}={}){
 const snapshot=lotSnapshot(data,productId,civilDay(now));if(snapshot.issues.length)fail('integrity');const row=snapshot.lots.find(l=>l.id===lotId),ref=physicalLots(data,productId).refs.get(lotId)?.receipt;if(!row||!ref)fail('edit-reference');
 const validity=normalizeValidity(input),why=String(reason||'').trim().slice(0,300),prior=row.status,next=validityState(validity,civilDay(now));
 if(validity.mode==='period'&&validity.referenceType==='received'&&row.receivedOn&&validity.referenceOn!==row.receivedOn)fail('edit-receipt-reference','A referência do prazo deve corresponder ao recebimento registrado. A conferência de validade não altera a data da entrada.');
 if(validity.manufacturedOn&&(validity.manufacturedOn>civilDay(now)||row.receivedOn&&validity.manufacturedOn>row.receivedOn||validity.expiresOn&&validity.manufacturedOn>validity.expiresOn))fail('edit-production-day','Confira a produção, o recebimento e o vencimento informados.');
 let quarantined=ref.quarantined===true;
 if(prior.blocking&&!next.blocking){if(!dateCorrectionConfirmed||why.length<5)fail('expiry-correction','Para corrigir uma data vencida, confirme a informação e registre o motivo.');quarantined=true;}
 if(condition!==undefined&&!['available','quarantine'].includes(condition))fail('condition');
 if(condition==='quarantine')quarantined=true;
 if(condition==='available'&&quarantined){if(!reviewConfirmed||why.length<5)fail('review-confirmation','Confira a condição do item e registre o motivo antes de liberá-lo.');if(next.blocking)fail('review-expired','A avaliação de condição não altera uma validade vencida.');quarantined=false;}
 const before={},keys=['validity','quarantined','dateConfirmedOn','metadataHistory','reviewedAt'];for(const k of keys)before[k]={present:Object.hasOwn(ref,k),value:ref[k]===undefined?undefined:JSON.parse(JSON.stringify(ref[k]))};
 const dateChanged=ref.validity?.expiresOn!==validity.expiresOn||ref.validity?.confirmed!==validity.confirmed;
 const proposed={validity,quarantined,dateConfirmedOn:dateChanged&&validity.confirmed?civilDay(now):ref.dateConfirmedOn||'',reviewedAt:condition==='available'&&ref.quarantined?new Date(now).toISOString():ref.reviewedAt||''};
 const changed=JSON.stringify([ref.validity,ref.quarantined===true,ref.dateConfirmedOn||'',ref.reviewedAt||''])!==JSON.stringify([proposed.validity,proposed.quarantined,proposed.dateConfirmedOn,proposed.reviewedAt]);
 if(changed)proposed.metadataHistory=[...(ref.metadataHistory||[]),{at:new Date(now).toISOString(),reason:why,previous:{validity:row.validity,quarantined:row.quarantined},next:{validity,quarantined}}].slice(-10);
 return{actorId:owner(data),revision:data.stockLotsRevision,productId,lotId,physical:snapshot.physical,reference:ref,before,proposed,changed};
}
export function applyLotEdit(data,plan){if(plan.actorId!==owner(data)||plan.revision!==data.stockLotsRevision||data.products.find(p=>p.id===plan.productId)?.stock!==plan.physical)fail('edit-stale','Os lotes mudaram. Reabra a edição.');if(!plan.changed)return;Object.assign(plan.reference,plan.proposed);data.stockLotsRevision++;invalidateLots(data);}
export function verifyLotEdit(data,plan){const s=lotSnapshot(data,plan.productId);if(s.issues.length||s.physical!==plan.physical||!s.lots.some(l=>l.id===plan.lotId&&JSON.stringify(l.validity)===JSON.stringify(plan.proposed.validity)&&l.quarantined===plan.proposed.quarantined))fail('edit-postcommit');}
export function rollbackLotEdit(data,plan){for(const [key,field]of Object.entries(plan.before))if(field.present)plan.reference[key]=field.value;else delete plan.reference[key];data.stockLotsRevision=plan.revision;invalidateLots(data);}

export function newProductOrigin(data,p,input={},initialQuantity=p.stock,now=Date.now()){
 return{version:1,epoch:1,id:'origin:'+p.id,actorId:owner(data),quantity:0,unit:p.unit,validity:initialQuantity===0?normalizeValidity(input):normalizeValidity(),recordedAt:new Date(now).toISOString(),legacy:false};
}
export function zeroStockUnitTransition(data,p,newUnit,now=Date.now()){
 const s=lotSnapshot(data,p.id);if(s.issues.length||s.physical!==0)fail('unit-transition','Confira e zere o estoque antes de mudar a unidade.');
 const epoch=(p.lotOrigin.epoch||1)+1;return{lotHistoryOrigins:[...(p.lotHistoryOrigins||[]),p.lotOrigin],lotOrigin:{version:1,epoch,id:'origin:'+p.id+':'+epoch,actorId:owner(data),quantity:0,unit:newUnit,validity:normalizeValidity(),recordedAt:new Date(now).toISOString(),legacy:false}};
}
