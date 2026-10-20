import { stepSpring, springAtRest } from './spring.js';
import { animate, SPRINGS, ramp, clamp, motionOf, finishAll, liveCount, carriedVelocity, springCurve } from './engine.js';

// Every opening and closing (pages, tabs, sheets, nested sheets, toasts, pressed keys) is
// choreographed here and played by the compositor through engine.js. Nothing in this file
// writes styles per frame: the main thread only decides where a surface comes from and goes to.
// The small SVG simulations of the navigation icons keep their own frame loop below.
const running = new Set();
let frame = 0, previousTime = 0, installed = false;
let preference;
let latestSource = null;
let renderedFrames = 0;
const fixedContentSelector = '.sale-dock, .multi-bar, #number-pad, .modal-number-pad, .sale-footer, .subview-footer, [style*="position:fixed"], [style*="position: fixed"]';
const root = () => document.documentElement;
const limited = () => root().classList.contains('lite');
const reduced = () => preference?.matches || root().dataset.reduceEffects === 'true';
const enabled = () => installed && !reduced() && !document.hidden && typeof Element.prototype.animate === 'function';
const spring = name => limited() && !['press', 'release'].includes(name) ? SPRINGS.lite : SPRINGS[name];

function requestFrame() {
  if (!frame && running.size) frame = requestAnimationFrame(tick);
}

function tick(time) {
  frame = 0;
  renderedFrames++;
  const seconds = previousTime ? Math.min((time - previousTime) / 1000, 0.05) : 1 / 60;
  previousTime = time;
  for (const motion of [...running]) {
    if (motion.owner && !motion.owner.isConnected) { motion.cancel(); continue; }
    if (!enabled() || motion.advance(seconds)) motion.finish();
    else motion.draw();
  }
  if (running.size) requestFrame();
  else previousTime = 0;
}

// Small SVG simulations (gravity/contact as well as springs) share one frame scheduler.
// Returning true from advance means the simulation has reached its natural resting state.
export function createPhysicalFrameMotion(owner, { advance, draw, onRest }) {
  let complete = false;
  const motion = {
    owner, advance, draw,
    finish() { if (!complete) { complete = true; running.delete(this); onRest?.(false); } },
    cancel() { if (!complete) { complete = true; running.delete(this); onRest?.(true); } },
  };
  if (!enabled()) { motion.finish(); return motion; }
  motion.draw();
  running.add(motion);
  requestFrame();
  return motion;
}

export const fluidMotionAllowed = () => enabled();
export const fluidMotionLite = () => limited();
export const getMotionDiagnostics = () => ({ active: running.size + liveCount(), compositor: liveCount(), pendingFrame: !!frame, renderedFrames, lite: limited() });

export function getMotionSource(maxAge = 5000) {
  return latestSource && performance.now() - latestSource.time < maxAge ? { ...latestSource } : null;
}

// ---------------------------------------------------------------- where a movement comes from
const sourceSurface = control => control.closest('.product-card, .feira-card, .feira-stock-count, .feira-row, .kpi-item') || control;
function sourceSelector(control) {
  if (!control.dataset.action) return '';
  return [...control.attributes].filter(attr => attr.name.startsWith('data-'))
    .map(attr => `[${attr.name}="${CSS.escape(attr.value)}"]`).join('');
}
const ghostSelector = 'dialog:not([open]), .fluid-page-morph-layer, .fluid-exit-layer, .fluid-sheet-ghost-layer, .fluid-section-ghost';

// The page behind a sheet or a page may re-render while it is open (a pending-sale banner appears,
// a list reorders). On return, find the same control again and aim at where it is now.
function locateSource(source) {
  if (!source?.selector) return source;
  const control = [...document.querySelectorAll(source.selector)]
    .find(el => !el.closest('dialog, ' + ghostSelector) && el.getClientRects().length);
  if (!control) return null;
  const bounds = sourceSurface(control).getBoundingClientRect();
  if (!bounds.width || !bounds.height || bounds.bottom < 0 || bounds.top > innerHeight) return null;
  return { ...source, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
    cx: bounds.left + bounds.width / 2, cy: bounds.top + bounds.height / 2 };
}

function captureMotionSource(event) {
  const control = event.target.closest?.('[data-action], summary, select, [role="button"], a[href]');
  if (!control || control.disabled || control.closest('[inert]')) return;
  const surface = sourceSurface(control);
  const bounds = surface.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const sheet = control.closest('dialog[open]');
  latestSource = {
    sheet: sheet ? { dialog: sheet, children: [...sheet.children], surface: surfaceState(sheet), kind: sheet.dataset.kind || '',
      scrollTop: sheet.querySelector('.dialog-content')?.scrollTop || 0 } : null,
    sheetSelector: sheet ? sourceSelector(control) : '',
    selector: control.closest('dialog') ? '' : sourceSelector(control),
    radius: parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 0,
    left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
    cx: bounds.left + bounds.width / 2, cy: bounds.top + bounds.height / 2,
    time: performance.now(), insideDialog: !!control.closest('dialog'), inNav: !!control.closest('#nav'),
    tab: control.dataset.page || '', action: control.dataset.action || '',
  };
}

