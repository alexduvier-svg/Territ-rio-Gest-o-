import * as R from './receivables.js';
export function installReceivables() {
  const b = window.TerritorioWorkflowBridge, a = b.actions, e = b.escape, money = b.money;
  const button = (action,text,cls='choice',data) => b.button(action,text,cls,data);
  let terms = null, receiving = null, busy = false;
  const footer = (action='credit-back',label='Voltar') => button(action,b.icon('back')+'<span>'+label+'</span>','sheet-back');
  function open(title,body,foot,kind) { b.open(title,body,foot,kind); document.getElementById('dialog').setAttribute('data-no-close','');document.querySelector('#dialog .dialog-close')?.remove(); }
  function back() { terms=null;b.checkout(); }
  function other() {
    open('Outras formas de pagamento','<div class="credit-options">'+button('credit-terms','<strong>Fiado</strong><small>Cliente e data para receber</small>')+button('payment-other-confirm','<strong>Outro</strong><small>Já recebido de outra forma</small>')+button('credit-split','<strong>Mais de uma forma</strong><small>Combinar dois pagamentos</small>')+'</div>',footer(),'credit-other');
  }
  function captureTerms() {
    if (!terms) return;
    const name=document.getElementById('credit-client-name'),date=document.getElementById('credit-due-date');
    if(name)terms.name=name.value;if(date)terms.dueDate=date.value;
  }
  function clearTermError() { const el=document.getElementById('credit-terms-error');if(el)el.textContent=''; }
  function termsSheet() {
    const d=b.draft();if(!d)return;
    terms ||= {name:d.clientName||'',clientId:d.clientId||'',dueDate:d.creditDueDate||''};
    const clients=b.data().clients, options=clients.map(c=>'<option value="'+e(c.id)+'"'+(terms.clientId===c.id?' selected':'')+'>'+e(c.name)+'</option>').join('');
    open('Fiado','<div class="client-editor-layout"><section class="client-form-surface credit-form"><p class="credit-help">A venda sai do estoque agora. O dinheiro entra no caixa quando você marcar o recebimento em Clientes.</p><label for="credit-client-name">Cliente</label><input id="credit-client-name" autocomplete="name" maxlength="120" placeholder="Digite o nome" value="'+e(terms.name)+'">'+(clients.length?'<label for="credit-client-pick">Ou escolher cliente cadastrado</label><select id="credit-client-pick"><option value="">Escolher cliente</option>'+options+'</select>':'')+b.dateField('credit-due-date','Data prevista para pagar',terms.dueDate,'min="'+R.day()+'"')+'<p class="credit-error" id="credit-terms-error" role="status"></p></section></div>',button('credit-save','Usar Fiado','success')+footer(),'credit-terms');
  }
  const dateBR = date => R.validDay(date) ? date.split('-').reverse().join('/') : 'Data não informada';
  function entry(clientId) {
    const rows=R.outstanding(b.data().sales,clientId),total=rows.reduce((n,s)=>n+R.balance(s),0);
    if(clientId&&!rows.length)return '';
    return button('receivables','<span><strong>'+(clientId?'A receber deste cliente':'Clientes a receber')+'</strong><small>'+rows.length+' '+(rows.length===1?'venda pendente':'vendas pendentes')+'</small></span><strong class="tabular">'+money(total)+'</strong>','receivable-entry',{client:clientId||''});
  }
  function list(clientId='') {
    const rows=R.outstanding(b.data().sales,clientId),limit=Math.min(rows.length,100);
    open('Clientes a receber','<p class="credit-help">Marque somente depois que o cliente pagar. Nenhum aviso é enviado automaticamente.</p>'+rows.slice(0,limit).map(s=>button('receivable-open','<span><strong>'+e(s.customerName)+'</strong><small>Pagamento em '+dateBR(s.credit.dueDate)+'</small><small>'+e(s.items.map(i=>i.name).join(' · '))+'</small></span><span><strong class="tabular">'+money(R.balance(s))+'</strong>'+(s.credit.dueDate<R.day()?'<small class="red">Em atraso</small>':'')+'</span>','receivable-row',{id:s.id,client:clientId})).join('')+(!rows.length?'<p class="empty">Nenhum valor pendente.</p>':'')+(rows.length>limit?'<p class="muted">Mostrando os primeiros 100. Abra o cadastro de um cliente para filtrar.</p>':''),footer('close-modal'),'receivables');
  }
  function receiptSheet(id,client='') {
    const s=b.data().sales.find(s=>s.id===id);if(!s||!R.balance(s))return list(client);
    receiving={id,client,operationId:b.uid(),method:'Pix',date:R.day()};
    open('Registrar recebimento','<div class="credit-form"><h3>'+e(s.customerName)+'</h3><p class="credit-amount tabular">'+money(R.balance(s))+'</p><label for="credit-received-method">Como recebeu?</label><select id="credit-received-method">'+R.CASH_METHODS.map(m=>'<option>'+m+'</option>').join('')+'</select>'+b.dateField('credit-received-date','Data do recebimento',R.day(),'min="'+R.day(s.date)+'" max="'+R.day()+'"')+'<p id="credit-receipt-error" class="credit-error" role="status"></p></div>',button('receivable-settle','Confirmar recebimento','success')+footer('receivable-back'),'receivable-receipt');
  }
  a['payment-other']=other;a['credit-terms']=termsSheet;a['credit-back']=back;
  a['payment-other-confirm']=()=>{Object.assign(b.draft(),{payment:'Outro',split:false,partsManual:false});b.checkout();};
  a['credit-split']=()=>{const d=b.draft();if(d.payment==='Fiado')d.payment='Pix';d.split=true;d.partsManual=false;b.checkout();};
  a['credit-save']=()=>{
    captureTerms();const d=b.draft(),candidate={...d,payment:'Fiado',split:false,clientName:terms.name.trim(),creditDueDate:terms.dueDate},error=R.draftError(candidate);
    if(error){document.getElementById('credit-terms-error').textContent=error;return;}
    const client=b.data().clients.find(c=>c.id===terms.clientId&&c.name===candidate.clientName);
    Object.assign(d,candidate,{clientId:client?.id||'',...(client?{uf:client.uf||'',city:client.city||'',neighborhood:client.neighborhood||''}:{})});terms=null;b.checkout();
  };
  a.receivables=d=>list(d.client||'');a['receivable-open']=d=>receiptSheet(d.id,d.client||'');a['receivable-back']=()=>list(receiving?.client||'');
  a['receivable-settle']=async()=>{
    if(busy||!receiving)return;busy=true;
    receiving.method=document.getElementById('credit-received-method').value;receiving.date=document.getElementById('credit-received-date').value;
    const btn=document.querySelector('[data-action="receivable-settle"]');btn.disabled=true;
    try{await b.settleReceivable({...receiving,saleId:receiving.id});const client=receiving.client;receiving=null;list(client);b.render();b.toast('Recebimento registrado. Caixa atualizado.');}
    catch(err){document.getElementById('credit-receipt-error').textContent=err.message;if(btn.isConnected)btn.disabled=false;}
    finally{busy=false;}
  };
  document.addEventListener('change',ev=>{if(ev.target.id==='credit-client-pick'){captureTerms();const c=b.data().clients.find(c=>c.id===ev.target.value);if(c){terms.name=c.name;terms.clientId=c.id;document.getElementById('credit-client-name').value=c.name;clearTermError();}}});
  document.addEventListener('input',ev=>{if(ev.target.id==='credit-client-name'&&terms){terms.name=ev.target.value;terms.clientId='';clearTermError();}if(ev.target.id==='credit-due-date'&&terms){terms.dueDate=ev.target.value;clearTermError();}});
  window.TerritorioReceivables={...R,entry,back};
}
