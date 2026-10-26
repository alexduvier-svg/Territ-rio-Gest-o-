import {normalizeValidity,parseCivilInput,parseValidityPeriod,formatCivil,addCivil,shiftCivil,validCivil} from './validity.js';
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=(raw,key)=>parseCivilInput(raw[key+'Text']??raw[key]);
export function proposedExpiry(raw={}){
 if(raw.state!=='dated')return '';
 if(raw.mode==='period'){const p=parseValidityPeriod(raw.periodText??(raw.period!==undefined?raw.period+' '+(raw.periodUnit==='months'?'meses':'dias'):'')),ref=date(raw,'referenceOn');return p&&ref?addCivil(ref,p.count,p.unit):'';}
 if(raw.mode==='month'){const m=String(raw.expiryMonthText??raw.expiryMonth??''),month=/^\d{2}\/\d{4}$/.test(m)?m.slice(3)+'-'+m.slice(0,2):m;if(!validCivil(month+'-01'))return '';return raw.monthConvention==='first_day'?month+'-01':raw.monthConvention==='last_day'?shiftCivil(addCivil(month+'-01',1,'months'),-1):'';}
 return date(raw,'expiresOn');
}
export function formValidity(raw={}){
 const input={...raw};for(const key of ['manufacturedOn','reviewOn','receivedOn']){const text=raw[key+'Text']??raw[key];if(text&&!date(raw,key))throw Error('Confira a data '+(key==='reviewOn'?'de revisão':key==='receivedOn'?'do recebimento':'de produção')+'. Use DD/MM/AAAA.');input[key]=date(raw,key);}
 if(raw.state==='dated'){
  input.expiresOn=proposedExpiry(raw);
  if(raw.mode==='period'){const p=parseValidityPeriod(raw.periodText??(raw.period!==undefined?raw.period+' '+(raw.periodUnit==='months'?'meses':'dias'):''));if(!p)throw Error('Informe um período como 120 Dias ou 6 Meses.');Object.assign(input,{period:p.count,periodUnit:p.unit,referenceOn:date(raw,'referenceOn')});if(raw.referenceType==='production'){if(input.manufacturedOn&&input.manufacturedOn!==input.referenceOn)throw Error('A data de produção difere da referência do prazo. Confira qual informação está correta.');input.manufacturedOn=input.referenceOn;}if(raw.referenceType==='received'){if(input.receivedOn&&input.receivedOn!==input.referenceOn)throw Error('A data de recebimento difere da referência do prazo. Confira qual informação está correta.');input.receivedOn=input.referenceOn;}}
  if(raw.mode==='month'){const m=String(raw.expiryMonthText??raw.expiryMonth??'');input.expiryMonth=/^\d{2}\/\d{4}$/.test(m)?m.slice(3)+'-'+m.slice(0,2):m;}
  input.confirmedExpiresOn=raw.confirmed?input.expiresOn:'';
 }
 return{...normalizeValidity(input),...(input.receivedOn?{receivedOn:input.receivedOn}:{})};
}
export function renderLotForm(key,raw={},helpers={},options={}){
 const e=helpers.escape||esc,attr=field=>' data-lot-field="'+field+'"',state=raw.state||'unknown',mode=raw.mode||'date';
 const field=(name,label,value,extra='')=>'<div class="form-field"><label for="'+key+'-'+name+'">'+label+'</label><input id="'+key+'-'+name+'"'+attr(name)+' value="'+e(value||'')+'" '+extra+'></div>';
 const select=(name,label,options,value)=>'<div class="form-field"><label for="'+key+'-'+name+'">'+label+'</label><select id="'+key+'-'+name+'"'+attr(name)+'>'+options.map(([v,t])=>'<option value="'+v+'"'+(value===v?' selected':'')+'>'+t+'</option>').join('')+'</select></div>';
 const calendar=(name,label)=>{const value=date(raw,name),text=raw[name+'Text']??formatCivil(value);if(name==='receivedOn'&&options.receiptLocked)return'<div class="form-field"><label>Recebimento Registrado</label><p class="lot-readonly">'+e(text||'Não Informado')+'</p></div>';const picker=helpers.dateField?helpers.dateField(key+'-'+name,'Escolher no Calendário',value,attr(name)).replace('<button type="button"','<button type="button" aria-label="'+e('Escolher '+label+' no Calendário')+'"'):'';return '<div class="lot-date-pair">'+field(name+'Text',label,text,'placeholder="DD/MM/AAAA" maxlength="10" autocomplete="off"')+picker+'</div>';};
 let body=select('state','Validade',[['unknown','Não Informada'],['dated','Com Validade'],['not_applicable','Não Se Aplica']],state);
 if(state==='dated'){
  body+=select('mode','Como Informar',[['date','Data Exata'],['period','Período'],['month','Mês e Ano']],mode);
  if(mode==='period')body+=field('periodText','Prazo Informado',raw.periodText??(raw.period!==undefined?raw.period+' '+(raw.periodUnit==='months'?'Meses':'Dias'):''),'placeholder="120 Dias ou 6 Meses" maxlength="24"')+select('referenceType','Contado a Partir de',[['','Escolher Referência'],['production','Produção'],['received','Recebimento'],['explicit','Outra Data']],raw.referenceType||'')+calendar('referenceOn','Data de Referência');
  else if(mode==='month')body+=field('expiryMonthText','Mês e Ano',raw.expiryMonthText??(raw.expiryMonth?raw.expiryMonth.slice(5)+'/'+raw.expiryMonth.slice(0,4):''),'placeholder="MM/AAAA" maxlength="7"')+select('monthConvention','Se Houver Orientação de Contagem',[['','Manter Somente o Mês'],['first_day','Primeiro Dia do Mês'],['last_day','Último Dia do Mês']],raw.monthConvention||'');
  else body+=calendar('expiresOn','Data do Vencimento');
  let proposed='';try{proposed=proposedExpiry(raw);}catch{}
  body+='<p class="lot-date-preview" data-lot-preview role="status">'+(proposed?'Data Para Conferir: '+formatCivil(proposed):mode==='month'&&!raw.monthConvention?'Sem dia exato: os avisos aguardam sua confirmação.':'Preencha a data ou o período e sua referência.')+'</p><label class="lot-check"><input type="checkbox"'+attr('confirmed')+(raw.confirmed?' checked':'')+'>Conferi a Data do Vencimento</label>';
 }
 body+='<details class="lot-extra"><summary>Detalhes da Entrada e Avisos</summary>'+field('lotCode','Código do Lote · Opcional',raw.lotCode,'maxlength="120"')+calendar('receivedOn','Data Efetiva do Recebimento · Opcional')+calendar('manufacturedOn','Fabricação ou Produção · Opcional')+select('source','Origem da Validade',[['unspecified','Não Informada'],['label','Rótulo'],['supplier','Fornecedor'],['own_production','Produção Própria'],['estimate','Estimativa Informada']],raw.source||'unspecified')+calendar('reviewOn','Revisar Condição em · Opcional')+'<label class="lot-check"><input type="checkbox"'+attr('reminders')+(raw.reminders!==false?' checked':'')+'>Avisar em D−5 e no Vencimento; Revisões no Dia</label>'+field('reminderTime','Horário dos Avisos',raw.reminderTime||'08:00','type="time"')+field('notes','Observações de Conservação · Opcional',raw.notes,'maxlength="500"')+'</details>';
 return '<details class="panel event-material-card lot-validity-form" data-lot-form="'+e(key)+'"'+(raw.open?' open':'')+'><summary><span>Lote e Validade <small>Opcional</small></span><strong data-lot-state>'+({unknown:'Não Informada',dated:'Com Validade',not_applicable:'Não Se Aplica'}[state])+'</strong></summary><div class="lot-form-content">'+body+'<p class="small muted">Cada reposição tem sua própria validade. Não Se Aplica é uma declaração do produtor, sem certificação do app.</p></div></details>';
}