// ---------------------------------------------------------------- choreography
// Born from a card: the surface starts centred on the card at the card's size and, within the
// first quarter of the spring, becomes opaque while it grows. Its content is the real content,
// only smaller, as in ColorOS and iOS; nothing is clipped, so nothing has to be repainted.
function launchPose(rect, source) {
  const scale = clamp(Math.max(source.width / rect.width, source.height / rect.height), 0.3, 0.92);
  return { x: source.cx - (rect.left + rect.width / 2), y: source.cy - (rect.top + rect.height / 2), scale, opacity: 0 };
}
// Returning to a card: the whole surface fits inside the card and dissolves into it at the end.
function landingPose(rect, source) {
  const scale = clamp(Math.min(source.width / rect.width, source.height / rect.height), 0.12, 0.92);
  return { x: source.cx - (rect.left + rect.width / 2), y: source.cy - (rect.top + rect.height / 2), scale, opacity: 0 };
}
const REST = Object.freeze({ x: 0, y: 0, scale: 1, opacity: 1 });
// Opacity follows its own short window of the same spring; position and scale keep the full curve.
const appear = (start, end) => (from) => (pose, p) => ({ ...pose, opacity: from.opacity + (1 - from.opacity) * ramp(p, start, end) });
const dissolve = (start, end, base = 1) => (pose, p) => ({ ...pose, opacity: base * (1 - ramp(p, start, end)) });
const usable = source => !!source && source.width > 4 && source.height > 4;

// ---------------------------------------------------------------- pages and tabs
// The page that leaves is not copied: its own nodes are moved, as they are, into a fixed layer
// (the renderer was about to discard them). There it zooms away, or shrinks back into the card
// it came from, while the new page arrives. Both are one compositor layer each.
const NAV_ORDER = ['Vender', 'Estoque', 'Clientes', 'Eventos', 'Gestão'];
const pageFreeze = ['display', 'background-color', 'background-image', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-radius', 'box-shadow', 'color', 'padding', 'gap', 'grid-template-columns', 'min-height', 'font-size', 'font-weight'];
let pageTransition = null;
let pageHandled = false;

function endPageTransition() {
  const t = pageTransition;
  pageTransition = null;
  if (!t) return;
  for (const handle of t.handles) handle?.cancel();
  t.layer?.remove();
}

// Rules that depend on html[data-page="…"], read once from the stylesheets: for each page, the
// selector of the elements they style, without the page part.
const pageRules = new Map();
function pageSelectors(page) {
  if (!pageRules.size) {
    pageRules.set('', '');
    const visit = rules => { for (const rule of rules) {
      if (rule.cssRules?.length && !rule.selectorText) { visit(rule.cssRules); continue; }
      if (!rule.selectorText?.includes('data-page')) continue;
      for (const part of rule.selectorText.split(/,(?![^(]*\))/)) {
        const match = part.match(/\[data-page\s*=\s*['"]?([^'"\]]+)['"]?\]/);
        if (!match) continue;
        const rest = part.replace(/^\s*(?::root|html)?(?:\[[^\]]*\]|\.[\w-]+)*\s*(?:body\s*)?/, '').trim();
        if (!rest || rest.startsWith(':') || rest.startsWith('>')) continue;
        try { document.createDocumentFragment().querySelector(rest); } catch { continue; }
        pageRules.set(match[1], [pageRules.get(match[1]), rest].filter(Boolean).join(', '));
      }
    } };
    for (const sheet of document.styleSheets) { try { visit(sheet.cssRules); } catch {} }
  }
  return pageRules.get(page) || '';
}

