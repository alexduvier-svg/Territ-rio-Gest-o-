import { stepSpring, springAtRest } from './spring.js';
import { createPhysicalFrameMotion, fluidMotionAllowed, fluidMotionLite } from './index.js';

// The renderer replaces the SVGs on navigation. Keep simulations on their actual SVG owner,
// and restore every attribute when it is removed, interrupted or reaches rest.
function prepare(parts) {
  const saved = parts.map(part => ({
    part, transform: part.getAttribute('transform'), opacity: part.style.opacity,
    hadClass: part.classList.contains('nav-physical-part'),
  }));
  for (const part of parts) part.classList.add('nav-physical-part');
  return () => {
    for (const { part, transform, opacity, hadClass } of saved) {
      if (transform === null) part.removeAttribute('transform'); else part.setAttribute('transform', transform);
      part.style.opacity = opacity;
      if (!hadClass) part.classList.remove('nav-physical-part');
    }
  };
}

const fmt = value => value.toFixed(4);
const bound = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const settled = (value, target) => springAtRest(value, target, 0.001, 0.008);

function stockSimulation(svg, done) {
  const apple = svg.querySelector('.nav-box-apple'), shell = svg.querySelector('.nav-box-shell');
  const left = svg.querySelector('.nav-box-flap-left'), right = svg.querySelector('.nav-box-flap-right');
  if (!apple || !shell || !left || !right) return null;
  const restore = prepare([apple, shell, left, right]);
  const lite = fluidMotionLite();
  const appleState = { y: -8.6, velocity: 0, opacity: 0, settled: false };
  let opening = { position: 0, velocity: 0 };
  let rotation = { position: lite ? -4 : -12, velocity: 0 };
  let compression = { position: 0, velocity: 0 };
  let elapsed = 0, hitAt = null;
  const floor = 1.3, gravity = lite ? 285 : 175, dropAt = lite ? 0.14 : 0.24;
  return createPhysicalFrameMotion(svg, {
    advance(seconds) {
      const previous = elapsed;
      elapsed += seconds;
      const fallingSeconds = Math.max(0, elapsed - Math.max(previous, dropAt));
      const closing = hitAt !== null && elapsed - hitAt >= (lite ? 0.04 : 0.09);
      opening = stepSpring(opening, closing ? 0 : 1, seconds, { stiffness: lite ? 650 : 430, damping: lite ? 44 : 29, mass: 1 });
      appleState.opacity = appleState.settled ? 0 : bound((elapsed - dropAt + 0.08) / 0.08);
      if (!appleState.settled && fallingSeconds) {
        // The flaps open first. Gravity then carries the fruit behind a fixed opening clip;
        // it cannot bounce back through the box or flash when the icon comes to rest.
        appleState.y += appleState.velocity * fallingSeconds + 0.5 * gravity * fallingSeconds * fallingSeconds;
        appleState.velocity += gravity * fallingSeconds;
        if (appleState.y >= floor) {
          appleState.y = floor;
          hitAt = elapsed;
          appleState.velocity = 0;
          appleState.settled = true;
          appleState.opacity = 0;
          compression.velocity += lite ? 0.45 : 1.35;
        }
      }
      rotation = stepSpring(rotation, 0, seconds, { stiffness: 150, damping: 19, mass: 1 });
      compression = stepSpring(compression, 0, seconds, { stiffness: 490, damping: lite ? 39 : 27, mass: 1 });
      return (closing && settled(opening, 0) && settled(rotation, 0) && settled(compression, 0)) || elapsed > (lite ? 1.15 : 1.6);
    },
    draw() {
      apple.setAttribute('transform', `translate(0 ${fmt(appleState.y)}) rotate(${fmt(rotation.position)} 12 14)`);
      apple.style.opacity = fmt(appleState.opacity);
      const angle = opening.position * 82;
      left.setAttribute('transform', `rotate(${fmt(-angle)} 3.5 9.5)`);
      right.setAttribute('transform', `rotate(${fmt(angle)} 20.5 9.5)`);
      const squeeze = compression.position;
      shell.setAttribute('transform', `translate(12 21.5) scale(${fmt(1 + squeeze * 0.45)} ${fmt(1 - squeeze)}) translate(-12 -21.5)`);
    },
    onRest() { restore(); done(); },
  });
}

function peopleSimulation(svg, done) {
  const back = svg.querySelector('.nav-person-back'), front = svg.querySelector('.nav-person-front');
  if (!back || !front) return null;
  const restore = prepare([back, front]);
  const originalOrder = [...svg.children];
  const lite = fluidMotionLite();
  let progress = { position: 0, velocity: 0 }, elapsed = 0, inFront = false;
  const distance = lite ? 3.8 : 9.3;
  return createPhysicalFrameMotion(svg, {
    advance(seconds) {
      elapsed += seconds;
      const target = elapsed < (lite ? 0.26 : 0.42) ? 1 : 0;
      progress = stepSpring(progress, target, seconds, { stiffness: 430, damping: lite ? 42 : 27, mass: 1 });
      return (target === 0 && settled(progress, 0)) || elapsed > 1.8;
    },
    draw() {
      const p = progress.position;
      back.setAttribute('transform', `translate(${fmt(distance * p)} ${fmt(1.4 * p)}) translate(7.2 14) scale(${fmt(1 + 0.055 * p)}) translate(-7.2 -14)`);
      front.setAttribute('transform', `translate(${fmt(-distance * p)} ${fmt(-1.4 * p)}) translate(16.5 15) scale(${fmt(1 - 0.09 * p)}) translate(-16.5 -15)`);
      back.style.opacity = fmt(bound(0.82 + 0.18 * p));
      front.style.opacity = fmt(bound(1 - 0.18 * p));
      if (p > 0.5 && !inFront) { front.after(back); inFront = true; }
      else if (p <= 0.5 && inFront) { front.before(back); inFront = false; }
    },
    onRest() {
      restore();
      for (const child of originalOrder) if (child.parentNode === svg) svg.append(child);
      done();
    },
  });
}

