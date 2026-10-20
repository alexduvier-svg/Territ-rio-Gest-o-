// The saved order is a presentation preference, never an inventory movement.
export function arrangeSalesProducts(products, saved) {
  if (!Array.isArray(saved)) return products.slice();
  const rank = new Map();
  saved.forEach(id => { if (typeof id === 'string' && !rank.has(id)) rank.set(id, rank.size); });
  return products.map((product, index) => ({ product, index }))
    .sort((a, b) => (rank.get(a.product.id) ?? Infinity) - (rank.get(b.product.id) ?? Infinity) || a.index - b.index)
    .map(row => row.product);
}

export function moveSalesProduct(ids, id, index) {
  const result = [...new Set(ids)];
  const from = result.indexOf(id);
  if (from < 0 || !Number.isInteger(index)) return result;
  result.splice(from, 1);
  result.splice(Math.max(0, Math.min(index, result.length)), 0, id);
  return result;
}

export function installSalesOrganization() {
  const bridge = window.TerritorioWorkflowBridge;
  let editing = false, ids = [], chosen = null, drag = null, frame = 0, saving = false;
  const cards = () => [...document.querySelectorAll('body>#app .feira-grid [data-action="sell-product"]')];
  const consume = event => { event.preventDefault(); event.stopImmediatePropagation(); };
  const endDrag = () => {
    if (!drag) return;
    clearTimeout(drag.timer); cancelAnimationFrame(frame); frame = 0;
    drag.card.style.removeProperty('transform'); drag.card.classList.remove('sales-dragging');
    document.querySelectorAll('.sales-drop-target').forEach(el => el.classList.remove('sales-drop-target'));
    try { drag.card.releasePointerCapture(drag.pointerId); } catch {}
    drag = null;
  };
  const paint = () => {
    document.documentElement.classList.toggle('sales-organizing', editing);
    document.getElementById('nav').inert = editing;
    const bar = document.getElementById('sales-organize-bar');
    if (!editing) { bar?.remove(); return; }
    const grid = document.querySelector('body>#app .feira-grid');
    if (!grid) return;
    const list = cards(), map = new Map(list.map(el => [el.dataset.id, el]));
    ids.forEach(id => { if (map.has(id)) grid.appendChild(map.get(id)); });
    list.forEach(el => { el.setAttribute('aria-disabled', 'false'); el.classList.toggle('sales-chosen', el.dataset.id === chosen); el.setAttribute('aria-pressed', String(el.dataset.id === chosen)); });
    if (!bar) {
      const el = document.createElement('section'); el.id = 'sales-organize-bar'; el.className = 'sales-organize-bar';
      el.setAttribute('aria-label', 'Organizar produtos');
      el.innerHTML = '<strong>Organizar produtos</strong><p>Segure e arraste. Ou escolha um card e use as setas.</p><div class="sales-order-movers"><button type="button" data-order="before" aria-label="Mover produto para antes">←</button><span aria-live="polite"></span><button type="button" data-order="after" aria-label="Mover produto para depois">→</button></div><div class="sales-order-actions"><button type="button" data-order="cancel">Cancelar</button><button type="button" data-order="save">Salvar ordem</button></div><button type="button" data-order="default" class="sales-order-default">Restaurar ordem por família</button>';
      document.body.appendChild(el);
    }
    const panel = document.getElementById('sales-organize-bar'), index = ids.indexOf(chosen);
    panel.querySelector('[data-order="before"]').disabled = saving || index <= 0;
    panel.querySelector('[data-order="after"]').disabled = saving || index < 0 || index >= ids.length - 1;
    panel.querySelector('span').textContent = index < 0 ? 'Escolha um produto' : `Posição ${index + 1} de ${ids.length}`;
    panel.querySelector('[data-order="save"]').disabled = saving;
  };
  const stop = () => { endDrag(); editing = false; ids = []; chosen = null; paint(); bridge.render(); };
  const move = (id, index) => { ids = moveSalesProduct(ids, id, index); chosen = id; paint(); };
  const save = async () => {
    if (saving) return;
    saving = true; paint();
    const settings = bridge.data().settings, previous = settings.salesProductOrder;
    settings.salesProductOrder = ids.filter(id => bridge.data().products.some(p => p.id === id));
    if (!bridge.persist()) { settings.salesProductOrder = previous; saving = false; paint(); return bridge.toast('Não foi possível salvar a ordem. Tente novamente.'); }
    const durable = !window.TerritorioNative?.isNative || await window.TerritorioNative.durable();
    saving = false;
    if (!durable) { paint(); return bridge.toast('Gravação pendente. Toque em Salvar ordem novamente.'); }
    stop(); bridge.toast('Ordem dos produtos salva.');
  };
  document.addEventListener('click', event => {
    const open = event.target.closest?.('[data-action="organize-sales"]');
    if (open && bridge.page() === 'Vender') {
      consume(event); window.TerritorioSelection?.cancel(); window.TerritorioProductGestures?.cancelPending();
      editing = true; ids = cards().map(el => el.dataset.id); chosen = null; paint(); return;
    }
    if (!editing) return;
    const control = event.target.closest?.('[data-order]'), card = event.target.closest?.('#app [data-action="sell-product"]');
    if (control) {
      consume(event); endDrag();
      if (saving) return;
      const action = control.dataset.order, index = ids.indexOf(chosen);
      if (action === 'cancel') stop();
      if (action === 'save') void save();
      if (action === 'before' || action === 'after') move(chosen, index + (action === 'before' ? -1 : 1));
      if (action === 'default') { ids = window.TerritorioStockOrder.orderStockProducts(bridge.data().products).map(p => p.id); paint(); }
    } else if (card) { consume(event); chosen = card.dataset.id; paint(); }
  }, true);
  document.addEventListener('keydown', event => {
    if (!editing) return;
    if (event.key === 'Escape') { consume(event); stop(); return; }
    const card = event.target.closest?.('#app [data-action="sell-product"]');
    if (card && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      consume(event); const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[event.key];
      move(card.dataset.id, ids.indexOf(card.dataset.id) + offset); card.focus();
    }
  }, true);
  document.addEventListener('pointerdown', event => {
    if (!editing || saving || event.button !== 0) return;
    const card = event.target.closest?.('#app [data-action="sell-product"]'); if (!card) return;
    endDrag();
    drag = { card, pointerId: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, scroll: window.scrollY, active: false, target: null };
    drag.timer = setTimeout(() => {
      if (!drag) return;
      drag.active = true; chosen = card.dataset.id; card.classList.add('sales-dragging');
      card.setPointerCapture(event.pointerId); window.TerritorioHaptics?.tick();
    }, 260);
  }, true);
  document.addEventListener('pointermove', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.active) { if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 10) endDrag(); return; }
    event.preventDefault(); drag.lastX = event.clientX; drag.lastY = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0; if (!drag?.active) return;
      const { lastX: x, lastY: y } = drag;
      if (y < 80) window.scrollBy(0, -24); else if (y > innerHeight - 240) window.scrollBy(0, 24);
      drag.card.style.transform = `translate3d(${x - drag.x}px,${y - drag.y + window.scrollY - drag.scroll}px,0) scale(1.04)`;
      const target = document.elementFromPoint(x,y)?.closest?.('.feira-grid [data-action="sell-product"]');
      document.querySelectorAll('.sales-drop-target').forEach(el => el.classList.remove('sales-drop-target'));
      drag.target = target?.dataset.id || null; target?.classList.add('sales-drop-target');
    });
  }, { passive: false });
  document.addEventListener('pointerup', event => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const id = drag.card.dataset.id, target = drag.target, active = drag.active;
    endDrag(); if (active && target) move(id, ids.indexOf(target));
  }, true);
  document.addEventListener('pointercancel', endDrag, true);
  new MutationObserver(() => {
    if (!editing) return;
    if (bridge.page() !== 'Vender') { endDrag(); editing = false; paint(); } else paint();
  }).observe(document.getElementById('app'), { childList: true });
  window.TerritorioSalesOrganization = { active: () => editing, cancel: () => { if (!editing) return false; stop(); return true; } };
}
