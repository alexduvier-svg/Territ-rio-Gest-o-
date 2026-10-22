import {Capacitor} from '@capacitor/core';
import {Share} from '@capacitor/share';
import {shopSnapshot} from './availability.js';
import {heldLocal} from '../local-catalog/model.js';
import { API, request } from '../server.js';
import { orderStockProducts } from '../stock-order.js';
const b=()=>window.TerritorioWorkflowBridge;
const esc=s=>b().escape(s),btn=(...args)=>b().button(...args);
const labels={requested:'Aguardando confirmação',preparing:'Preparando',ready:'Pronto',out_for_delivery:'Em rota de entrega',delivered:'Entregue',cancelled:'Cancelado'};
const next={preparing:'ready',ready:'out_for_delivery',out_for_delivery:'delivered'};
let busy=false,capability=null,timer,savePhotoBusy=false,installed=false,observedInventory='',inventoryTimer;
function state(){
 const data=b().data(),actor=data.dataContext?.id||data.productMemory.scopeId;
 if(data.onlineShop?.actorId===actor&&data.onlineShop.slug!==(data.portfolio?.slug||'')&&data.onlineShop.orders?.length){data.onlineShopArchives||=[];data.onlineShopArchives.push({...data.onlineShop,archivedAt:Date.now()});}
 if(!data.onlineShop||data.onlineShop.actorId!==actor||data.onlineShop.slug!==(data.portfolio?.slug||'')){const comingSoonIds=data.onlineShop?.actorId===actor?data.onlineShop.comingSoonIds||[]:[];data.onlineShop={version:2,actorId:actor,slug:data.portfolio?.slug||'',revision:0,enabled:false,orders:[],error:'',comingSoonIds};}
 data.onlineShop.comingSoonIds=(Array.isArray(data.onlineShop.comingSoonIds)?data.onlineShop.comingSoonIds:[]).filter(id=>data.products.some(p=>p.id===id));
 return data.onlineShop;
}
async function save(){if(!b().persist()||window.TerritorioNative?.isNative&&!await window.TerritorioNative.durable())throw Error('Gravação pendente. Confirme novamente depois de liberar espaço.');}
const api=(path,options={})=>request('/api/shops/'+state().slug+path,{timeoutMs:15000,...options,token:b().data().portfolio?.token});
const ownSale=id=>b().data().sales.find(s=>s.operationId==='order-'+id&&s.status==='completed');
const pending=()=>state().orders.filter(o=>!['delivered','cancelled'].includes(o.status));
async function supported(){if(capability===null){const info=await request('/api/shops/_capabilities',{method:'GET',timeoutMs:15000});capability=info.available;}if(!capability)throw Error('A loja online ainda não foi ativada no servidor. O cadastro e as vendas locais continuam disponíveis.');}
function snapshot(){return shopSnapshot(b().data(),state().comingSoonIds,p=>b().description(p));}
async function synchronize({enabled}={}){
 await supported();let s=state();const actor=s.actorId,slug=s.slug,token=b().data().portfolio?.token,guard=()=>{const current=state();if(current.actorId!==actor||current.slug!==slug)throw Error('O produtor mudou. Reabra sua loja.');return current;},call=(path,options)=>request('/api/shops/'+slug+path,{...options,token,timeoutMs:15000});if(!s.slug)throw Error('Publique sua página para ativar a loja.');
 const completed=s.orders.map(o=>{const sale=ownSale(o.id);return sale?{orderId:o.id,saleId:sale.id,items:sale.items.map(i=>({productId:i.productId,quantity:i.qty}))}:null;}).filter(Boolean);
 const refunded=s.orders.map(o=>{const sale=b().data().sales.find(s=>s.operationId==='order-'+o.id&&s.status==='returned');return sale?{orderId:o.id,saleId:sale.id}:null;}).filter(Boolean);
 const payload={products:snapshot(),completed,refunded,enabled:enabled??s.enabled};
 const serial=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload))))].map(n=>n.toString(16).padStart(2,'0')).join('');
 if(s.pendingSync?.serial!==serial){s.pendingSync={id:crypto.randomUUID(),serial};await save();}
 if(s.syncedFingerprint!==serial||Date.now()-(s.syncedAt||0)>600000){const r=await call('/inventory',{method:'PUT',json:{...payload,revision:s.revision,operationId:s.pendingSync.id}});s=guard();s.revision=r.revision;s.enabled=payload.enabled;s.syncedAt=r.syncedAt;s.syncedFingerprint=serial;s.error='';if(s.enabled)b().data().catalog.publicUrl=API+'/s/'+s.slug;await save();}
 const result=await call('/orders',{method:'GET'});s=guard();if(JSON.stringify(s.orders)!==JSON.stringify(result.orders)||s.enabled!==result.enabled||s.error){s.orders=result.orders;s.enabled=result.enabled;s.error='';await save();}return s;
}
async function refresh(){
 const s=state();if(busy||!s.slug||!s.enabled||document.hidden)return;busy=true;
 try{await synchronize();decorate();if(b().modal()?.kind==='store-orders')openOrders(false);}catch(e){s.error=e.message;b().persist();decorate();}finally{busy=false;}
}
function setup(){
 const d=b().data(),s=state();
 const products=orderStockProducts(d.products).filter((p,i,a)=>a.findIndex(q=>(q.catalogBase||q.baseName||q.name)===(p.catalogBase||p.baseName||p.name))===i);
 const restock='<details class="workflow-last-fair"><summary>Reposições · Em breve</summary><p class="small muted">Marque somente os produtos que pretende repor. O aviso aparece apenas quando esgotarem; não permite comprar sem estoque.</p>'+orderStockProducts(d.products).filter(p=>p.active!==false&&p.price>0).map(p=>'<label class="consent-row"><input type="checkbox" data-store-soon="'+esc(p.id)+'"'+(s.comingSoonIds.includes(p.id)?' checked':'')+'><span>'+esc(p.name)+'<small class="muted"> · '+esc(b().description(p))+'</small></span></label>').join('')+'</details>';
 const photos=products.map(p=>'<section class="store-photo-row"><div>'+((d.catalog.photos||{})[p.id]?'<img src="'+esc(d.catalog.photos[p.id])+'" alt="Foto de '+esc(p.name)+'">':'<span class="store-photo-placeholder">'+b().icon('image')+'</span>')+'<strong>'+esc(p.baseName||p.name)+'</strong></div><label class="catalog-upload">Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp" data-store-photo="'+esc(p.id)+'"></label><label class="catalog-upload">Tirar foto<input type="file" accept="image/*" capture="environment" data-store-photo="'+esc(p.id)+'"></label></section>').join('');
 b().open('Sua loja e sua marca','<p class="dialog-text">A lista de pedidos usa seus produtos e apresentações cadastrados. Esgotados ficam sinalizados, sem compra. Fotos e história são opcionais. Só vai à internet ao publicar.</p><label for="store-brand">Nome do negócio</label><input id="store-brand" maxlength="80" value="'+esc(d.catalog.title||d.settings.businessName)+'"><label for="store-story">Sua história</label><textarea id="store-story" maxlength="2000">'+esc(d.catalog.story)+'</textarea><p class="small muted">'+(s.enabled?'Loja ativa. O estoque se atualiza enquanto o app tem conexão.':'Cadastre a marca e depois publique para começar a receber pedidos.')+'</p>'+restock+photos+(s.error?'<p class="error">'+esc(s.error)+'</p>':''),btn('store-save-brand','Salvar no aparelho','choice')+btn('store-publish','Publicar / atualizar loja','success')+(s.enabled?btn('store-disable','Pausar novos pedidos','choice'):'')+btn('close-modal','Voltar','sheet-back'),'store-setup');
}
async function saveBrand(){const d=b().data(),brand=document.getElementById('store-brand')?.value.trim(),story=document.getElementById('store-story')?.value.trim();if(!brand)throw Error('Informe o nome do negócio.');d.catalog.title=brand;d.catalog.story=story;if(document.getElementById('store-brand'))state().comingSoonIds=[...document.querySelectorAll('[data-store-soon]:checked')].map(e=>e.dataset.storeSoon);await save();}
async function publish(){
 if(busy||savePhotoBusy)return;b().toast('Preparando sua loja…');busy=true;
 try{await supported();await saveBrand();if(b().context()?.type==='demo'||b().data().settings.onboarding==='demo')throw Error('A demonstração fica separada. Inicie seu cadastro real em Ajustes → Dados para testes antes de publicar sua loja.');await window.TerritorioPortfolio.publish();const s=state();s.revision=(await api('/inventory',{method:'GET'})).revision;await synchronize({enabled:true});b().close();b().render();openOrders(false);b().toast('Loja publicada. Envie o link da lista para seus clientes.');}catch(e){state().error=e.message;b().toast(e.message);}finally{busy=false;}
}
function orderLink(o){return API+'/s/'+state().slug+(o?'#'+o.trackingToken:'');}
async function shareList(){
 if(busy)return;const s=state();if(!s.slug||!s.enabled){setup();b().toast('Publique sua lista para receber pedidos por link.');return;}
 busy=true;try{await synchronize();b().open('Lista de pedidos','<p class="dialog-text">O cliente escolhe as quantidades e envia o pedido por este link. O pedido aparece aqui ao abrir ou atualizar o app com internet. Você confere e confirma a venda.</p><p class="small muted">Esgotados não aceitam compra. O portfólio com fotos fica disponível na própria lista.</p><p class="dialog-text" style="overflow-wrap:anywhere">'+esc(orderLink())+'</p>',btn('store-share-send','Enviar lista','success')+btn('store-copy','Copiar link','choice')+btn('close-modal','Voltar','sheet-back'),'store-share');}catch(e){b().toast(e.message);}finally{busy=false;}
}
async function sendList(){const url=orderLink(),text='Escolha os produtos disponíveis e envie seu pedido. Eu confirmo por aqui.\n'+url;if(Capacitor.isNativePlatform()){try{await Share.share({title:b().data().catalog.title||'Lista de pedidos',text,url,dialogTitle:'Enviar lista de pedidos'});return;}catch(e){if(/cancel/i.test(e.message||''))return;}}if(navigator.share){try{await navigator.share({title:b().data().catalog.title||'Lista de pedidos',text,url});return;}catch(e){if(e.name==='AbortError')return;}}b().external('https://wa.me/?text='+encodeURIComponent(text));}
function openOrders(showRefresh=true){
 const s=state(),rows=[...s.orders].sort((a,b)=>b.createdAt-a.createdAt);
 const archive=(b().data().onlineShopArchives||[]).filter(a=>a.actorId===s.actorId).flatMap(a=>a.orders);
 const html='<p class="dialog-text">Você confirma cada etapa. Pedidos só viram vendas após sua confirmação no carrinho.</p>'+(s.error?'<p class="error">'+esc(s.error)+'</p>':'')+(s.slug?'<div class="store-link-actions">'+btn('store-share','Enviar lista de pedidos','success')+btn('store-copy','Copiar link','choice')+btn('store-refresh','Atualizar pedidos','choice')+'</div>':'')+btn('store-setup','Fotos, marca e história','choice modal-action')+rows.map(o=>{const sale=ownSale(o.id),paid=!!sale||!!o.accountedSale;return '<section class="store-order"><small>'+esc(new Date(o.createdAt).toLocaleString('pt-BR'))+'</small><h3>'+esc(o.customer.name)+' · '+labels[o.status]+'</h3><p>'+esc(o.customer.address)+'</p>'+o.items.map(i=>'<p>'+b().quantity(i.quantity)+' '+esc(i.unit)+' · '+esc(i.name+' '+i.label)+'</p>').join('')+'<strong>'+b().money(o.total)+'</strong>'+(o.customer.note?'<p>'+esc(o.customer.note)+'</p>':'')+'<div class="store-order-actions">'+(o.status==='requested'&&!paid?btn('store-register','Conferir e registrar venda','success',{id:o.id})+btn('store-status','Recusar pedido','choice',{id:o.id,status:'cancelled'}):o.status==='requested'&&paid?btn('store-status','Iniciar preparo','success',{id:o.id,status:'preparing'}):next[o.status]?btn('store-status',labels[next[o.status]],'success',{id:o.id,status:next[o.status]}):'')+btn('store-whatsapp','Revisar aviso no WhatsApp','choice',{id:o.id})+btn('store-copy','Copiar acompanhamento','choice',{id:o.id})+'</div></section>';}).join('')+btn('catalog-orders','Pedidos anteriores por PDF','choice modal-action')+(!rows.length?'<p class="small muted">Nenhum pedido recebido. Os pedidos novos aparecerão aqui e na página de vendas.</p>':'')+(archive.length?'<details class="workflow-last-fair"><summary>Pedidos de lojas anteriores</summary>'+archive.map(o=>'<p><strong>'+esc(o.customer.name)+'</strong> · '+esc(labels[o.status])+'<br>'+b().money(o.total)+' · '+esc(new Date(o.createdAt).toLocaleDateString('pt-BR'))+'</p>').join('')+'</details>':'');
 b().open('Pedidos e entregas',html,btn('close-modal','Voltar','sheet-back'),'store-orders');
 if(showRefresh&&!busy&&s.enabled)void refresh();
}
async function changeStatus({id,status}){
 if(busy)return;busy=true;
 try{await synchronize();const o=state().orders.find(o=>o.id===id);if(!o)throw Error('Atualize os pedidos.');const result=await api('/orders/'+id,{method:'PUT',json:{status,version:o.version}});Object.assign(o,result.order);await save();decorate();openOrders(false);b().toast('Etapa atualizada no acompanhamento. Revise o aviso pelo WhatsApp.');}catch(e){b().toast(e.message);}finally{busy=false;}
}
async function register(id){if(busy)return;busy=true;try{await synchronize();const o=state().orders.find(o=>o.id===id);if(!o||o.status!=='requested')throw Error('Este pedido mudou. Atualize a lista.');if(ownSale(id))throw Error('A venda deste pedido já foi registrada.');b().prepareOrder(o);}catch(e){b().toast(e.message);}finally{busy=false;}}
function message(id){const o=state().orders.find(o=>o.id===id);if(!o)return;const text='Olá, '+o.customer.name+'! Seu pedido '+o.id.slice(0,8)+': '+labels[o.status]+'.\nAcompanhe: '+orderLink(o);b().open('Revisar aviso','<p class="dialog-text">'+esc(text)+'</p><p class="small muted">O WhatsApp abrirá com o texto. Você confere e envia.</p>',btn('store-send-whatsapp','Abrir WhatsApp','success',{id:o.id})+btn('store-orders','Voltar aos pedidos','sheet-back'),'store-message');}
function send(id){const o=state().orders.find(o=>o.id===id);if(!o)return;let phone=o.customer.phone;if(phone.length<=11)phone='55'+phone;b().external('https://wa.me/'+phone+'?text='+encodeURIComponent('Olá, '+o.customer.name+'! Seu pedido '+o.id.slice(0,8)+': '+labels[o.status]+'.\nAcompanhe: '+orderLink(o)));}
async function copy(id){const o=id?state().orders.find(o=>o.id===id):null;if(!state().slug)throw Error('Publique sua loja primeiro.');try{await navigator.clipboard.writeText(orderLink(o));b().toast('Link copiado.');}catch{b().open('Link para compartilhar','<p class="dialog-text" style="overflow-wrap:anywhere">'+esc(orderLink(o))+'</p>',btn('store-orders','Voltar','sheet-back'),'store-link');}}
async function photo(input){
 if(savePhotoBusy||!input.files[0])return;savePhotoBusy=true;
 try{const actor=state().actorId,file=input.files[0];if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>20*1024*1024)throw Error('Use uma foto JPEG, PNG ou WebP de até 20 MB.');const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'}),side=Math.min(bitmap.width,bitmap.height),canvas=document.createElement('canvas');canvas.width=canvas.height=640;canvas.getContext('2d').drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,640,640);bitmap.close();if(state().actorId!==actor)throw Error('O produtor mudou. Escolha a foto novamente.');const image=canvas.toDataURL('image/jpeg',.8),d=b().data(),p=d.products.find(p=>p.id===input.dataset.storePhoto);if(!p)throw Error('Produto não encontrado.');d.catalog.photos||={};for(const q of d.products.filter(q=>(q.catalogBase||q.baseName||q.name)===(p.catalogBase||p.baseName||p.name)))d.catalog.photos[q.id]=image;await saveBrand();setup();b().toast('Foto salva no aparelho. Publique quando estiver pronto.');}catch(e){b().toast(e.message);}finally{savePhotoBusy=false;}
}
function decorate(){
 const root=document.getElementById('app');if(!root)return;const fingerprint=JSON.stringify([b().data().products.map(p=>[p.id,p.stock,p.price,p.active,p.name,p.unit,p.category,heldLocal(b().data(),p.id)]),state().comingSoonIds,b().data().sales.filter(s=>s.orderId).map(s=>[s.id,s.status])]);if(state().enabled&&observedInventory!==fingerprint){observedInventory=fingerprint;clearTimeout(inventoryTimer);inventoryTimer=setTimeout(refresh,650);}
 if(b().page()==='Vender'){
  const list=pending(),old=root.querySelector('.store-pending-banner');
  if(list.length){const overdue=list.some(o=>Date.now()-o.updatedAt>3600000),html=btn('store-orders','<strong>'+list.length+' '+(list.length===1?'pedido para acompanhar':'pedidos para acompanhar')+'</strong><small>'+(overdue?'Confira se alguma etapa precisa ser atualizada.':'Prepare e confirme cada etapa da entrega.')+'</small>','store-pending-banner');if(!old)root.querySelector('.glass-product-head,.page-title,.top')?.insertAdjacentHTML('afterend',html);else if(!old.textContent.includes(String(list.length)))old.outerHTML=html;}else old?.remove();
 }
}
export function installStore(){
 if(installed||!b())return;installed=true;state();
 const safe=fn=>(...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>b().toast(e.message));
 Object.assign(b().actions,{'store-orders':()=>openOrders(),'store-share':shareList,'store-share-send':safe(sendList),'store-setup':setup,'store-save-brand':safe(async()=>{await saveBrand();b().toast('Marca e história salvas.');}),'store-publish':publish,'store-refresh':safe(async()=>{await refresh();openOrders(false);}),'store-register':d=>register(d.id),'store-status':changeStatus,'store-whatsapp':d=>message(d.id),'store-send-whatsapp':d=>send(d.id),'store-copy':safe(d=>copy(d.id)),'store-disable':safe(async()=>{await synchronize({enabled:false});setup();})});
 // Photos/brand entry uses the in-app editor; no external AI account is required.
 b().actions['workflow-catalog']=setup;
 document.addEventListener('change',event=>{if(event.target.dataset?.storePhoto)void photo(event.target);});
 new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true});
 window.addEventListener('online',refresh);window.addEventListener('territorio:resume',refresh);
 document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden){void refresh();schedule();}});
 function schedule(){clearTimeout(timer);if(!document.hidden)timer=setTimeout(async()=>{await refresh();schedule();},45000);}
 schedule();decorate();window.TerritorioStore={state,refresh,synchronize,snapshot};
}
