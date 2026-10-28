// Read-only simulations in reais. Adapted from Claude 22e3813; canonical recorded finances stay in finance.js.
const finite=(...v)=>v.every(Number.isFinite), nonnegative=(...v)=>finite(...v)&&v.every(n=>n>=0&&n<=1e12);
const optional=v=>v==null||Number.isNaN(v), rate=v=>optional(v)||finite(v)&&v>=0&&v<=100;
const tolerance=n=>Number.EPSILON*Math.max(1,Math.abs(n))*8;
const ceil=n=>Math.max(0,Math.ceil(n-tolerance(n)));
export function parseBR(value){
 if(typeof value==='number')return Number.isFinite(value)?value:NaN;
 let s=String(value??'').trim().replace(/^R\$\s*/i,'').replace(/\s*%$/,'').trim();
 if(!s||/\s/.test(s))return NaN;
 if(s.includes(',')){if(!/^[+-]?(?:\d*|\d{1,3}(?:\.\d{3})+),\d+$/.test(s))return NaN;s=s.replace(/\./g,'').replace(',','.');}
 else if(/^[+-]?\d{1,3}(?:\.\d{3})+$/.test(s))s=s.replace(/\./g,'');
 else if(!/^[+-]?\d+(?:\.\d+)?$/.test(s))return NaN;
 const n=Number(s);return finite(n)&&Math.abs(n)<=1e12?n:NaN;
}
export function markupPrice({cost,margin,card,fair,tax}){
 if(!nonnegative(cost,margin)||margin>100||![card,fair,tax].every(rate))return null;
 const expenseRate=[card,fair,tax].reduce((n,v)=>n+(optional(v)?0:v),0)/100,m=margin/100;
 if(expenseRate+m>=1)return{status:'impossible',expenseRate,marginRate:m};
 if(cost===0)return{status:'zero-cost',expenseRate,marginRate:m};
 const markup=1/(1-expenseRate-m),price=cost*markup,naive=cost*(1+expenseRate+m);
 if(!finite(markup,price)||price>1e12)return{status:'limit'};
 return{status:'ok',markup,price,profit:price*m,expenses:price*expenseRate,expenseRate,marginRate:m,overCost:(price-cost)/cost,naive,naiveMargin:(naive*(1-expenseRate)-cost)/naive};
}
export function breakEvenUnits({fixed,price,variable,profit}){
 if(!nonnegative(fixed,price,variable)||price<=0||!optional(profit)&&!nonnegative(profit))return null;
 const contribution=price-variable;if(contribution<=0)return{status:'no-margin',contribution};
 const units=ceil(fixed/contribution),goal=ceil((fixed+(optional(profit)?0:profit))/contribution);
 if(!Number.isSafeInteger(units)||!Number.isSafeInteger(goal)||Math.max(units*price,goal*price)>1e12)return{status:'limit'};
 const ratio=fixed/contribution;
 return{status:'ok',contribution,contributionRate:contribution/price,units,exact:Math.abs(ratio-Math.round(ratio))<=tolerance(ratio),revenue:units*price,firstSurplusUnit:Math.floor(ratio+tolerance(ratio))+1,goalUnits:goal,goalRevenue:goal*price,hasGoal:!optional(profit)&&profit>0};
}
export function periodIndicators({revenue,count,previous,taken,lost,returned}){
 if(!nonnegative(revenue,count)||!Number.isInteger(count)||count<=0||!optional(previous)&&!nonnegative(previous))return null;
 for(const v of[taken,lost,returned])if(!optional(v)&&!nonnegative(v))return null;
 if(!optional(taken)&&(lost>taken||returned>taken||finite(lost,returned)&&lost+returned>taken))return{status:'invalid-quantities'};
 const lossRate=finite(taken,lost)&&taken>0?lost/taken:null,returnRate=finite(taken,returned)&&taken>0?returned/taken:null;
 return{status:'ok',ticket:revenue/count,change:finite(previous)&&previous>0?(revenue-previous)/previous:null,lossRate,returnRate,used:lossRate==null?null:1-lossRate};
}
export function discountImpact({price,variable,discount,qty}){
 if(!nonnegative(price,variable,discount)||price<=0||discount>100||!optional(qty)&&!nonnegative(qty))return null;
 const before=price-variable,maxDiscount=Math.max(0,before/price);
 if(before<=0)return{status:'no-margin',before,maxDiscount:0};
 const newPrice=price*(1-discount/100),after=newPrice-variable;
 if(after<=Math.max(price,variable)*Number.EPSILON*8)return{status:'loss',newPrice,before,after:Math.min(0,after),maxDiscount};
 const extra=before/after-1,newQty=finite(qty)&&qty>0?ceil(qty*(1+extra)):null;
 if(!finite(extra)||newQty!==null&&!Number.isSafeInteger(newQty))return{status:'limit'};
 return{status:'ok',newPrice,before,after,extra,marginCut:1-after/before,maxDiscount,newQty,profitSame:finite(qty)&&qty>0?after*qty:null,profitBefore:finite(qty)&&qty>0?before*qty:null};
}
export function cardNet({value,rate:fee,wanted}){
 if(!finite(fee)||fee<0||fee>=100||!optional(value)&&!nonnegative(value)||!optional(wanted)&&!nonnegative(wanted))return null;
 const hasValue=finite(value)&&value>0,hasWanted=finite(wanted)&&wanted>0;if(!hasValue&&!hasWanted)return null;
 const keep=1-fee/100,out={status:'ok',net:hasValue?value*keep:null,fee:hasValue?value*fee/100:null,grossFor:hasWanted?wanted/keep:null,increase:hasWanted?1/keep-1:null};
 return Object.values(out).filter(v=>typeof v==='number').every(v=>Number.isFinite(v)&&v<=1e12)?out:{status:'limit'};
}
export function unitCost({fixed,units,variable}){
 if(!nonnegative(fixed,variable)||!finite(units)||units<=0||units>1e12)return null;
 const allocated=fixed/units,total=allocated+variable;
 return finite(total)&&total<=1e12?{fixed,units,variable,allocated,total}:null;
}
export function selectedCharges(rows,{kind}={}){
 const selected=rows.filter(r=>r.selected&&(!kind||r.kind===kind));let total=0;const names=new Set();
 for(const r of selected){const name=String(r.name||'').trim().toLocaleLowerCase('pt-BR');if(!name||names.has(name)||!nonnegative(r.amount))return null;names.add(name);total+=r.amount;}
 return finite(total)&&total<=1e12?{total,count:selected.length}:null;
}

