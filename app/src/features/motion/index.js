import { stepSpring, springAtRest } from './spring.js';
import { naturalRect, reanchorPose, insightSheetGeometry, navigationEntryGeometry, morphGeometry, wholeReturnGeometry, revealClip, closingOpacity } from './geometry.js';

// One frame loop for the whole interface. Idle springs do not request frames.
const running = new Set();
const elementMotions = new WeakMap();
let frame = 0, previousTime = 0, installed = false;
let preference;
let latestSource = null;
let skipNextPageEntry = false;
let renderedFrames = 0;
const fixedContentSelector = '.sale-dock, .multi-bar, #number-pad, .modal-number-pad, .sale-footer, .subview-footer, [style*="position:fixed"], [style*="position: fixed"]';
const root = () => document.documentElement;
const limited = () => root().classList.contains('lite');
const reduced = () => preference?.matches || root().dataset.reduceEffects === 'true';
const enabled = () => installed && !reduced() && !document.hidden;

function requestFrame() {
  if (!frame && running.size) frame = requestAnimationFrame(tick);
}

function tick(time) {
  frame = 0;
  renderedFrames++;
  const seconds = previousTime ? Math.max(0, (time - previousTime) / 1000) : 1 / 60;
  previousTime = time;
  for (const motion of [...running]) {
    if (motion.owner && !motion.owner.isConnected) { motion.cancel(); continue; }
    if (motion.advance) {
      if (!enabled() || motion.advance(seconds)) motion.finish();
      else motion.draw();
      continue;
    }
    let resting = true;
    for (const [key, spring] of Object.entries(motion.values)) {
      const next = stepSpring(spring, spring.target, seconds, motion.config);
      Object.assign(spring, next);
      const tolerance = key === 'opacity' || key === 'scale' || key === 'reveal' ? 0.0005 : 0.04;
      if (!springAtRest(spring, spring.target, tolerance, tolerance * 8)) resting = false;
    }
    if (resting || !enabled()) motion.finish();
    else motion.draw();
  }
  if (running.size) requestFrame();
  else previousTime = 0;
}

function springMotion(owner, from, target, draw, rest, config = {}) {
  const motion = {
    owner,
    config: { stiffness: 420, damping: limited() ? 44 : 36, mass: 1, ...config },
    values: Object.fromEntries(Object.entries(from).map(([key, position]) => [key, { position, velocity: 0, target: target[key] ?? position }])),
    draw() { draw(Object.fromEntries(Object.entries(this.values).map(([key, s]) => [key, s.position]))); },
    retarget(next) {
      for (const [key, value] of Object.entries(next)) if (this.values[key]) this.values[key].target = value;
      running.add(this);
      if (!enabled()) this.finish(); else requestFrame();
    },
    finish() {
      for (const s of Object.values(this.values)) { s.position = s.target; s.velocity = 0; }
      this.draw();
      running.delete(this);
      rest?.();
    },
    cancel() { running.delete(this); rest?.(true); },
  };
  motion.draw();
  motion.retarget(target);
  return motion;
}

// Small SVG simulations (gravity/contact as well as springs) share the same frame scheduler.
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
export const getMotionDiagnostics = () => ({ active: running.size, pendingFrame: !!frame, renderedFrames, lite: limited() });

export function getMotionSource(maxAge = 5000) {
  return latestSource && performance.now() - latestSource.time < maxAge ? { ...latestSource } : null;
}

const sourceSurface = control => control.closest('.product-card, .feira-card, .feira-stock-count, .feira-row, .kpi-item') || control;
function sourceSelector(control) {
  if (!control.dataset.action) return '';
  return [...control.attributes].filter(attr => attr.name.startsWith('data-'))
    .map(attr => `[${attr.name}="${CSS.escape(attr.value)}"]`).join('');
}

