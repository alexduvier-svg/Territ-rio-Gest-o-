import {recurringEventNames} from '../event-learning.js';
import {properName} from '../proper-name.js';
export const validEventTime=value=>/^([01]\d|2[0-3]):[0-5]\d$/.test(String(value));
export function nameCompletion(data,typed){const query=String(typed).trim();if(query.length<3)return null;const matches=recurringEventNames(data,{term:query,limit:12});return matches.length===1?properName(matches[0].name):null;}
export function installEventForm(b){
 let clock=null;
 const button=(action,label,data={})=>b.button(action,label,'choice',data);
 function syncTimes(){for(const id of ['event-from','event-until']){const input=document.getElementById(id),display=document.querySelector('[data-event-time-value="'+id+'"]');if(display&&input)display.textContent=input.value;}}
 function suggestions(value=''){const target=document.getElementById('event-name-history');if(!target)return;const rows=recurringEventNames(b.data(),{term:value});target.innerHTML=rows.length?'<p class="small muted">Nomes do Seu Histórico</p><div class="event-name-chips">'+rows.map(r=>button('event-known-name',b.escape(properName(r.name)),{key:r.key})).join('')+'</div>':'';}
 function field(id){return document.getElementById(id)?.closest('.form-field');}
 function enhance(){
  const root=document.querySelector('#dialog[data-kind=event] .dialog-content');if(!root||root.querySelector('.event-form-cards'))return;
  clock=null;const name=field('event-name'),place=field('event-place'),city=field('event-city'),uf=field('event-uf'),start=field('event-start'),end=field('event-end'),fee=field('event-fee');if(!name||!start||!end)return;
  const from=document.getElementById('event-from')?.value||'08:00',until=document.getElementById('event-until')?.value||'18:00';
  const cards=document.createElement('div');cards.className='event-form-cards';cards.innerHTML='<section class="event-material-card event-identification"><h3>Qual é a Feira?</h3></section><section class="event-material-card event-schedule"><h3>Data e Horário</h3><div class="event-form-dates"></div><div class="event-time-fields"></div><div id="event-clock-editor" hidden></div><p class="small muted event-schedule-note">Encerramento automático no horário final · Brasília.</p></section>'+(fee?'<details class="event-material-card event-optional-fee"><summary>Custo para Participar (Opcional) '+b.icon('down')+'</summary></details>':'');
  const identity=cards.querySelector('.event-identification');identity.append(name);name.insertAdjacentHTML('afterend','<div id="event-name-history" aria-live="polite"></div>');if(place)identity.append(place);const region=document.createElement('div');region.className='event-form-region';if(city)region.append(city);if(uf)region.append(uf);identity.append(region);
  cards.querySelector('.event-form-dates').append(start,end);if(fee)cards.querySelector('.event-optional-fee').append(fee);
  cards.querySelector('.event-time-fields').innerHTML=[['event-from','Início',from],['event-until','Fim',until]].map(([id,label,value])=>'<input id="'+id+'" type="hidden" value="'+b.escape(value)+'"><button type="button" class="choice event-time-field" data-action="event-clock-toggle" data-field="'+id+'" aria-expanded="false" aria-controls="event-clock-editor" aria-label="Escolher Horário de '+label+'"><span>'+b.icon('clock')+' '+label+'</span><strong data-event-time-value="'+id+'">'+b.escape(value)+'</strong></button>').join('');
  root.replaceChildren(cards);document.getElementById('event-name').maxLength=160;suggestions();queueMicrotask(syncTimes);
 }
 function paintClock(){const root=document.getElementById('event-clock-editor');if(!root||!clock)return;root.hidden=false;
  const [hour,minute]=clock.value.split(':'),values=clock.mode==='hour'?Array.from({length:24},(_,i)=>i):clock.precise?Array.from({length:60},(_,i)=>i):Array.from({length:12},(_,i)=>i*5),part=clock.mode==='hour'?hour:minute;
  root.innerHTML='<div class="event-clock-heading"><strong>Horário de '+(clock.field==='event-from'?'Início':'Fim')+'</strong>'+b.button('event-clock-toggle',b.icon('close')+'<span class="sr-only">Fechar Horário</span>','round',{field:clock.field})+'</div><div class="event-clock-tabs">'+button('event-clock-mode','Hora <b>'+hour+'</b>',{mode:'hour'})+button('event-clock-mode','Minuto <b>'+minute+'</b>',{mode:'minute'})+'</div><p class="small muted">Escolha '+(clock.mode==='hour'?'a hora. Depois, escolha os minutos.':'os minutos para aplicar o horário.')+'</p><div class="event-clock-grid" role="group" aria-label="'+(clock.mode==='hour'?'Horas':'Minutos')+'">'+values.map(n=>{const value=String(n).padStart(2,'0');return '<button type="button" class="choice'+(value===part?' selected':'')+'" data-action="event-clock-pick" data-value="'+value+'" aria-pressed="'+(value===part)+'">'+value+'</button>';}).join('')+'</div>'+(clock.mode==='minute'&&!clock.precise?button('event-clock-precise','Outro Minuto'):'');
  root.querySelector('[data-mode="'+clock.mode+'"]')?.classList.add('selected');root.querySelector('.event-clock-grid .selected')?.scrollIntoView({block:'nearest'});
 }
 function closeClock(){clock=null;const root=document.getElementById('event-clock-editor');if(root)root.hidden=true;document.querySelectorAll('.event-time-field').forEach(el=>el.setAttribute('aria-expanded','false'));}
 Object.assign(b.actions,{
  'event-known-name':({key})=>{const name=recurringEventNames(b.data(),{limit:12}).find(n=>n.key===key);if(!name)return;const input=document.getElementById('event-name');input.value=properName(name.name);input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length);suggestions(input.value);},
  'event-clock-toggle':({field})=>{if(clock?.field===field)return closeClock();const input=document.getElementById(field);if(!input||!['event-from','event-until'].includes(field))return;closeClock();clock={field,mode:'hour',value:validEventTime(input.value)?input.value:'08:00',precise:false};document.querySelector('[data-field="'+field+'"]')?.setAttribute('aria-expanded','true');paintClock();},
  'event-clock-mode':({mode})=>{if(!clock||!['hour','minute'].includes(mode))return;clock.mode=mode;paintClock();},
  'event-clock-precise':()=>{if(clock){clock.precise=true;paintClock();}},
  'event-clock-pick':({value})=>{if(!clock||!/^\d{2}$/.test(value))return;const [h,m]=clock.value.split(':');if(clock.mode==='hour'){if(Number(value)>23)return;clock.value=value+':'+m;clock.mode='minute';paintClock();}else{if(Number(value)>59)return;const input=document.getElementById(clock.field);input.value=h+':'+value;input.dispatchEvent(new Event('input',{bubbles:true}));syncTimes();closeClock();}}
 });
 document.addEventListener('input',event=>{const input=event.target;if(['event-from','event-until'].includes(input.id))return syncTimes();if(input.id!=='event-name'||b.modal()?.kind!=='event')return;const typed=input.value;if(!event.isComposing&&!String(event.inputType||'').startsWith('delete')&&input.selectionStart===typed.length){const complete=nameCompletion(b.data(),typed);if(complete&&complete.length>typed.length){input.value=complete;input.setSelectionRange(typed.length,complete.length);}}suggestions(typed);});
 return enhance;
}
