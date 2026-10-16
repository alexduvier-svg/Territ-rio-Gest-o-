import { createPhysicalFrameMotion, fluidMotionAllowed, fluidMotionLite } from './index.js';
import { stepSpring, springAtRest } from './spring.js';

// A low capsule contains both the icon and label. Only its position moves.
export function installNavSelection() {
  const nav = document.getElementById('nav');
  if (!nav) return () => {};
  let values, targets, motion, queued = 0, disposed = false;
  const draw = () => {
    for (const key of Object.keys(values)) nav.style.setProperty('--selection-' + key, values[key].position.toFixed(3) + 'px');
  };
  const measure = () => {
    queued = 0;
    if (disposed) return;
    const button = nav.querySelector('button.active');
    if (nav.hidden || !button) { nav.classList.remove('selection-ready'); motion?.cancel(); motion = null; return; }
    const next = { x: button.offsetLeft - 1, y: button.offsetTop + 3, width: button.offsetWidth + 2, height: Math.max(44, button.offsetHeight - 6) };
    nav.classList.add('selection-ready');
    if (!values) values = Object.fromEntries(Object.entries(next).map(([key, value]) => [key, { position: value, velocity: 0 }]));
    const changed = !targets || Object.keys(next).some(key => Math.abs(next[key] - targets[key]) > 0.1);
    targets = next;
    if (!fluidMotionAllowed()) {
      motion?.cancel(); motion = null;
      for (const key of Object.keys(next)) Object.assign(values[key], { position: next[key], velocity: 0 });
      draw(); return;
    }
    if (!changed && !motion) { draw(); return; }
    if (motion) return; // A changed destination retains position and velocity.
    motion = createPhysicalFrameMotion(nav, {
      advance(seconds) {
        let resting = true;
        for (const key of Object.keys(values)) {
          Object.assign(values[key], stepSpring(values[key], targets[key], seconds, { stiffness: 430, damping: fluidMotionLite() ? 43 : 33, mass: 1 }));
          if (!springAtRest(values[key], targets[key], 0.04, 0.3)) resting = false;
        }
        return resting;
      }, draw,
      onRest() {
        for (const key of Object.keys(values)) Object.assign(values[key], { position: targets[key], velocity: 0 });
        draw(); motion = null;
      },
    });
  };
  const schedule = () => { if (!queued && !disposed) queued = requestAnimationFrame(measure); };
  const observer = new MutationObserver(records => {
    if (records.some(record => record.type === 'childList' || record.attributeName === 'hidden' || record.target.tagName === 'BUTTON')) schedule();
  });
  observer.observe(nav, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] });
  const resize = new ResizeObserver(schedule);
  resize.observe(nav);
  document.fonts?.ready.then(schedule);
  measure();
  return () => {
    disposed = true; cancelAnimationFrame(queued); observer.disconnect(); resize.disconnect(); motion?.cancel();
    nav.classList.remove('selection-ready');
  };
}
