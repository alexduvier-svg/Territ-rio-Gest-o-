import {properName} from '../proper-name.js';
export const VERSION=1,MAX_OFFERS=20;
export const actorOf=d=>d.dataContext?.id||d.productMemory?.scopeId||'';
import { normalizePortuguese as norm } from '../portuguese.js';
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});
export const day=(at=Date.now())=>dayFormat.format(new Date(at));
export const validDay=s=>{if(!/^\d{4}-\d\d-\d\d$/.test(s||''))return false;const d=new Date(s+'T12:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;};
export function decimal(raw,precision=3,{optional=false,positive=false}={}){
 const s=String(raw??'').trim();if(!s&&optional)return null;
 if(!new RegExp('^\\d+(?:[.,]\\d{1,'+precision+'})?$').test(s))throw Error('Use um número válido, sem separador de milhares.');
 const n=Number(s.replace(',','.')),v=Math.round(n*10**precision);if(!Number.isSafeInteger(v)||v>1e12||positive&&v<=0)throw Error('Informe uma quantidade ou valor válido.');return v;
}
const text=(s,max=160)=>String(s||'').trim().slice(0,max);
export function book(data,create=false){
 const s=data.supplierBook;if(!s&&!create)return{version:VERSION,actorId:actorOf(data),suppliers:[],comparisons:[],purchases:[],draft:null};
 if(s&&(s.version!==VERSION||s.actorId!==actorOf(data)||!Array.isArray(s.suppliers)||!Array.isArray(s.comparisons)))throw Error('O cadastro de fornecedores pertence a outro contexto ou versão. Restaure uma cópia válida.');
 if(!s)data.supplierBook={version:VERSION,actorId:actorOf(data),suppliers:[],comparisons:[],purchases:[],draft:null};return data.supplierBook;
}
export function identity(data,s){const c=s.clientId?data.clients.find(c=>c.id===s.clientId):s;return{name:properName(c?.name||s.name||'Cadastro Indisponível'),phone:c?.phone||'',city:properName(c?.city||''),linked:!!s.clientId};}
export function duplicateCandidates(data,input,id=''){
 const name=norm(input.name),phone=String(input.phone||'').replace(/\D/g,'');
 return book(data).suppliers.filter(s=>s.id!==id).filter(s=>{const p=identity(data,s);return name&&norm(p.name)===name||phone.length>=8&&p.phone.replace(/\D/g,'')===phone;});
}
export function saveSupplier(data,input,{id,uid,now=new Date().toISOString(),distinct=false}={}){
 const s=book(data,true),prior=s.suppliers.find(s=>s.id===id),client=input.clientId?data.clients.find(c=>c.id===input.clientId):null;
 if(input.clientId&&!client)throw Error('A pessoa escolhida não está mais cadastrada.');
 if(client&&s.suppliers.some(x=>x.clientId===client.id&&x.id!==id))throw Error('Esta pessoa já está nos fornecedores, inclusive nos arquivados.');
 const name=properName(text(client?.name||input.name));if(!name)throw Error('Informe o nome do fornecedor.');
 const phone=text(client?.phone||input.phone,40);const candidates=duplicateCandidates(data,{name,phone},id);
 if(candidates.length&&!distinct){const error=Error('Há um cadastro semelhante. Confira antes de criar outra pessoa.');error.code='DUPLICATE';error.ids=candidates.map(s=>s.id);throw error;}
 const entry={id:prior?.id||id||uid(),clientId:client?.id||'',name:client?'':name,phone:client?'':phone,city:client?'':properName(text(input.city,100)),category:properName(text(input.category,80)),notes:text(input.notes,600),productIds:[...new Set(input.productIds||[])].filter(id=>data.products.some(p=>p.id===id)).slice(0,100),archived:prior?.archived||false,createdAt:prior?.createdAt||now,updatedAt:now};
 if(prior)s.suppliers[s.suppliers.indexOf(prior)]=entry;else s.suppliers.push(entry);return entry;
}
export function requestFrom(data,input,{id,uid,now=new Date().toISOString()}={}){
 const p=input.productId?data.products.find(p=>p.id===input.productId):null;if(input.productId&&!p)throw Error('O produto não está mais cadastrado.');
 const item={productId:p?.id||'',name:properName(text(p?.name||input.name)),specification:text(input.specification,240),unit:text(p?.unit||input.unit,40)};
 if(!item.name||!item.unit||!item.specification)throw Error('Informe item, unidade e especificação para comparar materiais equivalentes.');
 decimal(input.needed,3,{positive:true});if(input.needBy&&!validDay(input.needBy))throw Error('Confira a data em que precisa receber.');
 if(!text(input.destination,160))throw Error('Informe o local de entrega para comparar o frete.');
 return{id:id||uid(),item,needed:text(input.needed,24),needBy:input.needBy||'',destination:text(input.destination,160),perishable:!!input.perishable,createdAt:now,updatedAt:now,offers:[]};
}
export function offerFrom(input,{id,uid,now=new Date().toISOString()}={}){
 const o={id:id||uid(),supplierId:text(input.supplierId,100),packLabel:text(input.packLabel,120),packSize:text(input.packSize,24),price:text(input.price,24),freight:text(input.freight,24),discount:text(input.discount,24),charges:text(input.charges,24),minimum:text(input.minimum||'1',12),multiple:text(input.multiple||'1',12),quotedAt:input.quotedAt||'',validUntil:input.validUntil||'',delivery:input.delivery||'',expiry:input.expiry||'',payment:text(input.payment,160),equivalent:!!input.equivalent,available:!!input.available,yield:text(input.yield,16),yieldSource:text(input.yieldSource,160),notes:text(input.notes,600),updatedAt:now};
 if(input.calendarReminders!==undefined&&typeof input.calendarReminders!=='boolean')throw Error('Confira a preferência de avisos da cotação.');
 if(input.reminderTime&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.reminderTime))throw Error('Confira o horário dos avisos da cotação.');
 Object.assign(o,{calendarReminders:input.calendarReminders===true,reminderTime:input.reminderTime||'08:00',dateConfirmedOn:input.dateConfirmedOn&&validDay(input.dateConfirmedOn)?input.dateConfirmedOn:''});
 if(!o.supplierId||!o.packLabel)throw Error('Escolha fornecedor e apresentação oferecida.');
 decimal(o.packSize,3,{positive:true});decimal(o.price,2,{positive:true});
 for(const k of ['freight','discount','charges'])decimal(o[k],2,{optional:true});
 for(const k of ['minimum','multiple'])if(!/^\d+$/.test(o[k])||Number(o[k])<1||Number(o[k])>1000000)throw Error('Pedido mínimo e múltiplo usam números inteiros de apresentações.');
 for(const k of ['quotedAt','validUntil','delivery','expiry'])if(o[k]&&!validDay(o[k]))throw Error('Confira as datas da proposta.');
 if(o.yield){const y=decimal(o.yield,3,{positive:true});if(y>100000)throw Error('O rendimento deve ser maior que 0 e até 100%.');if(!o.yieldSource)throw Error('Informe de onde veio o rendimento.');}
 return o;
}
export function comparisonSignature(request){return JSON.stringify([request.item,request.needed,request.needBy,request.destination,request.perishable,request.offers]);}
const ceilDiv=(a,b)=>(a+b-1n)/b;
const safe=n=>{const v=Number(n);if(!Number.isSafeInteger(v)||v<0||v>1e12)throw Error('O total é alto demais para comparar com segurança.');return v;};
export function compareOffers(request,at=Date.now()){
 if(!request?.item?.unit||!request.item.specification)throw Error('Confira item, unidade e especificação.');
 if(!Array.isArray(request.offers)||request.offers.length>MAX_OFFERS)throw Error('Compare até 20 propostas de um item por vez.');
 const needed=decimal(request.needed,3,{positive:true}),today=day(at),rows=request.offers.map(raw=>{
  const gaps=[],blocked=[],inactive=(request.inactiveSupplierIds||[]).includes(raw.supplierId),o=offerFrom(raw,{id:raw.id,uid:()=>raw.id}),size=decimal(o.packSize,3,{positive:true}),min=Number(o.minimum),multiple=Number(o.multiple);
  const packs=safe(ceilDiv(BigInt(Math.max(min,safe(ceilDiv(BigInt(needed),BigInt(size))))),BigInt(multiple))*BigInt(multiple)),quantity=safe(BigInt(packs)*BigInt(size)),goods=safe(BigInt(decimal(o.price,2,{positive:true}))*BigInt(packs)),discount=decimal(o.discount,2,{optional:true}),freight=decimal(o.freight,2,{optional:true}),charges=decimal(o.charges,2,{optional:true});
  if(inactive)blocked.push('Fornecedor arquivado; reative e confirme as condições');
  if(o.validUntil&&o.quotedAt&&o.validUntil<o.quotedAt)blocked.push('Validade anterior à data da cotação');
  if(o.delivery&&o.quotedAt&&o.delivery<o.quotedAt)blocked.push('Entrega anterior à cotação');
  if(o.delivery&&o.delivery<today)blocked.push('Entrega informada já passou; reconfirme a data');
  if(discount!==null&&discount>goods)throw Error('O desconto supera o valor dos produtos.');
  for(const [label,value]of [['Frete',freight],['Desconto',discount],['Encargos',charges]])if(value===null)gaps.push(label+' não confirmado');
  if(!o.equivalent)gaps.push('Equivalência da especificação');if(!o.available)gaps.push('Disponibilidade da quantidade');
  if(!o.quotedAt)gaps.push('Data da cotação');else if(o.quotedAt>today)blocked.push('Cotação com data futura');
  if(!o.validUntil)gaps.push('Validade da cotação');else if(o.validUntil<today)blocked.push('Cotação vencida');
  if(!o.delivery)gaps.push('Data de entrega');if(!o.payment)gaps.push('Forma e prazo de pagamento');
  if(request.perishable&&!o.expiry)gaps.push('Validade do produto');if(o.expiry&&o.delivery&&o.expiry<o.delivery)blocked.push('Vence antes da entrega');
  if(request.perishable&&o.expiry&&request.needBy&&o.expiry<request.needBy)blocked.push('Validade termina antes da data necessária');
  const total=[discount,freight,charges].some(v=>v===null)?null:safe(BigInt(goods-discount)+BigInt(freight)+BigInt(charges));
  const excess=(quantity-needed)/1000,onTime=request.needBy&&o.delivery?o.delivery<=request.needBy:null;
  if(onTime===false)blocked.push('Entrega após a data necessária');
  if(request.perishable&&excess>0)blocked.push('Excedente perecível sem consumo confirmado');
  const complete=gaps.length===0&&blocked.length===0,costComplete=!inactive&&total!==null&&o.equivalent&&o.available&&!!o.quotedAt&&o.quotedAt<=today&&!!o.validUntil&&o.validUntil>=today;
  return{id:o.id,supplierId:o.supplierId,packs,quantity:quantity/1000,excess,goods,total,unitCost:total===null?null:total/(quantity/1000),usefulUnitCost:total!==null&&o.yield?total/(quantity/1000*(decimal(o.yield,3)/100000)):null,onTime,gaps,blocked,complete,costComplete,delivery:o.delivery,payment:o.payment};
 });
 const lowest=list=>{const sorted=list.filter(r=>r.total!==null).sort((a,b)=>a.total-b.total||a.id.localeCompare(b.id));return sorted.length?sorted.filter(r=>r.total===sorted[0].total).map(r=>r.id):[];};
 return{ruleId:'supplier-total-delivery',ruleVersion:VERSION,calculatedAt:at,signature:comparisonSignature(request),inactiveSupplierIds:request.inactiveSupplierIds||[],requestId:request.id,unit:request.item.unit,needed:needed/1000,rows,lowestCost:lowest(rows.filter(r=>r.costComplete)),recommended:request.needBy?lowest(rows.filter(r=>r.complete)):[],onTime:rows.filter(r=>r.complete&&r.onTime===true).map(r=>r.id),gaps:request.needBy?[]:['Data necessária não informada; não é possível concluir adequação ao prazo'],limits:['Valores nominais, sem projeção de caixa ou lucro líquido.','Qualidade e entrega são informações a confirmar com o fornecedor; não há histórico medido nesta fase.','Nenhuma compra, dívida, reserva ou entrada de estoque foi criada.']};
}
export function validateBook(data){const s=book(data);if(s.purchases!==undefined&&(!Array.isArray(s.purchases)||s.purchases.length>10000))throw Error('Histórico de compras inválido.');const purchaseIds=new Set();for(const p of purchases(data)){if(!p.id||purchaseIds.has(p.id)||!s.suppliers.some(v=>v.id===p.supplierId)||!p.item?.name||!p.item.specification||!p.item.unit||!validDay(p.occurredOn)||typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt))||p.source!=='producer-confirmed-history'&&!(data.dataContext?.type==='demo'&&p.source==='system-example'))throw Error('Compra histórica inválida.');purchaseIds.add(p.id);const q=decimal(p.quantity,3,{positive:true}),g=decimal(p.goods,2,{positive:true}),f=decimal(p.freight,2),d=decimal(p.discount,2),c=decimal(p.charges,2);if(d>g||p.total!==g-d+f+c||p.unitCost!==p.total/(q/1000)||p.total<=0)throw Error('Totais da compra histórica não conferem.');}if(s.suppliers.length>10000||s.comparisons.length>10000)throw Error('Cadastro de fornecedores grande demais para restaurar neste formato.');const ids=new Set();for(const supplier of s.suppliers){if(!supplier||typeof supplier.id!=='string'||!supplier.id||ids.has(supplier.id)||typeof supplier.name!=='string'||typeof supplier.clientId!=='string')throw Error('Fornecedor inválido no backup.');ids.add(supplier.id);}const requests=new Set();for(const c of s.comparisons){if(!c||!c.id||requests.has(c.id)||!c.item?.name||!c.item?.unit||!c.item.specification||!Array.isArray(c.offers)||c.offers.length>MAX_OFFERS)throw Error('Comparação inválida no backup.');requests.add(c.id);decimal(c.needed,3,{positive:true});const offers=new Set();for(const o of c.offers){if(!o.id||offers.has(o.id)||!ids.has(o.supplierId))throw Error('Proposta sem fornecedor ou ID único.');offers.add(o.id);offerFrom(o,{id:o.id,uid:()=>o.id});}}return true;}
export function exportSupplierRows(data){const s=book(data);return{ suppliers:[['ID','Pessoa ID','Nome','Contato','Categoria','Cidade','Arquivado','Atualizado'],...s.suppliers.map(v=>{const p=identity(data,v);return[v.id,v.clientId,p.name,p.phone,v.category,p.city,v.archived?'Sim':'Não',v.updatedAt];})],quotes:[['Comparação ID','Item ID','Item','Unidade','Necessidade','Data Necessária','Destino','Proposta ID','Fornecedor ID','Apresentação','Conteúdo','Preço','Frete','Desconto','Encargos','Pedido Mínimo','Múltiplo','Cotado em','Válido até','Entrega','Pagamento'],...s.comparisons.flatMap(c=>c.offers.map(o=>[c.id,c.item.productId,c.item.name,c.item.unit,c.needed,c.needBy,c.destination,o.id,o.supplierId,o.packLabel,o.packSize,o.price,o.freight,o.discount,o.charges,o.minimum,o.multiple,o.quotedAt,o.validUntil,o.delivery,o.payment]))]};}

