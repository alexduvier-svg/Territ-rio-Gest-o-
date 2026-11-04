import {parseBR} from '../finance/producer-calcs.js';
import {day,validDay,recordDay,recordClock,recordInstant} from '../record-date.js';
export {day,validDay,recordClock,recordInstant};
export const saleDay=recordDay;
export function eligible(data, sale) {
  const actor = data.dataContext?.id || data.productMemory?.scopeId;
  return !!sale && ['completed','returned'].includes(sale.status)
    && (!sale.actorId || sale.actorId === actor)
    && (!sale.dataContext?.id || sale.dataContext.id === actor)
    && !(data.dataContext?.type === 'real' && (sale.demo || sale.simulation || sale.simulated));
}
export const itemCostKnown = item => item?.costKnown !== false && Number.isSafeInteger(item?.cost) && item.cost >= 0
  && (item.costKnown === true || item.cost > 0) && Number.isSafeInteger(item.costTotal) && item.costTotal >= 0;

// This is a view over the original sales, not a second store or a monthly move.
export function history(data, {month = day().slice(0,7), scope = 'all',ids=null,missingOnly=false} = {}) {
  const wanted=ids?(ids instanceof Set?ids:new Set(ids)):null;
  const sales = data.sales.filter(s => eligible(data,s) && (scope === 'all' || s.scope === scope) && (!wanted||wanted.has(s.id)) && (!missingOnly||s.items.some(i=>!itemCostKnown(i))));
  const months = [...new Set(sales.map(s => saleDay(s).slice(0,7)).filter(Boolean))].sort().reverse();if(sales.some(s=>!saleDay(s)))months.push('undated');
  const rows = sales.filter(s => month==='undated'?!saleDay(s):saleDay(s).startsWith(month + '-'))
    .sort((a,b) => saleDay(b).localeCompare(saleDay(a)) || String(b.date).localeCompare(String(a.date)) || String(b.id).localeCompare(String(a.id)));
  const days = new Map();
  for (const sale of rows) { const key=saleDay(sale);if(!days.has(key))days.set(key,[]);days.get(key).push(sale); }
  return {month,months,days:[...days].map(([date,sales])=>({date,sales})),sales:rows,count:sales.length,
    missing:rows.reduce((n,s)=>n+s.items.filter(i=>!itemCostKnown(i)).length,0)};
}
export function missingCosts(data, sales=data.sales, returns=[]) {
  const seen=new Set(),items=new Map(),saleIds=[];let lines=0;
  for(const sale of [...sales,...returns]){
    if(!eligible(data,sale)||seen.has(sale.id))continue;seen.add(sale.id);let missing=false;
    for(const item of sale.items||[])if(!itemCostKnown(item)){
      missing=true;lines++;const key=JSON.stringify([item.productId,item.name,item.description,item.unit]);
      if(!items.has(key))items.set(key,{name:item.name,description:item.description||'',unit:item.unit,sales:0});items.get(key).sales++;
    }
    if(missing)saleIds.push(sale.id);
  }
  return {items:[...items.values()],saleIds,lines};
}

