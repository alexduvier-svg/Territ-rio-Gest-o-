import * as MathOf from '../finance/producer-calcs.js';
import {calculatorInputs,actorOf,productStamp} from './model.js';
import {createCostComponents} from './components.js';
import './style.css';

const SUBJECTS=[
 ['price','tag','Preço','Preço de venda pelo markup',['markup']],
 ['sales','chart','Vendas','Equilíbrio e indicadores do período',['balance','period']],
 ['fees','wallet','Descontos e Taxas','Quanto cada venda deixa',['discount','card']],
 ['suppliers','users','Fornecedores','Comparações e condições de compra',[]],
 ['stock','box','Estoque e Caixa','Compras e ciclo de caixa',[]],
 ['rural','leaf','Produção Rural','Custos e medidas da produção',[]],
 ['credit','wallet','Crédito e Investimento','Parcelas e retorno',[]]
];
const CALCS={
 markup:{title:'Preço de Venda pelo Markup',fn:'markupPrice',formula:'Markup = 1 ÷ (1 − taxas% − margem%). Preço = custo × markup.',fields:[['cost','Custo por Unidade','R$'],['margin','Margem Desejada','%'],['card','Taxa do Cartão','%'],['fair','Taxa da Feira','%'],['tax','Imposto sobre Vendas','%']],required:['cost','margin'],missing:'Informe o custo e a margem desejada para calcular o preço.'},
 balance:{title:'Ponto de Equilíbrio e Meta',fn:'breakEvenUnits',formula:'Cada unidade deixa = preço − custo variável. Equilíbrio = fixos ÷ contribuição, arredondado para cima.',fields:[['fixed','Custos Fixos do Mês','R$'],['price','Preço de Venda','R$'],['variable','Custo por Unidade','R$'],['profit','Resultado Desejado no Mês','R$']],required:['fixed','price','variable'],missing:'Informe os custos fixos, o preço e o custo por unidade.'},
 period:{title:'Indicadores do Período',fn:'periodIndicators',formula:'Compra média = receita ÷ vendas. Variação = (receita atual − anterior) ÷ anterior. Perda = quantidade perdida ÷ levada.',fields:[['revenue','Vendido no Período','R$'],['count','Vendas Registradas','vendas'],['previous','Vendido no Período Anterior','R$'],['taken','Quantidade Levada','un'],['lost','Perda Física','un'],['returned','Voltou Vendável','un']],required:['revenue','count'],missing:'Informe o valor vendido e a quantidade de vendas do período.'},
 discount:{title:'Impacto do Desconto',fn:'discountImpact',formula:'Antes = preço − custo. Depois = preço com desconto − custo. Quantidade adicional = antes ÷ depois − 1.',fields:[['price','Preço Normal','R$'],['variable','Custo por Unidade','R$'],['discount','Desconto','%'],['qty','Vendido em 30 Dias','un']],required:['price','variable','discount'],missing:'Informe preço, custo e o desconto que pretende oferecer.'},
 card:{title:'Taxa do Cartão e da Maquininha',fn:'cardNet',formula:'Recebe = valor × (1 − taxa%). Para receber um valor: cobrar = valor desejado ÷ (1 − taxa%).',fields:[['value','Valor da Venda','R$'],['rate','Taxa Cobrada','%'],['wanted','Quero Receber','R$']],required:['rate'],missing:'Informe a taxa e o valor da venda ou quanto deseja receber.'}
};
const FIELD_HELP={
 markup:{cost:'Quanto custa uma unidade. Use a composição abaixo se precisar somar custos e ratear fixos.',margin:'Parte do preço que você deseja deixar após os custos e taxas incluídos.',card:'Percentual que a operadora cobra sobre o valor da venda.',fair:'Comissão percentual da feira ou do canal. Não use o aluguel fixo da barraca aqui.',tax:'Percentual efetivo sobre esta venda. A lista abaixo ajuda a compor os tributos aplicáveis.'},
 balance:{fixed:'Custos mensais que precisam ser cobertos, incluindo retirada quando escolhida.',price:'Quanto você cobra por uma unidade do mesmo produto.',variable:'Custo que acompanha cada unidade, incluindo embalagem e taxas. Não repita fixos já informados.',profit:'Resultado adicional que deseja alcançar depois de cobrir os custos informados.'},
 period:{revenue:'Valor vendido no recorte, após descontos e devoluções. Não é o saldo recebido.',count:'Quantidade de vendas registradas no mesmo período, não de produtos vendidos.',previous:'Receita de um período comparável. As datas dos registros aparecem acima.',taken:'Quantidade levada no período que está avaliando, sempre na mesma unidade.',lost:'Somente o que deixou de ser vendável. Produto que voltou em bom estado não é perda.',returned:'Quantidade que voltou e continua vendável. Não é devolução financeira de uma venda.'},
 discount:{price:'Preço por unidade antes do desconto que está simulando.',variable:'Custo por unidade. Inclua as despesas variáveis que pretende considerar.',discount:'Percentual de redução que deseja testar sobre o preço normal.',qty:'Quantidade do mesmo produto e unidade no recorte de 30 dias; ajuda a simular o volume adicional.'},
 card:{value:'Valor cobrado do cliente antes da taxa da operadora.',rate:'Percentual contratado para esta cobrança. Não inclui outras despesas automaticamente.',wanted:'Quanto deseja receber após esta taxa. A calculadora mostra quanto precisaria cobrar.'}
};
const PURPOSE={markup:'Descubra um preço que cubra os custos incluídos e preserve a margem que deseja.',balance:'Veja quantas unidades precisaria vender para cobrir os custos e buscar sua meta.',period:'Entenda a compra média, a comparação de receita e as quantidades que voltaram ou se perderam.',discount:'Avalie quanto o desconto reduz a contribuição e qual volume adicional seria necessário.',card:'Confira o que resta depois da taxa ou quanto cobrar para receber o valor desejado.'};

