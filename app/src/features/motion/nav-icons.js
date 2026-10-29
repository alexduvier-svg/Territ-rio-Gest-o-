import { fluidMotionAllowed, fluidMotionLite } from './index.js';
import { registerMotion } from './engine.js';
import { getNavTrack, NAV_TRACK_KINDS } from './nav-tracks.js';

const kinds = Object.freeze({ Estoque: 'stock', Clientes: 'people', Gestão: 'chart', Eventos: 'calendar' });
const selectors = Object.freeze({
  stock: { apple: '.nav-box-apple', shell: '.nav-box-shell', left: '.nav-box-flap-left', right: '.nav-box-flap-right' },
  people: { back: '.nav-person-back', front: '.nav-person-front' },
  chart: Object.fromEntries([0, 1, 2, 3].map(index => ['bar' + index, '.nav-chart-bar[data-index="' + index + '"]'])),
  calendar: { tick: '.nav-calendar-tick path' },
});

// Playback changes no SVG geometry attributes. Only the two people crossings change DOM order.
export function playNavTrack(svg, track, { onRest = () => {}, schedule = setTimeout, clear = clearTimeout, register = registerMotion } = {}) {
  const groups = Object.fromEntries(Object.entries(selectors[track.kind]).map(([role, selector]) => [role, [...svg.querySelectorAll(selector)]]));
  if (Object.values(groups).some(parts => !parts.length)) return null;
  const parts = Object.values(groups).flat(), originalOrder = [...svg.children];
  const saved = parts.map(part => ({ part, style: part.getAttribute('style'), hadClass: part.classList.contains('nav-physical-part') }));
  const animations = [], timers = new Set();
  let running = true, release = () => {};
  const restore = () => {
    for (const { part, style, hadClass } of saved) {
      if (style === null) part.removeAttribute('style'); else part.setAttribute('style', style);
      if (!hadClass) part.classList.remove('nav-physical-part');
    }
    if (track.kind === 'people' && originalOrder.some((part, index) => svg.children[index] !== part)) {
      for (const part of originalOrder) if (part.parentNode === svg) svg.append(part);
    }
  };
  const finish = cancelled => {
    if (!running) return;
    running = false;
    for (const timer of timers) clear(timer);
    timers.clear();
    for (const animation of animations) { try { animation.cancel(); } catch {} }
    restore(); release(); onRest(cancelled);
  };
  const handle = { owner: svg, get running() { return running; }, cancel: () => finish(true), finish: () => finish(false) };
  try {
    for (const [role, elements] of Object.entries(groups)) for (const part of elements) {
      part.classList.add('nav-physical-part');
      part.style.transformOrigin = '0px 0px';
      part.style.transformBox = 'view-box';
      if (track.kind === 'calendar') part.style.strokeDasharray = '1';
      else part.style.willChange = 'transform, opacity';
      animations.push(part.animate(track.parts[role], { duration: track.duration, easing: 'linear', fill: 'both' }));
    }
    for (const swap of track.swaps) {
      const timer = schedule(() => {
        timers.delete(timer);
        if (!running || !svg.isConnected) return;
        const back = groups.back[0], front = groups.front[0];
        if (swap.backInFront) front.after(back); else front.before(back);
      }, swap.time);
      timers.add(timer);
    }
    Promise.all(animations.map(animation => animation.finished)).then(() => finish(false), () => finish(true));
    release = register(handle);
    // A synchronous budget/preference listener may finish the group during registration.
    if (!running) release();
  } catch {
    finish(true);
    return null;
  }
  return handle;
}

export function installNavIconMotion() {
  const nav = document.getElementById('nav');
  if (!nav) return () => {};
  const active = new Set();
  let pendingPage = null, queued = 0, disposed = false, warmIdle = 0, warmTimer = 0;
  const cancelAll = () => { for (const motion of [...active]) motion.cancel(); };
  const run = () => {
    queued = 0;
    const page = pendingPage; pendingPage = null;
    if (disposed) return;
    cancelAll();
    if (!page || nav.hidden || !fluidMotionAllowed()) return;
    const button = [...nav.querySelectorAll('button')].find(button => button.dataset.page === page && button.classList.contains('active'));
    const svg = button?.querySelector('svg'), kind = kinds[page];
    if (!svg || !kind) return;
    let motion;
    motion = playNavTrack(svg, getNavTrack(kind, fluidMotionLite()), { onRest: () => active.delete(motion) });
    if (motion?.running) active.add(motion);
  };
  const click = event => {
    const button = event.target.closest?.('#nav button[data-action="nav"]');
    if (!button || button.disabled) return;
    pendingPage = button.dataset.page;
    // One frame sees the SVG produced by the route renderer; playback has no JS frame loop.
    if (!queued) queued = requestAnimationFrame(run);
  };
  const stop = () => { cancelAnimationFrame(queued); queued = 0; pendingPage = null; cancelAll(); };
  const visibility = () => { if (document.hidden) stop(); };
  document.addEventListener('click', click, true);
  document.addEventListener('visibilitychange', visibility);
  const observer = new MutationObserver(() => {
    for (const motion of [...active]) if (nav.hidden || !motion.owner.isConnected) motion.cancel();
  });
  observer.observe(nav, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  const firstLite = fluidMotionLite();
  const variants = [firstLite, !firstLite].flatMap(lite => NAV_TRACK_KINDS.map(kind => ({ kind, lite })));
  const warm = () => {
    warmIdle = warmTimer = 0;
    if (disposed) return;
    const variant = variants.shift();
    if (variant) getNavTrack(variant.kind, variant.lite);
    if (variants.length) scheduleWarm();
  };
  const scheduleWarm = () => {
    if (window.requestIdleCallback) warmIdle = window.requestIdleCallback(warm, { timeout: 2000 });
    else warmTimer = setTimeout(warm, 120);
  };
  scheduleWarm();
  return () => {
    disposed = true; stop();
    if (warmIdle) window.cancelIdleCallback?.(warmIdle);
    clearTimeout(warmTimer);
    document.removeEventListener('click', click, true);
    document.removeEventListener('visibilitychange', visibility);
    observer.disconnect();
  };
}
