import {calculatorInputs, actorOf, productStamp} from './model.js';
import {createCostComponents} from './components.js';
import './style.css';

// The Claude calculator owns all seven subjects and their product picker. This module adds
// Codex provenance and cost/tax composition to that renderer instead of installing a second UI.
const CALC_PROJECTION = {markup:'markup', equilibrio:'balance', indicadores:'period', desconto:'discount', taxa:'card'};
const FIELD_HELP={
 markup:{cost:'Quanto custa uma unidade. Use a composição abaixo se precisar somar custos e ratear fixos.',margin:'Parte do preço que você deseja deixar após os custos e taxas incluídos.',card:'Percentual que a operadora cobra sobre o valor da venda.',fair:'Comissão percentual da feira ou do canal. Não use o aluguel fixo da barraca aqui.',tax:'Percentual efetivo sobre esta venda. A lista abaixo ajuda a compor os tributos aplicáveis.'},
 equilibrio:{fixed:'Custos mensais que precisam ser cobertos, incluindo retirada quando escolhida.',price:'Quanto você cobra por uma unidade do mesmo produto.',variable:'Custo que acompanha cada unidade, incluindo embalagem e taxas. Não repita fixos já informados.',profit:'Resultado adicional que deseja alcançar depois de cobrir os custos informados.'},
 indicadores:{revenue:'Valor vendido no recorte, após descontos e devoluções. Não é o saldo recebido.',count:'Quantidade de vendas registradas no mesmo período, não de produtos vendidos.',previous:'Receita de um período comparável. As datas dos registros aparecem acima.',taken:'Quantidade levada no período que está avaliando, sempre na mesma unidade.',lost:'Somente o que deixou de ser vendável. Produto que voltou em bom estado não é perda.',returned:'Quantidade que voltou e continua vendável. Não é devolução financeira de uma venda.'},
 desconto:{price:'Preço por unidade antes do desconto que está simulando.',variable:'Custo por unidade. Inclua as despesas variáveis que pretende considerar.',discount:'Percentual de redução que deseja testar sobre o preço normal.',qty:'Quantidade do mesmo produto e unidade no recorte de 30 dias; ajuda a simular o volume adicional.'},
 taxa:{value:'Valor cobrado do cliente antes da taxa da operadora.',rate:'Percentual contratado para esta cobrança. Não inclui outras despesas automaticamente.',wanted:'Quanto deseja receber após esta taxa. A calculadora mostra quanto precisaria cobrar.'}
};

export function installProducerCalculator(b=window.TerritorioWorkflowBridge) {
 let snapshot=null, owner=null, selected='';
 const state=()=>window.ERPPreview?.calculatorState?.();
 const current=()=>b.modal()?.kind==='calculator' && state()?.mode==='contas';
 function projection(productId='', {refresh=false}={}) {
  const data=b.data();
  if(refresh || !snapshot || owner!==data || snapshot.actor!==actorOf(data) || selected!==productId) {
   snapshot=calculatorInputs(data,productId,{dayKey:window.ERP.dayKey});
   owner=data;selected=productId;components.reset(snapshot);
  }
  return snapshot;
 }
 const components=createCostComponents(b,{current,apply:(field,value)=>{
  if(!snapshot || owner!==b.data() || snapshot.actor!==actorOf(b.data()))return b.toast('O contexto mudou. Reabra a calculadora.');
  const input=document.getElementById('cm-markup-'+field);
  if(!input || !current())return;
  input.value=String(value).replace('.',',');
  input.dispatchEvent(new Event('input',{bubbles:true}));
  b.toast('Composição aplicada somente a esta simulação.');
 }});
 function source(id,key,productId='') {
  const p=projection(productId), projected=CALC_PROJECTION[id];
  if(projected)return {handled:true,value:p.fields[projected]?.[key]};
  if(id==='reposicao' && key==='daily')return {handled:true,value:p.fields.discount.qty>0?p.fields.discount.qty/30:undefined};
  if(id==='reposicao' && key==='onHand') {
   const model=b.lotModel?.(), value=p.product && typeof model?.availableStock==='function'?Number(model.availableStock(p.product.id)):NaN;
   return {handled:true,value:Number.isFinite(value)&&value>=0?value:undefined};
  }
  if(id==='ciclo' && key==='monthlyCost')return {handled:true,value:p.previousMonthCost};
  return {handled:false};
 }
 function caption(id,productId='') {
  const p=projection(productId), date=value=>value.split('-').reverse().join('/');
  if(id==='indicadores')return 'Registros: '+date(p.period.from)+' a '+date(p.period.until)+'; comparação: '+date(p.period.previousFrom)+' a '+date(p.period.previousUntil)+'. Receita após descontos e devoluções; Fiado vendido não é recebimento.'+(!p.period.equalLength?' Os recortes têm durações diferentes; a variação não comprova tendência.':'');
  if(id==='desconto')return 'Quantidade líquida de devoluções: '+date(p.quantityPeriod.from)+' a '+date(p.quantityPeriod.until)+', do mesmo produto e unidade.';
  if(id==='equilibrio')return 'Fixos do mês incluem a retirada quando ativada. Não repita esses valores no custo variável por unidade.';
  return '';
 }
 function componentsHtml(productId='') {projection(productId);return components.html();}
 function fieldHelp(id,key) {return FIELD_HELP[id]?.[key] || '';}
 function reset(productId='') {return projection(productId,{refresh:true});}
 function usePrice(productId,cents) {
  if(!current() || !snapshot || owner!==b.data() || snapshot.actor!==actorOf(b.data())) {b.toast('O contexto mudou. Reabra a calculadora.');return false;}
  const product=b.data().products?.find(p=>p.id===productId);
  if(productId!==selected || !product || product.active===false || product.archived || productStamp(product)!==snapshot.productStamp) {b.toast('O produto mudou. Escolha-o novamente para conferir o preço.');return false;}
  if(!Number.isSafeInteger(cents) || cents<=0 || cents>100000000) {b.toast('O preço deve ficar entre R$ 0,01 e R$ 1.000.000,00.');return false;}
  leave();b.priceDraft(productId,cents);b.toast('Preço de '+b.money(cents)+' preenchido. Confira e salve o produto.');return true;
 }
 const leave=()=>{snapshot=null;owner=null;selected='';document.getElementById('dialog')?.classList.remove('has-accounts');};
 document.getElementById('dialog')?.addEventListener('close',()=>{if(!document.getElementById('dialog').open)leave();});
 document.addEventListener('territorio:sheet',()=>document.getElementById('dialog')?.classList.toggle('has-accounts',current()));
 window.TerritorioProducerCalculator=Object.freeze({projection,source,caption,componentsHtml,fieldHelp,reset,usePrice,active:current,leave});
}
