// Code-native vector, no bitmap/model or animation loop. Decorative inside the product control.
export function restockSymbol(){return '<svg class="restock-symbol" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 16A19 19 0 0 1 40 11M40 11l-1-8m1 8-8-1M41 32A19 19 0 0 1 8 37m0 0 1 8m-1-8 8 1"/></svg>';}

// Decorations never participate in layout. Place them once after render/resize/font load,
// in actual blank space, without resizing the card or running an idle animation.
export function installRestockSymbols(){
 const app=document.getElementById('app');let pending=false;
 function place(){pending=false;const writes=[];
  for(const card of app.querySelectorAll('.feira-card,.feira-row')){
   const symbols=[...card.querySelectorAll('.restock-symbol,.product-outline')].sort((a,b)=>Number(b.matches('.restock-symbol'))-Number(a.matches('.restock-symbol')));if(!symbols.length)continue;
   const bounds=card.getBoundingClientRect(),scale=bounds.width/card.offsetWidth;if(!scale||!bounds.height)continue;
   const text=[];const walker=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent.trim()||node.parentElement.closest('svg,.glass-touch-light,agro-touch-light'))continue;const range=document.createRange();range.selectNodeContents(node);for(const r of range.getClientRects())if(r.width&&r.height)text.push({left:(r.left-bounds.left)/scale,top:(r.top-bounds.top)/scale,right:(r.right-bounds.left)/scale,bottom:(r.bottom-bounds.top)/scale});}
   for(const icon of card.querySelectorAll('svg:not(.restock-symbol):not(.product-outline),.icon,input,select')){const r=icon.getBoundingClientRect();if(r.width&&r.height)text.push({left:(r.left-bounds.left)/scale,top:(r.top-bounds.top)/scale,right:(r.right-bounds.left)/scale,bottom:(r.bottom-bounds.top)/scale});}
   const detail=card.querySelector('.card-detail,.fr-main small'),d=detail?.getBoundingClientRect(),label=card.querySelector('.card-out,.sale-price'),l=label?.getBoundingClientRect();
   for(const symbol of symbols){let spot=null;
   for(const size of symbol.matches('.product-outline')?[22,18,14]:[16,12]){
    const maxX=card.clientWidth-size-10,maxY=card.clientHeight-size-10;
    const trySpot=(x,y)=>{if(x<10||y<10||x>maxX||y>maxY)return false;if(text.some(r=>!(x+size+2<=r.left||x-2>=r.right||y+size+2<=r.top||y-2>=r.bottom)))return false;spot={x,y,size};return true;};
    if(d){trySpot(maxX,(d.top-bounds.top)/scale);if(!spot&&l)trySpot((card.offsetWidth-size)/2,((d.bottom-bounds.top)/scale+(l.top-bounds.top)/scale-size)/2);}
    // Prefer near the description, then any existing blank space. Never create a row.
    if(!spot)search:for(let y=10;y<=maxY;y+=4)for(let x=maxX;x>=10;x-=4)if(trySpot(x,y))break search;
    if(spot)break;
   }
   writes.push({symbol,spot});
   if(spot)text.push({left:spot.x,top:spot.y,right:spot.x+spot.size,bottom:spot.y+spot.size});
   }
  }
  for(const {symbol,spot} of writes){symbol.style.visibility=spot?'visible':'hidden';if(spot){symbol.style.left=spot.x+'px';symbol.style.top=spot.y+'px';symbol.style.width=spot.size+'px';symbol.style.height=spot.size+'px';}}
 }
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(place);}};
 new MutationObserver(records=>{if(records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('.restock-symbol,.product-outline')||n.querySelector('.restock-symbol,.product-outline')))))schedule();}).observe(app,{childList:true,subtree:true});
 window.addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);document.fonts?.addEventListener('loadingdone',schedule);schedule();
}