// The page behind a sheet or a page may re-render while it is open (a pending-sale banner appears,
// a list reorders). On return, find the same control again and aim at where it is now.
function locateSource(source) {
  if (!source?.selector) return source;
  const control = [...document.querySelectorAll(source.selector)]
    .find(el => !el.closest('dialog, .fluid-page-morph-layer, .fluid-exit-layer, .fluid-page-exit-layer') && el.getClientRects().length);
  if (!control) return source;
  const bounds = sourceSurface(control).getBoundingClientRect();
  if (!bounds.width || !bounds.height) return source;
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
    time: performance.now(), insideDialog: !!control.closest('dialog'), inNav: !!control.closest('#nav'), tab: control.dataset.page || '', action: control.dataset.action || '',
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
function dialogGeometry(bounds, source, dialog, morph = true) {
  // A sheet opened by a tap grows out of the tapped surface and returns to it on close, clipped
  // to that surface's shape. Lite devices morph too, with a critically damped spring (dialogSpring).
  // Sheets opened without a tap keep the short expansion.
  if (morph && source) {
    const sheetRadius = dialog ? parseFloat(getComputedStyle(dialog).borderTopLeftRadius) || 28 : 28;
    const geometry = morphGeometry(bounds, source, sheetRadius);
    if (geometry) return geometry;
  }
  return insightSheetGeometry(bounds, source, limited());
}
const applyReveal = (element, clip, reveal) => { if (clip) element.style.clipPath = revealClip(clip, reveal); };
function dialogSpring(kind, closing = false) {
  return closing ? { stiffness: 720, damping: 52 } : { stiffness: 560, damping: limited() ? 47 : 35 };
}

const properties = ['translate', 'scale', 'opacity', 'will-change', 'transform-origin', 'clip-path'];
function animateElement(element, from, to, options = {}) {
  elementMotions.get(element)?.cancel();
  if (!enabled()) return null;
  const original = properties.map(p => [p, element.style.getPropertyValue(p), element.style.getPropertyPriority(p)]);
  const clean = () => {
    for (const [p, value, priority] of original) {
      if (value) element.style.setProperty(p, value, priority);
      else element.style.removeProperty(p);
    }
    element.classList.remove('fluid-animating');
    elementMotions.delete(element);
    options.onRest?.();
  };
  element.classList.add('fluid-animating');
  if (options.origin) element.style.transformOrigin = options.origin;
  element.style.willChange = [...new Set(Object.keys(from).filter(k => k !== 'reveal').map(k => k === 'x' || k === 'y' ? 'translate' : k))].join(', ');
  const motion = springMotion(element, from, to, value => {
    if ('x' in value || 'y' in value) element.style.translate = `${(value.x || 0).toFixed(3)}px ${(value.y || 0).toFixed(3)}px`;
    if ('scale' in value) element.style.scale = value.scale.toFixed(5);
    if ('opacity' in value) element.style.opacity = Math.max(0, Math.min(1, value.opacity)).toFixed(4);
    options.onUpdate?.(value);
  }, clean, options.config);
  elementMotions.set(element, motion);
  return motion;
}

// ---------------------------------------------------------------- page morph
// Pages opened from a card (Venda, Produto, Ajustes…) behave like the sheets: the whole page grows
// out of the tapped card and, on return, shrinks back into it whole. #app and its fixed bars are
// never transformed; a detached visual copy inside one fixed layer carries the movement instead.
const freezeProperties = ['display', 'box-sizing', 'width', 'height', 'padding', 'margin', 'background-color', 'background-image',
  'color', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'box-shadow', 'font', 'gap',
  'flex', 'grid-template-columns', 'align-items', 'justify-content', 'opacity', 'visibility'];
let pendingPageEntry = null;

// Copy elements for a moving page. Ids stay so id-based styles still apply (the real nodes come
// first in the document, so lookups keep finding them); names and actions are removed so a copied
// radio or button can never touch real state. With freeze, computed styles are pinned first, for
// copies that must keep their look after html[data-page] changes. All reads happen before writes.
function pageCopies(elements, freeze, limit = 1500) {
  const pairs = [], roots = [];
  for (const element of elements) {
    // Count before cloning: a long catalog must not be duplicated just to reject it.
    if (!boundedSurface(element, limit-pairs.length)) return null;
    const copy = element.cloneNode(true);
    roots.push(copy);
    pairs.push([element, copy]);
    const originals = element.querySelectorAll('*'), copies = copy.querySelectorAll('*');
    for (let i = 0; i < originals.length; i++) pairs.push([originals[i], copies[i]]);
    if (pairs.length > limit) return null;
  }
  const styles = freeze ? pairs.map(([original]) => { const computed = getComputedStyle(original); return freezeProperties.map(p => computed.getPropertyValue(p)); }) : null;
  pairs.forEach(([original, copy], i) => {
    if (original.matches?.('input, textarea, select') && copy.type !== 'file') copy.value = original.value;
    if ('checked' in original) copy.checked = original.checked;
    for (const attr of ['name', 'autofocus', 'for', 'data-action']) copy.removeAttribute(attr);
    copy.classList?.remove('fluid-animating', 'fluid-press', 'fluid-section-running');
    if (styles) freezeProperties.forEach((p, j) => { if (styles[i][j]) copy.style.setProperty(p, styles[i][j]); });
  });
  return roots;
}

function pageContext(app, copies) {
  const rect = app.getBoundingClientRect(), computed = getComputedStyle(app);
  const context = document.createElement('div');
  context.id = 'app';
  context.className = app.className + ' fluid-page-morph-context';
  Object.assign(context.style, { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', padding: computed.padding });
  context.append(...copies);
  return context;
}

function pageLayer() {
  const layer = document.createElement('div');
  layer.className = 'fluid-page-morph-layer';
  layer.inert = true;
  layer.setAttribute('aria-hidden', 'true');
  layer.style.setProperty('--page-morph-bg', getComputedStyle(document.body).backgroundColor);
  return layer;
}

function capturePageEntry(app, source) {
  pendingPageEntry = null;
  if (!enabled() || limited() || !source || source.insideDialog || source.inNav) return;
  const chrome = ['nav-glass', 'nav'].map(id => document.getElementById(id)).filter(el => el && el.getClientRects().length);
  const parts = [...app.children], copies = pageCopies([...parts, ...chrome], true);
  if (!copies) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'fluid-page-morph-surface';
  backdrop.append(pageContext(app, copies.slice(0, parts.length)), ...copies.slice(parts.length));
  pendingPageEntry = { backdrop, source, time: performance.now() };
  requestAnimationFrame(() => { pendingPageEntry = null; });
}

function morphPage(card, shade, layer, source, closing) {
  const geometry = (closing ? wholeReturnGeometry : morphGeometry)({ left: 0, top: 0, width: innerWidth, height: innerHeight }, source, 0);
  if (!geometry) return false;
  // Lite devices clip with square corners, the cheapest clip to repaint.
  const clip = limited() ? { ...geometry.clip, radius: 0 } : geometry.clip;
  const open = { x: 0, y: 0, scale: 1, reveal: 1 }, shut = { x: geometry.x, y: geometry.y, scale: geometry.scale, reveal: 0 };
  const motion = animateElement(card, closing ? open : shut, closing ? shut : open, {
    origin: geometry.origin, config: dialogSpring('page', closing),
    onUpdate: value => {
      applyReveal(card, clip, value.reveal);
      shade.style.opacity = clamp(value.reveal, 0, 1).toFixed(4);
      if (closing) card.style.opacity = closingOpacity(value.reveal).toFixed(4);
    },
    onRest: () => layer.remove(),
  });
  return motion ? { motion, geometry } : null;
}

function animatePageEntry(app) {
  const pending = pendingPageEntry;
  pendingPageEntry = null;
  if (!pending || performance.now() - pending.time > 1000 || !app.querySelector(':scope > .subview')) return false;
  const copies = pageCopies([...app.children], false);
  if (!copies) return false;
  const layer = pageLayer(), shade = document.createElement('div'), card = document.createElement('div');
  shade.className = 'fluid-page-morph-shade';
  card.className = 'fluid-page-morph-surface';
  card.append(pageContext(app, copies));
  layer.append(pending.backdrop, shade, card);
  document.body.append(layer);
  if (!morphPage(card, shade, layer, pending.source, false)) { layer.remove(); return false; }
  return true;
}

function animatePageReturn(app, source) {
  if (!enabled() || limited()) return null;
  const copies = pageCopies([...app.children], true);
  if (!copies) return null;
  const layer = pageLayer(), shade = document.createElement('div'), card = document.createElement('div');
  shade.className = 'fluid-page-morph-shade';
  card.className = 'fluid-page-morph-surface';
  card.append(pageContext(app, copies));
  layer.append(shade, card);
  document.body.append(layer);
  const morph = morphPage(card, shade, layer, source, true);
  if (morph) return { layer, ...morph };
  layer.remove();
  return null;
}

// Flow panels share one viewport pivot and one spring. Their relative positions stay
// fixed throughout the launch; fixed toolbars keep their viewport containing block.
let pageEntryMotion = null;
export function animatePageChange(app) {
  pageEntryMotion?.cancel();
  pageEntryMotion = null;
  if (skipNextPageEntry) { skipNextPageEntry = false; return; }
  if (!app || !enabled()) return;
  if (animatePageEntry(app)) return;
  const source=getMotionSource(900),navigation=!!source?.inNav;
  const entry = navigation?navigationEntryGeometry(innerWidth,innerHeight,source,limited()):insightSheetGeometry({left:0,top:0,width:innerWidth,height:innerHeight},source,limited());
  const pivot = entry.origin.split(' ').map(parseFloat);
  const candidates = [...app.children].flatMap(el => el.classList.contains('subview') ? [...el.children] : [el]);
  const prepared = candidates.filter(el => !el.hidden && !el.matches('script, style')).map(element => {
    const bounds = element.getBoundingClientRect();
    const fixed = getComputedStyle(element).position === 'fixed' || !!element.querySelector(fixedContentSelector);
    return {element,bounds,fixed,original:properties.map(p=>[p,element.style.getPropertyValue(p),element.style.getPropertyPriority(p)])};
  }).filter(({bounds})=>bounds.width && bounds.height && bounds.top<innerHeight && bounds.bottom>0).slice(0,12);
  if (!prepared.length) return;
  let complete = false, motion;
  const clean = () => {
    if (complete) return;
    complete = true;
    for (const {element,original} of prepared) {
      for (const [p,value,priority] of original) value ? element.style.setProperty(p,value,priority) : element.style.removeProperty(p);
      element.classList.remove('fluid-animating');
      elementMotions.delete(element);
    }
    if (pageEntryMotion === motion) pageEntryMotion = null;
  };
  for (const {element,bounds,fixed} of prepared) {
    element.classList.add('fluid-animating');
    element.style.willChange = fixed ? 'opacity' : 'translate, scale, opacity';
    if (!fixed) element.style.transformOrigin = `${pivot[0]-bounds.left}px ${pivot[1]-bounds.top}px`;
  }
  motion = springMotion(app,{x:entry.x,y:entry.y,scale:entry.scale,opacity:0.72},{x:0,y:0,scale:1,opacity:1}, value => {
    const opacity = String(clamp(value.opacity,0,1)), translate = `${value.x.toFixed(3)}px ${value.y.toFixed(3)}px`, scale = value.scale.toFixed(5);
    for (const {element,fixed} of prepared) {
      element.style.opacity = opacity;
      if (!fixed) { element.style.translate = translate; element.style.scale = scale; }
    }
  },clean,navigation?{stiffness:520,damping:limited()?44:28}:dialogSpring('page'));
  pageEntryMotion = motion;
  for (const {element} of prepared) elementMotions.set(element,motion);
}

export function animateSection(details) {
  if (!details.open || !enabled() || details.dataset.fluidSectionManaged === 'true') return;
  [...details.children].filter(el => !el.matches('summary') && !el.hidden).slice(0, 6).forEach(element => {
    animateElement(element, { y: limited() ? -2 : -5, opacity: 0.35 }, { y: 0, opacity: 1 },
      { config: { stiffness: 460, damping: 38 } });
  });
}

const toastMotions = new WeakMap();
export function animateToast(toast) {
  if (toast.hidden || !enabled()) {
    elementMotions.get(toast)?.cancel();
    toastMotions.delete(toast);
    return;
  }
  const existing = toastMotions.get(toast);
  if (existing && running.has(existing)) {
    // A second message during entry keeps its current position and velocity.
    existing.retarget({ y: 0, scale: 1, opacity: 1 });
    return;
  }
  const visible = toastMotions.has(toast);
  const motion = animateElement(toast, { y: visible ? 4 : 20, scale: 0.985, opacity: visible ? 1 : 0 },
    { y: 0, scale: 1, opacity: 1 }, { config: { stiffness: 390, damping: 33 } });
  toastMotions.set(toast, motion);
}

function installPress(listen) {
  const pointers = new Map(), buttons = new Map();
  const release = button => {
    const state = buttons.get(button);
    if (!state) return;
    state.down = false;
    state.motion.retarget({ scale: 1 });
  };
  const releaseAll = () => { pointers.clear(); for (const button of buttons.keys()) release(button); };
  const press = button => {
    if (!enabled() || !button || button.disabled || button.getAttribute('aria-disabled') === 'true' || button.closest('[inert]')) return;
    const existing = buttons.get(button);
    if (existing) { existing.down = true; existing.motion.retarget({ scale: limited() ? 0.985 : 0.972 }); return; }
    const original = button.style.scale;
    const state = { down: true };
    buttons.set(button, state);
    button.classList.add('fluid-press');
    state.motion = springMotion(button, { scale: 1 }, { scale: limited() ? 0.985 : 0.972 }, value => {
      button.style.scale = value.scale.toFixed(5);
    }, cancelled => {
      if (state.down && !cancelled && enabled()) return;
      button.style.scale = original;
      button.classList.remove('fluid-press');
      buttons.delete(button);
    }, { stiffness: 650, damping: 38 });
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
  listen(document, 'pointerout', event => {
    const held = pointers.get(event.pointerId);
    if (event.pointerType === 'mouse' && held && !held.button.contains(event.relatedTarget)) {
      pointers.delete(event.pointerId); release(held.button);
    }
  }, { capture: true, passive: true });
  listen(document, 'keydown', event => {
    if (event.repeat || !['Enter', ' '].includes(event.key) || !event.target.matches?.('button')) return;
    press(event.target);
  }, true);
  listen(document, 'keyup', event => { if (['Enter', ' '].includes(event.key)) releaseAll(); }, true);
  listen(document, 'scroll', releaseAll, { capture: true, passive: true });
  listen(window, 'blur', releaseAll);
  return () => { releaseAll(); for (const state of buttons.values()) state.motion.cancel(); };
}

function surfaceState(element) {
  const bounds = element.getBoundingClientRect(), computed = getComputedStyle(element);
  const values = elementMotions.get(element)?.values || {};
  const translation = computed.translate === 'none' ? [0, 0] : computed.translate.split(' ').map(parseFloat);
  const origin = computed.transformOrigin.split(' ').map(parseFloat);
  const pose = {
    x: values.x?.position ?? translation[0] ?? 0, y: values.y?.position ?? translation[1] ?? 0,
    scale: values.scale?.position ?? (parseFloat(computed.scale) || 1),
    opacity: values.opacity?.position ?? Number(computed.opacity),
    originX: origin[0] || 0, originY: origin[1] || 0,
    velocityX: values.x?.velocity || 0, velocityY: values.y?.velocity || 0,
    velocityScale: values.scale?.velocity || 0, velocityOpacity: values.opacity?.velocity || 0,
  };
  const material = Object.fromEntries(['background', 'border', 'border-radius', 'padding', 'color', 'box-shadow', 'font'].map(property => [property, computed.getPropertyValue(property)]));
  return { rect: naturalRect(bounds, pose), pose, material, display: computed.display, position: computed.position };
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
  clone.querySelectorAll('.fluid-animating, .fluid-press, .fluid-section-running').forEach(part => part.classList.remove('fluid-animating', 'fluid-press', 'fluid-section-running'));
  clone.classList.remove('fluid-animating', 'fluid-press', 'fluid-section-running');
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  return clone;
}

const surfaceProperties = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height', 'margin', 'box-sizing', 'max-width', 'max-height', 'background', 'border', 'border-radius', 'padding', 'color', 'box-shadow', 'font'];
function placeSurface(element, surface) {
  const rect = surface.rect;
  for (const [property, value] of Object.entries(surface.material)) element.style.setProperty(property, value);
  Object.assign(element.style, {
    position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
    right: 'auto', bottom: 'auto', width: rect.width + 'px', height: rect.height + 'px',
    margin: '0', boxSizing: 'border-box', maxWidth: 'none', maxHeight: 'none',
  });
}

function inheritVelocity(motion, pose) {
  if (!motion) return;
  for (const [key, velocity] of [['x', pose.velocityX], ['y', pose.velocityY], ['scale', pose.velocityScale], ['opacity', pose.velocityOpacity]]) {
    if (motion.values[key]) motion.values[key].velocity = velocity || 0;
  }
}

function installDialogs() {
  const states = new Map();
  const pendingUpdates = new Map();
  const nativeExit = !!globalThis.CSS?.supports?.('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto');
  const discardGhost = state => { const ghost = state.ghost; state.ghost = null; ghost?.remove(); };
  const exit = (dialog, state) => {
    if (!enabled() || !dialog.open || state.closing) return null;
    // One bounds read and one computed-style read, with no writes between them.
    const surface = surfaceState(dialog);
    const children = [...dialog.children].map(element=>({element,height:element.offsetHeight,scrollTop:element.scrollTop,scrollLeft:element.scrollLeft,saved:['height','min-height','max-height','flex'].map(p=>[p,element.style.getPropertyValue(p),element.style.getPropertyPriority(p)])}));
    if (!surface.rect.width || !surface.rect.height) return null;
    if (state.morph) state.source = locateSource(state.source);
    const close = (state.morph && wholeReturnGeometry(surface.rect, state.source, parseFloat(getComputedStyle(dialog).borderTopLeftRadius) || 28)) || dialogGeometry(surface.rect, state.source, dialog, state.morph);
    const clip = close.clip;
    // A fast reversal keeps the current partial opening frozen; a settled sheet
    // keeps its complete mask. Neither wipes individual rows during the return.
    const retainedClip = dialog.style.clipPath || revealClip(clip || { x: 0, bottom: 0, radius: 28, sheetRadius: 28 }, 1);
    const drawReturnClip = (element, value) => {
      if (close.whole) element.style.clipPath = retainedClip;
      else applyReveal(element, clip, value);
    };
    const reveal = elementMotions.get(dialog)?.values.reveal?.position ?? 1;
    const origin = close.origin.split(' ').map((value, i) => value.includes('%') ? parseFloat(value) / 100 * (i ? surface.rect.height : surface.rect.width) : parseFloat(value));
    const pose = reanchorPose(surface.pose, origin[0], origin[1]);
    // A morphing sheet stays whole and solid on its way back and only merges into the source at the end.
    const from = clip ? { x: pose.x, y: pose.y, scale: pose.scale, reveal } : { x: pose.x, y: pose.y, scale: pose.scale, opacity: pose.opacity };
    const to = clip ? { x: close.x, y: close.y, scale: close.scale, reveal: 0 } : { x: close.x, y: close.y, scale: close.scale, opacity: 0 };
    const fade = value => clip ? closingOpacity(value.reveal, pose.opacity) : value.opacity;
    const shadeLevel = value => clamp((clip ? value.reveal : value.opacity / Math.max(0.001, pose.opacity)), 0, 1) * backdropOpacity;
    const backdrop = getComputedStyle(dialog, '::backdrop');
    const backdropColor = backdrop.backgroundColor;
    const backdropOpacity = Number(backdrop.opacity);
    const token = { motion: null, native: nativeExit };
    elementMotions.get(dialog)?.cancel();
    if (nativeExit) {
      // The browser retains the actual top-layer pixels via discrete display/overlay transitions.
      // close(), returnValue, focus and business handlers still complete synchronously.
      const saved = [...surfaceProperties, 'clip-path', '--fluid-backdrop-opacity', '--fluid-backdrop-color'].map(property => [property, dialog.style.getPropertyValue(property), dialog.style.getPropertyPriority(property)]);
      const originalInert = dialog.inert, originalAriaHidden = dialog.getAttribute('aria-hidden');
      const restore = () => {
        if (state.closing !== token) return;
        state.closing = null;
        // The discrete overlay can outlive the spring by a frame. Keep a closed surface hidden
        // while restoring inline opacity/scale, otherwise its unanimated pose briefly flashes.
        if (!dialog.open) dialog.classList.add('fluid-exit-closed');
        dialog.classList.remove('fluid-native-exit');
        dialog.inert = originalInert;
        if (originalAriaHidden === null) dialog.removeAttribute('aria-hidden'); else dialog.setAttribute('aria-hidden', originalAriaHidden);
        for (const child of children) for (const [p,value,priority] of child.saved) value ? child.element.style.setProperty(p,value,priority) : child.element.style.removeProperty(p);
        for (const [property, value, priority] of saved) {
          if (value) dialog.style.setProperty(property, value, priority); else dialog.style.removeProperty(property);
        }
      };
      state.closing = token;
      token.markClosed = () => { dialog.inert = true; dialog.setAttribute('aria-hidden', 'true'); };
      placeSurface(dialog, surface);
      for (const child of children) if(child.height){Object.assign(child.element.style,{height:child.height+'px',minHeight:child.height+'px',maxHeight:child.height+'px',flex:'0 0 auto'});child.element.scrollTop=child.scrollTop;child.element.scrollLeft=child.scrollLeft;}
      dialog.style.setProperty('--fluid-backdrop-color', backdropColor);
      dialog.classList.add('fluid-native-exit');
      token.motion = animateElement(dialog, from, to, {
        origin: close.origin, config: dialogSpring(state.kind, true),
        onUpdate: value => {
          dialog.style.setProperty('--fluid-backdrop-opacity', shadeLevel(value));
          if (clip) dialog.style.opacity = fade(value).toFixed(4);
          drawReturnClip(dialog, value.reveal);
        },
        onRest: restore,
      });
      inheritVelocity(token.motion, pose);
      // The shared legacy dialog is often emptied or rewritten right after close() (cancelling a
      // product option, for example). Keep a detached copy of what was on screen; if the content
      // changes mid-flight, the copy finishes the same return instead of the sheet falling apart.
      const copy = boundedSurface(dialog, 1200) ? makeVisualCopy(dialog) : null;
      const scrollTop = dialog.querySelector('.dialog-content')?.scrollTop || 0;
      token.swap = () => {
        const motion = token.motion;
        if (!copy || !motion || state.closing !== token || !running.has(motion)) return false;
        const now = Object.fromEntries(Object.entries(motion.values).map(([key, spring]) => [key, { ...spring }]));
        const layer = document.createElement('div');
        layer.className = 'fluid-exit-layer';
        layer.inert = true;
        layer.setAttribute('aria-hidden', 'true');
        const shade = document.createElement('div');
        shade.className = 'fluid-exit-backdrop';
        shade.style.background = backdropColor;
        shade.style.opacity = shadeLevel(Object.fromEntries(Object.entries(now).map(([key, spring]) => [key, spring.position])));
        copy.classList.add('fluid-exit-ghost');
        placeSurface(copy, surface);
        copy.style.display = surface.display;
        copy.style.transform = 'none';
        layer.append(shade, copy);
        discardGhost(state);
        state.ghost = layer;
        document.body.append(layer);
        const content = copy.querySelector('.dialog-content');
        if (content) content.scrollTop = scrollTop;
        motion.cancel();
        const ghost = animateElement(copy, Object.fromEntries(Object.entries(now).map(([key, spring]) => [key, spring.position])), to, {
          origin: close.origin, config: dialogSpring(state.kind, true),
          onUpdate: value => {
            shade.style.opacity = shadeLevel(value);
            copy.style.opacity = fade(value).toFixed(4);
            drawReturnClip(copy, value.reveal);
          },
          onRest: () => { if (state.ghost === layer) discardGhost(state); },
        });
        if (ghost) for (const [key, spring] of Object.entries(now)) if (ghost.values[key]) ghost.values[key].velocity = spring.velocity;
        return true;
      };
      return token;
    }
    // Older WebViews get a bounded fallback. Never duplicate a large form or receipt on close.
    const clone = boundedSurface(dialog, 1200) ? makeVisualCopy(dialog) : null;
    const layer = document.createElement('div');
    layer.className = 'fluid-exit-layer';
    layer.inert = true;
    layer.setAttribute('aria-hidden', 'true');
    const shade = document.createElement('div');
    shade.className = 'fluid-exit-backdrop';
    shade.style.background = backdropColor;
    layer.append(shade);
    if (clone) {
      clone.classList.add('fluid-exit-ghost');
      placeSurface(clone, surface);
      clone.style.display = surface.display;
      clone.style.transform = 'none';
      layer.append(clone);
    }
    token.play = () => {
      discardGhost(state);
      state.ghost = layer;
      document.body.append(layer);
      if (clone) {
        const motion = animateElement(clone, from, to, {
          origin: close.origin, config: dialogSpring(state.kind, true),
          onUpdate: value => { if (clip) clone.style.opacity = fade(value).toFixed(4); drawReturnClip(clone, value.reveal); },
          onRest: () => { if (state.ghost === layer) discardGhost(state); },
        });
        inheritVelocity(motion, pose);
      }
      animateElement(shade, { opacity: backdropOpacity }, { opacity: 0 }, {
        config: dialogSpring(state.kind, true),
        onRest: () => { if (!clone && state.ghost === layer) discardGhost(state); },
      });
    };
    return token;
  };
  // A sheet opened from a row of another sheet (a cost inside the day summary, a topic inside the
  // brain) is born from that row, while the previous sheet recedes behind it. Going back, the
  // nested sheet shrinks whole into the row it came from, above the restored parent sheet.
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
    shell.style.transform = 'none';
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
    if (!row) return source;
    const bounds = row.getBoundingClientRect();
    return { ...source, left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
      cx: bounds.left + bounds.width / 2, cy: bounds.top + bounds.height / 2 };
  };
  const nestedSheet = (dialog, state, source, signature) => {
    const old = source.sheet;
    const detached = old.children.length > 0 && old.children.every(child => !child.isConnected);
    const radius = parseFloat(getComputedStyle(dialog).borderTopLeftRadius) || 28;
    const back = state.trail.findLastIndex(step => step.signature === signature);
    if (back >= 0) {
      const step = state.trail[back];
      state.trail.length = back;
      // The parent comes back where it was scrolled when the row was tapped.
      const parentContent = dialog.querySelector('.dialog-content');
      if (parentContent && step.source.sheet) parentContent.scrollTop = step.source.sheet.scrollTop;
      const ghost = detached && typeof HTMLElement.prototype.showPopover === 'function' ? sheetGhost(old, true) : null;
      if (!ghost) return false;
      state.ghost = ghost.layer;
      const shut = wholeReturnGeometry(old.surface.rect, rowInSheet(dialog, step.source), radius);
      if (!shut) { discardGhost(state); return false; }
      const motion = animateElement(ghost.shell, { x: 0, y: 0, scale: 1, reveal: 1 }, { x: shut.x, y: shut.y, scale: shut.scale, reveal: 0 }, {
        origin: shut.origin, config: dialogSpring(state.kind, true),
        onUpdate: value => { applyReveal(ghost.shell, shut.clip, value.reveal); ghost.shell.style.opacity = closingOpacity(value.reveal).toFixed(4); },
        onRest: () => { if (state.ghost === ghost.layer) discardGhost(state); },
      });
      if (!motion) discardGhost(state);
      // The parent sheet comes forward from just behind.
      animateElement(dialog, { scale: limited() ? 0.985 : 0.965 }, { scale: 1 }, { config: dialogSpring(state.kind) });
      return true;
    }
    const entry = morphGeometry(dialog.getBoundingClientRect(), source, radius);
    if (!entry) return false;
    state.trail.push({ signature: state.signature, source });
    const ghost = detached ? sheetGhost(old, false) : null;
    if (ghost) {
      state.ghost = ghost.layer;
      animateElement(ghost.shell, { scale: 1, opacity: 1 }, { scale: limited() ? 0.985 : 0.95, opacity: 0 }, {
        config: dialogSpring(state.kind),
        onRest: () => { if (state.ghost === ghost.layer) discardGhost(state); },
      });
    }
    animateElement(dialog, { x: entry.x, y: entry.y, scale: entry.scale, reveal: 0 }, { x: 0, y: 0, scale: 1, reveal: 1 }, {
      origin: entry.origin, config: dialogSpring(state.kind),
      onUpdate: value => applyReveal(dialog, entry.clip, value.reveal),
      onRest: () => dialog.style.removeProperty('clip-path'),
    });
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
    if (state.closing && !dialog.open && contentChanged && !state.closing.swap?.()) state.closing.motion?.cancel();
    const kind = String(detail?.kind ?? dialog.dataset.kind ?? '');
    const title = String(detail?.title ?? dialog.querySelector('h2')?.textContent ?? '').trim();
    const dataKey = detail ? identity(detail.data) : state.kind === kind && state.title === title ? state.identity : '';
    const signature = JSON.stringify([kind, title, dataKey]);
    const fresh = !state.open;
    if (dialog.open && (fresh || state.signature !== signature)) {
      discardGhost(state);
      elementMotions.get(dialog)?.cancel();
      const source = getMotionSource();
      if (fresh) state.trail = [];
      if (!fresh && source?.sheet?.dialog === dialog && nestedSheet(dialog, state, source, signature)) {
        state.kind = kind; state.title = title; state.identity = dataKey; state.signature = signature;
        return;
      }
      state.source = fresh ? source : source || state.source;
      // Only a fresh opening morphs; new content inside an open sheet keeps the short settle.
      if (fresh) state.morph = true;
      const entry = dialogGeometry(dialog.getBoundingClientRect(), state.source, dialog, fresh);
      const clip = entry.clip;
      animateElement(dialog, { x: entry.x, y: entry.y, scale: entry.scale, ...(clip ? { reveal: 0 } : { opacity: fresh ? 0.72 : 0.82 }) },
        { x: 0, y: 0, scale: 1, ...(clip ? { reveal: 1 } : { opacity: 1 }) }, {
          origin: entry.origin, config: dialogSpring(kind),
          onUpdate: value => {
            dialog.style.setProperty('--fluid-backdrop-opacity', fresh ? clamp(clip ? value.reveal : value.opacity, 0, 1) : 1);
            applyReveal(dialog, clip, value.reveal);
          },
          onRest: () => { dialog.style.removeProperty('--fluid-backdrop-opacity'); if (clip) dialog.style.removeProperty('clip-path'); },
        });
    } else if (!dialog.open && state.open && !state.closing) elementMotions.get(dialog)?.cancel();
    state.open = dialog.open;
    state.kind = kind;
    state.title = title;
    state.identity = dataKey;
    state.signature = signature;
  };
  const unbind = (dialog, state) => {
    pendingUpdates.delete(dialog);
    discardGhost(state);
    elementMotions.get(dialog)?.cancel();
    dialog.removeEventListener('cancel', state.cancel);
    if (dialog.close === state.close) {
      if (state.descriptor) Object.defineProperty(dialog, 'close', state.descriptor); else delete dialog.close;
    }
    for (const method of state.openMethods) if (dialog[method.name] === method.wrapper) {
      if (method.descriptor) Object.defineProperty(dialog, method.name, method.descriptor); else delete dialog[method.name];
    }
  };
  // Legacy painters finish their footer, labels and optional sections after
  // dispatching the sheet event. Measure once after that synchronous work, before
  // paint, rather than starting a spring with an intermediate window height.
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
    const state = { trail: [], open: false, ghost: null, closing: null, descriptor: Object.getOwnPropertyDescriptor(dialog, 'close'), openMethods: [], source: null, kind: '', title: '', identity: '', signature: '' };
    state.close = function (...args) {
      if (this !== dialog) return nativeClose.apply(this, args);
      const closing = exit(dialog, state);
      let result;
      try { result = nativeClose.apply(dialog, args); } catch (error) { closing?.motion?.cancel(); throw error; }
      // Existing application guards may intentionally refuse close (for example onboarding).
      if (dialog.open) { closing?.motion?.cancel(); return result; }
      state.open = false;
      closing?.markClosed?.();
      closing?.play?.();
      return result;
    };
    dialog.close = state.close;
    for (const name of ['show', 'showModal']) {
      const original = dialog[name], descriptor = Object.getOwnPropertyDescriptor(dialog, name);
      const wrapper = function (...args) {
        if (this === dialog && state.closing) state.closing.motion?.cancel();
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
        if (event.defaultPrevented || dialog.open) closing?.motion?.cancel();
        else { state.open = false; closing?.markClosed?.(); closing?.play?.(); }
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
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      const dialog = target?.closest('dialog');
      if (dialog && !dialog.closest('.fluid-exit-layer, .fluid-page-exit-layer, .fluid-sheet-ghost-layer')) changed.set(dialog, true);
      for (const node of record.addedNodes || []) {
        if (node.nodeType !== 1 || node.closest('.fluid-exit-layer, .fluid-page-exit-layer, .fluid-sheet-ghost-layer')) continue;
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

function installPageExits(listen) {
  const app = document.getElementById('app');
  let currentPage = root().dataset.page || window.TerritorioShell?.page?.();
  const history = [];
  const ghosts = new Set();
  const discard = () => { for (const layer of ghosts) layer.remove(); ghosts.clear(); };
  const before = event => {
    const nextPage = event.detail?.page;
    if (!nextPage || nextPage === currentPage) return;
    discard();
    const source = getMotionSource(), previous = history.at(-1);
    const goingBack = !source?.inNav&&(previous?.from === nextPage || /back|cancel-product|cancel-sale/.test(source?.action || ''));
    if(source?.inNav)history.length=0;
    const subview = app.querySelector(':scope > .subview');
    if (goingBack && subview) {
      // Revealing the existing parent is the return transition. Do not animate it as a new launch.
      // A lite device uses a short, coherent parent settle instead of freezing
      // hundreds of computed styles for a full-page snapshot on every return.
      skipNextPageEntry = !limited();
      pendingPageEntry = null;
      // The page returns whole into the card that opened it. A checkout already closes its own
      // native sheet, so a page copy would flash stale sale content over the registered sale.
      const target = previous?.source;
      const back = target && !source?.insideDialog ? animatePageReturn(app, target) : null;
      if (back) {
        ghosts.add(back.layer);
        // The parent page is rendered right after this event, before the next frame. Re-aim at
        // the card's new place while keeping the spring's position and velocity.
        queueMicrotask(() => {
          const fresh = locateSource(target);
          if (fresh === target) return;
          const aim = wholeReturnGeometry({ left: 0, top: 0, width: innerWidth, height: innerHeight }, fresh, 0);
          if (aim && Math.abs(aim.scale - back.geometry.scale) < 0.01) back.motion.retarget({ x: aim.x, y: aim.y });
        });
      }
    } else if (!goingBack) capturePageEntry(app, source);
    if (goingBack) {
      const index = history.findLastIndex(entry => entry.from === nextPage);
      if (index >= 0) history.splice(index); else history.pop();
    } else history.push({ from: currentPage, page: nextPage, source });
    if (history.length > 20) history.shift();
    pageEntryMotion?.cancel(); pageEntryMotion=null;
    currentPage = nextPage;
  };
  listen(app, 'territorio:before-page', before);
  listen(document, 'visibilitychange', discard);
  listen(preference, 'change', discard);
  return () => { discard(); pageEntryMotion?.cancel(); pageEntryMotion=null; };
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
  const settle = () => { resetPress?.(); for (const motion of [...running]) motion.finish(); };
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
  cleanups.push(resetPress, installDialogs(), installPageExits(listen), () => settings.disconnect());
  return () => {
    installed = false;
    cleanups.reverse().forEach(fn => fn());
    for (const motion of [...running]) motion.cancel();
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
    root().classList.remove('fluid-motion');
  };
}
