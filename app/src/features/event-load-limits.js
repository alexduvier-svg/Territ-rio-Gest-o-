import {eventLoadLimit} from './stock-lots/reservations.js';
export function installEventLoadLimits(b=window.TerritorioWorkflowBridge){
 const popup=document.createElement('dialog');popup.id='event-load-limit-dialog';popup.dataset.kind='event-load-limit';popup.dataset.bottomBack='';popup.dataset.noClose='';popup.setAttribute('aria-labelledby','event-load-limit-title');document.body.append(popup);
 let timer=null,returnInput='',closing=false;
 const current=()=>b.modal()?.kind==='event-load'&&document.getElementById('dialog').open;
 const row=input=>b.eventDraft()?.products[Number(input?.dataset.eventLoadIndex)];
 const limit=input=>{const p=row(input);return p?eventLoadLimit(b.data(),b.eventDraft().eventId,p.productId):null;};
 function sync(){
  if(!current())return;
  for(const input of document.querySelectorAll('#dialog input[data-event-load-index]')){
   const cap=limit(input);if(!cap)continue;const unavailable=cap.maxTotal<=0,pending=b.eventDraft()?.pendingLoadSaved||b.eventDraft()?.busy;
   input.disabled=!!pending||unavailable;input.setAttribute('aria-disabled',String(input.disabled));input.max=String(cap.maxTotal);
   const root=input.closest('.event-load-row');root.classList.toggle('event-load-unavailable',unavailable);
   let hint=root.querySelector('.el-eligible');if(!hint){hint=document.createElement('small');hint.className='el-eligible';root.querySelector(':scope>span')?.append(hint);}
   hint.textContent=unavailable?'Indisponível para Esta Feira':'Pode Levar: '+b.quantity(cap.maxTotal)+' '+window.ERP.unitLabel(row(input).unit,cap.maxTotal);
   const clear=root.querySelector('.el-clear');if(clear)clear.disabled=!!pending||unavailable&&!String(input.value).trim();
  }
 }
 function warn(input,cap){
  if(!current()||document.hidden||popup.open||closing)return;clearTimeout(timer);returnInput=input.id;
  const product=row(input),actual=b.data().products.find(p=>p.id===product.productId),name=actual?window.TerritorioCoffee.coffeeName(actual):product.name,description=actual?b.description(actual):product.description,qty=b.number(input.value),missing=Math.max(0,Math.round((qty-cap.maxTotal)*1000)/1000),unit=window.ERP.unitLabel(product.unit,cap.maxTotal);
  popup.innerHTML='<div class="checkout-header"><h2 id="event-load-limit-title">Estoque Insuficiente</h2></div><div class="dialog-content"><p class="dialog-text"><strong>'+b.escape(name)+'</strong><br><small class="muted">'+b.escape(description)+'</small></p><p>Você informou '+b.escape(b.quantity(qty))+'. Para esta feira, pode levar até <strong>'+b.escape(b.quantity(cap.maxTotal)+' '+unit)+'</strong>.</p><p class="small muted">Para levar essa quantidade, reponha pelo menos '+b.escape(b.quantity(missing)+' '+window.ERP.unitLabel(product.unit,missing))+' com validade adequada e confira as reservas. Use o botão + da preparação para cadastrar ou repor. Você também pode reduzir a quantidade.</p></div><div class="checkout-footer">'+b.button('event-load-limit-back',b.icon('back')+'<span>Conferir Quantidade</span>','sheet-back')+'</div>';
  input.blur();popup.showModal();
 }
 function invalid(input,{show=true}={}){
  const cap=limit(input);if(!cap)return false;const qty=b.number(input.value),bad=Number.isFinite(qty)&&qty>cap.maxTotal+0.000001;
  input.setAttribute('aria-invalid',String(bad));if(bad&&show)warn(input,cap);return bad;
 }
 function close(){if(closing||!popup.open)return;closing=true;popup.close();}
 popup.addEventListener('close',()=>{closing=false;const input=document.getElementById(returnInput);if(current()&&input&&!input.disabled){input.focus({preventScroll:true});input.select();}});
 b.actions['event-load-limit-back']=close;
 popup.addEventListener('cancel',event=>{event.preventDefault();close();});
 for(const action of['event-load-next','save-event-load']){
  const previous=b.actions[action];b.actions[action]=function(...args){if(current()){
   clearTimeout(timer);const inputs=action==='event-load-next'?[document.activeElement?.matches('[data-event-load-index]')?document.activeElement:document.querySelector('#dialog input[data-event-load-index][data-load-active=true]')]:[...document.querySelectorAll('#dialog input[data-event-load-index]')];
   if(inputs.some(input=>input&&invalid(input)))return;
  }const result=previous.apply(this,args);if(result?.finally)return result.finally(sync);sync();return result;};
 }
 document.addEventListener('focusin',event=>{if(!current()||!event.target.matches('[data-event-load-index]'))return;document.querySelectorAll('#dialog [data-load-active]').forEach(el=>delete el.dataset.loadActive);event.target.dataset.loadActive='true';});
 document.addEventListener('input',event=>{if(!current()||!event.target.matches('[data-event-load-index]'))return;clearTimeout(timer);const input=event.target;invalid(input,{show:false});timer=setTimeout(()=>{if(input.isConnected&&current())invalid(input);},1000);});
 document.addEventListener('territorio:sheet',()=>{clearTimeout(timer);sync();if(!current()&&popup.open)close();});
}