export function installProducerCalculator(b=window.TerritorioWorkflowBridge){
 let enabled=false,selected='',opened='',snapshot=null,owner=null,values={},origins={},costBasis=null,applying=false;
 const e=b.escape,money=n=>Number.isFinite(n)?b.money(Math.round(n*100)):'—',pct=(n,d=1)=>Number.isFinite(n)?(n*100).toLocaleString('pt-BR',{maximumFractionDigits:d})+'%':'—',num=n=>Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:3}):'—';
 const btn=(action,label,cls='choice',data)=>b.button(action,label,cls,data),date=s=>s?.split('-').reverse().join('/');
 const current=()=>enabled&&b.modal()?.kind==='calculator';
 const components=createCostComponents(b,{current,apply:(field,value,basis)=>{
  if(owner!==b.data()||snapshot.actor!==actorOf(b.data()))return b.toast('O contexto mudou. Reabra a calculadora.');
  const input=document.querySelector('[data-accounts-calc=markup][data-accounts-field='+field+']');if(!input)return;
  if(field==='cost')costBasis=basis||null;applying=true;input.value=String(value).replace('.',',');input.dispatchEvent(new Event('input',{bubbles:true}));applying=false;b.toast('Composição aplicada somente a esta simulação.');
 }});
 function refresh(){
  snapshot=calculatorInputs(b.data(),selected,{dayKey:window.ERP.dayKey});owner=b.data();selected=snapshot.product?.id||'';origins={...snapshot.origins};values={};
  for(const [key,calc]of Object.entries(CALCS))values[key]=Object.fromEntries(calc.fields.map(([field])=>[field,Number.isFinite(snapshot.fields[key][field])?String(snapshot.fields[key][field]).replace('.',','):'']));
  costBasis=null;components.reset(snapshot);
 }
 function controls(){
  return'<div class="calculator-mode"><span>'+(enabled?'Contas da Banca':window.ERPPreview.calculatorState().scientific?'Científica · '+(window.ERPPreview.calculatorState().angle==='deg'?'Graus':'Radianos'):'Básica')+'</span><div class="accounts-mode-tools">'+btn('calculator-scientific',b.icon('scientific')+'<span class="sr-only">Alternar Calculadora Científica</span>','choice calculator-mode-pill'+(!enabled&&window.ERPPreview.calculatorState().scientific?' selected':''))+btn('calculator-accounts','<span aria-hidden="true">$</span><span class="sr-only">'+(enabled?'Voltar à Calculadora':'Contas da Banca')+'</span>','choice calculator-mode-pill'+(enabled?' selected':''))+'</div></div>';
 }
 function field(calc,[key,label,unit]){
  const mark='<small class="accounts-origin" data-source-for="'+calc+'.'+key+'"'+(origins[calc+'.'+key]?'':' hidden')+'>Seus Dados</small>';
  return'<div class="accounts-field">'+b.numericField((unit==='R$'?'price-':'')+'accounts-'+calc+'-'+key,e(label)+' <span class="accounts-unit">('+e(unit)+')</span>'+mark,values[calc][key],'data-accounts-calc="'+calc+'" data-accounts-field="'+key+'" inputmode="'+(key==='count'?'numeric':'decimal')+'" aria-describedby="accounts-help-'+calc+'-'+key+'"')+'<p class="accounts-field-help" id="accounts-help-'+calc+'-'+key+'">'+e(FIELD_HELP[calc][key])+'</p></div>';
 }
 function calculate(key){
  const spec=CALCS[key],raw=values[key],input={};
  for(const [field]of spec.fields){input[field]=MathOf.parseBR(raw[field]);if(String(raw[field]).trim()&&!Number.isFinite(input[field]))return{error:'Confira o número digitado. Use, por exemplo, 12,50.'};}
  if(spec.required.some(f=>!String(raw[f]).trim()))return{error:spec.missing};
  const r=MathOf[spec.fn](input);return r?{r,input}:{error:'Confira os valores: use números não negativos e percentuais válidos. '+(key==='card'?spec.missing:'')};
 }
 function result(key){
  const {r,input,error}=calculate(key),spec=CALCS[key];
  if(error)return'<p class="accounts-empty">'+e(error)+'</p>';
  const row=(label,value)=>'<div class="accounts-result-row"><span>'+e(label)+'</span><strong>'+e(value)+'</strong></div>',hero=(label,value)=>'<div class="accounts-result-hero"><small>'+e(label)+'</small><output>'+e(value)+'</output></div>',note=(text,warn=false)=>'<p class="accounts-insight'+(warn?' is-warning':'')+'">'+e(text)+'</p>';
  const formula='<details class="accounts-formula"><summary>Fórmula</summary><p>'+e(spec.formula)+'</p></details>';
  let html='',insight='',limit='',next='';
  if(r.status==='limit')return note('O resultado ultrapassa o limite desta simulação. Confira as unidades e os valores.',true);
  if(key==='markup'){
   if(r.status==='impossible')html=hero('Preço Não Calculável','Impossível')+note('Taxas e margem somam '+pct(r.expenseRate+r.marginRate)+'. Precisam somar menos de 100%.',true);
   else if(r.status==='zero-cost')html=note('O custo zero está informado, mas não define sozinho um preço por markup. Informe um custo aplicável ou simule uma venda em Descontos e Taxas.',true);
   else{
    html=hero('Preço Sugerido por Unidade',money(r.price))+row('Resultado por Unidade',money(r.profit))+row('Despesas da Venda',money(r.expenses))+row('Markup',num(r.markup)+' ×')+row('Acréscimo sobre o Custo',pct(r.overCost));
    insight='Com os custos e taxas informados, o preço deixa '+money(r.profit)+' por unidade'+(costBasis?.fixed>0?', após o rateio de fixos que você incluiu.':', antes dos custos fixos e de outras despesas.');
    if(r.expenseRate>0)insight+=' Somar as porcentagens ao custo daria '+money(r.naive)+', com margem de '+pct(r.naiveMargin)+'.';
    limit=[['card','cartão'],['fair','feira'],['tax','imposto']].filter(([k])=>!String(values[key][k]).trim()).map(([,n])=>n).join(', ');limit=limit?'Taxas não informadas ('+limit+') ficaram fora da conta. O resultado é parcial.':'Taxas são as informadas para esta simulação; confirme os tributos aplicáveis.';
    if(costBasis?.fixed>0)limit+=' O rateio usa '+num(costBasis.units)+' unidades produzidas no mês; isso não comprova venda de toda a produção.';
    next='Confira o custo da embalagem e as condições de venda antes de adotar o preço.';
    html+=snapshot.product?btn('accounts-use-price','Usar Este Preço','success accounts-use-price'):'<p class="accounts-empty">Escolha um produto para levar o preço ao cadastro.</p>';
   }
  }else if(key==='balance'){
   if(r.status==='no-margin')html=hero('Equilíbrio por Unidade','Não Existe')+note('O preço não supera o custo informado. Vender mais não cobre os custos fixos; revise preço e custo.',true);
   else{html=hero('Unidades para Empatar no Mês',num(r.units))+row('Cada Unidade Deixa',money(r.contribution)+' · '+pct(r.contributionRate))+row('Empate em Vendas',money(r.revenue))+(r.hasGoal?row('Unidades para a Meta',num(r.goalUnits))+row('Vendas da Meta',money(r.goalRevenue)):'');insight='A partir da unidade '+num(r.firstSurplusUnit)+', a contribuição supera os custos fixos informados.';limit='É uma simulação de uma mesma unidade e preço. Some embalagem, taxas e outros custos variáveis ao custo; não é o lucro líquido registrado na Gestão.';next='Compare a meta com sua capacidade e a procura observada, sem assumir que todas essas unidades serão vendidas.';}
  }else if(key==='period'){
   if(r.status==='invalid-quantities')html=note('Perdas e produtos que voltaram não podem superar a quantidade levada. Use a mesma unidade e o mesmo período.',true);
   else{html=hero('Compra Média no Período',money(r.ticket))+row('Variação da Receita',r.change==null?'Sem Base de Comparação':(r.change>0?'+':'')+pct(r.change))+row('Perda Física',pct(r.lossRate))+row('Voltou Vendável',pct(r.returnRate));insight='Cada venda registrada representa, em média, '+money(r.ticket)+' de receita no recorte informado. Isso não é lucro nem dinheiro recebido.';limit='Produto que voltou vendável continua sendo estoque, não perda. Não há um limite universal de perdas para todos os negócios.';next='Confira o registro de devoluções e compare períodos equivalentes antes de concluir que houve crescimento ou queda.';}
  }else if(key==='discount'){
   if(r.status==='no-margin')html=note('O preço já não supera o custo informado. Antes de oferecer desconto, confira o custo e o preço.',true);
   else if(r.status==='loss')html=hero('Volume Adicional Necessário','Sem Compensação')+row('Preço com Desconto',money(r.newPrice))+row('Cada Unidade Deixa',money(r.after))+note('Nenhuma quantidade adicional recupera a contribuição anterior mantendo esse preço e custo. Reduza o desconto ou revise os custos.',true);
   else{html=hero('Precisaria Vender a Mais',pct(r.extra))+row('Preço com Desconto',money(r.newPrice))+row('Antes, por Unidade',money(r.before))+row('Depois, por Unidade',money(r.after))+(r.newQty!==null?row('Nova Quantidade para a Mesma Contribuição',num(r.newQty)):'')+row('Desconto que Zera a Contribuição',pct(r.maxDiscount));insight='O desconto reduz em '+pct(r.marginCut)+' o que cada unidade deixa. Para manter a contribuição anterior, seria necessário vender '+pct(r.extra)+' a mais.';limit='Isso não prevê procura nem garante compensação. Custos fixos e despesas não incluídas continuam fora; o desconto limite não deixa contribuição para pagá-los.';next='Avalie a capacidade, o estoque elegível e o efeito no caixa antes de oferecer o desconto.';}
  }else{
   html=hero(r.net==null?'Cobrar para Receber o Desejado':'Recebe após Esta Taxa',money(r.net??r.grossFor))+(r.fee!==null?row('Valor da Taxa',money(r.fee)):'')+(r.grossFor!==null?row('Cobrar para Receber '+money(input.wanted),money(r.grossFor))+row('Acréscimo Necessário',pct(r.increase,2)):'');insight='A taxa incide sobre todo o valor cobrado. Somar apenas a porcentagem da taxa não preserva o mesmo valor a receber.';limit='É o valor após esta taxa, antes de custo do produto, tributos, antecipação e outras despesas. Não comprova depósito da operadora.';next='Confira a taxa contratada e as regras da sua maquininha.';
  }
  return'<div class="accounts-result">'+html+(insight?note(insight):'')+(limit?'<p class="accounts-limit">'+e(limit)+'</p>':'')+(next?'<p class="accounts-next"><strong>Para Avaliar:</strong> '+e(next)+'</p>':'')+formula+'</div>';
 }
 function caption(key){
  if(key==='period')return'Seus Dados: '+date(snapshot.period.from)+' a '+date(snapshot.period.until)+'; comparação: '+date(snapshot.period.previousFrom)+' a '+date(snapshot.period.previousUntil)+'. Todos os locais. Receita após descontos e devoluções; Fiado vendido não é recebimento.'+(!snapshot.period.equalLength?' Os recortes têm durações diferentes; a variação não comprova tendência.':'');
  if(key==='discount')return'Quantidade registrada: '+date(snapshot.quantityPeriod.from)+' a '+date(snapshot.quantityPeriod.until)+', líquida de devoluções compatíveis na mesma unidade.';
  if(key==='balance')return'Simulação por unidade. Inclua embalagem e taxas no custo, se houver. Fixos incluem a retirada mensal quando ativada.';
  return'';
 }
 function card(key){return'<section class="ds-card accounts-card" data-account-card="'+key+'"><h3>'+e(CALCS[key].title)+'</h3><p class="accounts-purpose">'+e(PURPOSE[key])+'</p>'+(snapshot.product&&key!=='period'?'<p class="accounts-caption">'+e(window.TerritorioCoffee.coffeeName(snapshot.product)+' · '+b.description(snapshot.product))+'</p>':'')+(caption(key)?'<p class="accounts-caption">'+e(caption(key))+'</p>':'')+'<div class="accounts-fields">'+CALCS[key].fields.map(f=>field(key,f)).join('')+'</div>'+(key==='markup'?components.html():'')+'<div data-account-result="'+key+'" aria-live="polite" aria-atomic="true">'+result(key)+'</div></section>';}
 function paint(){
  if(!snapshot||owner!==b.data()||snapshot.actor!==actorOf(b.data()))refresh();
  b.open('Calculadora',controls()+'<div class="accounts-root"><p class="accounts-intro">Simulações com os seus números. Abra um assunto para calcular e entender o resultado.</p><div class="form-field accounts-product"><label for="accounts-product">Produto</label><select id="accounts-product"><option value="">Nenhum · Contas Livres</option>'+snapshot.products.map(p=>'<option value="'+e(p.id)+'"'+(p.id===selected?' selected':'')+'>'+e(window.TerritorioCoffee.coffeeName(p)+' · '+b.description(p))+'</option>').join('')+'</select></div>'+SUBJECTS.map(([id,icon,title,subtitle,calcs])=>'<details class="accounts-subject" data-account-subject="'+id+'"'+(opened===id?' open':'')+(calcs.length?'':' inert')+'><summary'+(calcs.length?'':' aria-disabled="true"')+'><span class="accounts-topic-icon">'+b.icon(icon)+'</span><span><strong>'+e(title)+'</strong><small>'+e(subtitle)+'</small></span>'+(calcs.length?b.icon('chevron'):'<small class="accounts-soon">Em Breve</small>')+'</summary>'+(calcs.length?'<div class="accounts-subject-body">'+calcs.map(card).join('')+'</div>':'')+'</details>').join('')+'<p class="accounts-disclaimer">“Seus Dados” vem dos registros do app e desaparece quando você edita o campo. Simulações não registram vendas nem alteram o estoque. Confirme os tributos com seu contador.</p></div>',btn('close-modal','Voltar','sheet-back'),'calculator');
  document.getElementById('dialog').classList.add('has-accounts');
  document.getElementById('dialog').setAttribute('data-numeric-sheet','');
 }
 function toggle(){if(enabled){enabled=false;document.getElementById('dialog').classList.remove('has-accounts');b.actions.calculator();}else{enabled=true;refresh();paint();}}
 b.actions['calculator-accounts']=toggle;
 b.actions['accounts-open']=()=>{enabled=true;refresh();paint();};
 b.actions['accounts-use-price']=()=>{
  if(!current()||owner!==b.data()||snapshot.actor!==actorOf(b.data()))return b.toast('O contexto mudou. Reabra a calculadora.');
  const product=b.data().products.find(p=>p.id===selected),r=calculate('markup').r,cents=r?.status==='ok'?Math.round(r.price*100):0;
  if(!product||product.active===false||product.archived||productStamp(product)!==snapshot.productStamp)return b.toast('O produto mudou. Escolha-o novamente para conferir o preço.');
  if(!Number.isSafeInteger(cents)||cents<=0||cents>100000000)return b.toast('O preço deve ficar entre R$ 0,01 e R$ 1.000.000,00.');
  enabled=false;document.getElementById('dialog').classList.remove('has-accounts');b.priceDraft(product.id,cents);b.toast('Preço de '+b.money(cents)+' preenchido. Confira e salve o produto.');
 };
 document.addEventListener('input',event=>{
  const el=event.target;if(!current()||!el.matches('[data-accounts-calc]'))return;
  const key=el.dataset.accountsCalc,field=el.dataset.accountsField;if(!CALCS[key]?.fields.some(([f])=>f===field))return;
  values[key][field]=el.value;if(key==='markup'&&field==='cost'&&!applying)costBasis=null;delete origins[key+'.'+field];document.querySelector('[data-source-for="'+key+'.'+field+'"]')?.setAttribute('hidden','');
  const output=document.querySelector('#dialog [data-account-result="'+key+'"]');if(output)output.innerHTML=result(key);
 });
 document.addEventListener('change',event=>{if(current()&&event.target.id==='accounts-product'){selected=event.target.value;refresh();paint();}});
 document.addEventListener('toggle',event=>{
  const target=event.target;if(!current()||!target.matches('#dialog .accounts-subject'))return;
  if(target.open){opened=target.dataset.accountSubject;for(const d of document.querySelectorAll('#dialog .accounts-subject[open]'))if(d!==target)d.open=false;}else if(opened===target.dataset.accountSubject)opened='';
 },true);
 document.addEventListener('territorio:sheet',()=>{document.getElementById('dialog').classList.toggle('has-accounts',current());});
 document.getElementById('dialog').addEventListener('close',()=>{if(!document.getElementById('dialog').open){enabled=false;document.getElementById('dialog').classList.remove('has-accounts');}});
 window.TerritorioProducerCalculator=Object.freeze({active:()=>enabled,controls,paint,leave:()=>{enabled=false;document.getElementById('dialog').classList.remove('has-accounts');}});
}
