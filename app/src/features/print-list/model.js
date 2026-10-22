import {shopSnapshot} from '../store/availability.js';
import {properName} from '../proper-name.js';
export const PRINT_LIMIT=24,PRINT_PAGE_SIZE=6;
const round=n=>Math.round(n*1000)/1000;
export const printActor=data=>data.dataContext?.id||data.productMemory?.scopeId||'';
export function printProducts(data,description=()=> ''){
 const actor=printActor(data),shop=data.onlineShop,globalHeld=new Map(),homeHeld=new Map();
 const completed=new Set((data.sales||[]).filter(s=>s.status==='completed').map(s=>s.operationId));
 if(shop?.actorId===actor&&shop.slug===(data.portfolio?.slug||''))for(const order of shop.orders||[]){
  if(['cancelled','delivered'].includes(order.status)||order.accountedSale||completed.has('order-'+order.id))continue;
  for(const line of order.items||[]){globalHeld.set(line.productId,(globalHeld.get(line.productId)||0)+line.quantity);if(!order.event)homeHeld.set(line.productId,(homeHeld.get(line.productId)||0)+line.quantity);}
 }
 return shopSnapshot(data,[],description).map(p=>({...p,name:properName(p.name),available:Math.max(0,round(Math.min(p.stock-(globalHeld.get(p.productId)||0),p.homeStock-(homeHeld.get(p.productId)||0))))}));
}
export function printOffer(data,ids,{description,at=Date.now(),theme='light'}={}){
 const selected=new Set(ids);if(!selected.size)throw Error('Selecione os produtos para enviar.');if(selected.size>PRINT_LIMIT)throw Error('Escolha até '+PRINT_LIMIT+' produtos por envio para manter as imagens legíveis.');
 const items=printProducts(data,description).filter(p=>selected.has(p.productId)&&p.available>0).map(p=>({id:p.productId,name:p.name,label:p.label,unit:p.unit,category:p.category,price:p.price}));
 if(items.length!==selected.size)throw Error('A disponibilidade mudou. Confira os produtos selecionados; algum deles acabou ou está reservado.');
 return{actor:printActor(data),brand:properName(data.catalog?.title||data.settings?.businessName||'AGRO Gestão'),phone:String(data.settings?.phone||'').replace(/\D/g,''),at,theme:theme==='dark'?'dark':'light',items};
}
export function printFingerprint(offer){const{at,...publicFields}=offer;return JSON.stringify(publicFields);}
export function printPages(offer){return Array.from({length:Math.ceil(offer.items.length/PRINT_PAGE_SIZE)},(_,index)=>offer.items.slice(index*PRINT_PAGE_SIZE,(index+1)*PRINT_PAGE_SIZE));}