// Confirmed historical purchases are evidence only: never a stock receipt, payable or expense.
export const purchases=data=>book(data).purchases||[];
export function recordPurchase(data,input,{id,uid,now=new Date().toISOString()}={}){
 const s=book(data,true),prior=purchases(data).find(p=>p.id===id);if(prior)return prior;
 if(!s.suppliers.some(v=>v.id===input.supplierId))throw Error('Escolha o fornecedor desta compra.');
 if(!input.confirmed)throw Error('Confirme que esta compra realmente aconteceu. Cotação não é compra.');
 if(!validDay(input.occurredOn)||input.occurredOn>day(Date.parse(now)))throw Error('Informe a data real da compra, sem data futura.');
 const item=requestFrom(data,{...input,needed:input.quantity,destination:'Registro Histórico'},{id:'item',uid}).item;
 const quantity=decimal(input.quantity,3,{positive:true}),goods=decimal(input.goods,2,{positive:true}),freight=decimal(input.freight,2),discount=decimal(input.discount,2),charges=decimal(input.charges,2);
 if(discount>goods)throw Error('O desconto supera o valor dos produtos.');const total=safe(BigInt(goods-discount)+BigInt(freight)+BigInt(charges));if(total<=0)throw Error('O custo total deve ser positivo para comparar.');
 const entry={id:id||uid(),supplierId:input.supplierId,item,quantity:text(input.quantity,24),goods:text(input.goods,24),freight:text(input.freight,24),discount:text(input.discount,24),charges:text(input.charges,24),total,unitCost:total/(quantity/1000),occurredOn:input.occurredOn,payment:text(input.payment,160),notes:text(input.notes,600),source:'producer-confirmed-history',createdAt:now};
 s.purchases=[...purchases(data),entry];return entry;
}
export function voidPurchase(data,id,reason,now=new Date().toISOString()){
 const s=book(data,true),entry=purchases(data).find(p=>p.id===id);if(!entry)throw Error('Compra indisponível.');if(entry.voidedAt)return entry;if(!text(reason,240))throw Error('Informe o motivo para desconsiderar.');const next={...entry,voidedAt:now,voidReason:text(reason,240)};s.purchases=purchases(data).map(p=>p.id===id?next:p);return next;
}
export function purchaseComparison(data,id){
 const current=purchases(data).find(p=>p.id===id);if(!current||current.voidedAt)return null;
 const key=p=>JSON.stringify([p.item.productId||norm(p.item.name),norm(p.item.specification),norm(p.item.unit)]),eligible=purchases(data).filter(p=>p.id!==id&&!p.voidedAt&&key(p)===key(current)&&p.occurredOn<=current.occurredOn&&(p.occurredOn<current.occurredOn||p.createdAt<=current.createdAt)).sort((a,b)=>b.occurredOn.localeCompare(a.occurredOn)||b.createdAt.localeCompare(a.createdAt));
 const previous=eligible.find(p=>p.supplierId===current.supplierId)||null,seen=new Set(),others=eligible.filter(p=>{if(p.supplierId===current.supplierId||seen.has(p.supplierId))return false;seen.add(p.supplierId);return true;}).slice(0,3);
 const row=p=>p?{purchase:p,delta:current.unitCost-p.unitCost,percent:p.unitCost>0?(current.unitCost/p.unitCost-1)*100:null}:null;
 return{ruleId:'supplier-purchase-history',ruleVersion:VERSION,purchaseId:id,sameSupplier:row(previous),otherSuppliers:others.map(row),comparableRecords:eligible.length,limits:['Compras confirmadas pelo produtor, na mesma especificação e unidade; sem conversão presumida.','Quantidade, frete, pagamento e datas podem diferir; variação não comprova reajuste ou qualidade.','Preços históricos não são propostas atuais. Não alteram saldo, despesa, dívida ou custos das vendas.']};
}

export function exportPurchaseRows(data){return [['Compra ID','Fornecedor ID','Item ID','Item','Especificação','Unidade','Quantidade','Data','Produtos','Frete','Desconto','Encargos','Total em Centavos','Custo por Unidade em Centavos','Pagamento','Origem','Registrada em','Desconsiderada em','Motivo'],...purchases(data).map(p=>[p.id,p.supplierId,p.item.productId,p.item.name,p.item.specification,p.item.unit,p.quantity,p.occurredOn,p.goods,p.freight,p.discount,p.charges,p.total,p.unitCost,p.payment,p.source,p.createdAt,p.voidedAt||'',p.voidReason||''])];}