// Detach the leaving page into a layer. Only what is on screen travels: blocks below the screen
// are left behind for the renderer to discard, so the layer stays small to style and draw. The
// few elements whose look depends on the page attribute (which changes right after this event)
// keep their current look.
function liftPage(app, onTop, page) {
  const children = [...app.children];
  if (!children.length) return null;
  const rect = app.getBoundingClientRect(), computed = getComputedStyle(app);
  const below = [];
  const prune = (parent, depth) => {
    for (const child of parent.children) {
      const box = child.getBoundingClientRect();
      if (box.top > innerHeight) below.push(child);
      else if (depth < 3 && child.childElementCount > 6 && box.bottom > innerHeight) prune(child, depth + 1);
    }
  };
  prune(app, 0);
  const selector = pageSelectors(page);
  const visible = selector ? [...app.querySelectorAll(selector)].filter(node => !below.some(b => b.contains(node))).slice(0, 120) : [];
  const pinned = visible.map(node => { const style = getComputedStyle(node); return pageFreeze.map(p => style.getPropertyValue(p)); });
  const chrome = ['nav-glass', 'nav'].map(id => document.getElementById(id)).filter(el => el && el.getClientRects().length && !onTop)
    .map(el => { const copy = el.cloneNode(true); copy.removeAttribute('id'); copy.classList.add('fluid-chrome-copy'); copy.querySelectorAll('[id],[data-action]').forEach(n => { n.removeAttribute('id'); n.removeAttribute('data-action'); }); const s = getComputedStyle(el); copy.style.cssText += `;position:fixed;left:${s.left};right:${s.right};bottom:${s.bottom};top:${s.top};width:${s.width};height:${s.height}`; return copy; });
  const layer = document.createElement('div');
  layer.className = 'fluid-page-morph-layer' + (onTop ? ' is-front' : ' is-behind');
  layer.inert = true;
  layer.setAttribute('aria-hidden', 'true');
  const surface = document.createElement('div');
  surface.className = 'fluid-page-morph-surface';
  surface.style.setProperty('--page-morph-bg', getComputedStyle(document.body).backgroundColor);
  const context = document.createElement('div');
  context.className = app.className + ' fluid-page-morph-context';
  Object.assign(context.style, { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', padding: computed.padding });
  visible.forEach((node, i) => pageFreeze.forEach((p, j) => { if (pinned[i][j]) node.style.setProperty(p, pinned[i][j]); }));
  for (const node of below) node.remove();
  context.append(...children.filter(child => child.isConnected));
  // A moved page must never answer a query meant for the live one.
  context.querySelectorAll('[data-action], [name], [autofocus]').forEach(node => { node.removeAttribute('data-action'); node.removeAttribute('name'); node.removeAttribute('autofocus'); });
  surface.append(context, ...chrome);
  layer.append(surface);
  app.after(layer);
  return { layer, surface };
}

// The arriving page: every flow block shares one pivot and one spring, so the page moves as one
// piece; fixed bars (sale dock, keypad) rise into place on their own.
function arrivePage(app, entry, pivot, springName, fixedFrom = { y: 28, opacity: 0 }) {
  const blocks = [...app.children].flatMap(el => el.classList.contains('subview') ? [...el.children] : [el]);
  const prepared = blocks.filter(el => !el.hidden && !el.matches('script, style')).map(element => {
    const bounds = element.getBoundingClientRect();
    const fixed = getComputedStyle(element).position === 'fixed' || !!element.querySelector(fixedContentSelector);
    return { element, bounds, fixed };
  }).filter(({ bounds }) => bounds.width && bounds.height && bounds.top < innerHeight && bounds.bottom > 0).slice(0, 14);
  const curve = spring(springName);
  return prepared.map(({ element, bounds, fixed }) => fixed
    ? animate(element, { from: { ...fixedFrom }, to: { y: 0, opacity: 1 }, spring: curve, shape: appear(0.12, 0.55)(fixedFrom) })
    : animate(element, { from: entry, to: REST, spring: curve, shape: appear(0, entry.opacity > 0.5 ? 0.4 : 0.3)(entry),
      origin: `${(pivot[0] - bounds.left).toFixed(1)}px ${(pivot[1] - bounds.top).toFixed(1)}px` }));
}

function installPageTransitions(listen) {
  const app = document.getElementById('app');
  let currentPage = root().dataset.page || window.TerritorioShell?.page?.();
  const history = [];
  const before = event => {
    const nextPage = event.detail?.page;
    if (!nextPage || nextPage === currentPage) return;
    const previousPage = currentPage;
    currentPage = nextPage;
    endPageTransition();
    const source = getMotionSource(1200), previous = history.at(-1);
    const nav = !!source?.inNav;
    const goingBack = !nav && (previous?.from === nextPage || /back|cancel-product|cancel-sale/.test(source?.action || ''));
    if (nav) history.length = 0;
    if (goingBack) {
      const index = history.findLastIndex(entry => entry.from === nextPage);
      if (index >= 0) history.splice(index); else history.pop();
    } else if (!nav) history.push({ from: previousPage, page: nextPage, source });
    if (history.length > 20) history.shift();
    if (!enabled() || !app) return;
    // A checkout closes its own sheet into the sale; a copy of the sale page would flash stale content.
    const lift = source?.insideDialog ? null : liftPage(app, goingBack, previousPage);
    const t = pageTransition = { layer: lift?.layer, handles: [] };
    pageHandled = true;
    // The renderer finishes the new page synchronously after this event: aim once it is there.
    queueMicrotask(() => {
      pageHandled = false;
      if (pageTransition !== t) return;
      const done = () => { if (pageTransition === t) { pageTransition = null; t.layer?.remove(); } };
      const view = { left: 0, top: 0, width: innerWidth, height: innerHeight };
      const center = [innerWidth / 2, innerHeight / 2];
      // The copied tab bar only stands in for a bar that the new page hides.
      if (lift && document.getElementById('nav')?.getClientRects().length) lift.surface.querySelectorAll(':scope > .fluid-chrome-copy').forEach(node => node.remove());
      if (nav) {
        const step = Math.sign(NAV_ORDER.indexOf(nextPage) - NAV_ORDER.indexOf(previousPage)) || 0;
        const shift = (limited() ? 10 : 22) * step;
        if (lift) t.handles.push(animate(lift.surface, { from: { x: 0, scale: 1, opacity: 1 }, to: { x: -shift, scale: 0.985, opacity: 0 }, spring: spring('tab'), shape: dissolve(0, 0.42), onFinish: done }));
        t.handles.push(...arrivePage(app, { x: shift, y: 0, scale: 0.985, opacity: 0 }, center, 'tab', { y: 0, opacity: 0 }));
        if (!lift) t.handles.at(-1)?.finished.then(done);
        return;
      }
      if (goingBack) {
        const target = previous?.source ? locateSource(previous.source) : null;
        if (lift) {
          const to = usable(target) ? landingPose(view, target) : { x: 0, y: 36, scale: 0.9, opacity: 0 };
          t.handles.push(animate(lift.surface, { from: REST, to, spring: spring('back'), shape: usable(target) ? dissolve(0.58, 1) : dissolve(0, 0.7), onFinish: done }));
        }
        const pivot = usable(target) ? [target.cx, target.cy] : center;
        t.handles.push(...arrivePage(app, { x: 0, y: 0, scale: limited() ? 1.015 : 1.04, opacity: 0 }, pivot, 'back', { y: 18, opacity: 0 }));
        if (!lift) t.handles.at(-1)?.finished.then(done);
        return;
      }
      if (usable(source) && !source.insideDialog) {
        if (lift) t.handles.push(animate(lift.surface, { from: REST, to: { x: 0, y: 0, scale: limited() ? 1.02 : 1.06, opacity: 0 }, spring: spring('page'), shape: dissolve(0, 0.5), origin: `${source.cx}px ${source.cy}px`, onFinish: done }));
        const entry = launchPose(view, source);
        t.handles.push(...arrivePage(app, entry, center, 'page'));
        if (!lift) t.handles.at(-1)?.finished.then(done);
        return;
      }
      // Without a tap (after a sale, from the assistant): a short, quiet cross-fade.
      if (lift) t.handles.push(animate(lift.surface, { from: { y: 0, opacity: 1 }, to: { y: -8, opacity: 0 }, spring: spring('tab'), shape: dissolve(0, 0.45), onFinish: done }));
      t.handles.push(...arrivePage(app, { x: 0, y: 14, scale: 0.99, opacity: 0 }, center, 'tab', { y: 18, opacity: 0 }));
      if (!lift) t.handles.at(-1)?.finished.then(done);
    });
  };
  listen(app, 'territorio:before-page', before);
  listen(document, 'visibilitychange', endPageTransition);
  return endPageTransition;
}

// interface.js calls this after each route change. Route changes that went through the renderer
// were already choreographed above; this only covers the first page.
export function animatePageChange(app) {
  if (pageHandled || pageTransition || !app || !enabled()) return;
}

export function animateSection(details) {
  if (!details.open || !enabled() || details.dataset.fluidSectionManaged === 'true') return;
  [...details.children].filter(el => !el.matches('summary') && !el.hidden).slice(0, 6).forEach(element => {
    const from = { y: limited() ? -2 : -5, opacity: 0.35 };
    animate(element, { from, to: { y: 0, opacity: 1 }, spring: spring('section'), shape: appear(0, 0.5)(from) });
  });
}

const toastMotions = new WeakMap();
export function animateToast(toast) {
  if (toast.hidden || !enabled()) {
    motionOf(toast)?.cancel();
    toastMotions.delete(toast);
    return;
  }
  const existing = motionOf(toast);
  if (existing?.running) { existing.retarget({ y: 0, scale: 1, opacity: 1 }); return; }
  const visible = toastMotions.has(toast);
  const from = { y: visible ? 4 : 18, scale: visible ? 0.985 : limited() ? 0.96 : 0.9, opacity: visible ? 1 : 0 };
  toastMotions.set(toast, true);
  animate(toast, { from, to: REST, spring: spring('toast'), shape: appear(0, 0.35)(from) });
}

// ---------------------------------------------------------------- pressed keys
function installPress(listen) {
  const pointers = new Map(), pressed = new Set();
  const depth = button => { const r = button.getBoundingClientRect(); return r.width > 300 ? 0.985 : limited() ? 0.98 : 0.965; };
  const release = button => {
    if (!pressed.delete(button)) return;
    // A lifted product (hold and drag) is moved and settled by reorder.js, not by the key spring.
    if (button.classList.contains('reorder-lifted')) return;
    const current = motionOf(button);
    const from = current ? current.now().pose : { scale: 1 };
    if (!enabled() || !button.isConnected) { current?.cancel(); return; }
    animate(button, { from: { scale: from.scale ?? 1 }, to: { scale: 1 }, spring: SPRINGS.release, velocity: current ? carriedVelocity(current, from, { scale: 1 }) : 0 });
  };
  const releaseAll = () => { pointers.clear(); for (const button of [...pressed]) release(button); };
  const press = button => {
    if (!enabled() || !button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.closest('[inert]')) return;
    const current = motionOf(button);
    const from = current ? current.now().pose : { scale: 1 };
    pressed.add(button);
    animate(button, { from: { scale: from.scale ?? 1 }, to: { scale: depth(button) }, spring: SPRINGS.press, persist: true });
  };
  listen(document, 'pointerdown', event => {
    if (event.button !== 0 || event.isPrimary === false) return;
    const button = event.target.closest?.('button');
    if (!button || button.disabled) return;
    pointers.set(event.pointerId, { button, x: event.clientX, y: event.clientY });
    press(button);
  }, { capture: true, passive: true });
  listen(document, 'pointermove', event => {
    const held = pointers.get(event.pointerId);
    if (!held || Math.hypot(event.clientX - held.x, event.clientY - held.y) < 9) return;
    pointers.delete(event.pointerId);
    release(held.button);
  }, { capture: true, passive: true });
  for (const type of ['pointerup', 'pointercancel']) listen(document, type, event => {
    const held = pointers.get(event.pointerId);
    if (held) { pointers.delete(event.pointerId); release(held.button); }
  }, { capture: true, passive: true });
  listen(document, 'keydown', event => {
    if (event.repeat || !['Enter', ' '].includes(event.key) || !event.target.matches?.('button')) return;
    press(event.target);
  }, true);
  listen(document, 'keyup', event => { if (['Enter', ' '].includes(event.key)) releaseAll(); }, true);
  listen(document, 'scroll', releaseAll, { capture: true, passive: true });
  listen(window, 'blur', releaseAll);
  return releaseAll;
}

// ---------------------------------------------------------------- sheets
function surfaceState(element) {
  const bounds = element.getBoundingClientRect(), computed = getComputedStyle(element);
  const material = Object.fromEntries(['background', 'border', 'border-radius', 'padding', 'color', 'box-shadow', 'font'].map(property => [property, computed.getPropertyValue(property)]));
  return { rect: { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height }, material, display: computed.display, position: computed.position };
}

function boundedSurface(element, maximum) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT);
  let count = 1;
  while (walker.nextNode()) if (++count > maximum) return false;
  return true;
}

