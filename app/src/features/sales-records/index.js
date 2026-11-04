import * as R from './domain.js';

export function installSalesRecords() {
  const b=window.TerritorioWorkflowBridge,a=b.actions,e=b.escape;
  const button=(action,label,cls='choice',data,disabled)=>b.button(action,label,cls,data,disabled);
  const dateBR=date=>R.validDay(date)?date.split('-').reverse().join('/'):'Data não informada';
  const monthName=month=>/^\d{4}-\d{2}$/.test(month)?new Date(month+'-15T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC',month:'long',year:'numeric'}):'Sem data válida';
  const money=value=>b.data().settings.financialVisible?b.money(value):'•••••';
  const foot=(action='close-modal',label='Voltar',data)=>button(action,b.icon('back')+'<span>'+label+'</span>','sheet-back',data);
  let view=null,cost=null,card=null,warning=null;
  const auditLimits=new Map();
  const actor=()=>b.data().dataContext?.id||b.data().productMemory?.scopeId;
  const currentView=()=>view&&view.actor===actor();
  const saleLabel=s=>s.scope==='loja'?'Loja':b.data().events.find(event=>event.id===s.scope)?.name||'Evento registrado';
  const lineLabel=s=>s.items.map(i=>b.quantity(i.qty)+' '+b.unitLabel(i.unit,i.qty)+' de '+i.name+' · '+(i.description||'')).join(' / ');
  function saleRow(s) {
    return button('record-sale','<span><strong>'+e(s.items.map(i=>i.name).join(' · '))+'</strong><small>'+e(lineLabel(s))+'</small><small>'+e(R.recordClock(s)||'Horário não informado')+' · '+e(saleLabel(s))+' · '+e(s.customerName||'Cliente não identificado')+'</small><small>'+e(s.payments.map(p=>p.method).join(' + '))+(s.status==='returned'?' · Devolvida':'')+'</small></span><span class="record-sale-total tabular">'+money(s.total)+b.icon('chevron')+'</span>','record-sale-row',{id:s.id});
  }
  function dayRows(group) {
    const limit=view.limits[group.date]||40;
    return group.sales.slice(0,limit).map(saleRow).join('')+(group.sales.length>limit?button('records-more','Mostrar mais 40 vendas','choice modal-action',{date:group.date}):'');
  }
  function paintHistory() {
    if(!currentView())return;
    const h=R.history(b.data(),view),now=R.day().slice(0,7),old=h.months.filter(m=>m!==now);
    const scopeOptions=[['all','Todos os locais'],['loja','Loja'],...b.data().events.map(event=>[event.id,event.name])];
    const scopeIds=new Set(scopeOptions.map(([id])=>id));
    for(const s of b.data().sales)if(R.eligible(b.data(),s)&&!scopeIds.has(s.scope)){scopeIds.add(s.scope);scopeOptions.push([s.scope,'Evento registrado · '+String(s.scope).slice(0,8)]);}
    const controls='<div class="records-controls"><label for="records-scope">Local das vendas</label><select id="records-scope">'+scopeOptions.map(([id,name])=>'<option value="'+e(id)+'"'+(view.scope===id?' selected':'')+'>'+e(name)+'</option>').join('')+'</select>'+button('records-month','Mês atual · '+e(monthName(now)),'choice'+(view.month===now?' selected':''),{month:now})+'<details class="records-archive"'+(view.month!==now?' open':'')+'><summary>Arquivo · meses anteriores</summary><div>'+old.map(month=>button('records-month',e(monthName(month)),'choice'+(view.month===month?' selected':''),{month})).join('')+(!old.length?'<p class="muted small">Ainda não há meses anteriores neste local.</p>':'')+'</div></details></div>';
    const days=h.days.map(group=>'<details class="records-day" data-records-day="'+e(group.date)+'"'+(view.days.has(group.date)?' open':'')+'><summary><strong>'+dateBR(group.date)+'</strong><small>'+group.sales.length+' '+(group.sales.length===1?'venda':'vendas')+'</small>'+b.icon('down')+'</summary><div class="records-day-body">'+(view.days.has(group.date)?dayRows(group):'')+'</div></details>').join('');
    b.open('Vendas',(view.missingOnly?'<p class="records-missing">Vendas com custo pendente no relatório consultado.</p>'+button('records-all','Ver todas as vendas'):'')+controls+'<div class="records-month-heading"><h3>'+e(monthName(view.month))+'</h3>'+button('records-privacy',b.icon(b.data().settings.financialVisible?'eyeOff':'eye')+'<span>'+(b.data().settings.financialVisible?'Ocultar valores':'Mostrar valores')+'</span>','choice')+'</div><p class="ds-note">Toque no dia e na venda para consultar os produtos e informar seus custos. Os meses ficam guardados no Arquivo.</p>'+(h.missing?'<p class="records-missing">'+h.missing+' '+(h.missing===1?'item com custo não informado.':'itens com custo não informado.')+'</p>':'')+'<div class="records-days">'+(days||'<p class="ds-empty">Nenhuma venda registrada neste mês e local.</p>')+'</div>',foot(),'sales-records');
  }
  function openHistory(options={}) {
    view={actor:actor(),month:options.month||R.day().slice(0,7),scope:options.scope||'all',ids:options.ids||null,missingOnly:!!options.missingOnly,days:new Set(),limits:{}};
    let h=R.history(b.data(),view);if(view.missingOnly&&!h.sales.length&&h.months[0]){view.month=h.months[0];h=R.history(b.data(),view);}if(h.days[0])view.days.add(h.days[0].date);paintHistory();
  }
  function costCaption(item) {
    return R.itemCostKnown(item)?'Custo: '+b.money(item.cost)+' por '+b.unitLabel(item.unit,1)+' · Total '+b.money(item.costTotal):'Custo não informado · toque para informar';
  }
  function detail(id){if(b.modal()?.kind==='sales-records'&&view)view.scroll=document.getElementById('checkout-scroll')?.scrollTop||0;b.saleDetail(id);const sale=b.data().sales.find(s=>s.id===id);if(sale)decorateReceipt(sale);}
  function fillAudit(details,sale) {
    const limit=auditLimits.get(sale.id)||40,rows=[...(sale.costCorrections||[])].reverse();
    details.querySelector('.records-audit-body').innerHTML=rows.slice(0,limit).map(row=>'<p><strong>'+e(row.name)+'</strong><br>'+e(new Date(row.recordedAt).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}))+' · '+(row.before.costKnown?b.money(row.before.cost):'Não informado')+' → '+b.money(row.after.cost)+' por '+e(b.unitLabel(row.unit,1))+'</p>').join('')+(rows.length>limit?button('records-audit-more','Mostrar mais alterações','choice',{id:sale.id}):'');
  }
  function decorateReceipt(sale) {
    if(!R.eligible(b.data(),sale)||b.modal()?.kind!=='receipt')return;
    const body=document.querySelector('#dialog > .dialog-content');if(!body)return;
    const rows=[...body.querySelectorAll(':scope > .list-row')];
    sale.items.forEach((item,index)=>{const row=rows[index];if(!row)return;row.outerHTML=button('sale-cost-open',row.innerHTML,'list-row record-cost-row',{sale:sale.id,index});const current=body.querySelector('.record-cost-row[data-index="'+index+'"] > span');if(current){const note=document.createElement('small');note.className='record-cost-note';note.textContent=costCaption(item);current.append(note);}});
    let extra='<p class="ds-note">Toque no produto para informar ou corrigir o custo desta venda. O preço e o cadastro atual do produto continuam os mesmos.</p>';
    if(sale.cardPlan){extra+='<section class="record-installments"><h3>Crédito · '+sale.cardPlan.count+' '+(sale.cardPlan.count===1?'parcela':'parcelas')+'</h3>'+sale.cardPlan.installments.map(p=>'<div><span>'+p.number+'ª · '+dateBR(p.date)+'</span><strong class="tabular">'+b.money(p.amount)+'</strong></div>').join('')+'<p class="ds-note">Datas combinadas com o cliente. Não confirmam o repasse da operadora.</p></section>';}
    else if(sale.payments.some(p=>p.method==='Crédito'))extra+='<p class="ds-note">O parcelamento não foi informado nesta venda antiga.</p>';
    if(sale.costCorrections?.length)extra+='<details class="records-audit" data-cost-audit="'+e(sale.id)+'"><summary>Alterações de custo · '+sale.costCorrections.length+'</summary><div class="records-audit-body"></div></details>';
    const marker=body.querySelector('[data-action="sale-story"]');if(marker)marker.insertAdjacentHTML('beforebegin',extra);else body.insertAdjacentHTML('beforeend',extra);
    if(currentView()){const close=body.querySelector('[data-action="close-modal"]');if(close)close.outerHTML=foot('records-back','Voltar a Vendas');}
  }
  function openCost(saleId,index) {
    if(cost?.pending||cost?.saving)return b.toast('Confirme a gravação do custo antes de abrir outro produto.');
    const sale=b.data().sales.find(s=>s.id===saleId),item=sale?.items[index];
    if(!R.eligible(b.data(),sale)||!item)return b.toast('Venda não disponível.');
    cost={saleId,index,owner:b.lotModel(),data:b.data(),actor:actor(),revision:sale.costRevision||0,operationId:b.uid(),value:R.itemCostKnown(item)?(item.cost/100).toFixed(2).replace('.',','):'',saving:false,pending:false};
    paintCost();window.ERPPreview.showNumberPad('cost-sale-unit');
  }
  const ownsCost=r=>cost===r&&b.lotModel()===r.owner&&b.data()===r.data&&actor()===r.actor;
  function paintCost(message='') {
    const r=cost;if(!r||!ownsCost(r))return;
    const sale=b.data().sales.find(s=>s.id===r.saleId),item=sale?.items[r.index];if(!item)return;
    b.open('Custo deste produto','<section class="record-cost-form"><h3>'+e(item.name)+'</h3><p>'+e(item.description||'')+' · '+b.quantity(item.qty)+' '+e(b.unitLabel(item.unit,item.qty))+'</p><p>Vendido por '+b.money(item.total)+' em '+dateBR(R.saleDay(sale))+'.</p>'+b.numericField('cost-sale-unit','Custo por '+e(b.unitLabel(item.unit,1))+' (R$)',r.value,'inputmode="decimal"'+(r.pending||r.saving?' readonly':''))+'<p class="ds-note">Informe o custo de uma unidade vendida. O total usa a quantidade desta venda. Atualiza os relatórios do período e guarda o valor anterior no histórico.</p><p id="record-cost-error" role="status" class="credit-error">'+e(message)+'</p></section>',button('sale-cost-save',r.pending?'Confirmar gravação':'Salvar custo','success',null,r.saving)+button('sale-cost-back',b.icon('back')+'<span>Voltar à venda</span>','sheet-back',null,r.saving||r.pending),'sale-cost');
  }
  async function saveCost() {
    const r=cost;if(!r||!ownsCost(r)||r.saving)return;
    const input=document.getElementById('cost-sale-unit');if(!r.pending)r.value=input.value;
    let value;try{value=R.parseCost(r.value);}catch(error){document.getElementById('record-cost-error').textContent=error.message;return;}
    r.saving=true;b.closeNumberPad();paintCost();
    try{
      const result=await b.saveSaleCost({saleId:r.saleId,index:r.index,cost:value,expectedRevision:r.revision,operationId:r.operationId});
      if(cost!==r||b.lotModel()!==r.owner||b.data()!==result.data||b.modal()?.kind!=='sale-cost')return;
      cost=null;b.render();detail(r.saleId);b.toast('Custo da venda atualizado.');
    }catch(error){
      if(cost!==r||b.lotModel()!==r.owner||actor()!==r.actor||b.modal()?.kind!=='sale-cost')return;
      if(error.pendingApplied){r.data=b.data();r.pending=true;}
      r.saving=false;if(ownsCost(r))paintCost(error.message);
    }finally{r.saving=false;}
  }
  a['sales-records']=openHistory;
  a['records-all']=()=>openHistory({month:view?.month,scope:view?.scope});
  a['records-back']=()=>{cost=null;paintHistory();const el=document.getElementById('checkout-scroll');if(el)el.scrollTop=view?.scroll||0;};
  a['records-month']=d=>{if(!currentView()||!(d.month==='undated'||/^\d{4}-\d{2}$/.test(d.month)))return;view.month=d.month;view.days.clear();const h=R.history(b.data(),view);if(h.days[0])view.days.add(h.days[0].date);paintHistory();};
  a['records-more']=d=>{if(!currentView())return;view.limits[d.date]=(view.limits[d.date]||40)+40;const group=R.history(b.data(),view).days.find(g=>g.date===d.date),details=[...document.querySelectorAll('[data-records-day]')].find(el=>el.dataset.recordsDay===d.date);if(group&&details)details.querySelector('.records-day-body').innerHTML=dayRows(group);};
  a['record-sale']=d=>detail(d.id);
  a['records-privacy']=()=>{a['toggle-financial']();paintHistory();};
  a['sale-cost-open']=d=>openCost(d.sale,Number(d.index));
  a['sale-cost-save']=saveCost;
  a['sale-cost-back']=()=>{if(!cost||cost.saving||cost.pending)return;const id=cost.saleId;cost=null;detail(id);};
  a['records-audit-more']=d=>{auditLimits.set(d.id,(auditLimits.get(d.id)||40)+40);const sale=b.data().sales.find(s=>s.id===d.id),details=document.querySelector('[data-cost-audit="'+CSS.escape(d.id)+'"]');if(sale&&details)fillAudit(details,sale);};
  const oldDetail=a['sale-detail'];a['sale-detail']=d=>{if(b.modal()?.kind!=='sales-records')view=null;oldDetail(d);const sale=b.data().sales.find(s=>s.id===d.id);if(sale)decorateReceipt(sale);};
  document.addEventListener('toggle',event=>{
    const el=event.target;if(el.matches?.('[data-records-day]')&&currentView()){
      const date=el.dataset.recordsDay;if(el.open){view.days.add(date);const group=R.history(b.data(),view).days.find(g=>g.date===date);if(group)el.querySelector('.records-day-body').innerHTML=dayRows(group);}else view.days.delete(date);
    }
    if(el.matches?.('[data-cost-audit]')&&el.open){const sale=b.data().sales.find(s=>s.id===el.dataset.costAudit);if(sale)fillAudit(el,sale);}
  },true);
  document.addEventListener('change',event=>{if(event.target.id==='records-scope'&&currentView()){view.scope=event.target.value;view.days.clear();paintHistory();}});
  document.getElementById('dialog').addEventListener('close',()=>{if(!document.getElementById('dialog').open&&b.modal()?.kind!=='sale-cost')cost=null;});

  // Credit configuration is kept separate from Fiado and is committed only to the draft.
  const ownsCard=r=>card===r&&b.draft()===r.draft&&b.lotModel()===r.owner&&b.data()===r.data;
  const cardAmount=()=>{const d=b.draft();return R.creditAmount({...d,payment:'Crédito'},b.quote().total);};
  function openCard() {
    const draft=b.draft();if(!draft)return;
    const now=R.day(),prior=draft.cardPlan;
    card={draft,owner:b.lotModel(),data:b.data(),count:prior?.count||'',amount:cardAmount(),firstDate:prior?.firstDate||R.addMonths(now,1),anchorDay:prior?.anchorDay||Number(now.slice(8)),plan:prior?JSON.parse(JSON.stringify(prior)):null,stage:'count'};
    paintCard();window.ERPPreview.showNumberPad('card-installment-count');
  }
  function cancelCard(){card=null;b.closeNumberPad();b.checkout();}
  function paintCard(message='') {
    const r=card;if(!r||!ownsCard(r))return;
    let body;
    if(r.stage==='count')body='<div class="card-plan-count"><p>Valor no Crédito: <strong class="tabular">'+b.money(r.amount)+'</strong></p>'+b.numericField('card-installment-count','Em quantas vezes?',String(r.count),'inputmode="numeric"')+'<p class="ds-note">De 1 a 60 parcelas. As datas mensais aparecerão para você conferir.</p></div>';
    else body='<p class="ds-note">Datas mensais sugeridas. Toque em uma data para ajustar no calendário.</p><div class="card-plan-list">'+r.plan.installments.map(p=>'<section class="card-plan-row"><div><strong>'+p.number+'ª parcela</strong><span class="tabular">'+b.money(p.amount)+'</span></div>'+b.dateField('card-plan-date-'+(p.number-1),monthName(p.date.slice(0,7)),p.date,'min="'+R.day()+'"')+'</section>').join('')+'</div><div class="card-plan-tools">'+button('card-count-back','Alterar número de parcelas')+button('card-monthly','Gerar datas mensais novamente')+'</div>';
    b.open('Crédito · Parcelamento',body+'<p id="card-plan-error" role="status" class="credit-error">'+e(message)+'</p>',button(r.stage==='count'?'card-generate':'card-save',r.stage==='count'?'Conferir datas':'Usar parcelamento','success')+foot('card-back','Voltar à venda'),'card-installments');
  }
  function generateCard() {
    const r=card;if(!r||!ownsCard(r))return;
    const input=document.getElementById('card-installment-count');if(input)r.count=Number(input.value);
    try{r.plan=R.installments({amount:r.amount,count:r.count,firstDate:r.firstDate,anchorDay:r.anchorDay});r.stage='dates';b.closeNumberPad();paintCard();}
    catch(error){document.getElementById('card-plan-error').textContent=error.message;}
  }
  a['card-terms']=openCard;a['card-back']=cancelCard;a['card-generate']=generateCard;
  a['card-count-back']=()=>{if(!card)return;card.firstDate=card.plan.firstDate;card.stage='count';paintCard();window.ERPPreview.showNumberPad('card-installment-count');};
  a['card-monthly']=()=>{if(!card)return;try{card.anchorDay=Number(card.plan.firstDate.slice(8));card.plan=R.installments({amount:card.amount,count:card.count,firstDate:card.plan.firstDate,anchorDay:card.anchorDay});paintCard();}catch(error){document.getElementById('card-plan-error').textContent=error.message;}};
  a['card-save']=()=>{const r=card;if(!r||!ownsCard(r))return;try{const plan=R.validatedPlan(r.plan,cardAmount());Object.assign(r.draft,{payment:'Crédito',...(r.draft.split?{}:{partsManual:false}),cardPlan:plan});card=null;b.checkout();}catch(error){document.getElementById('card-plan-error').textContent=error.message;}};
  const oldPayment=a.payment;a.payment=d=>{if(d.value==='Crédito')return openCard();oldPayment(d);};
  const oldFinalize=a['finalize-purchase'];a['finalize-purchase']=d=>{
    const draft=b.draft();if(!draft)return;
    try{const amount=R.creditAmount(draft,b.quote().total);if(amount>0){if(!draft.cardPlan){openCard();return;}R.validatedPlan(draft.cardPlan,amount);}}
    catch(error){b.toast(error.message);openCard();return;}
    return oldFinalize(d);
  };
  const oldClosePad=a['number-pad-close'];a['number-pad-close']=()=>{if(card&&b.modal()?.kind==='card-installments'&&card.stage==='count')return generateCard();oldClosePad();};
  document.addEventListener('change',event=>{
    if(!card||!ownsCard(card)||!/^card-plan-date-\d+$/.test(event.target.id))return;
    const index=Number(event.target.id.split('-').at(-1)),date=event.target.value,r=card;
    try{
      if(index===0&&r.plan.mode==='monthly'){r.anchorDay=Number(date.slice(8));r.plan=R.installments({amount:r.amount,count:r.count,firstDate:date,anchorDay:r.anchorDay});paintCard();}
      else {r.plan.installments[index].date=date;r.plan.firstDate=r.plan.installments[0].date;r.plan.mode='custom';paintCard();}
    }catch(error){document.getElementById('card-plan-error').textContent=error.message;}
  });
  window.TerritorioSalesRecords={...R,decorateReceipt,openHistory,cancelCard,costPending:()=>!!cost&&(cost.pending||cost.saving)};
  function costWarningMarkup(sales,returns=[]){
    const missing=R.missingCosts(b.data(),sales,returns);if(!missing.lines)return '';
    warning={actor:actor(),owner:b.lotModel(),ids:missing.saleIds,items:missing.items,limit:10};
    const names=missing.items.map(item=>'<li>'+e(item.name)+(item.description?' · '+e(item.description):'')+' · '+e(item.unit)+'</li>');
    return '<aside class="report-cost-warning" role="note"><h3>Resultado parcial: faltam custos de produtos</h3><p>Estes produtos vendidos não possuem registro de custo. Os valores de lucro e resultado que dependem deles estão incompletos.</p><ul>'+names.slice(0,10).join('')+'</ul>'+(names.length>10?'<details><summary>Ver os outros '+(names.length-10)+' produtos</summary><ul class="records-more-cost-names"></ul>'+button('report-more-costs','Mostrar mais produtos','choice')+'</details>':'')+button('report-missing-costs','Informar os custos destas vendas','choice')+'</aside>';
  }
  a['report-more-costs']=()=>{if(!warning||warning.actor!==actor()||warning.owner!==b.lotModel())return;const target=document.querySelector('.records-more-cost-names');if(!target)return;const rows=warning.items.slice(warning.limit,warning.limit+40);target.insertAdjacentHTML('beforeend',rows.map(i=>'<li>'+e(i.name)+(i.description?' · '+e(i.description):'')+' · '+e(i.unit)+'</li>').join(''));warning.limit+=rows.length;if(warning.limit>=warning.items.length)document.querySelector('[data-action="report-more-costs"]')?.remove();};
  a['report-missing-costs']=()=>{if(warning&&warning.actor===actor()&&warning.owner===b.lotModel())openHistory({ids:warning.ids,missingOnly:true});};
  function decorateReport(){
    if(b.modal()?.kind!=='mg-detail'||!b.modal()?.data?.key)return;
    const body=document.querySelector('#dialog > .dialog-content');if(!body||body.querySelector('.report-cost-warning'))return;
    const records=b.reportRecords(),html=costWarningMarkup(records.sales,records.returns);if(html)body.insertAdjacentHTML('beforeend',html);
  }
  new MutationObserver(decorateReport).observe(document.getElementById('dialog'),{childList:true});
  function decorateProductWarning(){
    if(b.page()!=='Produto')return;const root=document.getElementById('app');if(root.querySelector('.product-cost-guidance'))return;
    const price=root.querySelector('input[id^="price-"]'),row=price?.closest('.form-field');if(!row)return;
    const point=row.parentElement?.classList.contains('two')?row.parentElement:row;
    point.insertAdjacentHTML('beforebegin','<aside class="product-cost-guidance" role="note"><strong>Informe o custo do produto para uma análise correta.</strong><p>Sem o custo, os relatórios de lucro ficam incompletos. Se esquecer, preencha depois em Vendas. Digite 0 somente se o custo for realmente zero.</p></aside>');
  }
  new MutationObserver(decorateProductWarning).observe(document.getElementById('app'),{childList:true,subtree:true});
  Object.assign(window.TerritorioSalesRecords,{costWarningMarkup});
  function decorateCheckout(){
    if(!['cart','checkout'].includes(b.modal()?.kind)||!b.draft())return;
    const controls=document.querySelector('#dialog .checkout-payment-controls');if(!controls||controls.querySelector('.card-plan-summary'))return;
    let amount;try{amount=R.creditAmount(b.draft(),b.quote().total);}catch{return;}if(!(amount>0))return;
    const plan=b.draft().cardPlan;
    controls.insertAdjacentHTML('beforeend','<div class="card-plan-summary"><span>'+(plan?plan.count+' '+(plan.count===1?'parcela':'parcelas')+' · Primeira em '+dateBR(plan.firstDate):'Informe as parcelas do Crédito')+'</span>'+button('card-terms',plan?'Alterar parcelas':'Definir parcelas','choice')+'</div>');
  }
  new MutationObserver(decorateCheckout).observe(document.getElementById('dialog'),{childList:true});
  function decorateEntry(){
    if(b.page()!=='Gestão')return;
    const root=document.getElementById('app');if(root.querySelector('.records-entry:not(.management-indicators-entry)'))return;
    const entry='<details class="event-material-card records-entry"><summary><span>'+b.icon('receipt')+'</span><span><strong>Vendas</strong><small>Registros por dia, custos e arquivo mensal</small></span>'+b.icon('down')+'</summary><div>'+button('sales-records','<span>Consultar vendas e informar custos</span>'+b.icon('chevron'),'link-row')+'</div></details>';
    const point=[...root.querySelectorAll('.mg-section-title')].find(el=>/Explorar o Período/i.test(el.textContent));
    if(point)point.insertAdjacentHTML('beforebegin',entry);else root.insertAdjacentHTML('beforeend',entry);
  }
  let refreshTimer;const refreshVisible=()=>{if(document.hidden||b.modal()?.kind!=='sales-records')return;clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{if(document.hidden||b.modal()?.kind!=='sales-records')return;const el=document.getElementById('checkout-scroll'),top=el?.scrollTop||0;paintHistory();const next=document.getElementById('checkout-scroll');if(next)next.scrollTop=top;},80);};
  window.addEventListener('territorio:product-source-saved',refreshVisible);window.addEventListener('territorio:saved',refreshVisible);window.addEventListener('territorio:resume',refreshVisible);
  new MutationObserver(decorateEntry).observe(document.getElementById('app'),{childList:true});decorateEntry();
}
