import {renderHistoricalChoices,readHistoricalChoices} from './stock-lots/historical.js';
import {saleLotContext} from './stock-lots/reservations.js';
import {recordFairActivity} from './fair-activity.js';
import {stockPartition,eventProductBalance} from './store/availability.js';
import {dominantEventPayment} from './fair-surplus.js';
import { buildSurplusSnapshot, planSurplusCheck } from './fair-surplus.js';
import './fair-surplus.css';

// The closing check is isolated from the sale flow. Nothing changes until the
// producer confirms; all corrections are validated on a copy before one save.
export function installFairSurplusUI(b) {
  let state = null;
  const esc = b.escape;
  const button = b.button;
  const snapshot = id => {
    const m = b.getModel();
    return buildSurplusSnapshot({eventId:id,load:b.eventLoad(id),sales:m.data.sales,
      movements:m.data.movements,productOf:pid=>m.product(pid)});
  };
  const event = () => b.getModel().data.events.find(e=>e.id===state?.id);
  const capture = () => {
    if (!state) return;
    document.querySelectorAll('[data-surplus-key]').forEach(el=>{
      if(el.value.trim()==='') delete state.counts[el.dataset.surplusKey];
      else state.counts[el.dataset.surplusKey]=el.value;
    });
    const note=document.getElementById('surplus-note');
    if(note)state.note=note.value.slice(0,600);
    const day=document.getElementById('surplus-occurred');if(day)state.occurrenceDay=day.value;const confirm=document.getElementById('surplus-date-confirmed');if(confirm)state.occurrenceConfirmed=confirm.checked;state.historicalSelections=readHistoricalChoices(document.getElementById('dialog'));
  };
  const unit = row => b.shortUnit(row.unit) || row.unit;
  const paint = () => {
    const e=event();if(!e)return;
    if(state.stage==='activity'){paintActivity();return;}
    const r=b.reportFor(e),edit=state.stage!=='confirm',q=state.question;
    let body=`<p class="surplus-event">${esc(e.fairName||e.name)}</p><div class="surplus-summary"><span>Vendas <strong>${r.totals.sales}</strong></span><span>Total vendido <strong>${esc(b.money(r.totals.revenue))}</strong></span></div>`;
    if(b.getModel().data.stockLotsVersion===1)body+='<section class="client-form-surface">'+b.dateField('surplus-occurred','Data dos Acertos Não Registrados',state.occurrenceDay||'','min="'+esc(e.start)+'" max="'+esc(e.end)+'"')+'<label class="lot-check"><input id="surplus-date-confirmed" type="checkbox"'+(state.occurrenceConfirmed?' checked':'')+'>As Vendas ou Perdas Aconteceram Nesta Data</label><p class="small muted">Preencha apenas se for registrar vendas ou perdas faltantes. A data não será presumida pelo aplicativo.</p></section>';
    body+='<section class="surplus-check"><h3>Antes de Finalizar</h3><p class="surplus-note">Acerte apenas o que ainda não foi registrado. Depois, confira a sobra.</p><div class="surplus-correction-cards">'+[['added','Reposições','Repus ou levei produtos depois.'],['sold','Vendas Não Registradas','Vendi e ainda não anotei.'],['lost','Perdas ou Brindes','Saiu estoque sem uma venda.']].map(([mode,title,note])=>{const count=(e.fairActivities||[]).filter(a=>a[mode]>0).length;return button('surplus-activity','<span><strong>'+title+'</strong><small>'+note+(count?' '+count+' '+(count===1?'acerto registrado.':'acertos registrados.'):'')+'</small></span>'+b.icon('chevron'),'choice event-material-card surplus-correction-card',{mode});}).join('')+'</div></section>';
    if(state.snapshot.eligible){
      body+=`<section class="surplus-check"><h3>Pelo app, sobrou:</h3><div class="surplus-rows">`;
      body+=state.snapshot.rows.map((row,i)=>{
        const name=b.titleName(row.name),reason=state.reasons[row.key];
        if(!edit)return `<div class="surplus-row"><span>${esc(name)}</span><strong>${esc(b.quantity(row.calculated))} ${esc(unit(row))}</strong></div>`;
        const value=state.counts[row.key]??String(row.calculated).replace('.',',');
        return `<div class="surplus-edit-row">${b.numericField('surplus-count-'+i,esc(name),value,`inputmode="${['kg','Litro','g','ml'].includes(row.unit)?'decimal':'numeric'}" data-surplus-key="${esc(row.key)}"`)}<small>Pelo app: ${esc(b.quantity(row.calculated))} ${esc(unit(row))}${reason?' · '+(reason==='sale'?'Venda não registrada':'Perda ou brinde'):''}</small></div>`;
      }).join('')+'</div>';
      if(state.snapshot.rows.some(row=>row.recordedLoss>0))body+='<p class="surplus-note">As perdas já registradas estão descontadas para evitar uma segunda baixa.</p>';
      if(edit)body+='<p class="surplus-note">Altere apenas as quantidades que não conferem. Nenhuma venda ou baixa é feita antes de salvar.</p>';
      if(q)body+=`<section class="surplus-question" role="group" aria-labelledby="surplus-question-title"><h4 id="surplus-question-title">${esc(b.titleName(q.name))}</h4><p>Faltam ${esc(b.quantity(q.difference))} ${esc(unit(q))} em relação ao app. O que aconteceu?</p><div>${button('surplus-reason','Vendi e não registrei','choice',{reason:'sale',key:q.key})}${button('surplus-reason','Perdi / dei de brinde','choice',{reason:'loss',key:q.key})}</div></section>`;
      body+=(state.stage==='confirm'?'<div class="surplus-review-actions">'+button('surplus-correct','Corrigir Sobra','choice')+button('surplus-skip','Finalizar sem Conferir','link surplus-skip')+'</div>':'')+'</section>';
    }else if(!state.snapshot.hasLoad){
      body+='<p class="surplus-note">Sem carga registrada, a conferência da sobra não se aplica. As vendas continuam no relatório.</p>';
    }
    if(b.getModel().data.stockLotsVersion===1){try{const planned=plan(false);body+=planned.sales.map((line,index)=>renderHistoricalChoices(b.getModel().data,{productId:line.productId,eventId:e.id,onDay:state.occurrenceDay,selections:state.historicalSelections?.[line.productId]||[],prefix:'surplus-lot-'+index},b)).join('');}catch{}}
    if(e.fairId)body+=`<label class="surplus-feedback"><span>Observação para a organização <small>Opcional</small></span><textarea id="surplus-note" rows="2" maxlength="600" placeholder="Algo sobre a feira?">${esc(state.note)}</textarea></label><p class="surplus-note">${esc(b.consentText)}</p>`;
    if(state.error)body+=`<p class="error" role="alert">${esc(state.error)}</p>`;
    const label=e.fairId?'Finalizar e enviar relatório':'Finalizar evento';
    let footer='';
    if(q)footer=button('surplus-edit-back','Voltar à contagem','sheet-back');
    else if(state.snapshot.eligible&&state.stage==='confirm')footer=button('surplus-confirm',e.fairId?'Finalizar e Enviar Relatório':'Finalizar Evento','success surplus-primary');
    else footer=button('surplus-save',state.snapshot.eligible?(e.fairId?'Salvar e Enviar Relatório':'Salvar e Finalizar Evento'):label,'success surplus-primary');
    footer+='<div class="surplus-cancel">'+button('surplus-cancel','Voltar','sheet-back')+'</div>';
    b.openModal(e.fairId?'Finalizar feira':'Finalizar evento',body,'fair-finish',{id:e.id},'<div class="surplus-actions">'+footer+'</div>');
  };
  const open = id => {
    const e=b.getModel().data.events.find(e=>e.id===id);if(!e)return;
    if(b.getModel().eventLifecycle(id).closed){b.toast('Este evento já foi encerrado. O relatório acompanha as novas vendas.');return;}
    const s=snapshot(id);
    state={id,snapshot:s,openedAt:Date.now(),stage:'confirm',counts:{},reasons:{},note:b.stateFor(e).note||'',question:null,error:'',busy:false};
    paint();
  };
  const plan = (direct,confirmed=true) => planSurplusCheck({snapshot:state.snapshot,currentSnapshot:snapshot(state.id),
    counts:state.counts,reasons:state.reasons,confirmed,direct,openedAt:state.openedAt,now:Date.now()});
  const onError = error => {
    if(!state)return;
    if(error.code==='STALE_CHECK'){
      const id=state.id;open(id);state.error='Os registros mudaram. Confira os saldos atualizados antes de finalizar.';paint();return;
    }
    if(error.code==='REASON_REQUIRED'){
      const next=error.details.items[0],row=state.snapshot.rows.find(r=>r.key===next.key);
      state.question={...row,...next};state.stage='reason';state.error='';paint();
      document.querySelector('.surplus-question')?.scrollIntoView({block:'nearest'});return;
    }
    state.error=error.message||'Não foi possível conferir os dados.';paint();
  };
  const commit = async (direct,confirmed=true) => {
    if(!state||state.busy)return;
    capture();let p;
    try{p=plan(direct,confirmed);if(confirmed&&!state.snapshot.eligible)p.check.conferido=true;}catch(error){onError(error);return;}
    state.busy=true;
    const id=state.id,previous=b.getModel(),copy=new b.Model(JSON.parse(JSON.stringify(previous.data))),e=copy.data.events.find(e=>e.id===id);
    const stamp=new Date().toISOString(),checkId=b.uid();
    try{
      if(copy.eventLifecycle(id).closed)throw Error('Este evento já foi encerrado.');
      b.setLateBusy(true);
      const occurrence=copy.data.stockLotsVersion===1&&(p.sales.length||p.losses.length)?saleLotContext(copy.data,{scope:id,occurrenceDay:state.occurrenceDay,occurrenceConfirmed:state.occurrenceConfirmed}):null;if(occurrence&&!state.occurrenceDay)throw Error('Informe e confirme a data dos acertos antes de salvar.');
      for(const line of p.sales){
        const sale=copy.complete({scope:id,items:[{productId:line.productId,rawQty:String(line.qty)}],payment:p.payment,
          customerType:'PF',discountMode:'R$',discountValue:'0',...(occurrence?{occurrenceDay:occurrence.onDay,occurrenceConfirmed:true,lotSelections:state.historicalSelections}:{})});
        Object.assign(sale,{date:stamp,registeredAt:stamp,unregistered:true,late:true,surplusCheckId:checkId});
        copy.data.movements.filter(m=>m.saleId===sale.id).forEach(m=>Object.assign(m,{date:stamp,eventId:id,note:'Venda não registrada · conferência da sobra',surplusCheckId:checkId}));
      }
      for(const line of p.losses){
        const loss=copy.move(line.productId,'loss',line.qty,'Perda / brinde · conferência da sobra',{eventId:id,occurrenceDay:occurrence?.onDay,occurrenceConfirmed:true});
        Object.assign(loss,{date:stamp,eventId:id,surplusCheckId:checkId});
      }
      if(p.loadAdjustments.length){
        const load=copy.data.eventLoads.find(x=>x.eventId===id);
        for(const line of p.loadAdjustments){
          const item=load.items.find(i=>i.productId===line.productId&&i.unit===line.unit);
          if(!item)throw Error('A carga mudou. Reabra a conferência.');
          item.qty=Math.round((item.qty+line.qty)*1000)/1000;
          item.adjustments=[...(item.adjustments||[]),{at:stamp,qty:line.qty,reason:'surplus-check',surplusCheckId:checkId}];
        }
        load.updatedAt=stamp;load.surplusAdjustedAt=stamp;
      }
      e.surplusCheck=p.check;e.surplusCheckAt=stamp;e.surplusCheckMetrics={...p.metrics,checkedAt:stamp};
      const units={};
      for(const row of p.check.itens){const value=units[row.unidade]||(units[row.unidade]={unidade:row.unidade,diferencaTotal:0,diferencaLiquida:0});value.diferencaTotal=Math.round((value.diferencaTotal+Math.abs(row.real-row.calculado))*1000)/1000;value.diferencaLiquida=Math.round((value.diferencaLiquida+row.real-row.calculado)*1000)/1000;}
      e.surplusCheckMetrics.porUnidade=Object.values(units);
      if(p.check.conferido)e.fairClosedAt=stamp;e.status='finished';e.finishedAt=e.finishedAt||stamp;e.closedAutomatically=false;
      if(p.check.conferido){e.lossReviewedAt=stamp;e.lossReviewPending=false;}else b.markLossReview(e);
      const reports=copy.data.settings.fairReports||{},old=reports[id]||{};
      const counts=p.check.conferido?Object.fromEntries(state.snapshot.rows.map(row=>[row.productId,Number(String(state.counts[row.key]??row.calculated).replace(',','.'))])):{};
      copy.data.settings.fairReports={...reports,[id]:{...old,closedAt:p.check.conferido?stamp:old.closedAt||'',counts,note:state.note.trim(),consentAt:old.consentAt||e.fairConsentAt||stamp,snoozeAt:'',pending:!!e.fairId&&p.check.conferido,payload:null}};
      // Commit the complete model once; a validation failure leaves the live model untouched.
      b.setModel(copy);
      if(!b.persist()){b.setModel(previous);throw Error('Não foi possível salvar. Libere espaço e tente novamente.');}
      b.setSellingScope(id);
    }catch(error){b.setModel(previous);state.busy=false;onError(error);return;}
    finally{b.setLateBusy(false);}
    state=null;b.closeNumberPad();
    const checked=e.surplusCheck.conferido;
    b.openModal(e.fairName||e.name,`<div class="ff-done"><span class="ff-done-icon" aria-hidden="true">${b.icon(checked?'check':'box')}</span><strong>${checked?'Feira Encerrada':'Conferência Pendente'}</strong><span id="ff-done-status">${checked?'Gravando a conferência…':'Evento no histórico. Continue a conferência em Ver Evento.'}</span></div>`,'fair-done',null,button('close-modal','Pronto','success modal-action'));
    b.render();
    const native=window.TerritorioNative;
    if(native?.isNative&&native.durable&&!(await native.durable())){
      const el=document.getElementById('ff-done-status');
      if(el)el.textContent='Gravação pendente no aparelho. Libere espaço; o app tenta salvar novamente antes de enviar.';
      return;
    }
    if(!checked)return;
    if(e.fairId){
      const ok=await b.sendReport(id,true),el=document.getElementById('ff-done-status');
      if(el)el.textContent=ok?'Relatório enviado à organização ✓':'Relatório salvo e pendente de envio. O app tenta sozinho quando houver conexão.';
    }else{const el=document.getElementById('ff-done-status');if(el)el.textContent='Conferência salva. As vendas continuam na Gestão.';}
  };

  const paintActivity=()=>{
    const model=b.getModel(),e=event(),a=state.activity,p=model.product(a.productId),list=model.data.products.filter(p=>p.active!==false&&!p.archived&&p.price>0);if(!e||!p)return;
    const split=stockPartition(model.data,p.id),remaining=eventProductBalance(model.data,e.id,p.id),unit=b.shortUnit(p.unit)||p.unit;
    const material=(key,title,content)=>'<details data-activity-section="'+key+'" class="event-material-card surplus-activity-card"'+((a.openSections?a.openSections.includes(key):a.mode===key)?' open':'')+'><summary>'+title+'</summary>'+content+'</details>';
    if(model.data.stockLotsVersion===1&&window.TerritorioStockLotsUI)window.TerritorioStockLotsUI.bindDraft('fair-entry-lot',()=>state?.activity?(state.activity.lotInput||={}):null);
    const lotEntry=model.data.stockLotsVersion===1&&a.source==='new'&&window.TerritorioStockLotsUI?window.TerritorioStockLotsUI.form('fair-entry-lot',a.lotInput||={},b):'';
    const lotChoices=model.data.stockLotsVersion===1?renderHistoricalChoices(model.data,{productId:p.id,eventId:e.id,onDay:a.occurrenceDay,newQuantity:a.source==='new'?b.number(a.added||'0'):0,selections:a.lotSelections||[],prefix:'activity-lot'},b):'';
    const dateSection=model.data.stockLotsVersion===1?'<section class="client-form-surface">'+b.dateField('fair-activity-occurrenceDay','Data em que Ocorreu',a.occurrenceDay||'','min="'+esc(e.start)+'" max="'+esc(e.end)+'"')+'<label class="lot-check"><input id="fair-activity-occurrenceConfirmed" type="checkbox"'+(a.occurrenceConfirmed?' checked':'')+'>Conferi a Data da Reposição, Venda ou Perda</label></section>':'';
    const body='<p class="surplus-event">'+esc(e.name)+'</p>'+dateSection+'<section class="client-form-surface"><label for="fair-activity-product">Produto</label><select id="fair-activity-product">'+list.map(item=>'<option value="'+esc(item.id)+'"'+(item.id===p.id?' selected':'')+'>'+esc(b.titleName(item.name)+' · '+(item.description||window.TerritorioWorkflowBridge?.description(item)||'')+' · '+item.unit)+'</option>').join('')+'</select><p class="surplus-note">Estoque geral: '+b.quantity(split.total)+' '+esc(unit)+' · livres em casa: '+b.quantity(split.home)+' · saldo na feira: '+b.quantity(remaining)+'. A carga não é uma nova entrada.</p></section><div class="surplus-correction-cards">'
    +material('added','1 · Reposições',b.numericField('fair-activity-added','Repus ou Levei Depois',a.added,'inputmode="decimal"')+'<label for="fair-activity-source">Origem da Reposição</label><select id="fair-activity-source"><option value="existing"'+(a.source==='existing'?' selected':'')+'>Estoque de Casa</option><option value="new"'+(a.source==='new'?' selected':'')+'>Entrada Nova Ainda Não Registrada</option></select><p class="surplus-note">Estoque de Casa só transfere a carga. Entrada Nova também registra a entrada no estoque geral.</p>'+lotEntry)
    +material('sold','2 · Vendas Não Registradas',b.numericField('fair-activity-sold','Quanto Vendeu sem Registrar?',a.sold,'inputmode="decimal"')+'<label for="fair-activity-payment">Pagamento</label><select id="fair-activity-payment">'+['Pix','Dinheiro','Crédito','Débito','Outro'].map(method=>'<option'+(a.payment===method?' selected':'')+'>'+method+'</option>').join('')+'</select><p class="surplus-note">Não repita vendas já anotadas. Para Fiado ou pagamento dividido, use o carrinho com os dados completos.</p><div id="activity-lot-choices">'+lotChoices+'</div>')
    +material('lost','3 · Perdas ou Brindes',b.numericField('fair-activity-lost','Quantidade que Saiu sem Venda',a.lost,'inputmode="decimal"')+'<label for="fair-activity-lossReason">Motivo</label><select id="fair-activity-lossReason"><option value=""'+(!a.lossReason?' selected':'')+'>Escolher Motivo</option><option value="loss"'+(a.lossReason==='loss'?' selected':'')+'>Perda</option><option value="gift"'+(a.lossReason==='gift'?' selected':'')+'>Brinde</option></select><p class="surplus-note">Reduz o estoque uma vez e não cria faturamento.</p>')+'</div>'+(state.error?'<p class="error" role="alert">'+esc(state.error)+'</p>':'');
    b.openModal('Acertos da Feira',body,'fair-activity',{id:e.id},'<div class="surplus-actions">'+button('surplus-activity-save','Registrar e Conferir','success')+button('surplus-activity-back','Voltar','sheet-back')+'</div>');
  };
  const captureActivity=()=>{const a=state?.activity;if(!a)return;for(const key of ['added','sold','lost','lossReason','source','payment','occurrenceDay','occurrenceConfirmed']){const el=document.getElementById('fair-activity-'+key);if(el)a[key]=el.type==='checkbox'?el.checked:['added','sold','lost'].includes(key)&&el.value.trim()===''?'0':el.value;}a.openSections=[...document.querySelectorAll('#dialog[open] [data-activity-section][open]')].map(el=>el.dataset.activitySection);a.lotSelections=readHistoricalChoices(document.getElementById('dialog'))[a.productId]||[];};
  const saveActivity=async()=>{
    if(!state||state.busy||!state.activity)return;captureActivity();const previous=b.getModel(),copy=new b.Model(JSON.parse(JSON.stringify(previous.data)));state.busy=true;
    try{b.setLateBusy(true);const lotInput=state.activity.source==='new'&&b.number(state.activity.added||'0')>0&&window.TerritorioStockLotsUI?window.TerritorioStockLotsUI.read('fair-entry-lot',state.activity.lotInput||{}):undefined;recordFairActivity(copy,{...state.activity,eventId:state.id,lotInput});b.setModel(copy);if(!b.persist()){b.setModel(previous);throw Error('Não foi possível salvar. Libere espaço e tente novamente.');}if(window.TerritorioNative?.isNative&&!await window.TerritorioNative.durable())throw Error('Gravação pendente. Tente salvar novamente; o mesmo registro não será duplicado.');state.snapshot=snapshot(state.id);state.counts={};state.reasons={};state.activity=null;state.stage='confirm';state.error='';state.busy=false;b.closeNumberPad();b.render();paint();b.toast('Acertos registrados. Confira agora o que sobrou.');}
    catch(error){state.error=error.message;state.busy=false;paintActivity();}finally{b.setLateBusy(false);}
  };

  Object.assign(b.actions,{
    'fair-finish':d=>open(d.id),
    'surplus-activity':({mode='added'}={})=>{if(!state)return;capture();const p=b.getModel().data.products.find(p=>p.active!==false&&!p.archived&&p.price>0);if(!p)return b.toast('Cadastre o produto no Estoque antes de registrar.');state.activity={productId:p.id,added:'0',sold:'0',lost:'0',lossReason:'',mode:['added','sold','lost'].includes(mode)?mode:'added',source:'existing',payment:dominantEventPayment(b.getModel().data.sales,state.id),operationId:b.uid()};state.stage='activity';state.error='';paint();},
    'surplus-activity-save':saveActivity,
    'surplus-activity-back':()=>{if(!state||state.busy)return;state.activity=null;state.stage='confirm';state.error='';b.closeNumberPad();paint();},
    'finish-event':d=>open(d.id),
    'surplus-confirm':()=>commit(true),
    'surplus-skip':()=>commit(false,false),
    'surplus-correct':()=>{if(!state)return;capture();state.stage='edit';state.error='';paint();},
    'surplus-save':()=>commit(false),
    'surplus-reason':d=>{
      if(!state||!state.question||d.key!==state.question.key||!['sale','loss'].includes(d.reason))return;
      state.reasons[d.key]=d.reason;state.question=null;
      try{plan(false);state.stage='review';paint();}catch(error){onError(error);}
    },
    'surplus-edit-back':()=>{if(!state)return;state.question=null;state.stage='edit';paint();},
    'surplus-cancel':()=>{if(state?.busy)return;state=null;b.closeNumberPad();b.closeModal();},
  });
  document.addEventListener('change',event=>{if(event.target.id!=='fair-activity-product'||state?.stage!=='activity'||state.busy)return;state.activity={...state.activity,productId:event.target.value,added:'0',sold:'0',lost:'0',lossReason:'',lotInput:{},lotSelections:[],operationId:b.uid()};state.error='';b.closeNumberPad();paint();});
  document.addEventListener('change',event=>{const id=event.target.id;if(!state||state.busy)return;if(id==='fair-activity-source'||id==='fair-activity-occurrenceDay'){captureActivity();if(id.endsWith('occurrenceDay')){state.activity.occurrenceConfirmed=false;state.activity.lotSelections=[];}b.closeNumberPad();paintActivity();}else if(id==='surplus-occurred'){capture();state.occurrenceConfirmed=false;state.historicalSelections={};b.closeNumberPad();paint();}});
  let lotChoiceTimer;document.addEventListener('input',event=>{if(!['fair-activity-added','fair-activity-sold'].includes(event.target.id)||state?.stage!=='activity'||state.busy)return;clearTimeout(lotChoiceTimer);lotChoiceTimer=setTimeout(()=>{if(state?.stage!=='activity')return;captureActivity();const a=state.activity,target=document.getElementById('activity-lot-choices');if(target)target.innerHTML=renderHistoricalChoices(b.getModel().data,{productId:a.productId,eventId:state.id,onDay:a.occurrenceDay,newQuantity:a.source==='new'?b.number(a.added||'0'):0,selections:a.lotSelections||[],prefix:'activity-lot'},b);},250);});
  b.preview.fairSurplusState=()=>state;
  b.preview.fairReportFor=id=>b.reportFor(b.getModel().data.events.find(e=>e.id===id));
  b.preview.syncFairReports=b.syncReports;
  b.preview.persist=b.persist;
  return ()=>{state=null;};
}

window.TerritorioSurplusUI={install:installFairSurplusUI};
