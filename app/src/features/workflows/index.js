import { installProductGesture } from './product-gesture.js';
import { getMotionSource, restoreMotionSource } from '../motion/index.js';
import { lastFairSummary, soldOutProducts, saveDemandObservation, demandSignals } from '../event-learning.js';

const bridge=()=>window.TerritorioWorkflowBridge;
const esc=v=>bridge().escape(v);
const button=(...args)=>bridge().button(...args);
const dialog=()=>document.getElementById('dialog');
let installed=false, broadcastIds=new Set(), broadcastText='', demandEvent='', demandRows=[], saveBusy=false;
const timers=new Map();
const AUTO_CLOSE_MS=15000;

export function eventSummary(id){
 const b=bridge(),event=b.data().events.find(e=>e.id===id);if(!event)return '';
 const summary=lastFairSummary(b.data(),event),signals=demandSignals(b.data(),event);
 if(!summary&&!signals.length)return '';
 const money=n=>b.data().settings.financialVisible?b.money(n):'••••••';
 const rank=(label,rows)=>'<div><h4>'+label+'</h4>'+rows.map(r=>'<p><strong>'+esc(r.name)+'</strong><br><small>'+b.quantity(r.quantity)+' '+esc(r.unit)+' · '+money(r.revenue)+'</small></p>').join('')+'</div>';
 return '<details class="workflow-last-fair" open><summary>O que aconteceu na última feira '+b.icon('down')+'</summary>'+(summary?'<p>'+esc(summary.name)+' · '+esc(summary.day.split('-').reverse().join('/'))+'<br>'+summary.sales+' vendas · '+money(summary.total)+'</p><div class="workflow-rank">'+rank('Mais vendidos por valor',summary.most)+rank('Menos vendidos por valor',summary.least)+'</div><p class="small muted">Quantidade e valor têm papéis diferentes: giro não é lucro. Considera vendas vinculadas à feira, mesmo registradas depois; não compara horários de lançamento.</p>':'')+signals.map(s=>'<p class="workflow-demand-signal">'+esc(s.text)+'</p>').join('')+'</details>';
}

