import { lastFairSummary, soldOutProducts, saveDemandObservation, demandSignals } from '../event-learning.js';

const bridge=()=>window.TerritorioWorkflowBridge;
const esc=v=>bridge().escape(v);
const button=(...args)=>bridge().button(...args);
const dialog=()=>document.getElementById('dialog');
let installed=false, broadcastIds=new Set(), broadcastText='', demandEvent='', demandRows=[], saveBusy=false;

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

function scheduleExpansions(){window.TerritorioAutoCollapse?.schedule();}
function decorate(){
 const b=bridge(),root=document.getElementById('app');if(!root)return;
 if(b.page()==='Clientes'&&!root.querySelector('.workflow-client-tools')){
  const target=root.querySelector('.clients-layout>.receivable-entry');(target||root.querySelector('.clients-layout'))?.insertAdjacentHTML(target?'afterend':'afterbegin','<section class="workflow-client-tools panel"><h2>Sua loja e seus clientes</h2>'+button('workflow-catalog','Fotos, marca e história','choice modal-action')+button('workflow-broadcast','Mensagem para vários clientes','choice modal-action')+button('store-orders','Pedidos e entregas','choice modal-action')+'</section>');
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
 // Product cards count taps (1 sells, 2 peek the stock) within TAP_GAP; holding starts the selection (reorder.js).
 // The second tap only has to touch down within TAP_GAP of the first one lifting: from then on the
 // first is held until its click arrives (or TAP_HOLD passes), so a single tap waits less.
 let tap=null,serial=0;const TAP_GAP=200,TAP_HOLD=350;
 const resolveTaps=t=>{if(b.page()==='Vender'&&t.count===1)b.actions['sell-product']({id:t.id});};
 window.TerritorioProductGestures={suspend:()=>clearTimeout(tap?.timer),cancelPending:()=>{clearTimeout(tap?.timer);tap=null;serial++;}};
 document.addEventListener('pointercancel',()=>window.TerritorioProductGestures.cancelPending(),{passive:true});
 document.addEventListener('pointerdown',event=>{
  const card=event.target.closest?.('#app [data-action="sell-product"]');
  if(!tap||tap.armed||!card||card.dataset.id!==tap.id||Date.now()-tap.at>=TAP_GAP)return;
  clearTimeout(tap.timer);tap.armed=true;const current=++serial,pending=tap;
  pending.timer=setTimeout(()=>{if(current!==serial||tap!==pending)return;tap=null;resolveTaps(pending);},TAP_HOLD);
 },{capture:true,passive:true});
 document.addEventListener('click',event=>{
  const card=event.target.closest?.('#app [data-action="sell-product"]');if(!card||card.disabled||b.page()!=='Vender'||window.TerritorioSelection?.active())return;
  // Toques no cartão: 1 abre a venda, 2 mostram o estoque dele (segurar abre a seleção de vários).
  // O 1º toque espera TAP_GAP por um próximo (o cartão já afunda ao toque); o 2º age na hora.
  event.preventDefault();event.stopImmediatePropagation();const id=card.dataset.id,now=Date.now();
  if(tap&&tap.id===id&&(tap.armed||now-tap.at<TAP_GAP)){clearTimeout(tap.timer);tap.count++;tap.at=now;}
  else{if(tap){clearTimeout(tap.timer);resolveTaps(tap);}tap={id,count:1,at:now,timer:0};}
  if(tap.count>=2){const done=tap;tap=null;serial++;b.actions['stock-peek']({id:done.id});return;}
  const current=++serial,pending=tap;pending.timer=setTimeout(()=>{if(current!==serial||tap!==pending)return;tap=null;resolveTaps(pending);},TAP_GAP);
 },true);
 let zeroTap=null;document.addEventListener('pointerup',event=>{const card=event.target.closest?.('#app [data-action="sell-product"][disabled]');if(!card||b.page()!=='Vender')return;const id=card.dataset.id;if(zeroTap?.id===id&&Date.now()-zeroTap.at<320){zeroTap=null;b.actions['stock-peek']({id});}else zeroTap={id,at:Date.now()};},true);
 document.addEventListener('keydown',event=>{const card=event.target.closest?.('body > #app [data-action="sell-product"]');if(card&&(event.key==='ContextMenu'||event.shiftKey&&event.key==='Enter')){event.preventDefault();event.stopImmediatePropagation();clearTimeout(tap?.timer);tap=null;serial++;b.actions['stock-peek']({id:card.dataset.id});}},true);
 document.addEventListener('change',event=>{if(event.target.id==='workflow-broadcast-all')dialog().querySelectorAll('[data-workflow-recipient]').forEach(el=>{el.checked=event.target.checked;});});
 document.addEventListener('toggle',scheduleExpansions,true);document.addEventListener('click',()=>queueMicrotask(scheduleExpansions));
 new MutationObserver(decorate).observe(document.getElementById('app'),{childList:true});
 document.addEventListener('territorio:sheet',()=>{scheduleExpansions();});
 decorate();
}
