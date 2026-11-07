import {actorOf,day,validDay,decimal,book as supplierBook} from '../suppliers/model.js';

export const VERSION=1;
const text=(v,max=160)=>String(v??'').trim().slice(0,max);
export const normalize=v=>text(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
export function unitKey(v){const n=normalize(v);return /^(un|unidade|unidades)$/.test(n)?'un':n;}
export function book(data,create=false){
  if(!data.inputStock){const value={version:VERSION,actorId:actorOf(data),activities:[],items:[],movements:[],purchaseStates:[]};if(create)data.inputStock=value;return value;}
  const s=data.inputStock;
  if(s.version!==VERSION||s.actorId!==actorOf(data)||!['activities','items','movements','purchaseStates'].every(k=>Array.isArray(s[k])))throw Error('O estoque de insumos pertence a outro contexto ou versão.');
  return s;
}
export function saveActivities(data,values){const s=book(data,true),names=[...new Map(values.map(v=>text(v,60)).filter(Boolean).map(v=>[normalize(v),v])).values()];if(names.length>40)throw Error('Use até 40 atividades de produção.');s.activities=names;return names;}
export function saveItem(data,input,{id,uid,now=new Date().toISOString()}={}){
  const s=book(data,true),prior=s.items.find(i=>i.id===id),name=text(input.name,120),specification=text(input.specification,180),unit=text(input.unit,40),activities=[...new Map((input.activities||[]).map(v=>text(v,60)).filter(Boolean).map(v=>[normalize(v),v])).values()];
  if(!name||!unit)throw Error('Informe o nome e a unidade de controle do insumo.');
  if(!activities.length||activities.length>40)throw Error('Informe pelo menos uma atividade para este insumo.');
  if(prior&&unitKey(prior.unit)!==unitKey(unit))throw Error('A unidade do cadastro existente deve ser preservada. Crie outro insumo para usar uma unidade diferente.');
  if(s.items.some(i=>i.id!==id&&normalize(i.name)===normalize(name)&&normalize(i.specification)===normalize(specification)&&unitKey(i.unit)===unitKey(unit)))throw Error('Já existe este insumo com a mesma especificação e unidade. Abra o cadastro existente.');
  if(input.supplierId&&!supplierBook(data).suppliers.some(v=>v.id===input.supplierId&&!v.archived))throw Error('Escolha um fornecedor ativo ou deixe o vínculo vazio.');
  if(input.expiry&&!validDay(input.expiry))throw Error('Confira a validade ou deixe o campo vazio.');
  const minimum=decimal(input.minimum||'0',3),initial=prior?0:decimal(input.initial||'0',3),extra=(input.extra||[]).map(v=>({label:text(v.label,60),value:text(v.value,200)})).filter(v=>v.label||v.value);
  if(extra.length>8||extra.some(v=>!v.label||!v.value))throw Error('Preencha nome e conteúdo das informações adicionais. Use até oito campos.');
  if(!prior&&s.items.length>=5000)throw Error('Limite de 5.000 insumos neste formato. Exporte e revise os cadastros.');
  const item={id:prior?.id||id||uid(),name,specification,unit,activities,minimum,quantity:prior?.quantity||0,supplierId:input.supplierId||'',category:text(input.category,80),lot:text(input.lot,80),expiry:input.expiry||'',extra,archived:prior?.archived||false,createdAt:prior?.createdAt||now,updatedAt:now};
  if(prior)s.items[s.items.indexOf(prior)]=item;else s.items.push(item);
  saveActivities(data,[...s.activities,...activities]);
  if(initial)move(data,{itemId:item.id,kind:'entry',quantity:String(initial/1000),occurredOn:day(Date.parse(now)),reason:'Saldo inicial informado; sem rastreabilidade retroativa.'},{id:'initial-'+item.id,uid,now});
  return item;
}
export function purchaseState(data,purchaseId){
  const purchase=supplierBook(data).purchases?.find(p=>p.id===purchaseId);if(!purchase)throw Error('Compra não encontrada.');
  const state=book(data).purchaseStates.find(p=>p.purchaseId===purchaseId),ordered=decimal(purchase.quantity,3,{positive:true});
  if(!state)return {known:purchase.inputReceiptTracked===true,ordered,received:purchase.inputReceiptTracked===true?0:null,pending:purchase.inputReceiptTracked===true?ordered:null,purchase};
  const received=state.baseline+book(data).movements.filter(m=>m.purchaseId===purchaseId).reduce((sum,m)=>sum+m.quantity,0);
  if(received>ordered)throw Error('Recebimentos excedem a compra.');
  return {known:true,ordered,received,pending:ordered-received,purchase,itemId:state.itemId};
}
export function move(data,input,{id,uid,now=new Date().toISOString()}={}){
  const s=book(data,true),item=s.items.find(i=>i.id===input.itemId&&!i.archived),kind=input.kind;
  if(!item||!['entry','use'].includes(kind))throw Error('Escolha um insumo ativo e uma movimentação válida.');
  let quantity=decimal(input.quantity,3,{positive:true});
  if(input.packSize){const size=decimal(input.packSize,3,{positive:true}),n=BigInt(quantity)*BigInt(size);if(n%1000n!==0n)throw Error('A conversão excede três casas decimais. Confira as unidades.');quantity=Number(n/1000n);if(!Number.isSafeInteger(quantity)||quantity>1e12)throw Error('A quantidade convertida excede o limite.');}
  if(!validDay(input.occurredOn)||input.occurredOn>day(Date.parse(now)))throw Error('Informe a data real, sem data futura.');
  const reason=text(input.reason,240);if(!reason)throw Error(kind==='use'?'Informe o destino ou a finalidade do uso.':'Informe a origem da entrada.');
  if(input.supplierId&&!supplierBook(data).suppliers.some(v=>v.id===input.supplierId))throw Error('Fornecedor não encontrado.');
  const signature=JSON.stringify([item.id,kind,quantity,input.occurredOn,reason,input.supplierId||'',input.purchaseId||'',input.baseline??null]);
  const previous=s.movements.find(m=>m.id===id);if(previous){if(previous.signature!==signature)throw Error('A identificação desta movimentação já foi usada com outros dados.');return previous;}
  if(s.movements.length>=50000)throw Error('O histórico atingiu o limite deste formato. Exporte os registros.');
  if(kind==='use'&&quantity>item.quantity)throw Error('O uso supera o saldo disponível deste insumo.');
  if(kind==='entry'&&item.quantity+quantity>1e12)throw Error('O saldo excede o limite seguro.');
  let newState=null;
  if(input.purchaseId){
    const status=purchaseState(data,input.purchaseId),purchase=status.purchase;
    if(kind!=='entry'||purchase.voidedAt||purchase.item.productId)throw Error('Esta compra não está disponível para recebimento como insumo.');
    if(unitKey(purchase.item.unit)!==unitKey(item.unit))throw Error('A compra e o insumo devem usar a mesma unidade base. Confira antes de receber.');
    if(input.occurredOn<purchase.occurredOn)throw Error('O recebimento não pode ser anterior à compra.');
    if(input.supplierId!==purchase.supplierId)throw Error('O fornecedor deve ser o mesmo da compra.');
    const existing=s.purchaseStates.find(p=>p.purchaseId===input.purchaseId);
    if(existing&&existing.itemId!==item.id)throw Error('Esta compra já está vinculada a outro insumo.');
    let baseline=existing?.baseline||0;
    if(!existing&&!status.known){if(!input.baselineConfirmed)throw Error('Confira e confirme quanto já havia sido recebido.');baseline=decimal(input.baseline,3);}
    const already=existing?status.received:baseline;
    if(baseline>status.ordered||quantity>status.ordered-already)throw Error('A quantidade recebida supera o que ainda falta entregar.');
    if(!existing)newState={purchaseId:purchase.id,itemId:item.id,baseline,confirmedAt:now};
  }
  const movement={id:id||uid(),itemId:item.id,kind,quantity,unit:item.unit,occurredOn:input.occurredOn,reason,supplierId:input.supplierId||'',purchaseId:input.purchaseId||'',signature,createdAt:now,packSize:input.packSize||'',packCount:input.packSize?input.quantity:''};
  if(newState)s.purchaseStates.push(newState);
  item.quantity+=kind==='entry'?quantity:-quantity;item.updatedAt=now;s.movements.push(movement);return movement;
}
export function validate(data){
  if(!data.inputStock)return true;const s=book(data),items=new Map(),ids=new Set(),balances=new Map(),receiptTotals=new Map();
  if(s.items.length>5000||s.movements.length>50000||s.activities.length>40||s.purchaseStates.length>10000)throw Error('Estoque de insumos excede os limites do formato.');
  for(const item of s.items){if(!item?.id||items.has(item.id)||!item.name||!item.unit||!Array.isArray(item.activities)||!item.activities.length||!Number.isSafeInteger(item.quantity)||item.quantity<0||item.quantity>1e12||!Number.isSafeInteger(item.minimum)||item.minimum<0||item.expiry&&!validDay(item.expiry))throw Error('Cadastro de insumo inválido no backup.');items.set(item.id,item);balances.set(item.id,0);}
  for(const m of s.movements){const item=items.get(m.itemId);if(!m?.id||ids.has(m.id)||!item||m.unit!==item.unit||!['entry','use'].includes(m.kind)||!Number.isSafeInteger(m.quantity)||m.quantity<=0||!validDay(m.occurredOn)||!m.reason||!m.signature)throw Error('Movimentação de insumo inválida no backup.');ids.add(m.id);balances.set(m.itemId,balances.get(m.itemId)+(m.kind==='entry'?m.quantity:-m.quantity));if(m.purchaseId)receiptTotals.set(m.purchaseId,(receiptTotals.get(m.purchaseId)||0)+m.quantity);}
  for(const item of s.items)if(balances.get(item.id)!==item.quantity)throw Error('O saldo do insumo não confere com o histórico.');
  const purchases=new Map((supplierBook(data).purchases||[]).map(p=>[p.id,p])),states=new Map();
  for(const p of s.purchaseStates){const purchase=purchases.get(p.purchaseId);if(states.has(p.purchaseId)||!items.has(p.itemId)||!purchase||!Number.isSafeInteger(p.baseline)||p.baseline<0||p.baseline+(receiptTotals.get(p.purchaseId)||0)>decimal(purchase.quantity,3,{positive:true}))throw Error('Vínculo de recebimento de insumo inválido.');states.set(p.purchaseId,p);}
  for(const m of s.movements)if(m.purchaseId){const p=states.get(m.purchaseId),purchase=purchases.get(m.purchaseId);if(!p||p.itemId!==m.itemId||m.kind!=='entry'||!purchase||m.supplierId!==purchase.supplierId||unitKey(purchase.item.unit)!==unitKey(m.unit))throw Error('Recebimento sem vínculo válido com a compra.');}
  return true;
}
export function exportRows(data){const s=book(data);return {items:[['ID','Insumo','Especificação','Unidade','Disponível','Mínimo','Atividades','Fornecedor ID','Categoria','Lote','Validade'],...s.items.map(i=>[i.id,i.name,i.specification,i.unit,i.quantity/1000,i.minimum/1000,i.activities.join(' / '),i.supplierId,i.category,i.lot,i.expiry])],movements:[['ID','Insumo ID','Tipo','Quantidade','Unidade','Data real','Origem ou destino','Fornecedor ID','Compra ID','Registrado em'],...s.movements.map(m=>[m.id,m.itemId,m.kind==='entry'?'Entrada':'Uso',m.quantity/1000,m.unit,m.occurredOn,m.reason,m.supplierId,m.purchaseId,m.createdAt])]};}
