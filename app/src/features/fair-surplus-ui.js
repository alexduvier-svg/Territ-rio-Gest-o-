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
  };
  const unit = row => b.shortUnit(row.unit) || row.unit;
  const paint = () => {
    const e=event();if(!e)return;
    const r=b.reportFor(e),edit=state.stage!=='confirm',q=state.question;
    let body=`<p class="surplus-event">${esc(e.fairName||e.name)}</p><div class="surplus-summary"><span>Vendas <strong>${r.totals.sales}</strong></span><span>Total vendido <strong>${esc(b.money(r.totals.revenue))}</strong></span></div>`;
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
      body+='</section>';
    }else if(!state.snapshot.hasLoad){
      body+='<p class="surplus-note">Sem carga registrada, a conferência da sobra não se aplica. As vendas continuam no relatório.</p>';
    }
    if(e.fairId)body+=`<label class="surplus-feedback"><span>Observação para a organização <small>Opcional</small></span><textarea id="surplus-note" rows="2" maxlength="600" placeholder="Algo sobre a feira?">${esc(state.note)}</textarea></label><p class="surplus-note">${esc(b.consentText)}</p>`;
    if(state.error)body+=`<p class="error" role="alert">${esc(state.error)}</p>`;
    const label=e.fairId?'Finalizar e enviar relatório':'Finalizar evento';
    let footer='';
    if(q)footer=button('surplus-edit-back','Voltar à contagem','sheet-back');
    else if(state.snapshot.eligible&&state.stage==='confirm')footer=button('surplus-confirm','Confere','success surplus-primary')+button('surplus-correct','Corrigir','sheet-back')+button('surplus-skip',label,'link surplus-skip');
    else footer=button('surplus-save',state.snapshot.eligible?'Salvar e enviar relatório':label,'success surplus-primary');
    footer+='<div class="surplus-cancel">'+button('surplus-cancel','Voltar','link')+'</div>';
    b.openModal(e.fairId?'Finalizar feira':'Finalizar evento',body,'fair-finish',{id:e.id},'<div class="surplus-actions">'+footer+'</div>');
  };
  const open = id => {
    const e=b.getModel().data.events.find(e=>e.id===id);if(!e)return;
    if(b.stateFor(e).closedAt){b.toast('Este evento já foi finalizado. O relatório acompanha as novas vendas.');return;}
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
    try{p=plan(direct,confirmed);}catch(error){onError(error);return;}
    state.busy=true;
    const id=state.id,previous=b.getModel(),copy=new b.Model(JSON.parse(JSON.stringify(previous.data))),e=copy.data.events.find(e=>e.id===id);
    const stamp=new Date().toISOString(),checkId=b.uid();
    try{
      if(b.stateFor(e).closedAt)throw Error('Este evento já foi finalizado.');
      b.setLateBusy(true);
      for(const line of p.sales){
        const sale=copy.complete({scope:id,items:[{productId:line.productId,rawQty:String(line.qty)}],payment:p.payment,
          customerType:'PF',discountMode:'R$',discountValue:'0'});
        Object.assign(sale,{date:stamp,registeredAt:stamp,unregistered:true,late:true,surplusCheckId:checkId});
        copy.data.movements.filter(m=>m.saleId===sale.id).forEach(m=>Object.assign(m,{date:stamp,eventId:id,note:'Venda não registrada · conferência da sobra',surplusCheckId:checkId}));
      }
      for(const line of p.losses){
        const loss=copy.move(line.productId,'loss',line.qty,'Perda / brinde · conferência da sobra');
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
      e.fairClosedAt=stamp;if(!e.fairId)e.status='finished';e.finishedAt=stamp;e.closedAutomatically=false;
      if(p.check.conferido){e.lossReviewedAt=stamp;e.lossReviewPending=false;}else b.markLossReview(e);
      const reports=copy.data.settings.fairReports||{},old=reports[id]||{};
      const counts=p.check.conferido?Object.fromEntries(state.snapshot.rows.map(row=>[row.productId,Number(String(state.counts[row.key]??row.calculated).replace(',','.'))])):{};
      copy.data.settings.fairReports={...reports,[id]:{...old,closedAt:stamp,counts,note:state.note.trim(),consentAt:old.consentAt||e.fairConsentAt||stamp,snoozeAt:'',pending:!!e.fairId}};
      // Commit the complete model once; a validation failure leaves the live model untouched.
      b.setModel(copy);
      if(!b.persist()){b.setModel(previous);throw Error('Não foi possível salvar. Libere espaço e tente novamente.');}
      b.setSellingScope(id);
    }catch(error){b.setModel(previous);state.busy=false;onError(error);return;}
    finally{b.setLateBusy(false);}
    state=null;b.closeNumberPad();
    b.openModal(e.fairName||e.name,`<div class="ff-done"><span class="ff-done-icon" aria-hidden="true">${b.icon('check')}</span><strong>${e.fairId?'Feira':'Evento'} finalizado</strong><span id="ff-done-status">Gravando a conferência…</span></div>`,'fair-done',null,button('close-modal','Pronto','success modal-action'));
    b.render();
    const native=window.TerritorioNative;
    if(native?.isNative&&native.durable&&!(await native.durable())){
      const el=document.getElementById('ff-done-status');
      if(el)el.textContent='Gravação pendente no aparelho. Libere espaço; o app tenta salvar novamente antes de enviar.';
      return;
    }
    if(e.fairId){
      const ok=await b.sendReport(id,true),el=document.getElementById('ff-done-status');
      if(el)el.textContent=ok?'Relatório enviado à organização ✓':'Relatório salvo e pendente de envio. O app tenta sozinho quando houver conexão.';
    }else{const el=document.getElementById('ff-done-status');if(el)el.textContent='Conferência salva. As vendas continuam na Gestão.';}
  };
  Object.assign(b.actions,{
    'fair-finish':d=>open(d.id),
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
  b.preview.fairSurplusState=()=>state;
  b.preview.fairReportFor=id=>b.reportFor(b.getModel().data.events.find(e=>e.id===id));
  b.preview.syncFairReports=b.syncReports;
  b.preview.persist=b.persist;
  return ()=>{state=null;};
}

window.TerritorioSurplusUI={install:installFairSurplusUI};
