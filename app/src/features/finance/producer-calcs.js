// Read-only simulations in reais. Adapted from Claude 22e3813; canonical recorded finances stay in finance.js.
const finite=(...v)=>v.every(Number.isFinite), nonnegative=(...v)=>finite(...v)&&v.every(n=>n>=0&&n<=1e12);
const optional=v=>v==null||Number.isNaN(v), rate=v=>optional(v)||finite(v)&&v>=0&&v<=100;
const tolerance=n=>Number.EPSILON*Math.max(1,Math.abs(n))*8;
const ceil=n=>Math.max(0,Math.ceil(n-tolerance(n)));
export function parseBR(value){
 if(typeof value==='number')return Number.isFinite(value)?value:NaN;
 let s=String(value??'').trim().replace(/^R\$\s*/i,'').replace(/\s*%$/,'').trim();
 if(!s||/\s/.test(s))return NaN;
 if(s.includes(',')){if(!/^[+-]?(?:\d+|\d{1,3}(?:\.\d{3})+),\d+$/.test(s))return NaN;s=s.replace(/\./g,'').replace(',','.');}
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
 return{status:'ok',contribution,contributionRate:contribution/price,units,revenue:units*price,firstSurplusUnit:Math.floor(ratio+tolerance(ratio))+1,goalUnits:goal,goalRevenue:goal*price,hasGoal:!optional(profit)&&profit>0};
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
 return{status:'ok',newPrice,before,after,extra,marginCut:1-after/before,maxDiscount,newQty};
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