async function durable(){
 if(!bridge().persist())throw Error('Não foi possível gravar. Seus dados continuam nesta sessão; libere espaço e tente de novo.');
 if(window.TerritorioNative?.isNative&&!await window.TerritorioNative.durable())throw Error('Gravação pendente. Libere espaço e confirme novamente.');
}
function openDemand(id){
 const b=bridge(),event=b.data().events.find(e=>e.id===id);if(!event)return;
 demandEvent=id;demandRows=soldOutProducts(b.data(),id).map(p=>({...p,...event.demandObservation?.items?.find(i=>i.productId===p.productId)}));
 const rows=demandRows.map((r,i)=>'<section class="client-form-surface workflow-demand-row"><h3>'+esc(r.name)+'</h3><label for="demand-answer-'+i+'">Procuraram este produto depois que esgotou?</label><select id="demand-answer-'+i+'" data-demand-answer="'+i+'"><option value="unknown">Não sei</option><option value="yes"'+(r.askedMore===true?' selected':'')+'>Sim</option><option value="no"'+(r.askedMore===false?' selected':'')+'>Não</option></select><label for="demand-people-'+i+'">Quantas pessoas poderiam comprar na próxima feira?</label><input id="demand-people-'+i+'" inputmode="numeric" min="1" max="10000" type="text" value="'+esc(r.people??'')+'" placeholder="Estimativa · pode deixar sem resposta"><small>Uma estimativa sua, sem registrar venda ou alterar estoque.</small></section>').join('');
 b.open('Faltou algum produto?','<p class="dialog-text">'+esc(event.name)+'. Considere apenas a procura após esgotar.</p>'+rows,button('workflow-demand-save','Salvar observações','success')+button('close-modal','Responder depois','sheet-back'),'workflow-demand');
}
async function saveDemand(){
 if(saveBusy)return;saveBusy=true;
 try{const rows=demandRows.map((r,i)=>({productId:r.productId,askedMore:document.getElementById('demand-answer-'+i)?.value==='yes'?true:document.getElementById('demand-answer-'+i)?.value==='no'?false:null,people:document.getElementById('demand-people-'+i)?.value||null}));saveDemandObservation(bridge().data(),demandEvent,rows);await durable();bridge().close();bridge().render();bridge().toast('Observações salvas para as próximas feiras.');}catch(error){bridge().toast(error.message);}finally{saveBusy=false;}
}
function recipients(){return bridge().data().clients.filter(c=>c.noticeConsent&&/^\d{10,13}$/.test(String(c.phone||'').replace(/\D/g,'')));}
function openBroadcast(){
 const b=bridge(),list=recipients();broadcastIds=new Set();broadcastText='Olá! '+(b.data().catalog.title||b.data().settings.businessName||'')+' tem novidades. '+(b.data().catalog.publicUrl||'');
 b.open('Mensagem para clientes','<p class="dialog-text">Selecione os clientes que autorizaram avisos. Você revisa e envia cada mensagem pelo WhatsApp.</p><label class="consent-row"><input type="checkbox" id="workflow-broadcast-all">Selecionar todos ('+list.length+')</label><div class="workflow-recipient-list">'+list.map(c=>'<label class="consent-row"><input type="checkbox" data-workflow-recipient="'+esc(c.id)+'"><span>'+esc(c.name)+'</span></label>').join('')+'</div><label for="workflow-broadcast-message">Mensagem</label><textarea id="workflow-broadcast-message" maxlength="2000">'+esc(broadcastText)+'</textarea>'+(list.length?'':'<p class="small muted">Cadastre WhatsApp e autorização de avisos no cliente para incluí-lo aqui.</p>'),button('workflow-broadcast-review','Revisar destinatários','success')+button('close-modal','Voltar','sheet-back'),'workflow-broadcast');
}
function reviewBroadcast(){
 broadcastIds=new Set([...dialog().querySelectorAll('[data-workflow-recipient]:checked')].map(el=>el.dataset.workflowRecipient));
 broadcastText=dialog().querySelector('#workflow-broadcast-message')?.value.trim()||'';
 if(!broadcastIds.size||!broadcastText)return bridge().toast('Selecione clientes e escreva a mensagem.');
 const b=bridge();b.open('Revisar envios','<p class="dialog-text">'+esc(broadcastText)+'</p><p class="small muted">Cada botão abre o WhatsApp; confira e toque em Enviar lá. O app não marca a mensagem como entregue.</p>'+recipients().filter(c=>broadcastIds.has(c.id)).map(c=>button('workflow-broadcast-send','Revisar para '+esc(c.name),'choice modal-action',{id:c.id})).join(''),button('close-modal','Concluir','sheet-back'),'workflow-broadcast-review');
}
function sendBroadcast(id){const c=recipients().find(c=>c.id===id);if(!c||!broadcastIds.has(id))return bridge().toast('Confira a autorização e o WhatsApp do cliente.');let n=c.phone.replace(/\D/g,'');if(n.length<=11)n='55'+n;bridge().external('https://wa.me/'+n+'?text='+encodeURIComponent(broadcastText));}

