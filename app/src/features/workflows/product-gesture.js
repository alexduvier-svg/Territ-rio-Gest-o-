// A sale opens on the first activation. A second physical tap at the same point
// reverses only the untouched UI draft and opens stock. No waiting timer delays sale.
export function installProductGesture(bridge, { source, restoreSource } = {}) {
  let preview=null;
  const clear=()=>{preview=null;};
  window.TerritorioProductGestures={suspend(){},cancelPending:clear};
  const click=event=>{
    const physical=event.isTrusted&&event.detail>0;
    const card=event.target.closest?.('body>#app [data-action="sell-product"]');
    if(preview){
      const old=preview;clear();
      const double=physical&&performance.now()-old.at<320&&Math.hypot(event.clientX-old.x,event.clientY-old.y)<24;
      if(double&&old.undo?.()){
        event.preventDefault();event.stopImmediatePropagation();restoreSource?.(old.source);
        bridge.actions['stock-peek']({id:old.id});return;
      }
    }
    if(!card||card.disabled||bridge.page()!=='Vender'||window.TerritorioSelection?.active())return;
    event.preventDefault();event.stopImmediatePropagation();
    const id=card.dataset.id;
    if(card.getAttribute('aria-disabled')==='true'){if(physical)preview={id,at:performance.now(),x:event.clientX,y:event.clientY,source:source?.(),undo:()=>true};bridge.actions['sell-product']({id});return;}
    const origin=source?.(),at=performance.now();
    const undo=bridge.openSalePreview(id);
    if(physical&&undo)preview={id,at,x:event.clientX,y:event.clientY,source:origin,undo};
  };
  document.addEventListener('click',click,true);
  document.addEventListener('pointercancel',clear,{passive:true});
  document.addEventListener('visibilitychange',clear);
  document.addEventListener('keydown',event=>{
    const card=event.target.closest?.('body>#app [data-action="sell-product"]');
    if(card&&(event.key==='ContextMenu'||event.shiftKey&&event.key==='Enter')){
      event.preventDefault();event.stopImmediatePropagation();clear();bridge.actions['stock-peek']({id:card.dataset.id});
    }
  },true);
}
