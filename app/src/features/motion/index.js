import { stepSpring, springAtRest } from './spring.js';
import { naturalRect, reanchorPose, insightSheetGeometry } from './geometry.js';

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
  const seconds = previousTime ? Math.min((time - previousTime) / 1000, 0.064) : 1 / 60;
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
      const tolerance = key === 'opacity' || key === 'scale' ? 0.0005 : 0.04;
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

function captureMotionSource(event) {
  const control = event.target.closest?.('[data-action], summary, select, [role="button"], a[href]');
  if (!control || control.disabled || control.closest('[inert]')) return;
  const surface = control.closest('.product-card, .feira-card, .feira-stock-count, .feira-row, .kpi-item') || control;
  const bounds = surface.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  latestSource = {
    left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
    cx: bounds.left + bounds.width / 2, cy: bounds.top + bounds.height / 2,
    time: performance.now(), insideDialog: !!control.closest('dialog'), action: control.dataset.action || '',
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const isInsightSheet = kind => ['brain', 'sale-client', 'sale-origin', 'client', 'client-detail', 'consumption-detail'].includes(kind) || String(kind || '').startsWith('advisor');
function dialogGeometry(bounds, source, kind) {
  return isInsightSheet(kind) ? insightSheetGeometry(bounds, source, limited()) : sourceGeometryFromBounds(bounds, source);
}
function dialogSpring(kind, closing = false) {
  if (isInsightSheet(kind)) return closing ? { stiffness: 720, damping: 52 } : { stiffness: 560, damping: limited() ? 47 : 35 };
  return closing ? { stiffness: 600, damping: 44 } : { stiffness: 420, damping: limited() ? 42 : 30 };
}
function sourceGeometryFromBounds(bounds, source, page = false) {
  const lite = limited();
  if (!source || !bounds.width || !bounds.height) return {
    x: 0, y: lite ? 12 : 36, scale: lite ? 0.96 : 0.84, origin: '50% 65%',
  };
  const dx = source.cx - (bounds.left + bounds.width / 2), dy = source.cy - (bounds.top + bounds.height / 2);
  const ratio = Math.sqrt(source.width * source.height / (bounds.width * bounds.height));
  return {
    x: clamp(dx * (lite ? 0.12 : 0.6), lite ? -16 : -90, lite ? 16 : 90),
    y: clamp(dy * (lite ? 0.12 : 0.6), lite ? -22 : -100, lite ? 22 : 100),
    scale: lite ? 0.96 : clamp(ratio, page ? 0.8 : 0.72, 0.86),
    origin: `${clamp(source.cx - bounds.left, 0, bounds.width).toFixed(2)}px ${clamp(source.cy - bounds.top, 0, bounds.height).toFixed(2)}px`,
  };
}

const properties = ['translate', 'scale', 'opacity', 'will-change', 'transform-origin'];
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
  element.style.willChange = [...new Set(Object.keys(from).map(k => k === 'x' || k === 'y' ? 'translate' : k))].join(', ');
  const motion = springMotion(element, from, to, value => {
    if ('x' in value || 'y' in value) element.style.translate = `${(value.x || 0).toFixed(3)}px ${(value.y || 0).toFixed(3)}px`;
    if ('scale' in value) element.style.scale = value.scale.toFixed(5);
    if ('opacity' in value) element.style.opacity = Math.max(0, Math.min(1, value.opacity)).toFixed(4);
    options.onUpdate?.(value);
  }, clean, options.config);
  elementMotions.set(element, motion);
  return motion;
}

// The legacy renderer rewrites the page even for input changes: the caller tracks the route and
// invokes this only when it changes. Neither #app nor .subview is ever transformed: their fixed
// bars keep their viewport anchor. Only children without fixed descendants can expand.
export function animatePageChange(app) {
  if (skipNextPageEntry) { skipNextPageEntry = false; return; }
  if (!app || !enabled()) return;
  const source = getMotionSource();
  const candidates = [...app.children].flatMap(el => el.classList.contains('subview') ? [...el.children] : [el]);
  // Read all geometry before writing any transforms. Otherwise every card forces
  // another layout on a modest phone. Offscreen cards need no entrance work.
  const prepared = candidates.filter(el => !el.hidden && !el.matches('script, style')).slice(0, limited() ? 3 : 8).map(element => {
    const bounds = element.getBoundingClientRect();
    const fixed = getComputedStyle(element).position === 'fixed' || element.querySelector(fixedContentSelector);
    return {element,bounds,fixed,entry:sourceGeometryFromBounds(bounds,source,true)};
  }).filter(({bounds})=>bounds.width && bounds.height && bounds.top<innerHeight && bounds.bottom>0);
  for (const {element,fixed,entry} of prepared) {
    if (fixed || element.classList.contains('subview')) {
      animateElement(element, { opacity: 0.3 }, { opacity: 1 }, { config: { stiffness: 410, damping: 39 } });
    } else {
      animateElement(element, { x: entry.x, y: entry.y, scale: entry.scale, opacity: 0.25 },
        { x: 0, y: 0, scale: 1, opacity: 1 }, { origin: entry.origin, config: { stiffness: 420, damping: limited() ? 42 : 30 } });
    }
  }
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
  const nativeExit = !!globalThis.CSS?.supports?.('transition-behavior', 'allow-discrete') && CSS.supports('overlay', 'auto');
  const discardGhost = state => { const ghost = state.ghost; state.ghost = null; ghost?.remove(); };
  const exit = (dialog, state) => {
    if (!enabled() || !dialog.open || state.closing) return null;
    // One bounds read and one computed-style read, with no writes between them.
    const surface = surfaceState(dialog);
    if (!surface.rect.width || !surface.rect.height) return null;
    const close = dialogGeometry(surface.rect, state.source, state.kind);
    const origin = close.origin.split(' ').map((value, i) => value.includes('%') ? parseFloat(value) / 100 * (i ? surface.rect.height : surface.rect.width) : parseFloat(value));
    const pose = reanchorPose(surface.pose, origin[0], origin[1]);
    const from = { x: pose.x, y: pose.y, scale: pose.scale, opacity: pose.opacity };
    const to = { x: close.x, y: close.y, scale: close.scale, opacity: 0 };
    const backdrop = getComputedStyle(dialog, '::backdrop');
    const backdropColor = backdrop.backgroundColor;
    const backdropOpacity = Number(backdrop.opacity);
    const token = { motion: null, native: nativeExit };
    elementMotions.get(dialog)?.cancel();
    if (nativeExit) {
      // The browser retains the actual top-layer pixels via discrete display/overlay transitions.
      // close(), returnValue, focus and business handlers still complete synchronously.
      const saved = [...surfaceProperties, '--fluid-backdrop-opacity', '--fluid-backdrop-color'].map(property => [property, dialog.style.getPropertyValue(property), dialog.style.getPropertyPriority(property)]);
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
        for (const [property, value, priority] of saved) {
          if (value) dialog.style.setProperty(property, value, priority); else dialog.style.removeProperty(property);
        }
      };
      state.closing = token;
      token.markClosed = () => { dialog.inert = true; dialog.setAttribute('aria-hidden', 'true'); };
      placeSurface(dialog, surface);
      dialog.style.setProperty('--fluid-backdrop-color', backdropColor);
      dialog.classList.add('fluid-native-exit');
      token.motion = animateElement(dialog, from, to, {
        origin: close.origin, config: dialogSpring(state.kind, true),
        onUpdate: value => dialog.style.setProperty('--fluid-backdrop-opacity', clamp(value.opacity / Math.max(0.001, pose.opacity), 0, 1) * backdropOpacity),
        onRest: restore,
      });
      inheritVelocity(token.motion, pose);
      return token;
    }
    // Older WebViews get a bounded fallback. Never duplicate a large form or receipt on close.
    const clone = !limited() && boundedSurface(dialog, 80) ? makeVisualCopy(dialog) : null;
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
          origin: close.origin, config: isInsightSheet(state.kind) ? dialogSpring(state.kind, true) : { stiffness: 650, damping: 47 },
          onRest: () => { if (state.ghost === layer) discardGhost(state); },
        });
        inheritVelocity(motion, pose);
      }
      animateElement(shade, { opacity: backdropOpacity }, { opacity: 0 }, {
        config: isInsightSheet(state.kind) ? dialogSpring(state.kind, true) : { stiffness: 650, damping: 47 },
        onRest: () => { if (!clone && state.ghost === layer) discardGhost(state); },
      });
    };
    return token;
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
    if (state.closing && !dialog.open && contentChanged) state.closing.motion?.cancel();
    const kind = String(detail?.kind ?? dialog.dataset.kind ?? '');
    const title = String(detail?.title ?? dialog.querySelector('h2')?.textContent ?? '').trim();
    const dataKey = detail ? identity(detail.data) : state.kind === kind && state.title === title ? state.identity : '';
    const signature = JSON.stringify([kind, title, dataKey]);
    const fresh = !state.open;
    if (dialog.open && (fresh || state.signature !== signature)) {
      discardGhost(state);
      elementMotions.get(dialog)?.cancel();
      const source = getMotionSource();
      state.source = fresh ? source : source || state.source;
      const entry = dialogGeometry(dialog.getBoundingClientRect(), state.source, kind);
      animateElement(dialog, { x: entry.x, y: entry.y, scale: entry.scale, opacity: fresh ? 0.05 : 0.3 },
        { x: 0, y: 0, scale: 1, opacity: 1 }, {
          origin: entry.origin, config: dialogSpring(kind),
          onUpdate: value => dialog.style.setProperty('--fluid-backdrop-opacity', fresh ? clamp(value.opacity, 0, 1) : 1),
          onRest: () => dialog.style.removeProperty('--fluid-backdrop-opacity'),
        });
    } else if (!dialog.open && state.open && !state.closing) elementMotions.get(dialog)?.cancel();
    state.open = dialog.open;
    state.kind = kind;
    state.title = title;
    state.identity = dataKey;
    state.signature = signature;
  };
  const unbind = (dialog, state) => {
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
  const bind = dialog => {
    if (!(dialog instanceof HTMLDialogElement) || states.has(dialog) || dialog.classList.contains('fluid-exit-ghost')) return;
    const nativeClose = dialog.close;
    const state = { open: false, ghost: null, closing: null, descriptor: Object.getOwnPropertyDescriptor(dialog, 'close'), openMethods: [], source: null, kind: '', title: '', identity: '', signature: '' };
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
    update(event.target, event.detail);
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
      if (dialog && !dialog.closest('.fluid-exit-layer, .fluid-page-exit-layer')) changed.set(dialog, true);
      for (const node of record.addedNodes || []) {
        if (node.nodeType !== 1 || node.closest('.fluid-exit-layer, .fluid-page-exit-layer')) continue;
        if (node.matches('dialog')) bind(node);
        node.querySelectorAll('dialog').forEach(bind);
      }
    }
    for (const [dialog, contentChanged] of changed) { bind(dialog); update(dialog, null, contentChanged); }
    for (const [dialog, state] of states) if (!dialog.isConnected) { unbind(dialog, state); states.delete(dialog); }
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['open', 'data-kind'] });
  return () => {
    observer.disconnect();
    document.removeEventListener('territorio:sheet', semantic, true);
    for (const [dialog, state] of states) unbind(dialog, state);
    states.clear();
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
    const goingBack = previous?.from === nextPage || /back|cancel-product|cancel-sale/.test(source?.action || '');
    const subview = app.querySelector(':scope > .subview');
    if (goingBack && subview) {
      // Revealing the existing parent is the return transition. Do not animate it as a new launch.
      skipNextPageEntry = true;
      // A checkout already closes its own native sheet; a second page copy would flash stale sale
      // content over the newly registered sale. Lite devices also avoid page copies altogether.
      if (enabled() && !limited() && !source?.insideDialog) {
        const captures = [];
        let nodes = 0;
        for (const part of subview.children) {
          if (captures.length >= 2 || nodes >= 160) break;
          if (part.hidden || part.matches('script, style') || part.matches(fixedContentSelector) || part.querySelector(fixedContentSelector)) continue;
          if (!boundedSurface(part, 80)) continue;
          const surface = surfaceState(part);
          const rect = surface.rect;
          if (surface.display === 'none' || !rect.width || !rect.height || rect.top >= innerHeight || rect.top + rect.height <= 0) continue;
          if (surface.position === 'fixed') continue;
          captures.push({ part, surface });
          nodes += part.getElementsByTagName('*').length + 1;
        }
        // All layout reads finish before any insertion/style mutation. At most two small visible
        // flow panels are copied; never #app, .subview, fixed bars or a complete long form.
        if (captures.length) {
          const layer = document.createElement('div');
          layer.className = 'fluid-page-exit-layer';
          layer.inert = true;
          layer.setAttribute('aria-hidden', 'true');
          const context = document.createElement('div');
          context.className = subview.className + ' fluid-page-exit-context';
          layer.append(context);
          const prepared = captures.map(({ part, surface }) => {
            const copy = makeVisualCopy(part);
            placeSurface(copy, surface);
            copy.style.transform = 'none';
            context.append(copy);
            return { copy, surface };
          });
          document.body.append(layer);
          ghosts.add(layer);
          let remaining = prepared.length;
          for (const { copy, surface } of prepared) {
            const close = sourceGeometryFromBounds(surface.rect, previous?.source || source, true);
            const origin = close.origin.split(' ').map((value, i) => value.includes('%') ? parseFloat(value) / 100 * (i ? surface.rect.height : surface.rect.width) : parseFloat(value));
            const pose = reanchorPose(surface.pose, origin[0], origin[1]);
            const motion = animateElement(copy, { x: pose.x, y: pose.y, scale: pose.scale, opacity: pose.opacity },
              { x: close.x, y: close.y, scale: close.scale, opacity: 0 }, {
                origin: close.origin, config: { stiffness: 600, damping: 44 },
                onRest: () => { if (--remaining === 0) { layer.remove(); ghosts.delete(layer); } },
              });
            inheritVelocity(motion, pose);
          }
        }
      }
    }
    if (goingBack) {
      const index = history.findLastIndex(entry => entry.from === nextPage);
      if (index >= 0) history.splice(index); else history.pop();
    } else history.push({ from: currentPage, page: nextPage, source });
    if (history.length > 20) history.shift();
    currentPage = nextPage;
  };
  listen(app, 'territorio:before-page', before);
  listen(document, 'visibilitychange', discard);
  listen(preference, 'change', discard);
  return discard;
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

export function installFluidMotion() {
  if (installed) return () => {};
  installed = true;
  preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  root().classList.add('fluid-motion');
  const cleanups = [];
  const listen = (target, type, fn, options) => { target.addEventListener(type, fn, options); cleanups.push(() => target.removeEventListener(type, fn, options)); };
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