// Only informational expansions time out. Active forms never lose their input.
function arm(element,close){
 clearTimeout(timers.get(element));timers.set(element,setTimeout(()=>{
  timers.delete(element);if(!element.isConnected)return;
  if((element.contains(document.activeElement)||element.matches('.sale-products')&&document.activeElement?.id==='sale-quantity')&&document.activeElement.matches('input,textarea,select,[contenteditable="true"]'))return arm(element,close);
  close();
 },AUTO_CLOSE_MS));
}
function scheduleExpansions(){
 for(const [el,timer]of timers)if(!el.isConnected){clearTimeout(timer);timers.delete(el);}
 for(const el of document.querySelectorAll('#app details[open],#dialog details[open]')){
  if(!timers.has(el))arm(el,()=>{el.open=false;});
 }
 for(const el of document.querySelectorAll('#app .dimension-pill.open'))if(!timers.has(el))arm(el,()=>document.dispatchEvent(new CustomEvent('territorio:collapse-configurations')));
 for(const el of document.querySelectorAll('#app .week-sales,#app .hs-sales')){if(!timers.has(el)){const head=el.parentElement.querySelector('[data-action="week-day"]');if(head)arm(el,()=>bridge().actions['week-day']({day:head.dataset.day}));}}
 const empty=document.querySelector('#app .empty-days-list');if(empty&&!timers.has(empty))arm(empty,()=>bridge().actions['week-empty-days']());
 const stock=document.querySelector('#dialog [data-action="brain-stock-toggle"][aria-expanded="true"]');if(stock&&!timers.has(stock))arm(stock,()=>bridge().actions['brain-stock-toggle']());
 const history=document.querySelector('#app .fair-history-list');if(history&&!timers.has(history))arm(history,()=>bridge().actions['event-history']());
 const list=document.querySelector('#app .client-list');if(list&&!timers.has(list))arm(list,()=>bridge().actions['clients-toggle']());
 const groups=document.querySelector('#app .sale-products');if(groups&&!timers.has(groups)&&bridge().draft()?.items.every(i=>bridge().number(i.rawQty)>0))arm(groups,()=>bridge().collapseQuantity());
}
function decorate(){
 const b=bridge(),root=document.getElementById('app');if(!root)return;
 if(b.page()==='Clientes'&&!root.querySelector('.workflow-client-tools')){
  root.querySelector('.clients-layout')?.insertAdjacentHTML('afterbegin','<section class="workflow-client-tools panel"><h2>Sua loja e seus clientes</h2>'+button('workflow-catalog','Fotos, marca e história','choice modal-action')+button('workflow-broadcast','Mensagem para vários clientes','choice modal-action')+button('store-orders','Pedidos e entregas','choice modal-action')+'</section>');
 }
 if(b.page()==='Eventos'&&!root.querySelector('.workflow-demand-pending')){
  const pending=b.data().events.filter(e=>e.status==='finished'&&!e.demandObservation&&soldOutProducts(b.data(),e.id).length);
  if(pending.length)root.querySelector('.fair-history')?.insertAdjacentHTML('beforebegin','<section class="workflow-demand-pending panel"><h2>Depois da feira</h2>'+pending.map(e=>button('workflow-demand-open','Faltou algum produto? · '+esc(e.name),'choice modal-action',{id:e.id})).join('')+'</section>');
 }
 scheduleExpansions();
}
export function installWorkflows(){
 if(installed||!bridge())return;installed=true;window.TerritorioWorkflows={eventSummary,hasDemand:id=>soldOutProducts(bridge().data(),id).length>0};
 const b=bridge();Object.assign(b.actions,{
  'workflow-quantity-done':()=>b.finishQuantity(),
  'workflow-carangola':()=>{Object.assign(b.draft(),{uf:'MG',city:'Carangola',statesExpanded:false});b.paintSaleOptions('neighborhood');},
  'workflow-neighborhood-pick':d=>{b.draft().neighborhood=d.value;b.closeSaleOptions();},
  'workflow-neighborhood-save':()=>{b.draft().neighborhood=dialog().querySelector('#workflow-custom-neighborhood').value.trim();b.closeSaleOptions();},
  'workflow-day-cost-save':()=>b.saveExtraCost(),
  'workflow-demand-open':d=>openDemand(d.id),'workflow-demand-save':saveDemand,
  'workflow-catalog':()=>b.catalog(),'workflow-broadcast':openBroadcast,
  'workflow-broadcast-review':reviewBroadcast,'workflow-broadcast-send':d=>sendBroadcast(d.id),
 });
 const weekly=b.actions['weekly-back'];b.actions['weekly-back']=d=>{b.updateScopeReturnPrivacy();weekly(d);};
 const ready=b.actions['event-history'];b.actions['event-history']=d=>{ready(d);scheduleExpansions();};
 installProductGesture(b,{source:getMotionSource,restoreSource:restoreMotionSource});
 document.addEventListener('change',event=>{if(event.target.id==='workflow-broadcast-all')dialog().querySelectorAll('[data-workflow-recipient]').forEach(el=>{el.checked=event.target.checked;});});
 for(const type of ['pointerdown','input','keydown'])document.addEventListener(type,event=>{for(const [el,timer]of timers)if(el.contains(event.target)){clearTimeout(timer);timers.delete(el);}scheduleExpansions();},{passive:true});
 document.addEventListener('toggle',scheduleExpansions,true);document.addEventListener('click',()=>queueMicrotask(scheduleExpansions));
 new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true});
 document.addEventListener('territorio:sheet',()=>{scheduleExpansions();});
 decorate();
}