function chartSimulation(svg, done) {
  const bars = [...svg.querySelectorAll('.nav-chart-bar')].sort((a, b) => Number(a.dataset.index) - Number(b.dataset.index));
  if (!bars.length) return null;
  const restore = prepare(bars), lite = fluidMotionLite();
  const initial = lite ? [0.88, 0.84, 0.9, 0.86] : [0.62, 0.38, 0.72, 0.46];
  const stiffness = [480, 410, 520, 440], damping = [20, 18, 22, 19];
  const values = bars.map((_, i) => ({ position: initial[i % initial.length], velocity: 0 }));
  let elapsed = 0;
  return createPhysicalFrameMotion(svg, {
    advance(seconds) {
      elapsed += seconds;
      let resting = true;
      values.forEach((value, i) => {
        const delay = i * (lite ? 0.02 : 0.035);
        if (elapsed < delay) { resting = false; return; }
        values[i] = stepSpring(value, 1, seconds, { stiffness: stiffness[i % 4], damping: lite ? 43 : damping[i % 4], mass: 1 });
        if (!settled(values[i], 1)) resting = false;
      });
      return resting || elapsed > 1.8;
    },
    draw() {
      bars.forEach((bar, i) => bar.setAttribute('transform', `translate(0 22.5) scale(1 ${fmt(values[i].position)}) translate(0 -22.5)`));
    },
    onRest() { restore(); done(); },
  });
}

function calendarSimulation(svg, done) {
  const sheet = svg.querySelector('.nav-calendar-sheet');
  if (!sheet) return null;
  const restore = prepare([sheet]), lite = fluidMotionLite();
  let progress = { position: 0, velocity: 0 }, elapsed = 0;
  return createPhysicalFrameMotion(svg, {
    advance(seconds) {
      elapsed += seconds;
      progress = stepSpring(progress, 1, seconds, { stiffness: lite ? 260 : 150, damping: lite ? 34 : 18, mass: 1 });
      return settled(progress, 1) || elapsed > 1.6;
    },
    draw() {
      // A hinged projection of the paper: the second half reveals the next leaf. Its frame and
      // rings stay still. No 3D layer, layout animation, timer or repeating keyframe is needed.
      const angle = Math.PI * progress.position;
      const fold = Math.sin(angle);
      const scale = lite ? 1 - 0.12 * Math.abs(fold) : Math.max(0.035, Math.abs(Math.cos(angle)));
      const skew = (lite ? 1 : 5) * fold;
      sheet.setAttribute('transform', `translate(12 8.8) skewX(${fmt(skew)}) scale(1 ${fmt(scale)}) translate(-12 -8.8)`);
      sheet.style.opacity = fmt(lite ? 1 : 0.35 + 0.65 * Math.min(1, scale));
    },
    onRest() { restore(); done(); },
  });
}

export function installNavIconMotion() {
  const nav = document.getElementById('nav');
  if (!nav) return () => {};
  const active = new Set();
  let pendingPage = null, queued = 0, disposed = false;
  const cancelAll = () => { for (const motion of [...active]) motion.cancel(); };
  const run = () => {
    queued = 0;
    const page = pendingPage;
    pendingPage = null;
    if (disposed) return;
    cancelAll();
    if (!page || nav.hidden || !fluidMotionAllowed()) return;
    const button = [...nav.querySelectorAll('button')].find(button => button.dataset.page === page && button.classList.contains('active'));
    const svg = button?.querySelector('svg');
    if (!svg) return;
    const simulate = { Estoque: stockSimulation, Clientes: peopleSimulation, Gestão: chartSimulation, Eventos: calendarSimulation }[page];
    if (!simulate) return;
    let motion;
    motion = simulate(svg, () => active.delete(motion));
    if (motion) active.add(motion);
  };
  const click = event => {
    const button = event.target.closest?.('#nav button[data-action="nav"]');
    if (!button || button.disabled) return;
    pendingPage = button.dataset.page;
    // A browser may drain microtasks between capture and bubble listeners. The next frame
    // always sees the SVG created by the legacy handler, for physical and keyboard clicks.
    if (!queued) queued = requestAnimationFrame(run);
  };
  document.addEventListener('click', click, true);
  const observer = new MutationObserver(() => {
    for (const motion of [...active]) if (nav.hidden || !motion.owner.isConnected) motion.cancel();
  });
  observer.observe(nav, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  return () => {
    disposed = true;
    cancelAnimationFrame(queued);
    pendingPage = null;
    document.removeEventListener('click', click, true);
    observer.disconnect();
    cancelAll();
  };
}
