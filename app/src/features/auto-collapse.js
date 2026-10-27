export const EXPANSION_IDLE_MS=60000;
// Deadlines follow semantic sections across redraws; only an interaction resets them.
export function createIdleExpansions({delay=EXPANSION_IDLE_MS,setTimer=setTimeout,clearTimer=clearTimeout}={}){
 const entries=new Map();let paused=false;
 const arm=entry=>{clearTimer(entry.timer);if(paused)return;entry.timer=setTimer(()=>{if(!entries.has(entry.key))return;if(entry.blocked?.()){arm(entry);return;}entries.delete(entry.key);entry.close();},delay);};
 return{register(key,entry){if(entries.has(key))Object.assign(entries.get(key),entry);else{const row={key,...entry};entries.set(key,row);arm(row);}},retain(keys){for(const[key,row]of entries)if(!keys.has(key)){clearTimer(row.timer);entries.delete(key);}},touch(target){for(const entry of entries.values())if(entry.contains(target))arm(entry);},pause(){paused=true;for(const entry of entries.values())clearTimer(entry.timer);},resume(){if(!paused)return;paused=false;for(const entry of entries.values())arm(entry);},clear(){for(const entry of entries.values())clearTimer(entry.timer);entries.clear();},size:()=>entries.size};
}
export function installAutoCollapse(){
 const b=()=>window.TerritorioWorkflowBridge,registry=createIdleExpansions();let queued=false;
 const scope=el=>el.closest('dialog')?.dataset.kind||b().page();
 const editing=el=>{const field=document.activeElement;if(!field?.matches('textarea,select,[contenteditable="true"],input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=hidden])')||field.readOnly||field.disabled)return false;const area=el.closest('dialog,form,.sale-products,.registration-dimensions')||el;return area.contains(field);};
 function scan(){queued=false;const keys=new Set(),add=(key,el,close)=>{keys.add(key);registry.register(key,{contains:target=>el.contains(target),blocked:()=>document.hidden||editing(el),close:()=>{if(el.isConnected){close();schedule();}}});};
  const occurrences=new Map();for(const el of document.querySelectorAll('#app details[open],dialog[open] details[open],#number-pad details[open]')){
   const label=el.dataset.managementSection||el.dataset.resourceGroup||el.dataset.day||el.id||el.querySelector(':scope>summary')?.textContent||'',base=scope(el)+':details:'+el.className+':'+label,n=occurrences.get(base)||0;occurrences.set(base,n+1);
   add(base+':'+n,el,()=>{if(!el.open)return;if(el.classList.contains('number-price-presets')){b().foldNumericPresets();return;}const summary=el.querySelector(':scope>summary');if(summary)summary.click();else el.open=false;});
  }
  for(const el of document.querySelectorAll('#app .dimension-pill.open'))add('dimensions:'+scope(el)+':'+el.dataset.accIndex,el,()=>document.dispatchEvent(new CustomEvent('territorio:collapse-configurations')));
  for(const el of document.querySelectorAll('#app .week-sales,#app .hs-sales')){const head=el.parentElement.querySelector('[data-action="week-day"]');if(head)add('week:'+head.dataset.day,el,()=>b().actions['week-day']({day:head.dataset.day}));}
  for(const[selector,action,key]of [['#app .empty-days-list','week-empty-days','empty'],['#app .fair-history-list','event-history','events'],['#app .client-list','clients-toggle','clients'],['#dialog [data-action="brain-stock-toggle"][aria-expanded=true]','brain-stock-toggle','brain']]){const el=document.querySelector(selector);if(el)add(scope(el)+':'+key,el,()=>b().actions[action]());}
  for(const control of document.querySelectorAll('#app [aria-expanded=true][aria-controls],dialog[open] [aria-expanded=true][aria-controls]')){
   if(control.matches('input,[role=combobox]'))continue;const target=document.getElementById(control.getAttribute('aria-controls'));if(!target||target.hidden)continue;
   add(scope(control)+':control:'+control.getAttribute('aria-controls'),target,()=>{if(control.getAttribute('aria-expanded')==='true')control.click();});
  }
  const groups=document.querySelector('#app .sale-products');if(groups&&b().draft()?.items?.every(i=>b().number(i.rawQty)>0))add('sale-products',groups,()=>b().collapseQuantity());
  // Old-style expanded neighbourhood selectors have no aria-controls.
  for(const el of document.querySelectorAll('#dialog .neighborhood-list')){const control=el.parentElement.querySelector('[data-action="locality-toggle"]');if(control)add(scope(el)+':neighborhood',el,()=>control.click());}
  for(const key of window.TerritorioResourcePolicy?.expandedKeys?.()||[]){const control=[...document.querySelectorAll('#app [data-action=resource-more]')].find(el=>el.dataset.key===key);const section=control?.closest('details,section,.card')||control?.parentElement||(key==='clients'?document.querySelector('#app .client-list'):key==='selling'?document.querySelector('#app .glass-products-plane'):key==='stock-families'?document.querySelector('#app .feira-stock')||document.getElementById('app'):key.startsWith('stock-')?[...document.querySelectorAll('#app details[data-resource-group]')].find(el=>el.dataset.resourceGroup===key.slice(6)):null);if(section)add('resource:'+scope(section)+':'+key,section,()=>b().actions['resource-less']({key}));}
  for(const key of b().expandedStockLists?.()||[]){const action={ownLimit:'stock-own-more',familyLimit:'stock-family-more',presentationLimit:'stock-presentations-more'}[key],control=document.querySelector('#app [data-action='+action+']');const section=control?.closest('section')||control?.parentElement||document.querySelector('#stock-picker-results,#stock-name-suggestions,.stock-presentation-chooser');if(section){add('stock-list:'+key,section,()=>b().foldStockList(key));}}
  registry.retain(keys);
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(scan);}}
 for(const type of ['pointerdown','input','keydown','focusin'])document.addEventListener(type,event=>{registry.touch(event.target);schedule();},{passive:true});
 // Rolar só renova os prazos: varrer a tela a cada quadro do dedo pesava a rolagem em celulares básicos.
 for(const type of ['wheel','touchmove'])document.addEventListener(type,event=>registry.touch(event.target),{passive:true});
 document.addEventListener('toggle',schedule,true);document.addEventListener('click',schedule);document.addEventListener('territorio:sheet',schedule);document.addEventListener('visibilitychange',()=>{if(document.hidden)registry.pause();else registry.resume();schedule();});
 new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','aria-expanded']});
 window.TerritorioAutoCollapse={scan,schedule,delay:EXPANSION_IDLE_MS,count:()=>registry.size()};schedule();
}
