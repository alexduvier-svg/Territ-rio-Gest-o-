import { createPhysicalFrameMotion, fluidMotionAllowed, fluidMotionLite } from './index.js';
import { stepSpring, springAtRest } from './spring.js';

// Expansion state belongs to a semantic section, not to a DOM node: the legacy
// renderer replaces nodes after a tap. Only explicit expansion actions enter here.
const ACTIONS = new Set(['clients-toggle', 'week-day', 'week-empty-days', 'event-history', 'brain-stock-toggle']);
const STYLE = ['height', 'max-height', 'overflow', 'box-sizing', 'will-change', 'margin-bottom'];
const BODY_STYLE = ['opacity', 'translate'];
const restore = (element, saved) => {
  for (const [name, value, priority] of saved) {
    if (value) element.style.setProperty(name, value, priority);
    else element.style.removeProperty(name);
  }
};
const save = (element, names) => names.map(name => [name, element.style.getPropertyValue(name), element.style.getPropertyPriority(name)]);
const heightOf = element => element ? element.offsetHeight : 0;
const visible = element => !!element?.isConnected && !!element.getClientRects().length;

function visualCopy(element) {
  if (!element) return null;
  const clone = element.cloneNode(true);
  const fields = element.querySelectorAll('input, textarea, select');
  clone.querySelectorAll('input, textarea, select').forEach((field, index) => {
    if (field.type !== 'file') field.value = fields[index]?.value ?? '';
    if ('checked' in field) field.checked = fields[index]?.checked ?? false;
  });
  for (const child of [clone, ...clone.querySelectorAll('*')]) {
    for (const name of ['id', 'name', 'autofocus', 'for', 'data-fluid-section-managed', 'data-management-section']) child.removeAttribute(name);
    child.classList.remove('fluid-animating', 'fluid-press', 'fluid-section-running');
  }
  const computed = getComputedStyle(element);
  for (const name of ['display', 'padding', 'border', 'border-radius', 'background', 'color', 'font', 'box-shadow', 'gap', 'grid-template-columns', 'flex-direction']) {
    clone.style.setProperty(name, computed.getPropertyValue(name));
  }
  Object.assign(clone.style, { position: 'static', margin: '0', width: '100%', maxWidth: 'none', height: 'auto', maxHeight: 'none', overflow: 'visible', opacity: '1', translate: 'none', scale: 'none', transform: 'none', boxSizing: 'border-box' });
  clone.inert = true;
  clone.setAttribute('aria-hidden', 'true');
  return clone;
}

function bodyNodes(element) {
  if (element.matches('.client-list')) return [...element.children];
  return [...element.children].filter(child => !child.matches('summary, .dimension-heading, .brain-stock-heading, .brain-stock-intro, button'));
}

