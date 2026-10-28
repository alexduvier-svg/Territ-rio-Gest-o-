import * as Lots from './domain.js';
import {currentLots,calendarEntries,stockValidityOverview} from './derived.js';
import {renderLotForm,formValidity,proposedExpiry,esc} from './form.js';
export const form=renderLotForm;
let bridge,view=null;
const externalDrafts=new Map();
export function bindDraft(key,getter){if(key==='fair-entry-lot'&&typeof getter==='function')externalDrafts.set(key,getter);}
const button=(action,text,cls='choice',data)=>bridge?bridge.button(action,text,cls,data):'<button type="button" data-action="'+action+'" class="'+cls+'"'+Object.entries(data||{}).map(([k,v])=>' data-'+k+'="'+esc(v)+'"').join('')+'>'+text+'</button>',model=()=>bridge.lotModel(),data=()=>bridge?.data();
const names=p=>window.TerritorioCoffee?.coffeeName(p)||p.name;
const quantity=(n,unit)=>(bridge?.quantity(n)||window.ERP?.quantity(n)||String(n))+' '+(window.ERP?.unitLabel(unit,n)||unit);
const live=el=>!!el&&!el.closest('.fluid-page-morph-layer,.fluid-exit-layer,.fluid-section-ghost,[inert]')&&(!el.closest('dialog')||el.closest('dialog').open);
const liveForm=key=>[...document.querySelectorAll('[data-lot-form]')].find(el=>el.dataset.lotForm===key&&live(el));
export function capture(key,raw={}){
 const el=liveForm(key);if(!el)return raw;
 for(const input of el.querySelectorAll('[data-lot-field]'))raw[input.dataset.lotField]=input.type==='checkbox'?input.checked:input.value;
 raw.open=el.open;return raw;
}
export function read(key,raw={}){return formValidity(capture(key,raw));}
export function brief(stockData,p,{red=false}={}){
 if(stockData.stockLotsVersion!==1)return'';
 const s=Lots.lotSnapshot(stockData,p.id);if(s.issues.length)return '<small class="lot-brief lot-warning">Conferir Lotes</small>';
 const r=Lots.summarizeValidity(s.lots);if(!r.physical||!r.earliest&&!r.expired&&!r.quarantine&&!r.needsConfirmation)return'';
 const text=r.expired?'Há Lotes Vencidos':r.quarantine?'Há Lotes em Avaliação':r.needsConfirmation&&!r.earliest?'Validade por Mês: Conferir os Detalhes':r.earliest===r.latest?'Validade: '+Lots.formatCivil(r.earliest):'Validade: '+Lots.formatCivil(r.earliest)+' a '+Lots.formatCivil(r.latest);
 return'<small class="lot-brief'+(red?' lot-warning':'')+'">'+esc(text)+'</small>';
}
export function summary(stockData,p){
 if(stockData.stockLotsVersion!==1)return'';const s=Lots.lotSnapshot(stockData,p.id),r=Lots.summarizeValidity(s.lots),rows=s.lots.filter(l=>l.remaining>0),periods=[...new Set(rows.map(l=>Lots.periodLabel(l.validity)).filter(Boolean))];
 let html='<section class="lot-stock-summary" aria-label="Validade do Estoque">';
 if(s.issues.length)html+='<p class="lot-warning">Os lotes precisam de conferência antes de vender.</p>';
 else{
  if(periods.length===1&&rows.every(l=>Lots.periodLabel(l.validity)===periods[0]))html+='<p><strong>Prazo Informado: '+esc(periods[0])+'</strong></p>';else if(periods.length)html+='<p>Consulte o Prazo Informado de Cada Lote nos Detalhes.</p>';
  if(r.earliest){const range=r.earliest===r.latest?Lots.formatCivil(r.earliest):Lots.formatCivil(r.earliest)+' a '+Lots.formatCivil(r.latest);html+='<p>Vencimento: '+esc(range)+'</p>';if(r.earliest===r.latest){const days=Lots.civilDistance(Lots.civilDay(),r.earliest);html+='<p'+(days<0?' class="lot-warning"':'')+'>'+(days<0?'Vencido há '+(-days)+(days===-1?' Dia':' Dias'):days===0?'Vence Hoje':days===1?'Resta 1 Dia':'Restam '+days+' Dias')+'</p>';}}
  if(r.unknown)html+='<p>'+esc(quantity(r.unknown,p.unit))+' com Validade Não Informada</p>';
  if(r.needsConfirmation)html+='<p>'+esc(quantity(r.needsConfirmation,p.unit))+' com Mês Informado, sem Dia Confirmado.</p>';
  if(r.estimated)html+='<p>Há Datas Estimadas. Confira a Origem nos Detalhes de Cada Lote.</p>';
  if(r.notApplicable)html+='<p>'+esc(quantity(r.notApplicable,p.unit))+' marcados como Não Se Aplica</p>';
  if(r.expired||r.quarantine)html+='<p class="lot-warning">Disponível para Venda: '+esc(quantity(r.eligible,p.unit))+'. Vencidos e itens em avaliação mantêm seu saldo físico.</p>';
 }
 return html+button('lots-open','Ver Lotes e Entradas','choice lot-summary-action',{id:p.id})+'</section>';
}
export function entry(){return data()?.stockLotsVersion===1?button('lots-agenda','Validades e Revisões '+bridge.icon('chevron'),'event-material-card lot-agenda-entry'):'';}
export function eventRange(stockData,eventId,draft){
 if(stockData.stockLotsVersion!==1)return'';const e=stockData.events.find(e=>e.id===eventId);if(!e)return'';let rows=[];
 try{
  if(draft){const items=draft.products.map(p=>({...p,qty:Number(String(p.raw||'0').replace(',','.'))})).filter(p=>p.qty>0),plan=Lots.prepareEventLots(stockData,eventId,items);for(const p of plan.products){const s=Lots.lotSnapshot(stockData,p.productId,e.start);for(const a of p.allocations){const l=s.lots.find(l=>l.id===a.lotId);if(l)rows.push({...l,remaining:a.quantity});}}}
  else{const load=stockData.eventLoads?.find(l=>l.eventId===eventId);if(!load?.items.length)return'';if(!load.lotPlan)return'<p class="notice lot-cargo-info">Validade da Carga Não Conferida. Revise os lotes ao preparar a feira.</p>';for(const p of load.items){const selection=Lots.eventLots(stockData,eventId,p.productId,e.start);rows.push(...selection.lots);}}
 }catch{return'<p class="notice lot-cargo-info">Confira as quantidades, reservas e lotes elegíveis até o fim da feira.</p>';}
 const positive=rows.filter(l=>l.remaining>0),dates=positive.map(l=>Lots.validityState(l.validity,e.start).daysLeft).filter(n=>n!==null).sort((a,b)=>a-b),missing=new Set(positive.filter(l=>['unknown','confirm_date'].includes(Lots.validityState(l.validity,e.start).code)).map(l=>l.productId));if(!positive.length)return'';
 return'<p class="notice lot-cargo-info">'+(dates.length?'Validade da Carga: '+dates[0]+(dates.at(-1)!==dates[0]?' a '+dates.at(-1):'')+' Dias em '+Lots.formatCivil(e.start)+'. ':'')+(missing.size?missing.size+' '+(missing.size===1?'Produto com Parte da Carga sem Data.':'Produtos com Parte da Carga sem Data.'):'')+(!dates.length&&!missing.size?'Carga com Controle Declarado como Não Se Aplica.':'')+'</p>';
}
const card=(title,body)=>'<section class="event-material-card lot-list-card"><h3>'+esc(title)+'</h3>'+body+'</section>';
const pager=(action,page,more)=>page||more?'<div class="lot-nav">'+(page?button(action,'Anteriores','choice',{page:page-1}):'')+(more?button(action,'Próximas','choice',{page:page+1}):'')+'</div>':'';
function back(){if(view?.returnTo==='movement'){view=null;bridge.repaintLotMovement();}else{view=null;bridge.close();}}
// Persist a candidate copy. A rejected save must leave balances, audit and preferences intact.
function persistLotChange(change,message){
 const m=model(),before=m.data;m.data=JSON.parse(JSON.stringify(before));
 try{change(m);if(!bridge.persist())throw Error(message);}catch(error){m.data=before;throw error;}
}
async function lotDurable(){
 if(window.TerritorioNative?.durable&&!await window.TerritorioNative.durable())throw Error('Gravação pendente. Libere espaço e tente novamente; a operação não será repetida.');
}
function openProduct(id,{returnTo='movement',page=0,includeZero=false}={}){
 const p=model().product(id);if(!p)return bridge.toast('Produto não encontrado.');const snapshot=Lots.lotSnapshot(data(),id),rows=snapshot.lots.filter(l=>l.remaining>0||includeZero&&l.received>0).sort((a,b)=>Number(b.remaining>0)-Number(a.remaining>0)||(a.status.expiresOn||'9999').localeCompare(b.status.expiresOn||'9999')||a.recordedAt.localeCompare(b.recordedAt));view={type:'product',productId:id,returnTo,page,includeZero,actorId:data().dataContext?.id};
 const body='<p class="dialog-text">'+esc(names(p))+' · '+esc(bridge.description(p))+'</p>'+summary(data(),p).replace(/<button[\s\S]*?<\/button>/,'')+(snapshot.issues.length?'<p class="error">Confira a integridade do estoque antes de alterar lotes.</p>':'')+rows.slice(page*8,page*8+8).map(l=>card(l.validity.lotCode?'Lote '+l.validity.lotCode:l.legacy?'Saldo Anterior Sem Validade Informada':'Entrada em '+new Date(l.recordedAt).toLocaleDateString('pt-BR'),'<p><strong>'+esc(quantity(l.remaining,p.unit))+'</strong> · '+esc(l.quarantined?'Em Avaliação':l.status.label)+'</p>'+(Lots.periodLabel(l.validity)?'<p>Prazo Informado: '+esc(Lots.periodLabel(l.validity))+'</p>':'')+(l.status.expiresOn?'<p>Vencimento: '+Lots.formatCivil(l.status.expiresOn)+'</p>':l.validity.expiryMonth?'<p>Mês Informado: '+esc(l.validity.expiryMonth)+'</p>':'')+(l.receivedOn?'<p>Recebimento: '+Lots.formatCivil(l.receivedOn)+'</p>':'')+button('lots-edit','Conferir Data e Condição','choice',{id:l.id})+(l.remaining>0&&l.status.blocking?button('lots-loss','Registrar Como Perda','danger lot-loss',{id:l.id}):''))).join('')+(!rows.length?'<p class="dialog-text">Sem saldo físico. Cada nova reposição terá sua própria validade opcional.</p>':'')+card('Aviso Antes do Vencimento','<p class="ds-note">Quantos dias antes de vencer este produto aparece como "vence em breve" e recebe o aviso. Folhas e frutas pedem poucos dias; café e mel, mais.</p><div class="lot-lead-row"><label for="lot-lead-days">Dias antes</label><input id="lot-lead-days" type="text" inputmode="numeric" maxlength="2" value="'+Lots.productLead(data(),p.id)+'">'+button('lots-lead-save','Salvar','choice')+'</div>');
 const footer='<div class="lot-actions">'+pager('lots-page',page,(page+1)*8<rows.length)+button('lots-history',includeZero?'Ver Apenas Saldo Atual':'Consultar Entradas Anteriores')+button('lots-back','Voltar','sheet-back')+'</div>';bridge.open('Lotes e Validade',body,footer,'stock-lots');
}
// Lote vencido: baixa o saldo daquele lote como perda (entra em "Perdas de estoque" de Finanças, ao custo).
// Pede confirmação com quantidade e valor; não apaga o histórico e pode ser corrigido depois pelo Estoque.
function lossLot(id){
 const prior=view,p=model().product(prior?.productId),lot=p&&Lots.lotSnapshot(data(),p.id).lots.find(l=>l.id===id);if(!lot||!(lot.remaining>0)||!lot.status.blocking)return bridge.toast('Reabra os lotes para conferir o saldo.');
 view={...prior,type:'loss',lotId:id,returnView:prior};
 const known=Number.isFinite(p.cost)&&(p.costKnown===true||p.cost>0),value=known?window.ERP.money(Math.round(p.cost*lot.remaining)):'';
 const body='<p class="dialog-text">'+esc(names(p))+' · '+esc(bridge.description(p))+'</p>'+card(lot.validity.lotCode?'Lote '+lot.validity.lotCode:'Entrada em '+new Date(lot.recordedAt).toLocaleDateString('pt-BR'),'<p><strong>'+esc(quantity(lot.remaining,p.unit))+'</strong> · '+esc(lot.status.label)+(lot.status.expiresOn?' em '+Lots.formatCivil(lot.status.expiresOn):'')+'</p>')+'<p class="dialog-text">Baixar todo o saldo deste lote como perda por vencimento?</p><p class="ds-note">'+(known?'Entra em Perdas de Estoque, em Finanças, pelo custo: '+esc(value)+'.':'O produto está sem custo conhecido: a perda baixa o estoque, mas o valor não entra em Finanças.')+' O registro fica no histórico do produto.</p>';
 bridge.open('Registrar Perda',body,'<div class="lot-actions">'+button('lots-loss-confirm','Registrar Perda','danger',{id})+button('lots-loss-back','Voltar','sheet-back')+'</div>','stock-lots');
}
function editLot(id){
 const prior=view,p=model().product(prior?.productId),lot=p&&Lots.lotSnapshot(data(),p.id).lots.find(l=>l.id===id);if(!lot)return bridge.toast('Reabra os lotes para conferir o saldo.');
 view={type:'edit',productId:p.id,lotId:id,parent:prior,raw:{...lot.validity,receivedOn:lot.receivedOn||'',open:true},lot};paintEdit();
}
function paintEdit(error=''){
 const v=view,l=v.lot;
 bridge.open('Conferir Lote',card(names(model().product(v.productId)),'<p>'+esc(quantity(l.remaining,l.unit))+' · '+esc(l.quarantined?'Em Avaliação':l.status.label)+'</p>')+form('lot-edit',v.raw,bridge,{receiptLocked:true})+'<section class="client-form-surface"><label for="lot-condition">Condição do Lote</label><select id="lot-condition"><option value="keep">Manter Condição Atual</option><option value="quarantine">Manter em Avaliação</option>'+(l.quarantined?'<option value="available">Liberar Após Conferência</option>':'')+'</select><label for="lot-edit-reason">Motivo da Correção ou Conferência</label><input id="lot-edit-reason" maxlength="300" value="'+esc(v.reason||'')+'"><label class="lot-check"><input type="checkbox" id="lot-correction-confirmed">Conferi a Informação Original e a Condição do Item</label><p class="small muted">Corrigir a data de um lote vencido exige motivo e deixa o lote em avaliação. Uma avaliação não altera a validade.</p></section>'+(error?'<p class="error" role="alert">'+esc(error)+'</p>':''),'<div class="lot-actions">'+button('lots-edit-save','Salvar Conferência','success')+button('lots-edit-back','Voltar','sheet-back')+'</div>','lot-edit');
}
function agenda(page=0,filter='all'){
 const today=Lots.civilDay(),rows=calendarEntries(data(),today).filter(e=>e.active&&(filter==='expiry'?e.kind==='lot-expiry'&&e.date>=today:filter==='attention'?e.date<=Lots.addCivil(today,5):true)),overview=stockValidityOverview(data());view={type:'agenda',page,filter};
 const monthly=currentLots(data(),today).filter(l=>l.remaining>0&&!l.archived&&['confirm_date','expired_month'].includes(l.status.code)).slice(0,12).map(l=>card('Mês Informado: '+l.validity.expiryMonth.split('-').reverse().join('/'),'<p>'+esc(names(model().product(l.productId)))+' · '+esc(quantity(l.remaining,l.unit))+'</p><p>'+esc(l.status.label)+'. Sem dia exato, não são criados avisos diários.</p>'+button('lots-open','Conferir Lote','choice',{id:l.productId,from:'agenda'}))).join('');
 const body='<p class="dialog-text">'+overview.withExpired+' '+(overview.withExpired===1?'Produto com Lotes Vencidos':'Produtos com Lotes Vencidos')+' · '+overview.withUpcoming+' com Vencimento Próximo</p><p class="small muted">Agenda interna, disponível sem internet. Avisos no celular dependem da permissão e das condições do Android.</p>'+button('lots-enable','Ativar Avisos no Celular','choice lot-agenda-entry')+'<details class="event-material-card lot-consultations"><summary>Consultas Rápidas</summary><div class="lot-agenda-tools">'+button('lots-question','O Que Vence Primeiro?','choice',{kind:'expiry'})+button('lots-question','O Que Pede Atenção?','choice',{kind:'attention'})+'</div><p class="small muted">Estoque atual de todos os locais. Datas confirmadas e quantidades restantes; sem projeção de demanda.</p></details>'+monthly+rows.slice(page*12,page*12+12).map(e=>{const p=model().product(e.productId),title=e.kind==='quote-validity'?'Validade da Cotação':e.kind==='lot-review'?'Revisão do Lote':'Vencimento do Lote';return card(Lots.formatCivil(e.date)+' · '+title,'<p>'+esc(p?names(p):'Cotação Cadastrada em Fornecedores')+'</p>'+(p?'<p>'+esc(quantity(e.remaining,p.unit))+'</p>':'')+'<p>'+esc(e.state==='expired'?'Vencido':e.state==='today'?'Hoje':e.state==='overdue'?'Revisão Pendente':'Data Registrada')+'</p>'+(e.estimated?'<p>Data Estimada Informada pelo Produtor.</p>':'')+(p?button('lots-open','Ver Lotes','choice',{id:p.id,from:'agenda'}):button('lots-suppliers','Ver Fornecedores')));}).join('')+(!rows.length?card('Sem Datas Registradas','<p>Ao informar uma validade exata ou uma revisão, ela aparecerá aqui. A validade continua opcional.</p>'):'');
 const footer='<div class="lot-actions">'+pager('lots-agenda-page',page,(page+1)*12<rows.length)+button('lots-back','Voltar','sheet-back')+'</div>';bridge.open(filter==='expiry'?'Próximos Vencimentos':filter==='attention'?'Lotes que Pedem Atenção':'Validades e Revisões',body,footer,'lots-agenda');
}
export function handleQuestion(text){if(!bridge)return false;const q=String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[?!.]+$/,'').trim();if(/^(o que vence primeiro|quais lotes vencem primeiro|proximos vencimentos)$/.test(q)){agenda(0,'expiry');return true;}if(/^(quais lotes precisam de atencao|o que precisa de atencao no estoque)$/.test(q)){agenda(0,'attention');return true;}if(q==='qual fornecedor compensa'){bridge.actions['lots-suppliers']();return true;}return false;}
export function installStockLotsUI(b){
 bridge=b;
 const target=key=>key==='lot-edit'&&view?.type==='edit'?view.raw:externalDrafts.get(key)?.()||bridge.lotFormTarget(key);
 const update=event=>{const input=event.target,root=input.closest?.('[data-lot-form]');if(!live(root))return;const raw=target(root.dataset.lotForm);if(!raw)return;const field=input.dataset.lotField;if(!field)return;raw[field]=input.type==='checkbox'?input.checked:input.value;raw.open=root.open;
  if(!['confirmed','notes','lotCode','reminders','reminderTime','reviewOn','reviewOnText','source'].includes(field)){raw.confirmed=false;const box=root.querySelector('[data-lot-field="confirmed"]');if(box)box.checked=false;}
  if(['expiresOn','referenceOn','manufacturedOn','receivedOn','reviewOn'].includes(field)){raw[field+'Text']=Lots.formatCivil(input.value);const written=root.querySelector('[data-lot-field="'+field+'Text"]');if(written)written.value=raw[field+'Text'];}
  if(/^(expiresOn|referenceOn|manufacturedOn|receivedOn|reviewOn)Text$/.test(field)){const name=field.slice(0,-4),value=Lots.parseCivilInput(input.value),calendar=root.querySelector('[data-lot-field="'+name+'"]');if(calendar){calendar.value=value;const label=document.getElementById(calendar.id+'-label');if(label)label.textContent=value?Lots.formatCivil(value):'Escolher Data';}}
  if(['state','mode'].includes(field)&&event.type==='change'){capture(root.dataset.lotForm,raw);raw.confirmed=false;root.outerHTML=form(root.dataset.lotForm,raw,bridge,{receiptLocked:root.dataset.lotForm==='lot-edit'});return;}
  const preview=root.querySelector('[data-lot-preview]');if(preview){let proposed='';try{proposed=proposedExpiry(raw);}catch{}preview.textContent=proposed?'Data Para Conferir: '+Lots.formatCivil(proposed):'Confira a data, o período e sua referência.';}
 };
 document.addEventListener('input',update);document.addEventListener('change',update);
 document.addEventListener('toggle',event=>{const root=event.target;if(!root.dataset?.lotForm||!live(root))return;const raw=target(root.dataset.lotForm);if(raw)raw.open=root.open;},true);
 let previewTimer;document.addEventListener('input',event=>{if(event.target.dataset?.eventLoadIndex===undefined)return;clearTimeout(previewTimer);previewTimer=setTimeout(()=>{const draft=bridge.eventDraft(),target=document.getElementById('lot-cargo-preview');if(draft&&target&&target.closest('dialog')?.open)target.innerHTML=eventRange(data(),draft.eventId,draft);},250);});
 Object.assign(bridge.actions,{
  'lots-open':d=>openProduct(d.id,{returnTo:d.from==='agenda'?'agenda':bridge.modal()?.kind==='movement'?'movement':'page'}),
  'lots-back':()=>view?.returnTo==='agenda'?agenda():back(),
  'lots-page':d=>openProduct(view.productId,{returnTo:view.returnTo,page:Number(d.page)||0,includeZero:view.includeZero}),
  'lots-history':()=>openProduct(view.productId,{returnTo:view.returnTo,includeZero:!view.includeZero}),
  'lots-edit':d=>editLot(d.id),
  'lots-lead-save':async()=>{const v=view;if(v?.type!=='product'||v.busy||v.actorId!==data().dataContext?.id)return;const n=Number(String(document.getElementById('lot-lead-days')?.value||'').trim());if(!Number.isInteger(n)||n<1||n>90)return bridge.toast('Use de 1 a 90 dias.');const m=model(),actor=v.actorId,current=()=>view===v&&model()===m&&data().dataContext?.id===actor;v.busy=true;
   try{persistLotChange(next=>{const st=next.data.settings;st.validityLeadDays={...(st.validityLeadDays||{}),[v.productId]:n};},'Não foi possível salvar. Confira o espaço do aparelho.');await lotDurable();if(!current())return;openProduct(v.productId,{returnTo:v.returnTo,page:v.page,includeZero:v.includeZero});bridge.toast('Aviso '+n+(n===1?' dia':' dias')+' antes do vencimento.');}catch(error){if(current())bridge.toast(error.message||'Não foi possível salvar.');}finally{v.busy=false;}},
  'lots-loss':d=>lossLot(d.id),
  'lots-loss-back':()=>{if(view?.busy)return;const v=view?.returnView;if(v)openProduct(v.productId,{returnTo:v.returnTo,page:v.page,includeZero:v.includeZero});else back();},
  'lots-loss-confirm':async d=>{const v=view;if(v?.type!=='loss'||v.lotId!==d.id||v.busy||v.actorId!==data().dataContext?.id)return;const m=model(),actor=v.actorId,current=()=>view===v&&model()===m&&data().dataContext?.id===actor;v.busy=true;
   try{if(!v.saved){const p=m.product(v.productId),lot=p&&Lots.lotSnapshot(data(),p.id).lots.find(l=>l.id===d.id);if(!lot||!(lot.remaining>0)||!lot.status.blocking)throw Error('O saldo do lote mudou. Reabra os lotes.');
     persistLotChange(next=>next.move(p.id,'loss',lot.remaining,'Lote vencido'+(lot.validity.lotCode?' '+lot.validity.lotCode:'')+(lot.status.expiresOn?' em '+Lots.formatCivil(lot.status.expiresOn):''),{lotSelections:[{lotId:lot.id,quantity:lot.remaining}]}),'Não foi possível salvar. Confira o espaço do aparelho.');v.saved={quantity:lot.remaining,unit:p.unit};}
    await lotDurable();if(!current())return;const r=v.returnView;openProduct(r.productId,{returnTo:r.returnTo,page:0,includeZero:r.includeZero});bridge.toast('Perda registrada: '+quantity(v.saved.quantity,v.saved.unit)+'.');
   }catch(error){if(current())bridge.toast(error.message||'Não foi possível registrar a perda.');}finally{v.busy=false;}},
  'lots-edit-back':()=>{if(view?.busy)return;const p=view?.parent;if(p)openProduct(p.productId,p);},
  'lots-edit-save':async()=>{const v=view;if(v?.type!=='edit'||v.busy)return;capture('lot-edit',v.raw);v.reason=document.getElementById('lot-edit-reason')?.value||'';const actor=data().dataContext?.id,confirmed=document.getElementById('lot-correction-confirmed')?.checked===true,condition=document.getElementById('lot-condition')?.value,current=()=>view===v&&data().dataContext?.id===actor&&bridge.modal()?.kind==='lot-edit';try{const input=formValidity(v.raw);v.busy=true;document.querySelectorAll('#dialog[open] .lot-actions button').forEach(b=>b.disabled=true);await bridge.saveLotMetadata(v.productId,v.lotId,input,{condition:condition==='keep'?undefined:condition,reason:v.reason,reviewConfirmed:confirmed,dateCorrectionConfirmed:confirmed});if(!current())return;openProduct(v.productId,v.parent);bridge.toast('Conferência do Lote Salva.');}catch(error){v.busy=false;if(current())paintEdit(error.message);}},
  'lots-agenda':()=>agenda(),
  'lots-agenda-page':d=>agenda(Number(d.page)||0,view?.filter||'all'),
  'lots-question':d=>agenda(0,['expiry','attention'].includes(d.kind)?d.kind:'all'),
  'lots-enable':async()=>{data().settings.validityReminders=true;if(!bridge.persist())return bridge.toast('Não foi possível salvar a preferência. Tente novamente.');if(bridge.actions['followup-enable'])await bridge.actions['followup-enable']();else bridge.toast('A agenda interna está disponível. Avisos do aparelho são ativados no aplicativo Android.');},
  'lots-suppliers':()=>{bridge.close();bridge.setPage('Estoque');if(!window.TerritorioSuppliers?.active())bridge.actions['sup-toggle']?.();bridge.actions['sup-tab']?.({id:'compare'});}
 });
 return{agenda,product:openProduct};
}