export function parseCost(raw) {
  const text = String(raw ?? '').trim().replace(/^R\$\s*/,'');
  if (!/^(?:(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?|\d+\.\d{1,2})$/.test(text)) throw Error('Informe um valor válido, com até duas casas decimais. Se não houver custo, digite 0.');
  const cost = Math.round(parseBR(text) * 100);
  if (!Number.isSafeInteger(cost) || cost < 0) throw Error('O custo informado é muito alto.');
  return cost;
}

export function amendCost(data, {saleId,index,cost,operationId,expectedRevision}, now = Date.now()) {
  if (data.training?.version === 1) throw Error('Saia do Modo Teste para alterar o custo de uma venda registrada.');
  const sale = data.sales.find(s=>s.id===saleId);
  if (!eligible(data,sale)) throw Error('A venda deste produtor não está disponível.');
  if (!Number.isInteger(index) || index < 0 || !sale.items[index]) throw Error('O produto desta venda não foi encontrado.');
  if (!operationId || typeof operationId !== 'string' || operationId.length > 120) throw Error('Identificação da alteração inválida.');
  const previous = (sale.costCorrections || []).find(r=>r.id===operationId);
  if (previous) {
    if (previous.index !== index || previous.after.cost !== cost) throw Error('Esta alteração já foi registrada com outro custo.');
    return {changed:false,correction:previous};
  }
  if (data.sales.some(s=>s!==sale&&(s.costCorrections||[]).some(r=>r.id===operationId))) throw Error('Esta alteração pertence a outra venda.');
  if (expectedRevision !== undefined && expectedRevision !== (sale.costRevision || 0)) throw Error('O custo desta venda mudou. Reabra para conferir.');
  if (!Number.isSafeInteger(cost) || cost < 0) throw Error('Informe um custo válido em centavos.');
  const item = sale.items[index], costTotal = Math.round(cost * item.qty);
  if (!(Number.isFinite(item.qty) && item.qty > 0) || !Number.isSafeInteger(costTotal)) throw Error('Confira a quantidade e o custo deste produto.');
  if (itemCostKnown(item) && item.cost === cost && item.costTotal === costTotal) return {changed:false};
  const totals = sale.items.map((i,n)=>n===index?costTotal:Number.isSafeInteger(i.costTotal)&&i.costTotal>=0?i.costTotal:0);
  const total = totals.reduce((n,value)=>n+value,0);
  if (!Number.isSafeInteger(total)) throw Error('O custo total da venda é muito alto.');
  const when = new Date(now).toISOString();
  const correction = {id:operationId,index,productId:item.productId,name:item.name,unit:item.unit,qty:item.qty,
    before:{cost:Number.isSafeInteger(item.cost)?item.cost:null,costTotal:Number.isSafeInteger(item.costTotal)?item.costTotal:null,costKnown:itemCostKnown(item)},
    after:{cost,costTotal,costKnown:true},recordedAt:when,source:'producer-after-sale',actorId:data.dataContext?.id||data.productMemory?.scopeId};
  Object.assign(item,{cost,costTotal,costKnown:true,costUpdatedAt:when});
  sale.cost = total;sale.costRevision = (sale.costRevision || 0) + 1;
  sale.costCorrections = [...(sale.costCorrections || []),correction];
  return {changed:true,correction};
}

export function addMonths(date, offset, anchor = Number(String(date).slice(8,10))) {
  if (!validDay(date) || !Number.isInteger(offset) || !Number.isInteger(anchor) || anchor < 1 || anchor > 31) throw Error('Escolha uma data válida.');
  const year=Number(date.slice(0,4)), month=Number(date.slice(5,7))-1+offset;
  const first = new Date(Date.UTC(year,month,1,12)), last = new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0,12));
  const result = first.getUTCFullYear()+'-'+String(first.getUTCMonth()+1).padStart(2,'0')+'-'+String(Math.min(anchor,last.getUTCDate())).padStart(2,'0');
  if (!validDay(result)) throw Error('A data está fora do calendário disponível.');
  return result;
}
export function installments({amount,count,firstDate,dates,anchorDay}, saleDate = day()) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw Error('Confira o valor no Crédito.');
  if (!Number.isInteger(count) || count < 1 || count > 60) throw Error('Informe de 1 a 60 parcelas, usando um número inteiro.');
  if (count > amount) throw Error('O valor é insuficiente para esse número de parcelas.');
  if (!validDay(saleDate) || !validDay(firstDate) || firstDate < saleDate) throw Error('Escolha uma primeira data a partir da venda.');
  if (dates !== undefined && (!Array.isArray(dates) || dates.length !== count)) throw Error('Confira a data de cada parcela.');
  const schedule = dates ? [...dates] : Array.from({length:count},(_,i)=>addMonths(firstDate,i,anchorDay));
  if (schedule[0] !== firstDate || schedule.some((date,i)=>!validDay(date)||date<saleDate||i>0&&date<=schedule[i-1])) throw Error('As datas das parcelas devem estar em ordem, a partir da venda.');
  const base=Math.floor(amount/count), remainder=amount%count;
  return {version:1,count,firstDate,mode:dates?'custom':'monthly',...(anchorDay?{anchorDay}:{}),
    installments:schedule.map((date,i)=>({number:i+1,date,amount:base+(i<remainder?1:0)}))};
}
export function creditAmount(draft, total) {
  if (!draft.split) return draft.payment === 'Crédito' ? total : 0;
  return (draft.parts || []).filter(p=>p.method==='Crédito').reduce((n,p)=>n+parseCost(p.value),0);
}
// Old records remain valid without a schedule; a newly supplied schedule must match
// the current credit amount, including after changing a quantity or a split.
export function validatedPlan(plan, amount, saleDate = day()) {
  if (!plan) return null;
  if (!Array.isArray(plan.installments)) throw Error('Confira o parcelamento no Crédito.');
  const checked=installments({amount,count:plan.count,firstDate:plan.firstDate,dates:plan.installments.map(i=>i.date)},saleDate);
  if (plan.installments.some((p,i)=>p.number!==i+1||p.amount!==checked.installments[i].amount)) throw Error('O valor da venda mudou. Confira as parcelas do Crédito.');
  return {...checked,mode:plan.mode==='monthly'?'monthly':'custom',...(plan.anchorDay?{anchorDay:plan.anchorDay}:{})};
}
