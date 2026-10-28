import {statement,productMargins,financeSettings} from '../finance/finance.js';
import {orderStockProducts} from '../stock-order.js';
export const knownCost=p=>!!p&&Number.isSafeInteger(p.cost)&&p.cost>=0&&(p.costKnown===true||p.costKnown!==false&&p.cost>0);
const money=n=>Number.isSafeInteger(n)&&n>=0?n/100:null;
export const actorOf=d=>String(d?.dataContext?.id||d?.productMemory?.scopeId||d?.actorId||d?.settings?.producerId||'local')+'|'+String(d?.dataContext?.type||'');
export const productStamp=p=>p?JSON.stringify([p.id,p.unit,p.price,p.cost,p.costKnown,p.active,p.archived]):'';
const day=(v,dayKey)=>{const n=Date.parse(v);return Number.isFinite(n)?dayKey(n):'';};
function period(data,from,until,dayKey,now){
 const inside=v=>{const d=day(v,dayKey);return d>=from&&d<=until&&Date.parse(v)<=now;};
 const rows=data.sales||[],sales=rows.filter(s=>['completed','returned'].includes(s.status)&&inside(s.date)),returns=rows.filter(s=>s.status==='returned'&&inside(s.returnedAt||s.date));
 // Canonical revenue/returns/discounts and count. This is competence, not received cash.
 const st=statement({sales,returns,expenses:[],receipts:[],settings:data.settings?.finance});
 return{st,sales,returns};
}
export function calculatorInputs(data,productId,{now=Date.now(),dayKey}={}){
 if(typeof dayKey!=='function')throw Error('Calendário local indisponível.');
 const today=dayKey(now),month=today.slice(0,7),date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()-1);
 const previousMonth=date.toISOString().slice(0,7),daysPrevious=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate(),previousUntil=previousMonth+'-'+String(Math.min(Number(today.slice(8)),daysPrevious)).padStart(2,'0');
 const current=period(data,month+'-01',today,dayKey,now),previous=period(data,previousMonth+'-01',previousUntil,dayKey,now),previousFull=period(data,previousMonth+'-01',previousMonth+'-'+String(daysPrevious).padStart(2,'0'),dayKey,now),since=dayKey(now-29*86400000),recent=period(data,since,today,dayKey,now);
 const products=orderStockProducts((data.products||[]).filter(p=>p.active!==false&&!p.archived)),p=products.find(p=>p.id===productId),raw=data.settings?.finance||{},settings=financeSettings(raw),fields={markup:{},balance:{},period:{},discount:{},card:{}},origins={};
 const put=(calc,key,value)=>{if(value!==null&&Number.isFinite(value)){fields[calc][key]=value;origins[calc+'.'+key]=true;}};
 const configuredFee=Object.hasOwn(raw.cardFees||{},'Crédito')&&Number.isFinite(raw.cardFees.Crédito)&&raw.cardFees.Crédito>=0&&raw.cardFees.Crédito<100?raw.cardFees.Crédito:null;
 put('markup','card',configuredFee);put('card','rate',configuredFee);
 if(Object.hasOwn(raw,'salesTaxRate')&&Number.isFinite(raw.salesTaxRate)&&raw.salesTaxRate>=0&&raw.salesTaxRate<=30)put('markup','tax',raw.salesTaxRate);
 const fixed=settings.fixedCosts.filter(f=>!f.since||f.since<=month).reduce((n,f)=>n+Number(f.amount),0)+(settings.drawOn?settings.drawMonthly:0);
 if(fixed>0)put('balance','fixed',money(fixed));if(raw.goal>0)put('balance','profit',money(settings.goal));
 if(current.st.salesCount){put('period','revenue',current.st.revenue/100);put('period','count',current.st.salesCount);}
 if(previous.st.salesCount||previous.st.returned)put('period','previous',previous.st.revenue/100);
 if(p){const price=money(p.price),cost=knownCost(p)?money(p.cost):null;put('markup','cost',cost);put('balance','variable',cost);put('balance','price',price);put('discount','variable',cost);put('discount','price',price);put('card','value',price);
  const sameUnit=[...recent.sales,...recent.returns].flatMap(s=>s.items||[]).filter(i=>i.productId===p.id).every(i=>i.unit===p.unit);
  const row=sameUnit?productMargins(recent.sales,recent.returns).find(i=>i.id===p.id):null;if(row?.qty>0)put('discount','qty',row.qty);
 }
 const costOptions=settings.fixedCosts.filter(f=>(!f.since||f.since<=month)&&Number.isSafeInteger(f.amount)).map((f,i)=>({id:'fixed-'+i,name:f.title,kind:'fixed',amount:f.amount/100,source:true}));
 if(settings.drawOn&&settings.drawMonthly>0)costOptions.push({id:'monthly-draw',name:'Retirada Mensal de Finanças',kind:'fixed',amount:settings.drawMonthly/100,source:true});
 if(p&&knownCost(p))costOptions.push({id:'product-cost',name:'Custo do Cadastro · Confira se Já Inclui Rateios',kind:'variable',amount:p.cost/100,source:true});
 return{actor:actorOf(data),product:p||null,productStamp:productStamp(p),products,fields,origins,costOptions,previousMonthCost:previousFull.st.cmv>0?previousFull.st.cmv/100:undefined,period:{from:month+'-01',until:today,previousFrom:previousMonth+'-01',previousUntil,equalLength:Number(today.slice(8))<=daysPrevious},quantityPeriod:{from:since,until:today},context:data.dataContext};
}