// Additional read-only simulations from Claude 0.12.132.
const ok = finite, opt = value => Number.isFinite(value) ? value : 0;

// Fornecedor: pagar à vista ou a prazo. "implicit" é o juro ao mês que o preço a prazo embute; com a
// taxa que o dinheiro rende (ou o crédito custa) ao mês, o preço a prazo é trazido para hoje e comparado.
// Não considera falta de caixa, prazo de entrega ou qualidade: isso fica para o produtor pesar.
export function cashOrTerm({ cash, term, days, rate }) {
  if (!ok(cash, term, days) || cash <= 0 || term <= 0 || days <= 0 || days > 3650) return null;
  const implicit = Math.pow(term / cash, 30 / days) - 1;
  if (!ok(rate)) return { status: 'ok', implicit, hasRate: false };
  if (rate < 0 || rate >= 100) return null;
  const today = term / Math.pow(1 + rate / 100, days / 30), diff = cash - today;
  const best = Math.abs(diff) < 0.005 ? 'same' : diff > 0 ? 'term' : 'cash';
  return { status: 'ok', implicit, hasRate: true, today, diff, best };
}

// Fornecedores, comparação rápida: até 3 ofertas com preço, quantidade e frete; vence o menor custo por
// unidade. Só compara o que foi informado; qualidade, prazo e pagamento ficam para a comparação completa.
export function quickCompare(offers) {
  const rows = (Array.isArray(offers) ? offers : []).slice(0, 3).map((o, i) => ({ ...o, i }))
    .filter(o => nonnegative(o.price, o.qty) && o.price > 0 && o.qty > 0 && (optional(o.freight) || nonnegative(o.freight)))
    .map(o => { const total = o.price + opt(o.freight); return { i: o.i, total, unit: total / o.qty, freightKnown: ok(o.freight) }; })
    .filter(o => nonnegative(o.total, o.unit));
  if (rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => a.unit - b.unit || a.i - b.i), best = sorted[0], next = sorted[1];
  const tie = Math.abs(next.unit - best.unit) < 1e-9;
  const missingFreight = rows.some(r => !r.freightKnown);
  return { rows, best: missingFreight || tie ? null : best.i, tie, saving: missingFreight ? null : tie ? 0 : (next.unit - best.unit) / next.unit, missingFreight };
}

