import {Capacitor} from '@capacitor/core';
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {printActor,printProducts,printOffer,printFingerprint,PRINT_LIMIT} from './model.js';
import {renderPrintImages} from './image.js';
import {productOutline} from '../product-outline.js';
import './print.css';
const b=()=>window.TerritorioWorkflowBridge;
let selected=new Set(),query='',limit=24,owner='',busy=false,preview=null,urls=[],generation=0;
const esc=s=>b().escape(s),btn=(...args)=>b().button(...args);
const theme=()=>document.documentElement.dataset.theme||'light';
const available=()=>printProducts(b().data(),p=>b().description(p));
function revoke(){for(const url of urls)URL.revokeObjectURL(url);urls=[];preview=null;}
function open(){revoke();owner=printActor(b().data());selected=new Set();query='';limit=24;paint();}
function rows(){return available().filter(p=>(p.name+' '+p.label+' '+p.category).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));}
function list(){const all=rows(),shown=all.slice(0,limit);return shown.map(p=>'<label class="print-product-row'+(p.available<=0?' is-unavailable':'')+'"><input type="checkbox" data-print-product="'+esc(p.productId)+'"'+(p.available<=0?' disabled':'')+(selected.has(p.productId)?' checked':'')+'>'+productOutline(p)+'<span><strong>'+esc(p.name)+'</strong><small>'+esc(p.label||p.unit)+'</small><small>'+b().money(p.price)+' · '+(p.available>0?'Disponível':'Sem Estoque Disponível')+'</small></span></label>').join('')+(all.length>shown.length?btn('print-more','Mostrar Mais','choice modal-action'):'')+(!all.length?'<p class="small muted">Nenhum produto encontrado.</p>':'');}
function paint(){b().open('Enviar por Print','<p class="dialog-text">Escolha até '+PRINT_LIMIT+' produtos. A imagem usa o estoque registrado neste aparelho: nome, apresentação, preço e disponibilidade, sem expor seu saldo interno ou custos.</p><label for="print-search">Buscar Produto</label><input id="print-search" type="search" autocomplete="off" value="'+esc(query)+'" placeholder="Ex.: café, banana, tâmara"><p class="small muted">'+btn('print-select-visible','Selecionar Disponíveis Exibidos','choice')+'</p><p id="print-selected-count" class="small" role="status">'+selected.size+' selecionados</p><div id="print-products">'+list()+'</div>',btn('print-preview','Gerar Imagem','success',null,selected.size===0)+btn('close-modal','Voltar','sheet-back'),'print-select');}
function count(){const node=document.getElementById('print-selected-count');if(node)node.textContent=selected.size+' / '+PRINT_LIMIT+' selecionados';const button=document.querySelector('[data-action="print-preview"]');if(button)button.disabled=!selected.size||busy;}
async function generate(){
 if(busy)return;const revision=++generation;if(owner!==printActor(b().data()))throw Error('O produtor mudou. Reabra o envio.');busy=true;count();
 try{
  const offer=printOffer(b().data(),selected,{description:p=>b().description(p),theme:theme()}),blobs=await renderPrintImages(offer);
  if(revision!==generation||!['print-select','print-preview'].includes(b().modal()?.kind))return;
  if(owner!==printActor(b().data()))throw Error('O produtor mudou. Reabra o envio.');
  revoke();preview={offer,blobs};urls=blobs.map(blob=>URL.createObjectURL(blob));
  b().open('Conferir Imagem','<p class="dialog-text">'+offer.items.length+' produtos · '+blobs.length+' '+(blobs.length===1?'imagem':'imagens')+'.</p><p class="small muted">Escolha um ou vários destinatários no WhatsApp. Eles não precisam estar cadastrados no AGRO. Cada envio será confirmado por você.</p>'+urls.map((url,index)=>'<img class="print-preview-image" src="'+url+'" alt="Lista de produtos, imagem '+(index+1)+' de '+blobs.length+'">').join(''),btn('print-share','Compartilhar Imagem','success')+btn('print-edit','Mudar Produtos','choice')+btn('close-modal','Voltar','sheet-back'),'print-preview');
 }finally{busy=false;count();}
}
async function clearOldImages(){
 try{const {files}=await Filesystem.readdir({path:'agro-lista',directory:Directory.Cache});for(const file of files)if(/^[a-f0-9-]{36}\.jpg$/i.test(file.name)&&Number.isFinite(file.mtime)&&file.mtime<Date.now()-86400000)await Filesystem.deleteFile({path:'agro-lista/'+file.name,directory:Directory.Cache});}catch{/* The cache may be empty or already reclaimed by Android. */}
}
async function share(){
 if(busy||!preview)return;let fresh;try{fresh=printOffer(b().data(),selected,{description:p=>b().description(p),theme:theme()});}catch(error){revoke();const valid=new Set(available().filter(p=>p.available>0).map(p=>p.productId));selected=new Set([...selected].filter(id=>valid.has(id)));paint();b().toast(error.message);return;}
 if(owner!==fresh.actor)throw Error('O produtor mudou. Reabra o envio.');if(printFingerprint(fresh)!==printFingerprint(preview.offer)){await generate();b().toast('A lista mudou. Confira a imagem atualizada antes de compartilhar.');return;}
 busy=true;try{
  const files=preview.blobs.map((blob,i)=>new File([blob],'AGRO-Produtos-'+new Date(preview.offer.at).toISOString().slice(0,10)+'-'+(i+1)+'.jpg',{type:'image/jpeg'}));
  const title='Produtos Disponíveis',text='Escolha os produtos da imagem e responda com o nome e a quantidade. Eu confirmo a disponibilidade.';
  if(Capacitor.isNativePlatform()){
   await clearOldImages();const uris=[];for(const file of files){const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const saved=await Filesystem.writeFile({path:'agro-lista/'+crypto.randomUUID()+'.jpg',data,directory:Directory.Cache,recursive:true});uris.push(saved.uri);}
   await Share.share({title,text,files:uris,dialogTitle:'Enviar para um ou Vários Clientes'});
  }else if(navigator.canShare?.({files}))await navigator.share({title,text,files});else for(const file of files){const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
 }catch(error){if(error.name!=='AbortError'&&!/cancel/i.test(error.message))throw error;}finally{busy=false;}
}
export function installPrintList(){
 const safe=fn=>async(...args)=>{try{return await fn(...args);}catch(error){b().toast(error.message);}};
 Object.assign(b().actions,{'print-list':open,'print-preview':safe(generate),'print-share':safe(share),'print-edit':()=>{revoke();paint();},'print-more':()=>{limit+=24;document.getElementById('print-products').innerHTML=list();},'print-select-visible':()=>{for(const p of rows().slice(0,limit))if(p.available>0&&selected.size<PRINT_LIMIT)selected.add(p.productId);document.getElementById('print-products').innerHTML=list();count();}});
 document.addEventListener('change',event=>{const id=event.target.dataset?.printProduct;if(!id)return;if(event.target.checked){if(selected.size>=PRINT_LIMIT){event.target.checked=false;b().toast('Escolha até '+PRINT_LIMIT+' produtos por envio.');return;}selected.add(id);}else selected.delete(id);count();});
 document.addEventListener('input',event=>{if(event.target.id==='print-search'){query=event.target.value;limit=24;document.getElementById('print-products').innerHTML=list();}});
 document.addEventListener('territorio:sheet',()=>{if(preview&&b().modal()?.kind!=='print-preview')revoke();});
 const dialog=document.getElementById('dialog');new MutationObserver(()=>{if(!dialog.open){generation++;if(preview)revoke();}}).observe(dialog,{attributes:true,attributeFilter:['open']});
 window.TerritorioPrintList={offer:()=>preview?.offer,files:()=>preview?.blobs||[],open};
}
