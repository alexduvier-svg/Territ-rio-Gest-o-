// Segurar e arrastar para mudar a ordem dos produtos, em Vender (cartões) e no Estoque (linhas).
// Segurar 0,45 s levanta o cartão (vibração leve, sombra e um pouco maior); ao arrastar, os outros
// cartões da mesma família abrem espaço deslizando, e ao soltar ele assenta no lugar novo. A ordem
// fica nos dados do app (model.data.productOrder, incluída no backup) e vale em todas as listas
// que seguem a ordem do estoque. Um produto só troca de lugar dentro da própria família, para que
// famílias nunca se misturem. Os movimentos usam o motor de aberturas (compositor).
import { animate, SPRINGS, motionOf } from './motion/engine.js';
import { fluidMotionLite } from './motion/index.js';

const HOLD_MS = 450;
const SLOP = 10;
const ITEM = '#app .feira-grid > .feira-card[data-action="sell-product"], #app .feira-rows > .feira-row[data-action="stock-product"]';
const bridge = () => window.TerritorioWorkflowBridge;
const order = () => window.TerritorioStockOrder;
const tick = () => window.TerritorioHaptics ? window.TerritorioHaptics.tick() : navigator.vibrate?.(10);
const product = id => bridge()?.data()?.products?.find(p => p.id === id);
const springOf = () => fluidMotionLite() ? SPRINGS.lite : SPRINGS.tab;

let hold = null;   // waiting for the long press
let drag = null;   // a lifted item
let swallowUntil = 0;

const scopeOf = item => item.closest('.workflow-stock-family') || item.parentElement;

function groupOf(item) {
  const key = order()?.stockGroupKey(product(item.dataset.id) || {});
  return [...scopeOf(item).querySelectorAll(item.matches('.feira-row') ? '.feira-rows > .feira-row[data-action="stock-product"]' : ':scope > .feira-card[data-action="sell-product"]')]
    .filter(el => el.getClientRects().length && order()?.stockGroupKey(product(el.dataset.id) || {}) === key);
}

function lift(item, x, y) {
  const group = groupOf(item);
  if (group.length < 2) return false;
  window.TerritorioProductGestures?.cancelPending();
  const scrollY = window.scrollY;
  const slots = group.map(el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, w: r.width, h: r.height }; });
  const from = group.indexOf(item);
  drag = { item, group, slots, from, target: from, startX: x, startY: y + scrollY, x, y, scrollY, frame: 0, ended: false };
  item.classList.add('reorder-lifted');
  scopeOf(item).classList.add('reorder-active');
  document.documentElement.classList.add('reorder-dragging');
  tick();
  animate(item, { from: { scale: motionOf(item)?.now().pose.scale ?? 1 }, to: { scale: fluidMotionLite() ? 1.03 : 1.06 }, spring: SPRINGS.press, persist: true });
  return true;
}

// Where every item of the group stands when the lifted one is placed at `target`.
function layout(target) {
  const { group, from } = drag;
  const rest = group.filter((_, i) => i !== from);
  rest.splice(target, 0, group[from]);
  return rest;
}

function shift(target) {
  const arranged = layout(target), spring = springOf();
  arranged.forEach((el, slot) => {
    if (el === drag.item) return;
    const home = drag.slots[drag.group.indexOf(el)], place = drag.slots[slot];
    const to = { x: place.x - home.x, y: place.y - home.y };
    const now = motionOf(el)?.now().pose || { x: 0, y: 0 };
    animate(el, { from: { x: now.x ?? 0, y: now.y ?? 0 }, to, spring, persist: true });
  });
}

function nearest(pageX, pageY) {
  let best = drag.target, distance = Infinity;
  drag.slots.forEach((s, i) => {
    const d = Math.hypot(pageX - (s.x + s.w / 2), pageY - (s.y + s.h / 2));
    if (d < distance) { distance = d; best = i; }
  });
  return best;
}

function follow() {
  if (!drag || drag.ended) return;
  const pageY = drag.y + window.scrollY;
  drag.item.style.translate = `${(drag.x - drag.startX).toFixed(1)}px ${(pageY - drag.startY).toFixed(1)}px`;
  const center = drag.slots[drag.from];
  const target = nearest(center.x + center.w / 2 + drag.x - drag.startX, center.y + center.h / 2 + pageY - drag.startY);
  if (target !== drag.target) { drag.target = target; shift(target); tick(); }
}

