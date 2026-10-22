// Code-native vector, no bitmap/model or animation loop. Decorative inside the product control.
export function restockSymbol(){return '<svg class="restock-symbol" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 16A19 19 0 0 1 40 11M40 11l-1-8m1 8-8-1M41 32A19 19 0 0 1 8 37m0 0 1 8m-1-8 8 1"/></svg>';}

// Decorations never participate in layout. Place them once after render/resize/font load,
// in actual blank space, without resizing the card or running an idle animation.
export function installRestockSymbols(){
 const app=document.getElementById('app');let pending=false;
 function place(){pending=false;const writes=[];
  for(const symbol of app.querySelectorAll('.restock-symbol')){
   const card=symbol.closest('.feira-card,.feira-row');if(!card)continue;
   const bounds=card.getBoundingClientRect(),scale=bounds.width/card.offsetWidth;if(!scale||!bounds.height)continue;
   const text=[];const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim()||node.parentElement.closest('svg,.glass-touch-light,agro-touch-light'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height)text.push({left:(r.left-bounds.left)/scale,top:(r.top-bounds.top)/scale,right:(r.right-bounds.left)/scale,bottom:(r.bottom-bounds.top)/scale});}
   for(const icon of card.querySelectorAll('svg:not(.restock-symbol),.icon,input,select')){const r=icon.getBoundingClientRect();if(r.width&&r.height)text.push({left:(r.left-bounds.left)/scale,top:(r.top-bounds.top)/scale,right:(r.right-bounds.left)/scale,bottom:(r.bottom-bounds.top)/scale});}
   const detail=card.querySelector('.card-detail,.fr-main small'),d=detail?.getBoundingClientRect(),label=card.querySelector('.card-out,.sale-price'),l=label?.getBoundingClientRect();let spot=null;
   for(const size of [16,12]){
    const maxX=card.clientWidth-size-10,maxY=card.clientHeight-size-10,candidates=[];
    if(d){candidates.push([maxX,(d.top-bounds.top)/scale]);if(l)candidates.push([(card.offsetWidth-size)/2,((d.bottom-bounds.top)/scale+(l.top-bounds.top)/scale-size)/2]);}
    // Prefer near the description, then any existing blank space. Never create a row.
    for(let y=10;y<=maxY;y+=4)for(let x=maxX;x>=10;x-=4)candidates.push([x,y]);
    for(const [x,y] of candidates){if(x<10||y<10||x>maxX||y>maxY)continue;if(text.every(r=>x+size+2<=r.left||x-2>=r.right||y+size+2<=r.top||y-2>=r.bottom)){spot={x,y,size};break;}}
    if(spot)break;
   }
   writes.push({symbol,spot});
  }
  for(const {symbol,spot} of writes){symbol.style.visibility=spot?'visible':'hidden';if(spot){symbol.style.left=spot.x+'px';symbol.style.top=spot.y+'px';symbol.style.width=spot.size+'px';symbol.style.height=spot.size+'px';}}
 }
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(place);}};
 new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('.restock-symbol')||n.querySelector('.restock-symbol')))))schedule();}).observe(app,{childList:true,subtree:true});
 window.addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);schedule();
}
