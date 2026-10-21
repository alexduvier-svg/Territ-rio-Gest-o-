// Resolve the gesture before opening a surface. A double tap never renders a
// sale/checkout preview; the card's existing press feedback stays immediate.
export const PRODUCT_TAP_MS = 280;

export function installProductGesture(bridge, {
  source, restoreSource,
  clock = { now: () => performance.now(), set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) },
} = {}) {
  let pending = null;
  const clear = () => { if (pending) clock.clear(pending.timer); pending = null; };
  const consume = event => { event.preventDefault(); event.stopImmediatePropagation(); return true; };
  const near = (event, old) => Math.hypot(event.clientX - old.x, event.clientY - old.y) < 24;
  const organizing = () => window.TerritorioSalesOrganization?.active();
  const expire = (entry, delay, run) => {
    clock.clear(entry.timer);
    entry.timer = clock.set(() => { if (pending !== entry) return; clear(); run?.(); }, delay);
  };
  const suspend = (event, card) => {
    if (!pending) return;
    if (!card || card.dataset.id !== pending.id || clock.now() - pending.at > PRODUCT_TAP_MS || !near(event, pending)) return clear();
    // A second finger-down within the window must not let the sale open while
    // that finger is still down. A hold/scroll can then cancel the whole tap.
    clock.clear(pending.timer); pending.pressed = true;
  };
  const handleClick = (event, card) => {
    if (organizing()) { clear(); return false; }
    const physical = event.isTrusted && event.detail > 0;
    const old = pending; clear();
    const again = old && physical && card?.dataset.id === old.id && near(event, old) && (old.pressed || clock.now() - old.at <= PRODUCT_TAP_MS);
    if (again && bridge.page() === 'Vender') {
      consume(event);
      if (old.stage === 'selection') window.TerritorioSelection?.restore(old.selection);
      restoreSource?.(old.source);
      bridge.actions['stock-peek']({ id: old.id });
      return true;
    }
    if (!card || card.disabled || bridge.page() !== 'Vender') return false;
    const id = card.dataset.id, origin = source?.();
    if (window.TerritorioSelection?.active()) {
      // MultiSell toggles the first tap. A double restores the previous list.
      if (physical) {
        pending = { id, stage: 'selection', source: origin, at: clock.now(), x: event.clientX, y: event.clientY, selection: window.TerritorioSelection.snapshot() };
        expire(pending, PRODUCT_TAP_MS);
      }
      return false;
    }
    consume(event);
    if (!physical) { bridge.actions['sell-product']({ id }); return true; }
    const entry = pending = { id, stage: 'sale', source: origin, at: clock.now(), x: event.clientX, y: event.clientY, modal: bridge.modal?.() };
    expire(entry, PRODUCT_TAP_MS, () => {
      if (bridge.page() !== 'Vender' || organizing() || window.TerritorioSelection?.active() || bridge.modal?.() !== entry.modal) return;
      restoreSource?.(entry.source);
      // Use the quantity screen, with no default quantity and no checkout.
      bridge.actions['sell-product']({ id });
    });
    return true;
  };
  window.TerritorioProductGestures = { suspend, cancelPending: clear, handleClick };
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest?.('[data-action="sell-product"],.selling-card,.product-card,.feira-card')) clear();
  }, { capture: true, passive: true });
  document.addEventListener('pointermove', event => { if (pending?.pressed && Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > 10) clear(); }, { passive: true });
  document.addEventListener('pointerup', () => { if (pending?.pressed) expire(pending, 400); }, { passive: true });
  document.addEventListener('pointercancel', clear, { passive: true });
  document.addEventListener('visibilitychange', clear);
  document.addEventListener('keydown', event => {
    clear();
    const card = event.target.closest?.('body>#app [data-action="sell-product"]');
    if (card && !organizing() && (event.key === 'ContextMenu' || event.shiftKey && event.key === 'Enter')) {
      event.preventDefault(); event.stopImmediatePropagation();
      bridge.actions['stock-peek']({ id: card.dataset.id });
    }
  }, true);
}
