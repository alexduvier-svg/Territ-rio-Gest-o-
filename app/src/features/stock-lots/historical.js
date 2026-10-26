import {scopedLots} from './reservations.js';
import {civilDay,validCivil,formatCivil} from './validity.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const NEW_RECEIPT='__new_receipt__';
export function historicalChoices(data,productId,eventId,onDay,newQuantity=0){
 if(data.stockLotsVersion!==1||!validCivil(onDay)||onDay>=civilDay())return[];
 const snapshot=scopedLots(data,productId,{scope:eventId,onDay}),rows=snapshot.lots.filter(l=>l.remaining>0&&!l.quarantined&&!l.status.blocking&&(!l.receivedOn||l.receivedOn<=onDay));
 if(newQuantity>0)rows.push({id:NEW_RECEIPT,remaining:newQuantity,validity:{},new:true});return rows;
}
export function renderHistoricalChoices(data,{productId,eventId,onDay,newQuantity=0,selections=[],prefix='historic-lot'},helpers){
 const p=data.products.find(p=>p.id===productId);if(!p)return'';const rows=historicalChoices(data,productId,eventId,onDay,newQuantity);if(rows.length<2)return'';
 return'<section class="event-material-card lot-historical-choice"><h4>Quais Lotes Foram Vendidos?</h4><p class="small muted">Venda antiga com mais de um lote possível. Distribua a quantidade; o app não presume qual lote saiu.</p>'+rows.slice(0,24).map((l,i)=>{const value=selections.find(s=>s.lotId===l.id)?.quantity??'',label=l.new?'Entrada Nova Desta Conferência':l.validity.lotCode?'Lote '+l.validity.lotCode:l.validity.expiresOn?'Vencimento '+formatCivil(l.validity.expiresOn):'Lote sem Data · '+l.id.slice(-8);return helpers.numericField(prefix+'-'+i,esc(label),String(value).replace('.',','),'inputmode="'+(['kg','g','Litro','ml'].includes(p.unit)?'decimal':'numeric')+'" data-historic-product="'+esc(productId)+'" data-historic-lot="'+esc(l.id)+'"')+'<small class="lot-brief">Saldo Livre Registrado: '+esc(helpers.quantity(l.remaining)+' '+p.unit)+'</small>';}).join('')+(rows.length>24?'<p class="error">Há mais lotes para este produto. Confira as entradas por lote antes de registrar esta venda antiga.</p>':'')+'</section>';
}
export function readHistoricalChoices(root){const out={};for(const el of root.querySelectorAll('[data-historic-product][data-historic-lot]'))if(!el.closest('.fluid-page-morph-layer,.fluid-exit-layer,.fluid-section-ghost,[inert]')&&el.value.trim()!==''){const quantity=Number(el.value.replace(',','.'));if(quantity===0)continue;const product=el.dataset.historicProduct;(out[product]||=[]).push({lotId:el.dataset.historicLot,quantity});}return out;}
