import {contextOf,eligible} from './core.js';
import {normalize,productMatches} from '../stock-entries.js';
import {book,identity,purchaseReceiptState,validDay,day} from '../suppliers/model.js';
const quantity=n=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:3}).format(n);
const date=d=>d.split('-').reverse().join('/');
export function isIncomingQuestion(text){
 const q=normalize(text);
 if(/^(?:registre|receba|adicione|apague|exclua|cancele|zere)\b/.test(q))return false;
 if(/clientes?|cnpjs?|vendas?|\bvendi\b/.test(q)&&!/fornecedor|compras?/.test(q))return false;
 const arrival=/(?:(?:pra|para|a)\s+chegar|(?:vai|vao|deve|devem)\s+chegar|ainda\s+nao\s+cheg|falta.*receber|(?:aguardando|pendentes?).*(?:recebimento|entrega)|(?:recebimento|entrega).*(?:pendente|atrasad))/.test(q);
 return arrival||/\b(?:compras?|pedidos?|mercadorias?|produtos?|encomendas?)\b.*\b(?:pendentes?|atrasad[oa]s?)\b/.test(q);
}
// Reads the canonical purchase/receipt ledger; commitments never become stock.
export function incomingPurchases(data,text,{now=Date.now()}={}){
 if(!isIncomingQuestion(text))return null;
 const q=normalize(text),ctx=contextOf(data);
 if(!['real','demo','simulation'].includes(ctx.dataOrigin))throw Error('Confirme a origem dos registros antes de consultar.');
 const directory=book(data),rows=directory.purchases||[];
 if(rows.length>10000)throw Error('Histórico de compras grande demais. Consulte os pedidos em Fornecedores.');
 const today=day(now),target=/\bamanha\b/.test(q)?day(now+86400000):/\bhoje\b/.test(q)?today:null,late=/atrasad|prazo.*passou/.test(q);
 if(/\b(?:semana|mes|ano|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b|\b\d{1,2}[/-]\d/.test(q))throw Error('Para entregas, pergunte por hoje, amanhã, atrasados ou todas as pendências. Outros períodos ainda precisam ser consultados em Fornecedores.');
 const products=productMatches(data,q),productIds=new Set(products.map(p=>p.id)),suppliers=directory.suppliers.filter(s=>eligible(s,ctx)&&q.includes(normalize(identity(data,s).name))),supplierIds=new Set(suppliers.map(s=>s.id));
 if(/\b(?:do|da) fornecedor\b/.test(q)&&!suppliers.length)return answer('Não identifiquei esse fornecedor com segurança. Informe o nome cadastrado em Fornecedores.');
 const subject=q.match(/(?:tem|tenho|ha|existe|existem)\s+(.+?)\s+(?:(?:pra|para|a)\s+chegar|pendente)/)?.[1];
 if(subject&&!productIds.size&&!supplierIds.size&&!/^(?:(?:algum|alguma|alguns|algumas|mais|um|uma|meu|minha|meus|minhas)\s+)*(?:produtos?|mercadorias?|compras?|pedidos?|entregas?|encomendas?|algo)$/.test(subject))return answer('Não identifiquei o produto com segurança. Informe seu nome cadastrado para conferir as compras pendentes.');
 const seen=new Set(),pending=[],unknown=[];let registered=0,missingDate=0;
 for(const row of rows){
  if(!eligible(row,ctx)||ctx.dataOrigin==='real'&&row.source==='system-example'||row.voidedAt)continue;
  if(!row.id||seen.has(row.id))throw Error('Compras duplicadas ou sem identificação. Confira Fornecedores.');seen.add(row.id);
  if(productIds.size&&!productIds.has(row.item?.productId)||supplierIds.size&&!supplierIds.has(row.supplierId))continue;
  registered++;
  const state=purchaseReceiptState(row);
  if(state.known&&state.pending===0)continue;
  if(row.expectedOn&&!validDay(row.expectedOn))throw Error('Há uma previsão de entrega inválida. Confira o pedido em Fornecedores.');
  if((target||late)&&!row.expectedOn){missingDate++;continue;}
  if(target&&row.expectedOn!==target||late&&row.expectedOn>=today)continue;
  const supplier=directory.suppliers.find(s=>s.id===row.supplierId&&eligible(s,ctx));
  const name=row.item?.name||'Item sem nome registrado',unit=row.item?.unit||'unidade não registrada';
  const line=name+(row.item?.specification?' · '+row.item.specification:'')+' · '+(supplier?identity(data,supplier).name:'Fornecedor não identificado')+'\n'+(state.known?'Comprado: '+quantity(state.ordered)+' '+unit+'; recebido: '+quantity(state.received)+'; falta receber: '+quantity(state.pending)+' '+unit+'.':'Recebimentos anteriores não conferidos. Não é possível apurar a quantidade pendente.')+'\n'+(row.expectedOn?'Previsão registrada: '+date(row.expectedOn)+(row.expectedOn<today?' · prazo informado já passou; confirme a entrega.':'.'):'Previsão de entrega não registrada.');
  (state.known?pending:unknown).push(line);
 }
 const label=target?'previsão para '+date(target):late?'com prazo registrado vencido':'posição atual, independentemente do mês da compra';
 let textResult='Recebimentos pendentes · '+label+'\n';
 if(pending.length)textResult+=pending.join('\n\n');
 else textResult+=registered?'Não há saldo pendente confirmado neste recorte.':'Não há compras cadastradas para esta consulta. Registre seus pedidos em Fornecedores para acompanhar o que falta receber.';
 if(unknown.length)textResult+='\n\nCompras que precisam de conferência\n'+unknown.join('\n\n');
 if(missingDate)textResult+='\n\n'+missingDate+' compras sem previsão registrada ficaram fora do filtro de data.';
 textResult+='\n\nA previsão não confirma a chegada. Somente os recebimentos registrados reduzem a pendência; a quantidade pendente não faz parte do estoque físico.';
 return answer(textResult);
 function answer(text){return {intent:'integrated-read',text,contextLabel:'Compras do produtor · '+(target?'entregas previstas para '+date(target):late?'atrasos registrados':'pendências atuais, sem filtro pelo mês da compra'),generatedAt:now,specialists:[{name:'Fornecedores e recebimentos',source:'supplierBook.purchases e purchaseReceiptState · pedidos e recebimentos originais'}],confidence:'Somente registros desta base. Previsão não comprova entrega; saldo desconhecido exige conferência.',insights:[],rebuys:[]};}
}
