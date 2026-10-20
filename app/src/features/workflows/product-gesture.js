// The first tap responds immediately. Further taps reverse only its untouched
// preview; no timer delays checkout and no gesture commits a sale.
export function installProductGesture(bridge, { source, restoreSource } = {}) {
  let pending = null;
  const clear = () => { pending = null; };
  const consume = event => { event.preventDefault(); event.stopImmediatePropagation(); return true; };
  const remember = (event, state) => { pending = { ...state, at: performance.now(), x: event.clientX, y: event.clientY }; };
  const handleClick = (event, card) => {
    if (window.TerritorioSalesOrganization?.active()) { clear(); return false; }
    const physical = event.isTrusted && event.detail > 0;
    const old = pending; clear();
    const again = old && physical && performance.now() - old.at < 340 && Math.hypot(event.clientX - old.x, event.clientY - old.y) < 24;
    if (again) {
      if (old.stage === 1 && old.undo?.()) {
        consume(event); restoreSource?.(old.source);
        window.TerritorioSelection?.begin(old.id);
        remember(event, { ...old, stage: 2 });
        return true;
      }
      if (old.stage === 2 && bridge.page() === 'Vender') {
        consume(event);
        window.TerritorioSelection?.restore(old.selection || []);
        restoreSource?.(old.source);
        bridge.actions['stock-peek']({ id: old.id });
        return true;
      }
      if (old.stage === 'selection' && bridge.page() === 'Vender') {
        consume(event); remember(event, { ...old, stage: 2 }); return true;
      }
    }
    if (!card || card.disabled || bridge.page() !== 'Vender') return false;
    const id = card.dataset.id;
    if (window.TerritorioSelection?.active()) {
      // MultiSell performs the first toggle. Retain the prior selection so a
      // triple tap cannot discard products that were already selected.
      if (physical) remember(event, { id, stage: 'selection', source: source?.(), selection: window.TerritorioSelection.snapshot() });
      return false;
    }
    consume(event);
    const origin = source?.(), undo = bridge.openQuickCartPreview(id);
    if (physical && undo) remember(event, { id, stage: 1, source: origin, selection: [], undo });
    return true;
  };
  // MultiSell calls this before its own capture handler, including clicks now
  // targeting the checkout overlay rather than the original product card.
  window.TerritorioProductGestures = { suspend() {}, cancelPending: clear, handleClick };
  document.addEventListener('pointercancel', clear, { passive: true });
  document.addEventListener('visibilitychange', clear);
  document.addEventListener('keydown', event => {
    const card = event.target.closest?.('body>#app [data-action="sell-product"]');
    if (card && !window.TerritorioSalesOrganization?.active() && (event.key === 'ContextMenu' || event.shiftKey && event.key === 'Enter')) {
      event.preventDefault(); event.stopImmediatePropagation(); clear();
      bridge.actions['stock-peek']({ id: card.dataset.id });
    }
  }, true);
}
