import {Capacitor} from '@capacitor/core';
import {Share} from '@capacitor/share';
import {printActor,printProducts,printOffer,printFingerprint,selectAllProducts,PRINT_LIMIT} from './model.js';
import {offerText} from './text.js';
import {productOutline} from '../product-outline.js';
import './print.css';
const b=()=>window.TerritorioWorkflowBridge;
let selected=new Set(),query='',limit=24,owner='',busy=false,preview=null;
const esc=s=>b().escape(s),btn=(...args)=>b().button(...args);
const theme=()=>document.documentElement.dataset.theme||'light';
const available=()=>printProducts(b().data(),p=>b().description(p));
function open(){preview=null;owner=printActor(b().data());selected=new Set();query='';limit=24;paint();}
function rows(){return available().filter(p=>(p.name+' '+p.label+' '+p.category).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));}
function list(){const all=rows(),shown=all.slice(0,limit);return shown.map(p=>'<label class="print-product-row'+(p.available<=0?' is-unavailable':'')+'"><input type="checkbox" data-print-product="'+esc(p.productId)+'"'+(p.available<=0?' disabled':'')+(selected.has(p.productId)?' checked':'')+'>'+productOutline(p)+'<span><strong>'+esc(p.name)+'</strong><small>'+esc(p.label||p.unit)+'</small><small>'+b().money(p.price)+' · '+(p.available>0?'Disponível':'Sem Estoque Disponível')+'</small></span></label>').join('')+(all.length>shown.length?btn('print-more','Mostrar Mais','choice modal-action'):'')+(!all.length?'<p class="small muted">Nenhum produto encontrado.</p>':'');}
function paint(){b().open('Lista de Produtos','<p class="dialog-text">Escolha até '+PRINT_LIMIT+' produtos do estoque disponível para enviar em texto ou conferir na tela.</p><div class="print-search-group"><label for="print-search">Buscar Produto</label><input id="print-search" type="search" autocomplete="off" value="'+esc(query)+'" placeholder="Ex.: café, banana, tâmara"></div><label class="print-select-all"><input id="print-select-all" type="checkbox"><span>Selecionar Tudo</span></label><p class="print-selection-help">Marque uma ou mais opções.</p><p id="print-selection-feedback" class="error" role="alert" hidden></p><p id="print-selected-count" class="small" role="status"></p><div id="print-products">'+list()+'</div>',btn('print-preview','Conferir Lista','success',null,selected.size===0)+btn('close-modal','Voltar','sheet-back'),'print-select');count();}
function count(){const node=document.getElementById('print-selected-count');if(node)node.textContent=selected.size+' / '+PRINT_LIMIT+' selecionados';const button=document.querySelector('#dialog [data-action="print-preview"]');if(button)button.disabled=!selected.size||busy;const all=document.getElementById('print-select-all');if(all){const ids=rows().filter(p=>p.available>0).map(p=>p.productId),chosen=ids.filter(id=>selected.has(id)).length;all.checked=ids.length>0&&chosen===ids.length;all.indeterminate=chosen>0&&chosen<ids.length;all.disabled=ids.length===0;}}
function feedback(message=''){const el=document.getElementById('print-selection-feedback');if(el){el.hidden=!message;el.textContent=message;}}
function generate(){
 if(busy)return;if(owner!==printActor(b().data()))throw Error('O produtor mudou. Reabra o envio.');
 preview=printOffer(b().data(),selected,{description:p=>b().description(p),theme:theme()});
 const offer=preview,at=new Date(offer.at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
 b().open('Conferir Lista','<p class="print-manual-note">Para enviar como imagem, use a captura de tela do celular. Se a lista for longa, role para capturar o restante.</p><section id="print-preview-list" aria-label="Produtos disponíveis"><header class="print-list-heading"><h3>'+esc(offer.brand)+'</h3><p>Produtos Disponíveis</p><small>Atualizada em '+esc(at)+'</small></header>'+offer.items.map(p=>'<article class="print-product-row print-preview-row">'+productOutline(p)+'<span><span class="print-list-headline"><strong>'+esc(p.name)+'</strong><b>'+b().money(p.price)+'</b></span><small>'+esc(p.label||p.unit)+'</small><small class="print-available">Disponível</small></span></article>').join('')+'<p class="small muted">Para pedir, responda com o produto e a quantidade. O produtor confirma a disponibilidade.</p></section>',btn('print-share','Enviar Texto','success')+btn('print-edit','Mudar Produtos','choice')+btn('close-modal','Voltar','sheet-back'),'print-preview');
}
async function share(){
 if(window.TerritorioWorkspace?.active)throw Error('Envios ficam disponíveis fora do Modo Teste.');
 if(busy||!preview)return;let fresh;try{fresh=printOffer(b().data(),selected,{description:p=>b().description(p),theme:theme()});}catch(error){preview=null;const valid=new Set(available().filter(p=>p.available>0).map(p=>p.productId));selected=new Set([...selected].filter(id=>valid.has(id)));paint();feedback(error.message);return;}
 if(owner!==fresh.actor)throw Error('O produtor mudou. Reabra o envio.');if(printFingerprint(fresh)!==printFingerprint(preview)){generate();b().toast('A lista mudou. Confira os produtos atualizados antes de enviar.');return;}
 busy=true;try{
  const payload={title:'Produtos Disponíveis',text:offerText(preview)};
  if(Capacitor.isNativePlatform())await Share.share({...payload,dialogTitle:'Enviar Lista de Produtos'});
  else if(navigator.share)await navigator.share(payload);
  else b().open('Copiar Lista','<p class="dialog-text">Copie o texto e cole na conversa com o cliente.</p><label for="print-copy-text">Lista de Produtos</label><textarea id="print-copy-text" readonly rows="12">'+esc(payload.text)+'</textarea>',btn('print-copy','Copiar Texto','success')+btn('close-modal','Voltar','sheet-back'),'print-copy');
 }catch(error){if(error.name!=='AbortError'&&!/cancel/i.test(error.message))throw error;}finally{busy=false;}
}
export function installPrintList(){
 const safe=fn=>async(...args)=>{try{return await fn(...args);}catch(error){b().toast(error.message);}};
 Object.assign(b().actions,{'print-list':open,'print-preview':safe(generate),'print-share':safe(share),'print-edit':()=>{preview=null;paint();},'print-more':()=>{limit+=24;document.getElementById('print-products').innerHTML=list();count();},'print-copy':safe(async()=>{const field=document.getElementById('print-copy-text');field.focus();field.select();if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(field.value);b().toast('Lista copiada. Cole no WhatsApp.');}else b().toast('Texto selecionado. Use Copiar no celular.');})});
 document.addEventListener('change',event=>{if(event.target.id==='print-select-all'){try{selected=selectAllProducts(selected,rows(),event.target.checked);feedback();}catch(error){feedback(error.message);}document.getElementById('print-products').innerHTML=list();count();return;}const id=event.target.dataset?.printProduct;if(!id)return;feedback();if(event.target.checked){if(selected.size>=PRINT_LIMIT){event.target.checked=false;feedback('Escolha até '+PRINT_LIMIT+' produtos por envio.');return;}selected.add(id);}else selected.delete(id);count();});
 document.addEventListener('input',event=>{if(event.target.id==='print-search'){query=event.target.value;limit=24;document.getElementById('print-products').innerHTML=list();feedback();count();}});
 const dialog=document.getElementById('dialog');new MutationObserver(()=>{if(!dialog.open)preview=null;}).observe(dialog,{attributes:true,attributeFilter:['open']});
 window.TerritorioPrintList={offer:()=>preview,text:()=>preview?offerText(preview):'',open};
}
