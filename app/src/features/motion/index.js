import { stepSpring, springAtRest } from './spring.js';
import { compositorMotion } from './compositor.js';
import { naturalRect, reanchorPose, insightSheetGeometry, navigationEntryGeometry, wholeReturnGeometry, closingOpacity } from './geometry.js';

// One frame loop for the whole interface. Idle springs do not request frames.
const running = new Set();
const surfaces = new Set();
const elementMotions = new WeakMap();
let frame = 0, previousTime = 0, installed = false;
let preference;
let latestSource = null;
let skipNextPageEntry = false;
let renderedFrames = 0;
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
export const getMotionDiagnostics = () => ({ active: running.size + surfaces.size, compositorSurfaces: surfaces.size, pendingFrame: !!frame, renderedFrames, lite: limited() });

export function getMotionSource(maxAge = 5000) {
  return latestSource && performance.now() - latestSource.time < maxAge ? { ...latestSource } : null;
}

export function restoreMotionSource(source){if(source)latestSource={...locateSource(source),time:performance.now()};}

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
    const geometry = wholeReturnGeometry(bounds, source, sheetRadius);
    if (geometry) return geometry;
  }
  return insightSheetGeometry(bounds, source, limited());
}
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
  if (!options.onUpdate) {
    const motion=compositorMotion(element,from,to,value=>({
      ...(('x' in value||'y' in value)?{translate:`${(value.x||0).toFixed(3)}px ${(value.y||0).toFixed(3)}px`}:{}),
      ...('scale' in value?{scale:value.scale.toFixed(5)}:{}),
      ...('opacity' in value?{opacity:String(clamp(value.opacity,0,1))}:{}),
      ...(options.frame?.(value)||{}),
    }),clean,{stiffness:560,damping:limited()?47:35,...options.config},surfaces);
    elementMotions.set(element,motion);return motion;
  }
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
// never transformed; the actual outgoing nodes ride one fixed viewport layer during return.
let pendingPageEntry = null;

// Outgoing surfaces retain their actual nodes for the short return. Incoming
// surfaces are always live. No cloneNode or descendant computed-style scan.

