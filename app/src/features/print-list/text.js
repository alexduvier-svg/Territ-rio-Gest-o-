import {productOutlineKey} from '../product-outline.js';
const symbols=Object.freeze({coffee:'☕',banana:'🍌',dates:'🌴',cheese:'🧀',milk:'🥛',egg:'🥚',fish:'🐟',tomato:'🍅',carrot:'🥕',orange:'🍊',grape:'🍇',avocado:'🥑',apple:'🍎',cassava:'🌱',potato:'🥔',onion:'🧅',pepper:'🌶️',beans:'🌾',corn:'🌽',sausage:'🍖',honey:'🍯',bread:'🍞',cake:'🍰',leaf:'🥬',flower:'🌼',soap:'🧼',bottle:'🍾',meat:'🥩',grain:'🌾',jar:'🥫',basket:'🧺',box:'📦'});
const clean=value=>String(value||'').replace(/[\r\n\t]+/g,' ').replace(/[*_~`]/g,'').trim();
export const productTextSymbol=product=>symbols[productOutlineKey(product)]||symbols.box;
export function offerText(offer){
 const separator='━━━━━━━━━━━━━━━━━━';
 const date=new Date(offer.at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
 return['*'+clean(offer.brand)+'*','*Produtos Disponíveis*','Lista de '+date,separator,...offer.items.flatMap(p=>[productTextSymbol(p)+' *'+clean(p.name)+'*',clean(p.label||p.unit),'*'+(p.price/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})+'* · Disponível',separator]),'Para pedir, responda com o produto e a quantidade.','Confirmo a disponibilidade ao receber o pedido.'].join('\n');
}
