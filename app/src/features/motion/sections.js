import { fluidMotionAllowed, fluidMotionLite } from './index.js';
import { animate, SPRINGS } from './engine.js';

// Sections that expand inside a page or a sheet (details, "more" arrows, discount, client, state,
// calendar, a week day…). The renderer lays the page out once in its final state; the movement is
// then played on the compositor: the section is revealed by a clip that opens downward while what
// sits below slides from where it was. Closing, a copy of the old content folds away the same way.
// Nothing is laid out again during the movement, however long the page is.
// Expansion state belongs to a semantic section, not to a DOM node: the legacy renderer replaces
// nodes after a tap, so a section is found again after the render.
const ACTIONS = new Set(['clients-toggle', 'week-day', 'week-empty-days', 'event-history', 'brain-stock-toggle']);
const EXPANDER = /(^|-)(toggle|expand|more|collapse|less)(-|$)/;
const NOT_EXPANDER = /financial|privacy|effects|large-text|backup-reminder|test-reset|nav/;
const BLOCK = 'details, .dimension-pill, .hs-day, .week-day, .client-list, .fair-history, .empty-days, .brain-stock-diagnostic, .sale-product-group, .panel, section, .feira-rows';
const fixedContent = '.sale-dock, .multi-bar, #number-pad, .modal-number-pad, .sale-footer, .subview-footer, .checkout-footer';
const visible = element => !!element?.isConnected && !!element.getClientRects().length;
const curve = () => fluidMotionLite() ? SPRINGS.lite : SPRINGS.section;
const selectorOf = control => [...control.attributes].filter(attr => attr.name.startsWith('data-'))
  .map(attr => `[${attr.name}="${CSS.escape(attr.value)}"]`).join('');