function makeVisualCopy(element) {
  const clone = element.cloneNode(true);
  const originalFields = element.querySelectorAll('input, textarea, select');
  clone.querySelectorAll('input, textarea, select').forEach((field, i) => {
    if (field.type !== 'file') field.value = originalFields[i].value;
    if ('checked' in field) field.checked = originalFields[i].checked;
  });
  for (const part of [clone, ...clone.querySelectorAll('[id], [name], [autofocus], [for], [data-management-section], [data-action]')]) {
    for (const attr of ['id', 'name', 'autofocus', 'for', 'data-management-section', 'data-action']) part.removeAttribute(attr);
  }
  clone.querySelectorAll('.fluid-animating, .fluid-section-running').forEach(part => part.classList.remove('fluid-animating', 'fluid-section-running'));
  clone.classList.remove('fluid-animating', 'fluid-section-running', 'fluid-native-exit');
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  return clone;
}

const surfaceProperties = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'margin', 'box-sizing', 'max-width', 'max-height', 'background', 'border', 'border-radius', 'padding', 'color', 'box-shadow', 'font', 'transition-duration', '--fluid-exit-ms'];
function placeSurface(element, surface) {
  const rect = surface.rect;
  for (const [property, value] of Object.entries(surface.material)) element.style.setProperty(property, value);
  Object.assign(element.style, {
    position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
    right: 'auto', bottom: 'auto', width: rect.width + 'px', height: rect.height + 'px',
    margin: '0', boxSizing: 'border-box', maxWidth: 'none', maxHeight: 'none',
  });
}