// Near the top or bottom of the screen the page scrolls by itself, so a product can travel far.
function autoscroll() {
  if (!drag || drag.ended) return;
  const edge = 96, bottom = innerHeight - 150;
  const speed = drag.y < edge ? -(edge - drag.y) / 6 : drag.y > bottom ? (drag.y - bottom) / 6 : 0;
  if (speed) { window.scrollBy(0, Math.max(-14, Math.min(14, speed))); follow(); }
  drag.frame = requestAnimationFrame(autoscroll);
}

function commit(arranged) {
  const b = bridge(), data = b?.data();
  if (!data || !order()) return;
  const key = order().stockGroupKey(product(arranged[0].dataset.id) || {});
  const family = order().orderStockProducts(data.products).filter(p => order().stockGroupKey(p) === key).map(p => p.id);
  const moved = arranged.map(el => el.dataset.id), visible = new Set(moved);
  let next = 0;
  // Products of the family that are not on screen (filtered, or inside "Mais") keep their places.
  const full = family.map(id => visible.has(id) ? moved[next++] : id);
  const familySet = new Set(full);
  const previous = Array.isArray(data.productOrder?.ids) ? data.productOrder.ids : [];
  data.productOrder = { version: 1, updatedAt: new Date().toISOString(), ids: [...previous.filter(id => !familySet.has(id) && data.products.some(p => p.id === id)), ...full] };
  order().setManualOrder(data.productOrder.ids);
  b.persist();
}

function finish(cancelled) {
  if (!drag || drag.ended) return;
  const state = drag;
  state.ended = true;
  cancelAnimationFrame(state.frame);
  swallowUntil = Date.now() + 450;
  const target = cancelled ? state.from : state.target;
  const arranged = layout(target);
  const home = state.slots[state.from], place = state.slots[target];
  const [tx, ty] = (state.item.style.translate || '0px 0px').split(' ').map(parseFloat);
  state.item.style.translate = '';
  const spring = fluidMotionLite() ? SPRINGS.lite : SPRINGS.close;
  if (cancelled) shift(state.from);
  const landing = animate(state.item, { from: { x: tx || 0, y: ty || 0, scale: motionOf(state.item)?.now().pose.scale ?? 1 },
    to: { x: place.x - home.x, y: place.y - home.y, scale: 1 }, spring, persist: true });
  const settle = () => {
    for (const el of state.group) { motionOf(el)?.cancel(); el.style.translate = ''; }
    state.item.classList.remove('reorder-lifted');
    scopeOf(state.item).classList.remove('reorder-active');
    document.documentElement.classList.remove('reorder-dragging');
    drag = null;
    if (!cancelled && target !== state.from) { commit(arranged); bridge()?.render(); }
  };
  if (landing) landing.finished.then(settle); else settle();
}

function clearHold() {
  if (!hold) return;
  clearTimeout(hold.timer);
  hold.item.removeEventListener('touchmove', blockScroll);
  hold = null;
}
function blockScroll(event) { if (drag && !drag.ended) event.preventDefault(); }

export function installReorder() {
  window.TerritorioReorder = Object.freeze({ active: () => !!drag });
  document.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.isPrimary === false || drag) return;
    const item = event.target.closest?.(ITEM);
    const page = bridge()?.page?.();
    if (!item || window.TerritorioSelection?.active() || !['Vender', 'Estoque'].includes(page)) return;
    clearHold();
    // Only while this finger is down: the page may not scroll once the product is lifted.
    item.addEventListener('touchmove', blockScroll, { passive: false });
    hold = { item, x: event.clientX, y: event.clientY, pointer: event.pointerId,
      timer: setTimeout(() => { const h = hold; if (!h) return; if (!lift(h.item, h.x, h.y)) clearHold(); else drag.frame = requestAnimationFrame(autoscroll); }, HOLD_MS) };
  }, { capture: true, passive: true });
  document.addEventListener('pointermove', event => {
    if (drag && !drag.ended) { drag.x = event.clientX; drag.y = event.clientY; follow(); return; }
    if (hold && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > SLOP) clearHold();
  }, { capture: true, passive: true });
  document.addEventListener('pointerup', () => { const lifted = !!drag; clearHold(); if (lifted) finish(false); }, { capture: true, passive: true });
  document.addEventListener('pointercancel', () => { const lifted = !!drag; clearHold(); if (lifted) finish(true); }, { capture: true, passive: true });
  document.addEventListener('scroll', () => { if (hold && !drag) clearHold(); }, { capture: true, passive: true });
  // The release of a long press is not a tap: it must not open the sale or the stock sheet.
  window.addEventListener('click', event => {
    if (Date.now() < swallowUntil && event.target.closest?.(ITEM)) { swallowUntil = 0; event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('contextmenu', event => { if (event.target.closest?.(ITEM)) event.preventDefault(); });
}