function visualCopy(element) {
  if (!element) return null;
  const clone = element.cloneNode(true);
  const fields = element.querySelectorAll('input, textarea, select');
  clone.querySelectorAll('input, textarea, select').forEach((field, index) => {
    if (field.type !== 'file') field.value = fields[index]?.value ?? '';
    if ('checked' in field) field.checked = fields[index]?.checked ?? false;
  });
  for (const child of [clone, ...clone.querySelectorAll('*')]) {
    for (const name of ['id', 'name', 'autofocus', 'for', 'data-action', 'data-fluid-section-managed', 'data-management-section']) child.removeAttribute(name);
    child.classList.remove('fluid-animating', 'fluid-section-running');
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

// What sits below the section, in the same scrolling surface, up to one screen further down.
function followersOf(target, reach) {
  const out = [], limit = innerHeight + reach;
  let node = target;
  while (node && out.length < 40 && !node.matches('#app, .dialog-content, dialog, body')) {
    for (let next = node.nextElementSibling; next && out.length < 40; next = next.nextElementSibling) {
      if (next.matches('script, style, template, .fluid-section-ghost') || next.hidden) continue;
      const style = getComputedStyle(next);
      if (style.position === 'fixed' || style.position === 'sticky' || next.matches(fixedContent) || next.querySelector(fixedContent)) continue;
      const box = next.getBoundingClientRect();
      if (box.top > limit) break;
      if (box.height) out.push(next);
    }
    node = node.parentElement;
  }
  return out;
}

// The parts of an opened section that were not on screen before (below its previous height).
function bodyOf(target, previousHeight) {
  const top = target.getBoundingClientRect().top;
  return [...target.children].filter(child => !child.matches('summary, .fluid-section-ghost') && child.getBoundingClientRect().bottom > top + previousHeight + 1).slice(0, 12);
}

export function installSectionMotion() {
  const active = new Map(), pending = new Map(), detailIds = new WeakMap();
  let nextDetail = 0, flushFrame = 0, disposed = false;
  const page = () => document.documentElement.dataset.page || '';
  const withinApp = selector => document.getElementById('app')?.querySelector(selector);
  const live = selector => [...document.querySelectorAll(selector)].find(el => !el.closest('.fluid-section-ghost, .fluid-page-morph-layer, .fluid-exit-layer') && visible(el));
  const sameAction = (action, field, value) => [...document.querySelectorAll('[data-action]')].find(button => !button.closest('.fluid-section-ghost') && button.dataset.action === action && (!field || button.dataset[field] === value));

  const remember = descriptor => {
    if (pending.has(descriptor.key)) return;
    const element = descriptor.find();
    if (!element && !descriptor.anchor) return;
    active.get(descriptor.key)?.cancel();
    if (element?.matches('details')) element.dataset.fluidSectionManaged = 'true';
    const box = element?.getBoundingClientRect();
    pending.set(descriptor.key, {
      ...descriptor, route: page(),
      top: box?.top ?? 0, height: box?.height ?? 0,
      copy: fluidMotionLite() ? null : visualCopy(element),
    });
    if (!flushFrame) flushFrame = requestAnimationFrame(flush);
  };

  function animateRecord(record) {
    let target = record.find();
    let placeholder = null;
    if (!target && record.anchor && record.height > 0) {
      const anchor = record.anchor();
      if (!visible(anchor)) return;
      placeholder = document.createElement('div');
      placeholder.className = 'fluid-section-placeholder';
      placeholder.inert = true;
      anchor.after(placeholder);
      target = placeholder;
    }
    if (!visible(target)) return;
    const box = target.getBoundingClientRect();
    const height = placeholder ? 0 : box.height;
    const delta = height - record.height;
    if (Math.abs(delta) < 1) { if (target.matches('details')) delete target.dataset.fluidSectionManaged; placeholder?.remove(); return; }
    const followers = followersOf(target, Math.abs(delta));
    const handles = [];
    let ghost = null;
    const state = {};
    const finish = () => {
      if (target.matches('details')) delete target.dataset.fluidSectionManaged;
      target.classList.remove('fluid-section-running');
      ghost?.remove();
      placeholder?.remove();
      if (active.get(record.key) === state) active.delete(record.key);
    };
    state.cancel = () => { for (const handle of handles) handle?.cancel(); finish(); };
    active.set(record.key, state);
    target.classList.add('fluid-section-running');
    const spring = curve();
    // The section's own place may have moved with the render (scroll restored, list above it).
    const shift = Math.abs(record.top - box.top) > 1 ? record.top - box.top : 0;
    if (delta > 0) {
      // The new content settles into place while what sits below slides off it: the blocks below
      // cover the new part at first and uncover it as they move, with no clip to repaint.
      if (shift) handles.push(animate(target, { from: { y: shift }, to: { y: 0 }, spring }));
      for (const body of bodyOf(target, record.height)) {
        const from = { y: fluidMotionLite() ? -2 : -6, opacity: 0 };
        handles.push(animate(body, { from, to: { y: 0, opacity: 1 }, spring, shape: (pose, p) => ({ ...pose, opacity: Math.min(1, Math.max(0, (p - 0.08) / 0.5)) }) }));
      }
    } else if (record.copy) {
      // Closing: the old content, frozen as it was, stays under the page and dissolves while the
      // blocks below slide up over it.
      ghost = document.createElement('div');
      ghost.className = 'fluid-section-ghost is-under';
      ghost.inert = true;
      ghost.setAttribute('aria-hidden', 'true');
      const host = target.closest('dialog[open]');
      Object.assign(ghost.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: record.height + 'px' });
      const context = document.createElement('div');
      context.className = target.parentElement?.className || '';
      Object.assign(context.style, { display: 'block', margin: '0', padding: '0', border: '0', background: 'transparent', width: '100%' });
      context.append(record.copy);
      ghost.append(context);
      (host || document.body).append(ghost);
      // Inside a sheet the fixed layer may be anchored to the sheet: correct by what is measured.
      const placed = ghost.getBoundingClientRect();
      if (Math.abs(placed.left - box.left) > 0.5 || Math.abs(placed.top - box.top) > 0.5) {
        ghost.style.left = (2 * box.left - placed.left) + 'px';
        ghost.style.top = (2 * box.top - placed.top) + 'px';
      }
      const closed = Math.abs(delta);
      handles.push(animate(ghost, { from: { y: 0, opacity: 1 }, to: { y: fluidMotionLite() ? -2 : -Math.min(14, closed * 0.1), opacity: 0 }, spring,
        shape: (pose, p) => ({ ...pose, opacity: 1 - Math.min(1, p / 0.45) }) }));
    }
    for (const follower of followers) handles.push(animate(follower, { from: { y: shift - delta }, to: { y: 0 }, spring }));
    const last = handles.filter(Boolean).at(-1);
    if (last) last.finished.then(() => { if (active.get(record.key) === state) finish(); });
    else finish();
  }

  function flush() {
    flushFrame = 0;
    const records = [...pending.values()];
    pending.clear();
    for (const record of records) {
      if (!disposed && fluidMotionAllowed() && record.route === page()) animateRecord(record);
      else { const target = record.find(); if (target?.matches('details')) delete target.dataset.fluidSectionManaged; }
    }
  }

  const capture = event => {
    if (!fluidMotionAllowed() || event.target.closest?.('.fluid-section-ghost, [inert]')) return;
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
    if (!action) return;
    if (action === 'clients-toggle') remember({ key: action, find: () => withinApp('.client-list'), anchor: () => sameAction(action) });
    else if (action === 'week-day') {
      const day = button.dataset.day;
      remember({ key: action + ':' + day, find: () => sameAction(action, 'day', day)?.closest('.hs-day, .week-day') });
    } else if (action === 'week-empty-days') remember({ key: action, find: () => withinApp('.empty-days') });
    else if (action === 'event-history') remember({ key: action, find: () => withinApp('.fair-history') });
    else if (action === 'brain-stock-toggle') remember({ key: action, find: () => document.querySelector('dialog[open] .brain-stock-diagnostic') });
    else if (!ACTIONS.has(action) && EXPANDER.test(action) && !NOT_EXPANDER.test(action) && button.closest('#app, dialog[open]')) {
      // Any other "show more / show less" control: the block that holds it grows or shrinks.
      const selector = selectorOf(button);
      remember({ key: 'expander:' + selector, find: () => live(selector)?.closest(BLOCK) || null });
    }
  };
  // A change the app makes by itself (a sale card that closes once its quantity is known): blocks
  // found again by selector slide from where they were; blocks that leave fold away in place.
  const prepare = selectors => {
    if (!fluidMotionAllowed()) return;
    const before = selectors.map(selector => {
      const element = live(selector);
      const box = element?.getBoundingClientRect();
      return { selector, box, copy: element && !fluidMotionLite() ? visualCopy(element) : null };
    }).filter(entry => entry.box);
    requestAnimationFrame(() => {
      const spring = curve();
      for (const { selector, box, copy } of before) {
        const element = live(selector);
        if (element) {
          const now = element.getBoundingClientRect();
          if (Math.abs(now.top - box.top) > 1) animate(element, { from: { y: box.top - now.top }, to: { y: 0 }, spring });
        } else if (copy) {
          const ghost = document.createElement('div');
          ghost.className = 'fluid-section-ghost';
          ghost.inert = true;
          Object.assign(ghost.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' });
          ghost.append(copy);
          document.body.append(ghost);
          animate(ghost, { from: { y: 0, scale: 1, opacity: 1 }, to: { y: -12, scale: 0.97, opacity: 0 }, spring,
            shape: (pose, p) => ({ ...pose, opacity: 1 - Math.min(1, p / 0.55) }), onFinish: () => ghost.remove() });
        }
      }
    });
  };
  window.TerritorioSectionMotion = Object.freeze({ prepare });
  // Window capture runs before interface.js changes its accordion classes.
  window.addEventListener('click', capture, true);
  return () => {
    disposed = true;
    window.removeEventListener('click', capture, true);
    if (flushFrame) cancelAnimationFrame(flushFrame);
    for (const record of pending.values()) { const target = record.find(); if (target?.matches('details')) delete target.dataset.fluidSectionManaged; }
    pending.clear();
    for (const state of [...active.values()]) state.cancel();
    active.clear();
  };
}