export function installSectionMotion() {
  const active = new Map(), pending = new Map(), detailIds = new WeakMap();
  let nextDetail = 0, flushFrame = 0, disposed = false;
  const page = () => document.documentElement.dataset.page || '';
  const withinApp = selector => document.getElementById('app')?.querySelector(selector);
  const sameAction = (action, field, value) => [...document.querySelectorAll('[data-action]')].find(button => !button.closest('.fluid-section-ghost') && button.dataset.action === action && (!field || button.dataset[field] === value));

  const remember = descriptor => {
    if (pending.has(descriptor.key)) return;
    const element = descriptor.find();
    const state = active.get(descriptor.key);
    if (!element && !descriptor.anchor) return;
    if (element?.matches('details')) element.dataset.fluidSectionManaged = 'true';
    pending.set(descriptor.key, {
      ...descriptor, route: page(),
      height: state?.height.position ?? heightOf(element),
      velocity: state?.height.velocity ?? 0,
      copy: fluidMotionLite() ? null : state?.closing && state.copy ? visualCopy(state.copy) : visualCopy(element),
    });
    if (!flushFrame) flushFrame = requestAnimationFrame(flush);
  };

  const prepareGhost = (copy, target) => {
    if (!copy) return null;
    const layer = document.createElement('div');
    layer.className = 'fluid-section-ghost';
    layer.inert = true;
    layer.setAttribute('aria-hidden', 'true');
    const context = document.createElement('div');
    context.className = target.parentElement?.className || '';
    Object.assign(context.style, { display: 'block', margin: '0', padding: '0', border: '0', background: 'transparent', width: '100%' });
    context.append(copy);
    layer.append(context);
    // Outside #app: its renderer/decorators must never count cloned controls.
    (target.closest('dialog[open]') || document.body).append(layer);
    return layer;
  };

  const positionGhost = (layer, target, height) => {
    if (!layer) return;
    const bounds = target.getBoundingClientRect();
    const parent = layer.offsetParent;
    let x = bounds.left, y = bounds.top, width = bounds.width, available = Math.max(0, innerHeight - bounds.top), factor = 1;
    if (parent instanceof HTMLElement) {
      const origin = parent.getBoundingClientRect();
      const scaleX = parent.offsetWidth ? origin.width / parent.offsetWidth : 1;
      const scaleY = parent.offsetHeight ? origin.height / parent.offsetHeight : 1;
      x = (x - origin.left) / scaleX - parent.clientLeft + parent.scrollLeft;
      y = (y - origin.top) / scaleY - parent.clientTop + parent.scrollTop;
      width /= scaleX;
      available /= scaleY;
      factor = scaleY;
    }
    Object.assign(layer.style, { left: x + 'px', top: y + 'px', width: width + 'px', height: Math.max(0, Math.min(height, available)) + 'px' });
    return factor;
  };

  function animate(record) {
    active.get(record.key)?.motion.cancel();
    let target = record.find();
    let placeholder = false;
    if (!target && record.anchor && record.height > 0) {
      const anchor = record.anchor();
      if (!visible(anchor)) return;
      target = document.createElement('div');
      target.className = 'fluid-section-placeholder';
      target.inert = true;
      target.setAttribute('aria-hidden', 'true');
      anchor.after(target);
      placeholder = true;
    }
    if (!visible(target)) return;
    const destination = placeholder ? 0 : heightOf(target);
    if (Math.abs(destination - record.height) < 0.5) {
      if (target.matches('details')) delete target.dataset.fluidSectionManaged;
      if (placeholder) target.remove();
      return;
    }
    const original = save(target, STYLE);
    const bodies = bodyNodes(target).map(element => ({ element, original: save(element, BODY_STYLE) }));
    const gap = record.anchor && /grid|flex/.test(getComputedStyle(target.parentElement).display) ? parseFloat(getComputedStyle(target.parentElement).rowGap) || 0 : 0;
    const layer = prepareGhost(record.copy, target);
    const state = { target, copy: record.copy, layer, closing: destination < record.height, height: { position: record.height, velocity: record.velocity }, progress: { position: 0, velocity: 0 }, motion: null };
    const config = { stiffness: fluidMotionLite() ? 460 : 390, damping: fluidMotionLite() ? 46 : 36, mass: 1 };
    target.classList.add('fluid-section-running');
    if (target.matches('details')) target.dataset.fluidSectionManaged = 'true';
    Object.assign(target.style, { maxHeight: 'none', overflow: 'hidden', boxSizing: 'border-box', willChange: 'height' });
    const draw = () => {
      const progress = Math.max(0, Math.min(1, state.progress.position));
      const height = Math.max(0, state.height.position);
      target.style.height = height.toFixed(3) + 'px';
      if (gap) target.style.marginBottom = (-gap * (placeholder ? progress : 1 - progress)).toFixed(3) + 'px';
      if (layer) { positionGhost(layer, target, height); layer.style.opacity = String(1 - progress); }
      for (const body of bodies) {
        body.element.style.opacity = String(0.55 + progress * 0.45);
        body.element.style.translate = '0 ' + (-(fluidMotionLite() ? 1 : 3) * (1 - progress)).toFixed(3) + 'px';
      }
    };
    const finish = () => {
      restore(target, original);
      for (const body of bodies) restore(body.element, body.original);
      target.classList.remove('fluid-section-running');
      if (target.matches('details')) delete target.dataset.fluidSectionManaged;
      layer?.remove();
      if (placeholder) target.remove();
      if (active.get(record.key) === state) active.delete(record.key);
      state.copy = state.layer = null;
    };
    active.set(record.key, state);
    state.motion = createPhysicalFrameMotion(target, {
      advance(seconds) {
        Object.assign(state.height, stepSpring(state.height, destination, seconds, config));
        Object.assign(state.progress, stepSpring(state.progress, 1, seconds, config));
        return springAtRest(state.height, destination, 0.2, 2) && springAtRest(state.progress, 1, 0.001, 0.01);
      }, draw, onRest: finish,
    });
  }

  function flush() {
    flushFrame = 0;
    const records = [...pending.values()];
    pending.clear();
    for (const record of records) {
      if (!disposed && fluidMotionAllowed() && record.route === page()) animate(record);
      else { const target = record.find(); if (target?.matches('details')) delete target.dataset.fluidSectionManaged; }
    }
  }

  const capture = event => {
    if (!fluidMotionAllowed() || event.target.closest?.('.fluid-section-ghost')) return;
    const summary = event.target.closest?.('summary');
    if (summary && summary.parentElement instanceof HTMLDetailsElement) {
      const details = summary.parentElement;
      if (!detailIds.has(details)) detailIds.set(details, ++nextDetail);
      remember({ key: 'details:' + detailIds.get(details), find: () => details.isConnected ? details : null });
      return;
    }
    const dimension = event.target.closest?.('.dimension-pill.acc');
    if (dimension && !event.target.closest('.dimension-add') && event.target.closest('.dimension-heading, .choice')) {
      [...document.querySelectorAll('#app .registration-dimensions .dimension-pill')].forEach((pill, index) => {
        remember({ key: 'dimension:' + index, find: () => document.querySelectorAll('#app .registration-dimensions .dimension-pill')[index] });
      });
      return;
    }
    const button = event.target.closest?.('[data-action]');
    const action = button?.dataset.action;
    if (!ACTIONS.has(action)) return;
    if (action === 'clients-toggle') remember({ key: action, find: () => withinApp('.client-list'), anchor: () => sameAction(action) });
    else if (action === 'week-day') {
      const day = button.dataset.day;
      remember({ key: action + ':' + day, find: () => sameAction(action, 'day', day)?.closest('.hs-day, .week-day') });
    } else if (action === 'week-empty-days') remember({ key: action, find: () => withinApp('.empty-days') });
    else if (action === 'event-history') remember({ key: action, find: () => withinApp('.fair-history') });
    else if (action === 'brain-stock-toggle') remember({ key: action, find: () => document.querySelector('dialog[open] .brain-stock-diagnostic') });
  };
  // Window capture runs before interface.js changes its accordion classes.
  window.addEventListener('click', capture, true);
  return () => {
    disposed = true;
    window.removeEventListener('click', capture, true);
    if (flushFrame) cancelAnimationFrame(flushFrame);
    for (const record of pending.values()) { const target = record.find(); if (target?.matches('details')) delete target.dataset.fluidSectionManaged; }
    pending.clear();
    for (const state of [...active.values()]) state.motion.cancel();
    active.clear();
  };
}
