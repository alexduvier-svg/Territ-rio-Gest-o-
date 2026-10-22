// A new quantity round is a draft only; inventory changes exclusively in ERPModel.complete.
const n=value=>Number(String(value||'0').replace(',','.'));
export function beginRound(base){return{...base,items:[],active:0,multiPick:false,mpShown:[],additionBase:JSON.parse(JSON.stringify(base)),additionRequested:false,discountScope:'item',discountMode:'R$',discountValue:'',split:false,partsManual:false,quantityReviewCollapsed:false};}
export function mergeRound(round,products){
 const base=round.additionBase;if(!base)return round;
 const items=base.items.map(i=>({...i}));
 const discount=i=>i.discountMode==='%'?Math.round(products.find(p=>p.id===i.productId).price*n(i.rawQty)*n(i.discountValue)/100):Math.round(n(i.discountValue)*100);
 for(const line of round.items){const qty=n(line.rawQty),p=products.find(p=>p.id===line.productId);if(!p||!Number.isFinite(qty)||qty<=0)throw Error('Informe a quantidade de cada produto adicionado.');const old=items.find(i=>i.productId===line.productId);if(old){const cents=discount(old)+discount(line);old.rawQty=String(Math.round((n(old.rawQty)+qty)*1000)/1000).replace('.',',');if(base.discountScope==='item'){old.discountMode='R$';old.discountValue=String(cents/100).replace('.',',');}}else items.push({...line});}
 const merged={...base,items,active:0,quantityReviewCollapsed:true,partsManual:false};
 for(const key of ['clientName','clientId','uf','city','neighborhood'])merged[key]=round[key];
 delete merged.additionBase;delete merged.additionRequested;return merged;
}
