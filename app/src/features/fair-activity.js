import {parseSurplusQuantity} from './fair-surplus.js';
import {stockPartition,eventProductBalance,heldOnline} from './store/availability.js';

// Apply to a disposable ERPModel. The UI commits that entire copy once, after
// every stock movement and sale has passed the model's normal financial audit.
export function recordFairActivity(model,{eventId,productId,added=0,sold=0,lost=0,lossReason='',source='existing',payment='Pix',operationId},now=Date.now()){
 const data=model.data,event=data.events.find(e=>e.id===eventId),product=model.product(productId);
 if(!event||event.fairClosedAt||event.fairCancelled||!product||product.active===false||product.archived)throw Error('Reabra a conferência e escolha um produto disponível.');
 if(!operationId||operationId.length>100)throw Error('Reabra o registro da feira.');
 const prior=(event.fairActivities||[]).find(a=>a.id===operationId);
 const add=parseSurplusQuantity(added,product.unit),sell=parseSurplusQuantity(sold,product.unit),loss=parseSurplusQuantity(lost,product.unit);
 if(prior){if(prior.productId!==productId||prior.added!==add||prior.sold!==sell||(prior.lost||0)!==loss||(prior.lossReason||'')!==(loss?lossReason:'')||prior.source!==source||prior.payment!==payment)throw Error('Este registro já foi salvo com outros dados.');return prior;}
 if(!add&&!sell&&!loss)throw Error('Informe uma reposição, venda não registrada ou perda.');
 if(loss&&!['loss','gift'].includes(lossReason))throw Error('Informe se a baixa foi uma perda ou um brinde.');
 if(!['existing','new'].includes(source))throw Error('Informe de onde veio a reposição.');
 if(!['Pix','Dinheiro','Crédito','Débito','Outro'].includes(payment))throw Error('Confira a forma de pagamento das vendas não registradas.');
 const partition=stockPartition(data,productId),remaining=eventProductBalance(data,eventId,productId);
 if(add&&source==='existing'&&add>partition.home)throw Error('Há '+partition.home+' '+product.unit+' livres em casa. Se foi uma entrada nova ainda não registrada, escolha essa opção.');
 if(Math.round((sell+loss)*1000)/1000>Math.max(0,remaining+add-heldOnline(data,productId,eventId)))throw Error('Vendas e perdas superam a carga livre da feira. Confira a reposição e os pedidos reservados.');
 if(Math.round((sell+loss)*1000)/1000>model.availableStock(productId)+(source==='new'?add:0))throw Error('Vendas e perdas superam o estoque livre. Confira entradas e reservas.');
 const stamp=new Date(now).toISOString();
 if(add&&source==='new'){const movement=model.move(productId,'add',add,'Entrada nova informada na conferência da feira');Object.assign(movement,{date:stamp,eventId,fairActivityId:operationId});}
 let load=(data.eventLoads||[]).find(l=>l.eventId===eventId);
 if(!load){load={eventId,createdAt:stamp,updatedAt:stamp,items:[]};data.eventLoads||=[];data.eventLoads.push(load);}
 if(add){let item=load.items.find(i=>i.productId===productId&&i.unit===product.unit);if(!item){item={productId,name:product.name,unit:product.unit,description:product.description||'',qty:0};load.items.push(item);}item.qty=Math.round((item.qty+add)*1000)/1000;item.restocks=[...(item.restocks||[]),{at:stamp,qty:add,source,fairActivityId:operationId}];load.updatedAt=stamp;}
 let sale;
 if(sell){sale=model.complete({scope:eventId,operationId:'fair-activity-'+operationId,items:[{productId,rawQty:String(sell)}],payment,customerType:'PF',discountMode:'R$',discountValue:'0'});Object.assign(sale,{date:stamp,registeredAt:stamp,unregistered:true,late:true,fairActivityId:operationId});data.movements.filter(m=>m.saleId===sale.id).forEach(m=>Object.assign(m,{date:stamp,eventId,fairActivityId:operationId,note:'Venda não registrada · conferência da feira'}));}
 let lossMovement;if(loss){lossMovement=model.move(productId,'loss',loss,(lossReason==='gift'?'Brinde':'Perda')+' · conferência da feira');Object.assign(lossMovement,{date:stamp,eventId,fairActivityId:operationId,lossReason});}
 const record={id:operationId,at:stamp,productId,unit:product.unit,added:add,sold:sell,lost:loss,lossReason:loss?lossReason:'',lossMovementId:lossMovement?.id||'',source,payment,saleId:sale?.id||'',stockAfter:product.stock,eventRemaining:eventProductBalance(data,eventId,productId)};
 event.fairActivities=[...(event.fairActivities||[]),record];return record;
}