function installDialogs() {
  const states = new Map();
  const pendingUpdates = new Map();
  const nativeExit = !!globalThis.CSS?.supports?.('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto');
  const discardGhost = state => { const ghost = state.ghost; state.ghost = null; ghost?.remove(); };
  const playBackdrop = (dialog, state, from, to, curve, persist = false) => {
    state.backdrop?.cancel();
    state.backdrop = animate(dialog, { from: { opacity: from }, to: { opacity: to }, spring: curve, pseudoElement: '::backdrop', persist });
  };
  const backdropNow = state => state.backdrop?.running ? state.backdrop.now().pose.opacity : 1;
  // Stop whatever the sheet is doing and report the pose it had on screen.
  const settleSheet = (dialog, state) => {
    const handle = motionOf(dialog);
    const now = handle?.running ? handle.now() : null;
    const velocityFrom = handle?.running ? handle : null;
    if (state.closing) state.closing.restore(true);
    handle?.cancel();
    return { pose: now?.pose || null, handle: velocityFrom, backdrop: backdropNow(state) };
  };

  // Opening, or new content: everything is decided from one measurement of the sheet at rest.
  const open = (dialog, state, fresh, source) => {
    const prior = settleSheet(dialog, state);
    const rect = dialog.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.morph = fresh ? usable(source) : state.morph;
    let from;
    if (fresh && usable(source)) from = launchPose(rect, source);
    else if (fresh) from = { x: 0, y: limited() ? 10 : 22, scale: limited() ? 0.97 : 0.94, opacity: 0 };
    else from = { x: 0, y: 6, scale: 0.985, opacity: 0.6 };
    if (prior.pose) from = { ...from, ...prior.pose };
    const curve = spring(fresh ? 'open' : 'tab');
    const velocity = prior.handle ? carriedVelocity(prior.handle, from, REST) : 0;
    dialog.classList.add('fluid-animating');
    animate(dialog, { from, to: REST, spring: curve, velocity, shape: appear(0, fresh ? 0.28 : 0.35)(from),
      onFinish: () => dialog.classList.remove('fluid-animating') });
    if (fresh || prior.pose) playBackdrop(dialog, state, prior.pose ? prior.backdrop : 0, 1, curve);
  };

  // Closing: the sheet keeps its place in the top layer (display/overlay transition) for exactly
  // as long as its return lasts, then disappears at the card it came from.
  const exit = (dialog, state) => {
    if (!enabled() || !dialog.open || state.closing || !nativeExit) return null;
    const prior = settleSheet(dialog, state);
    const surface = surfaceState(dialog);
    if (!surface.rect.width || !surface.rect.height) return null;
    const children = [...dialog.children].map(element => ({ element, height: element.offsetHeight, scrollTop: element.scrollTop, scrollLeft: element.scrollLeft,
      saved: ['height', 'min-height', 'max-height', 'flex'].map(p => [p, element.style.getPropertyValue(p), element.style.getPropertyPriority(p)]) }));
    const target = state.morph ? locateSource(state.source) : null;
    const from = { ...REST, ...(prior.pose || {}) };
    const to = usable(target) ? landingPose(surface.rect, target) : { x: 0, y: limited() ? 8 : 16, scale: limited() ? 0.975 : 0.94, opacity: 0 };
    const shape = usable(target) ? dissolve(0.62, 1, from.opacity) : dissolve(0, 0.7, from.opacity);
    const curve = spring('close');
    const velocity = prior.handle ? carriedVelocity(prior.handle, from, to) : 0;
    const retention = Math.ceil(springCurve(curve, velocity).duration) + 120;
    const saved = surfaceProperties.map(property => [property, dialog.style.getPropertyValue(property), dialog.style.getPropertyPriority(property)]);
    const originalInert = dialog.inert, originalAriaHidden = dialog.getAttribute('aria-hidden');
    const copy = boundedSurface(dialog, 1200) ? makeVisualCopy(dialog) : null;
    const scrollTop = dialog.querySelector('.dialog-content')?.scrollTop || 0;
    const token = {};
    token.restore = (reopening = false) => {
      if (state.closing !== token) return;
      state.closing = null;
      // A closed sheet stays hidden while its inline pose is cleared; otherwise it flashes.
      if (!dialog.open && !reopening) dialog.classList.add('fluid-exit-closed');
      motionOf(dialog)?.cancel();
      if (!reopening) { state.backdrop?.cancel(); state.backdrop = null; }
      dialog.classList.remove('fluid-native-exit', 'fluid-animating');
      dialog.inert = originalInert;
      if (originalAriaHidden === null) dialog.removeAttribute('aria-hidden'); else dialog.setAttribute('aria-hidden', originalAriaHidden);
      for (const child of children) for (const [p, value, priority] of child.saved) value ? child.element.style.setProperty(p, value, priority) : child.element.style.removeProperty(p);
      for (const [property, value, priority] of saved) value ? dialog.style.setProperty(property, value, priority) : dialog.style.removeProperty(property);
    };
    token.markClosed = () => { dialog.inert = true; dialog.setAttribute('aria-hidden', 'true'); };
    state.closing = token;
    placeSurface(dialog, surface);
    for (const child of children) if (child.height) {
      Object.assign(child.element.style, { height: child.height + 'px', minHeight: child.height + 'px', maxHeight: child.height + 'px', flex: '0 0 auto' });
      child.element.scrollTop = child.scrollTop; child.element.scrollLeft = child.scrollLeft;
    }
    dialog.style.setProperty('--fluid-exit-ms', retention + 'ms');
    dialog.classList.add('fluid-native-exit', 'fluid-animating');
    token.handle = animate(dialog, { from, to, spring: curve, velocity, shape, persist: true, onFinish: finished => { if (finished) token.restore(); } });
    playBackdrop(dialog, state, prior.pose ? prior.backdrop : 1, 0, curve, true);
    // The shared legacy dialog is often emptied or rewritten right after close(). A detached copy
    // of what was on screen then finishes the same return from the same instant and speed.
    token.swap = () => {
      const handle = token.handle;
      if (!copy || !handle?.running || state.closing !== token) return false;
      const { pose } = handle.now();
      const speed = carriedVelocity(handle, pose, to);
      const shade = backdropNow(state);
      const layer = document.createElement('div');
      layer.className = 'fluid-exit-layer';
      layer.inert = true;
      layer.setAttribute('aria-hidden', 'true');
      const dim = document.createElement('div');
      dim.className = 'fluid-exit-backdrop';
      dim.style.background = getComputedStyle(dialog, '::backdrop').backgroundColor;
      copy.classList.add('fluid-exit-ghost');
      placeSurface(copy, surface);
      copy.style.display = surface.display;
      layer.append(dim, copy);
      discardGhost(state);
      state.ghost = layer;
      document.body.append(layer);
      const content = copy.querySelector('.dialog-content');
      if (content) content.scrollTop = scrollTop;
      token.restore();
      const end = () => { if (state.ghost === layer) discardGhost(state); };
      animate(dim, { from: { opacity: shade }, to: { opacity: 0 }, spring: curve });
      animate(copy, { from: pose, to, spring: curve, velocity: speed, shape: usable(target) ? dissolve(0.5, 1, pose.opacity ?? 1) : dissolve(0, 0.7, pose.opacity ?? 1), onFinish: end });
      return true;
    };
    return token;
  };

  // A sheet opened from a row of another sheet (a cost inside the day summary, a topic inside the
  // brain) is born from that row while the previous sheet recedes. Going back, the nested sheet
  // shrinks whole into the row it came from, above the parent coming forward.
  const sheetGhost = (old, onTop) => {
    const layer = document.createElement('div');
    layer.className = onTop ? 'fluid-sheet-ghost-layer' : 'fluid-exit-layer';
    layer.inert = true;
    layer.setAttribute('aria-hidden', 'true');
    const shell = document.createElement('dialog');
    shell.setAttribute('open', '');
    shell.className = 'fluid-exit-ghost';
    if (old.kind) shell.dataset.kind = old.kind;
    placeSurface(shell, old.surface);
    shell.style.display = old.surface.display;
    shell.style.overflow = 'hidden';
    for (const child of old.children) child.querySelectorAll?.('[name]').forEach(node => node.removeAttribute('name'));
    shell.append(...old.children);
    layer.append(shell);
    document.body.append(layer);
    if (onTop) {
      layer.setAttribute('popover', 'manual');
      try { layer.showPopover(); } catch { layer.remove(); return null; }
    }
    const content = shell.querySelector('.dialog-content');
    if (content) content.scrollTop = old.scrollTop;
    return { layer, shell };
  };
  const rowInSheet = (dialog, source) => {
    const row = source?.sheetSelector && [...dialog.querySelectorAll(source.sheetSelector)].find(el => el.getClientRects().length);
    if (!row) return null;
    const bounds = row.getBoundingClientRect();
    return { ...source, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
      cx: bounds.left + bounds.width / 2, cy: bounds.top + bounds.height / 2 };
  };
  const nestedSheet = (dialog, state, source, signature) => {
    const old = source.sheet;
    const detached = old.children.length > 0 && old.children.every(child => !child.isConnected);
    const back = state.trail.findLastIndex(step => step.signature === signature);
    settleSheet(dialog, state);
    if (back >= 0) {
      const step = state.trail[back];
      state.trail.length = back;
      // The parent comes back where it was scrolled when the row was tapped.
      const parentContent = dialog.querySelector('.dialog-content');
      if (parentContent && step.source.sheet) parentContent.scrollTop = step.source.sheet.scrollTop;
      const ghost = detached && typeof HTMLElement.prototype.showPopover === 'function' ? sheetGhost(old, true) : null;
      if (!ghost) return false;
      state.ghost = ghost.layer;
      const row = rowInSheet(dialog, step.source);
      const to = usable(row) ? landingPose(old.surface.rect, row) : { x: 0, y: 20, scale: 0.92, opacity: 0 };
      animate(ghost.shell, { from: REST, to, spring: spring('close'), shape: usable(row) ? dissolve(0.62, 1) : dissolve(0, 0.6),
        onFinish: () => { if (state.ghost === ghost.layer) discardGhost(state); } });
      const parent = { x: 0, y: 0, scale: limited() ? 0.985 : 0.955, opacity: 0.4 };
      animate(dialog, { from: parent, to: REST, spring: spring('nested'), shape: appear(0, 0.45)(parent) });
      return true;
    }
    const rect = dialog.getBoundingClientRect();
    if (!rect.width || !usable(source)) return false;
    state.trail.push({ signature: state.signature, source });
    const ghost = detached ? sheetGhost(old, false) : null;
    if (ghost) {
      state.ghost = ghost.layer;
      animate(ghost.shell, { from: REST, to: { x: 0, y: 0, scale: limited() ? 0.985 : 0.94, opacity: 0 }, spring: spring('nested'), shape: dissolve(0, 0.5),
        onFinish: () => { if (state.ghost === ghost.layer) discardGhost(state); } });
    }
    const from = launchPose(rect, source);
    animate(dialog, { from, to: REST, spring: spring('nested'), shape: appear(0, 0.3)(from) });
    return true;
  };
  const identity = data => {
    if (data === null || data === undefined) return '';
    if (typeof data !== 'object') return String(data);
    return ['id', 'productId', 'clientId', 'eventId', 'saleId', 'checkoutId', 'index', 'field', 'key', 'mode']
      .filter(key => data[key] !== undefined && (typeof data[key] === 'string' || typeof data[key] === 'number'))
      .map(key => key + ':' + data[key]).join('|');
  };
  const update = (dialog, detail, contentChanged = false) => {
    const state = states.get(dialog);
    if (!state) return;
    if (state.closing && !dialog.open && contentChanged && !state.closing.swap?.()) state.closing.restore();
    const kind = String(detail?.kind ?? dialog.dataset.kind ?? '');
    const title = String(detail?.title ?? dialog.querySelector('h2')?.textContent ?? '').trim();
    const dataKey = detail ? identity(detail.data) : state.kind === kind && state.title === title ? state.identity : '';
    const signature = JSON.stringify([kind, title, dataKey]);
    const fresh = !state.open;
    if (dialog.open && enabled() && (fresh || state.signature !== signature)) {
      discardGhost(state);
      const source = getMotionSource(1500);
      if (fresh) state.trail = [];
      if (!fresh && source?.sheet?.dialog === dialog && nestedSheet(dialog, state, source, signature)) {
        state.open = true; state.kind = kind; state.title = title; state.identity = dataKey; state.signature = signature;
        return;
      }
      if (fresh) state.source = source;
      open(dialog, state, fresh, fresh ? source : null);
    } else if (!dialog.open && state.open && !state.closing) motionOf(dialog)?.cancel();
    state.open = dialog.open;
    state.kind = kind;
    state.title = title;
    state.identity = dataKey;
    state.signature = signature;
  };
  const unbind = (dialog, state) => {
    pendingUpdates.delete(dialog);
    discardGhost(state);
    state.closing?.restore();
    motionOf(dialog)?.cancel();
    state.backdrop?.cancel();
    dialog.removeEventListener('cancel', state.cancel);
    if (dialog.close === state.close) {
      if (state.descriptor) Object.defineProperty(dialog, 'close', state.descriptor); else delete dialog.close;
    }
    for (const method of state.openMethods) if (dialog[method.name] === method.wrapper) {
      if (method.descriptor) Object.defineProperty(dialog, method.name, method.descriptor); else delete dialog[method.name];
    }
  };
  // Legacy painters finish their footer, labels and optional sections after dispatching the sheet
  // event. Measure once after that synchronous work, before paint.
  const scheduleUpdate = (dialog, detail, contentChanged = false) => {
    const pending = pendingUpdates.get(dialog);
    if (pending) {
      if (detail) pending.detail = detail;
      pending.contentChanged ||= contentChanged;
      return;
    }
    const next = { detail, contentChanged };
    pendingUpdates.set(dialog, next);
    queueMicrotask(() => {
      if (pendingUpdates.get(dialog) !== next) return;
      pendingUpdates.delete(dialog);
      if (states.has(dialog) && dialog.isConnected) update(dialog, next.detail, next.contentChanged);
    });
  };
  const bind = dialog => {
    if (!(dialog instanceof HTMLDialogElement) || states.has(dialog) || dialog.classList.contains('fluid-exit-ghost')) return;
    const nativeClose = dialog.close;
    const state = { trail: [], open: false, ghost: null, closing: null, backdrop: null, descriptor: Object.getOwnPropertyDescriptor(dialog, 'close'), openMethods: [], source: null, morph: false, kind: '', title: '', identity: '', signature: '' };
    state.close = function (...args) {
      if (this !== dialog) return nativeClose.apply(this, args);
      const closing = exit(dialog, state);
      let result;
      try { result = nativeClose.apply(dialog, args); } catch (error) { closing?.restore(); throw error; }
      // Existing application guards may intentionally refuse close (for example onboarding).
      if (dialog.open) { closing?.restore(true); return result; }
      state.open = false;
      closing?.markClosed();
      return result;
    };
    dialog.close = state.close;
    for (const name of ['show', 'showModal']) {
      const original = dialog[name], descriptor = Object.getOwnPropertyDescriptor(dialog, name);
      const wrapper = function (...args) {
        if (this === dialog) dialog.classList.remove('fluid-exit-closed');
        return original.apply(this, args);
      };
      state.openMethods.push({ name, descriptor, wrapper });
      dialog[name] = wrapper;
    }
    state.cancel = event => {
      if (event.defaultPrevented || !dialog.open) return;
      const closing = exit(dialog, state);
      queueMicrotask(() => {
        if (event.defaultPrevented || dialog.open) closing?.restore(true);
        else { state.open = false; closing?.markClosed(); }
      });
    };
    dialog.addEventListener('cancel', state.cancel);
    states.set(dialog, state);
    update(dialog);
  };
  const semantic = event => {
    if (!(event.target instanceof HTMLDialogElement)) return;
    bind(event.target);
    scheduleUpdate(event.target, event.detail);
  };
  document.addEventListener('territorio:sheet', semantic, true);
  document.querySelectorAll('dialog').forEach(bind);
  const observer = new MutationObserver(records => {
    const changed = new Map();
    for (const record of records) {
      if (record.type === 'attributes') {
        if (record.target instanceof HTMLDialogElement) changed.set(record.target, changed.get(record.target) || false);
        continue;
      }
      // The touch highlight of a pressed key is decoration, not new content.
      const decoration = node => node.nodeType === 1 && node.classList.contains('glass-touch-light');
      if (record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].every(decoration)) continue;
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const dialog = target?.closest('dialog');
      if (dialog && !dialog.closest('.fluid-exit-layer, .fluid-page-morph-layer, .fluid-sheet-ghost-layer')) changed.set(dialog, true);
      for (const node of record.addedNodes || []) {
        if (node.nodeType !== 1 || node.closest('.fluid-exit-layer, .fluid-page-morph-layer, .fluid-sheet-ghost-layer')) continue;
        if (node.matches('dialog')) bind(node);
        node.querySelectorAll('dialog').forEach(bind);
      }
    }
    for (const [dialog, contentChanged] of changed) { bind(dialog); scheduleUpdate(dialog, null, contentChanged); }
    for (const [dialog, state] of states) if (!dialog.isConnected) { unbind(dialog, state); states.delete(dialog); }
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-kind'] });
  return () => {
    observer.disconnect();
    document.removeEventListener('territorio:sheet', semantic, true);
    for (const [dialog, state] of states) unbind(dialog, state);
    states.clear();
    pendingUpdates.clear();
  };
}

function installMotionBudget(listen) {
  const media = ['(update: slow)', '(prefers-reduced-transparency: reduce)'].map(query => matchMedia(query));
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const evaluate = () => {
    const cores = navigator.hardwareConcurrency, memory = navigator.deviceMemory;
    const noBlur = !globalThis.CSS?.supports?.('backdrop-filter', 'blur(1px)') && !globalThis.CSS?.supports?.('-webkit-backdrop-filter', 'blur(1px)');
    if ((cores > 0 && cores <= 4) || (memory > 0 && memory <= 3) || connection?.saveData || noBlur || media.some(query => query.matches)) root().classList.add('lite');
    root().dataset.motionLite = String(limited());
  };
  for (const query of media) listen(query, 'change', evaluate);
  if (connection?.addEventListener) listen(connection, 'change', evaluate);
  evaluate();
}

function installDialogViewport(listen) {
  const viewport = window.visualViewport;
  const names = ['--dialog-viewport-height', '--dialog-viewport-width', '--dialog-viewport-top', '--dialog-viewport-left'];
  const saved = names.map(name => [name, root().style.getPropertyValue(name)]);
  let pending = 0;
  const sync = () => {
    pending = 0;
    const values = [viewport?.height || window.innerHeight, viewport?.width || window.innerWidth, viewport?.offsetTop || 0, viewport?.offsetLeft || 0];
    names.forEach((name, i) => root().style.setProperty(name, Math.max(0, values[i]).toFixed(2) + 'px'));
    // Resize/keyboard changes are occasional geometry changes, never part of
    // an animation frame. Keep the focused control in its own scroll area.
    const active = document.activeElement;
    if (active?.matches?.('input, textarea, select') && active.closest('dialog[open] > .dialog-content')) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  };
  const queue = () => { if (!pending) pending = requestAnimationFrame(sync); };
  sync();
  listen(window, 'resize', queue, { passive: true });
  if (viewport) {
    listen(viewport, 'resize', queue, { passive: true });
    listen(viewport, 'scroll', queue, { passive: true });
  }
  return () => {
    if (pending) cancelAnimationFrame(pending);
    for (const [name, value] of saved) value ? root().style.setProperty(name, value) : root().style.removeProperty(name);
  };
}

export function installFluidMotion() {
  if (installed) return () => {};
  installed = true;
  preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  root().classList.add('fluid-motion');
  const cleanups = [];
  const listen = (target, type, fn, options) => { target.addEventListener(type, fn, options); cleanups.push(() => target.removeEventListener(type, fn, options)); };
  cleanups.push(installDialogViewport(listen));
  installMotionBudget(listen);
  listen(document, 'pointerdown', captureMotionSource, { capture: true, passive: true });
  listen(document, 'click', captureMotionSource, true);
  let resetPress;
  const settle = () => { resetPress?.(); finishAll(); for (const motion of [...running]) motion.finish(); };
  let previousPreference = `${reduced()}:${limited()}`;
  const settings = new MutationObserver(() => {
    root().dataset.motionLite = String(limited());
    const next = `${reduced()}:${limited()}`;
    if (next !== previousPreference) { previousPreference = next; settle(); }
  });
  settings.observe(root(), { attributes: true, attributeFilter: ['data-reduce-effects', 'class'] });
  listen(preference, 'change', settle);
  const visibility = () => { root().toggleAttribute('data-app-inactive', document.hidden); settle(); };
  listen(document, 'visibilitychange', visibility);
  root().toggleAttribute('data-app-inactive', document.hidden);
  resetPress = installPress(listen);
  cleanups.push(resetPress, installDialogs(), installPageTransitions(listen), () => settings.disconnect());
  return () => {
    installed = false;
    cleanups.reverse().forEach(fn => fn());
    finishAll();
    for (const motion of [...running]) motion.cancel();
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
    root().classList.remove('fluid-motion');
  };
}