// Estoque: quando pedir e quanto comprar. Ponto de pedido = venda por dia × (dias até chegar + folga);
// a compra cobre os dias pedidos depois que a mercadoria chega, descontado o que já está no estoque.
export function restockPlan({ daily, onHand, leadDays, safetyDays, coverDays }) {
  if (!ok(daily, onHand, leadDays, coverDays) || daily <= 0 || onHand < 0 || leadDays < 0 || coverDays <= 0) return null;
  const safety = Math.max(0, opt(safetyDays)), reorderAt = daily * (leadDays + safety);
  const daysLeft = (onHand - reorderAt) / daily, quantity = Math.max(0, Math.ceil(daily * (leadDays + safety + coverDays) - onHand - 1e-9));
  return { reorderAt, daysLeft, orderNow: daysLeft <= 0, quantity, lastsDays: onHand / daily };
}

// Ciclo de caixa: quantos dias o dinheiro fica parado entre pagar o fornecedor e receber do cliente.
// Com o custo do mês, mostra o dinheiro de giro que esse ciclo prende.
export function cashCycle({ stockDays, receiveDays, payDays, monthlyCost }) {
  if (!ok(stockDays, receiveDays, payDays) || stockDays < 0 || receiveDays < 0 || payDays < 0) return null;
  const cycle = stockDays + receiveDays - payDays, hasCost = ok(monthlyCost) && monthlyCost > 0;
  return { cycle, operating: stockDays + receiveDays, working: hasCost && cycle > 0 ? monthlyCost / 30 * cycle : hasCost ? 0 : null };
}

// Produção rural: custo da safra por unidade colhida (saca, kg, caixa) e, com o preço, a sobra por unidade.
export function harvestCost({ inputs, labor, machines, other, produced, price }) {
  const parts = [inputs, labor, machines, other].filter(v => Number.isFinite(v));
  if (!parts.length || parts.some(v => v < 0) || !ok(produced) || produced <= 0) return null;
  const total = parts.reduce((n, v) => n + v, 0), unit = total / produced, hasPrice = ok(price) && price > 0;
  return { total, unit, informed: parts.length, margin: hasPrice ? (price - unit) / price : null, perUnit: hasPrice ? price - unit : null, breakEvenQty: hasPrice ? total / price : null };
}

// Medidas do campo. Saca de café/grãos 60 kg, arroba 15 kg; alqueire mineiro 48.400 m², paulista 24.200 m².
export const MEASURES = {
  peso: { kg: ['Quilo (kg)', 1, 'kg'], saca: ['Saca de 60 kg', 60, 'sacas'], arroba: ['Arroba (15 kg)', 15, 'arrobas'], t: ['Tonelada', 1000, 't'] },
  area: { ha: ['Hectare', 10000, 'ha'], alqmg: ['Alqueire mineiro', 48400, 'alqueires mineiros'], alqsp: ['Alqueire paulista', 24200, 'alqueires paulistas'], m2: ['Metro quadrado', 1, 'm²'] },
};
export function convertMeasure({ value, from }) {
  if (!ok(value) || value < 0) return null;
  const group = Object.entries(MEASURES).find(([, units]) => units[from]);
  if (!group) return null;
  const [name, units] = group, base = value * units[from][1];
  return { group: name, rows: Object.entries(units).filter(([id]) => id !== from).map(([id, [label, size, short]]) => ({ id, label, short, value: base / size })) };
}

// Financiamento pela tabela Price (parcela fixa). Juro 0 divide em partes iguais.
export function loanPayment({ principal, rate, months }) {
  if (!ok(principal, rate, months) || principal <= 0 || rate < 0 || rate >= 100 || months < 1 || months > 600 || !Number.isInteger(months)) return null;
  const i = rate / 100, payment = i === 0 ? principal / months : principal * i / (1 - Math.pow(1 + i, -months));
  return { payment, total: payment * months, interest: payment * months - principal };
}

// Investimento (balança, freezer, barraca): em quantos meses volta e quanto rende na vida útil.
export function investmentReturn({ cost, monthlyGain, lifeMonths }) {
  if (!ok(cost, monthlyGain) || cost <= 0) return null;
  if (monthlyGain <= 0) return { status: 'no-return' };
  const payback = cost / monthlyGain, hasLife = ok(lifeMonths) && lifeMonths > 0;
  return { status: 'ok', payback, gainLife: hasLife ? monthlyGain * lifeMonths : null, roi: hasLife ? (monthlyGain * lifeMonths - cost) / cost : null, paysBeforeEnd: hasLife ? payback <= lifeMonths : null };
}