function pageContext(app, nodes) {
  const rect = app.getBoundingClientRect(), computed = getComputedStyle(app);
  const context = document.createElement('div');
  context.id = 'app';
  context.className = app.className + ' fluid-page-morph-context motion-page-'+(root().dataset.page||'');
  Object.assign(context.style, { top: rect.top + 'px', left: rect.left + 'px', width: rect.width + 'px', padding: computed.padding });
  context.append(...nodes);
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

function capturePageEntry(app,source) {
  // The live incoming panels share one viewport pivot. No background or incoming
  // page clone is needed on the critical tap path, even on a long product grid.
  pendingPageEntry=enabled()&&source&&!source.inNav?{source,time:performance.now()}:null;
}

function morphPage(card, shade, layer, source, closing, pose) {
  const geometry = wholeReturnGeometry({ left: 0, top: 0, width: innerWidth, height: innerHeight }, source, 0);
  if (!geometry) return false;
  const open = { x: 0, y: 0, scale: 1, reveal: 1 }, shut = { x: geometry.x, y: geometry.y, scale: geometry.scale, reveal: 0 };
  animateElement(shade,{opacity:closing?1:0},{opacity:closing?0:1},{config:dialogSpring('page',closing)});
  const from=closing&&pose?{x:pose.x,y:pose.y,scale:pose.scale,reveal:1}:closing?open:shut;
  const motion = animateElement(card, from, closing ? shut : open, {
    origin: geometry.origin, config: dialogSpring('page', closing),
    frame: value => closing ? {opacity:(closingOpacity(value.reveal)*(pose?.opacity??1)).toFixed(4)} : {},
    onRest: () => layer.remove(),
  });
  if(pose?.velocity)motion?.setVelocity(pose.velocity);
  return motion ? { motion, geometry } : null;
}


function animatePageReturn(app, source, pose) {
  if (!enabled()) return null;
  const nodes=[...app.children];
  const layer = pageLayer(), shade = document.createElement('div'), card = document.createElement('div');
  shade.className = 'fluid-page-morph-shade';
  card.className = 'fluid-page-morph-surface';
  card.append(pageContext(app, nodes));
  layer.append(shade, card);
  document.body.append(layer);
  const morph = morphPage(card, shade, layer, source, true, pose);
  if (morph) return { layer, ...morph };
  layer.remove();
  return null;
}

// Flow panels share one viewport pivot and one spring. Their relative positions stay
// fixed throughout the launch; fixed toolbars keep their viewport containing block.
let pageEntryMotion = null;
export function continuePageMotion(app){
 if(pageEntryMotion?.active()&&pageEntryMotion.elements.some(el=>!el.isConnected))animatePageChange(app,true);
}
export function animatePageChange(app,continuing=false) {
  const old=continuing&&pageEntryMotion?.active()?pageEntryMotion:null;
  const sample=old?.sample();
  pageEntryMotion?.cancel();
  pageEntryMotion = null;
  if (skipNextPageEntry) { skipNextPageEntry = false; return; }
  if (!app || !enabled()) return;
  const pending=pendingPageEntry;pendingPageEntry=null;
  const source=old?.source||(pending&&performance.now()-pending.time<1000?pending.source:null)||getMotionSource(900),navigation=!!source?.inNav;
  const viewport={left:0,top:0,width:innerWidth,height:innerHeight};
  const entry = old?{...sample,origin:old.origin}:navigation?navigationEntryGeometry(innerWidth,innerHeight,source,limited()):(!limited()&&source&&app.querySelector(':scope>.subview')?wholeReturnGeometry(viewport,source,0):null)||insightSheetGeometry(viewport,source,limited());
  const pivot = entry.origin.split(' ').map(parseFloat);
  const candidates = [...app.children].flatMap(el => el.classList.contains('subview') ? [...el.children] : [el]);
  const prepared = candidates.filter(el => !el.hidden && !el.matches('script, style')).map(element => {
    const bounds = element.getBoundingClientRect();
    return {element,bounds};
  }).filter(({bounds})=>bounds.width && bounds.height && bounds.top<innerHeight && bounds.bottom>0).slice(0,12);
  if (!prepared.length) return;
  const tracks=[];
  for(const {element,bounds} of prepared){
    const origin=`${pivot[0]-bounds.left}px ${pivot[1]-bounds.top}px`;
    const motion=animateElement(element,{x:entry.x,y:entry.y,scale:entry.scale,opacity:sample?.opacity??.92},{x:0,y:0,scale:1,opacity:1},{origin,config:navigation?{stiffness:520,damping:limited()?44:30}:dialogSpring('page')});
    if(motion){if(sample)motion.setVelocity(sample.velocity);tracks.push(motion);}
  }
  pageEntryMotion={
    source,origin:entry.origin,elements:prepared.map(p=>p.element),active:()=>tracks.some(m=>surfaces.has(m)),
    sample:()=>{const v=tracks[0].values;return{x:v.x?.position||0,y:v.y?.position||0,scale:v.scale?.position??1,opacity:v.opacity?.position??1,velocity:Object.fromEntries(Object.entries(v).map(([k,s])=>[k,s.velocity]))};},
    cancel:()=>tracks.forEach(m=>m.cancel()),
  };
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
  if (existing && surfaces.has(existing)) {
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


function retainedSheet(dialog,children){
  const shell=document.createElement('dialog');shell.className=dialog.className;
  if(dialog.dataset.kind)shell.dataset.kind=dialog.dataset.kind;
  shell.classList.remove('fluid-native-exit','fluid-exit-closed','fluid-animating','fluid-press');shell.setAttribute('open','');
  shell.inert=true;shell.setAttribute('aria-hidden','true');
  // Detached references survive an immediate legacy innerHTML rewrite; move them
  // only when the original surface cannot continue its native top-layer return.
  shell.append(...children);return shell;
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
  if(motion.setVelocity){motion.setVelocity({x:pose.velocityX,y:pose.velocityY,scale:pose.velocityScale,opacity:pose.velocityOpacity});return;}
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
      // The browser retains the actual top-layer surface via discrete display/overlay transitions.
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
        frame: value => ({opacity:fade(value).toFixed(4)}),
        onRest: restore,
      });
      inheritVelocity(token.motion, pose);
      // The shared legacy dialog is often emptied or rewritten right after close() (cancelling a
      // product option, for example). Keep references to the actual nodes that were on screen; if the content
      // changes mid-flight, the copy finishes the same return instead of the sheet falling apart.
      const retained=[...dialog.children];
      let copy=null;
      const scrollTop = dialog.querySelector('.dialog-content')?.scrollTop || 0;
      token.swap = () => {
        const motion = token.motion;
        if (!retained.length || !motion || state.closing !== token || !running.has(motion) && !surfaces.has(motion)) return false;
        copy=retainedSheet(dialog,retained);
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
          frame: value => ({opacity:fade(value).toFixed(4)}),
          onRest: () => { if (state.ghost === layer) discardGhost(state); },
        });
        if(ghost?.setVelocity)ghost.setVelocity(Object.fromEntries(Object.entries(now).map(([key,s])=>[key,s.velocity])));
        animateElement(shade,{opacity:Number(shade.style.opacity)},{opacity:0},{config:dialogSpring(state.kind,true)});
        return true;
      };
      return token;
    }
    // Older WebViews get a bounded fallback. Never duplicate a large form or receipt on close.
    const clone=retainedSheet(dialog,[...dialog.children]);
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
          frame: value => ({opacity:fade(value).toFixed(4)}),
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
        frame: value => ({opacity:closingOpacity(value.reveal).toFixed(4)}),
        onRest: () => { if (state.ghost === ghost.layer) discardGhost(state); },
      });
      if (!motion) discardGhost(state);
      // The parent sheet comes forward from just behind.
      animateElement(dialog, { scale: limited() ? 0.985 : 0.965 }, { scale: 1 }, { config: dialogSpring(state.kind) });
      return true;
    }
    const entry = wholeReturnGeometry(dialog.getBoundingClientRect(), source, radius);
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
      frame: () => ({}),
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
          frame: () => ({}),
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
  let previewRevert=false;
  const discard = () => { for (const layer of ghosts) layer.remove(); ghosts.clear(); };
  const before = event => {
    const nextPage = event.detail?.page;
    if (!nextPage || nextPage === currentPage) return;
    discard();
    if(previewRevert){previewRevert=false;skipNextPageEntry=true;pendingPageEntry=null;history.pop();pageEntryMotion?.cancel();currentPage=nextPage;return;}
    const source = getMotionSource(), previous = history.at(-1);
    const goingBack = !source?.inNav&&(previous?.from === nextPage || /back|cancel-product|cancel-sale/.test(source?.action || ''));
    if(source?.inNav)history.length=0;
    const entry=pageEntryMotion?.active()?pageEntryMotion:null;
    let pose=entry?.sample();
    if(pose){const [ox,oy]=entry.origin.split(' ').map(parseFloat),shiftX=ox-innerWidth/2,shiftY=oy-innerHeight/2;pose={...pose,x:pose.x+shiftX*(1-pose.scale),y:pose.y+shiftY*(1-pose.scale),velocity:{...pose.velocity,x:(pose.velocity.x||0)-shiftX*(pose.velocity.scale||0),y:(pose.velocity.y||0)-shiftY*(pose.velocity.scale||0)}};}
    pageEntryMotion?.cancel();pageEntryMotion=null;
    const subview = app.querySelector(':scope > .subview');
    if (goingBack && subview) {
      // Revealing the existing parent is the return transition. Do not animate it as a new launch.
      // A lite device uses a short, coherent parent settle instead of freezing
      // hundreds of computed styles for a full-page snapshot on every return.
      skipNextPageEntry = true;
      pendingPageEntry = null;
      // The page returns whole into the card that opened it. A checkout already closes its own
      // native sheet, so a page copy would flash stale sale content over the registered sale.
      const target = previous?.source;
      const back = target && !source?.insideDialog ? animatePageReturn(app, target, pose) : null;
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
  listen(document,'territorio:preview-revert',()=>{previewRevert=true;});
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
  const settle = () => { resetPress?.(); for (const motion of [...running,...surfaces]) motion.finish(); };
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
    for (const motion of [...running,...surfaces]) motion.cancel();
    cancelAnimationFrame(frame); frame = 0; previousTime = 0;
    root().classList.remove('fluid-motion');
  };
}
