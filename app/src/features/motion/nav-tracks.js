import { stepSpring, springAtRest } from './spring.js';

// Solve four icons × two modes once while idle. Playback never changes SVG geometry per frame.
const STEP = 1 / 60, cache = new Map();
export const NAV_TRACK_KINDS = Object.freeze(['stock', 'people', 'chart', 'calendar']);
const fmt = number => number.toFixed(4);
const clamp = number => Math.max(0, Math.min(1, number));
const settled = (value, target) => springAtRest(value, target, 0.001, 0.008);
const rotate = (x, y, angle) => `translate(${x}px, ${y}px) rotate(${fmt(angle)}deg) translate(${-x}px, ${-y}px)`;
const scale = (x, y, sx, sy = sx) => `translate(${x}px, ${y}px) scale(${fmt(sx)}, ${fmt(sy)}) translate(${-x}px, ${-y}px)`;
const STILL = 'translate(0px, 0px)';

function stock(lite) {
  const apple = { y: -8.6, velocity: 0, opacity: 0, settled: false };
  let opening = { position: 0, velocity: 0 }, rotation = { position: lite ? -4 : -12, velocity: 0 };
  let compression = { position: 0, velocity: 0 }, elapsed = 0, hitAt = null;
  const dropAt = lite ? 0.14 : 0.24, gravity = lite ? 285 : 175;
  return {
    frame: () => ({
      apple: { transform: `translate(0px, ${fmt(apple.y)}px) ${rotate(12, 14, rotation.position)}`, opacity: fmt(apple.opacity) },
      shell: { transform: scale(12, 21.5, 1 + compression.position * 0.45, 1 - compression.position) },
      left: { transform: rotate(3.5, 9.5, -opening.position * 82) },
      right: { transform: rotate(20.5, 9.5, opening.position * 82) },
    }),
    advance(seconds) {
      const previous = elapsed; elapsed += seconds;
      const falling = Math.max(0, elapsed - Math.max(previous, dropAt));
      const closing = hitAt !== null && elapsed - hitAt >= (lite ? 0.04 : 0.09);
      opening = stepSpring(opening, closing ? 0 : 1, seconds, { stiffness: lite ? 650 : 430, damping: lite ? 44 : 29, mass: 1 });
      apple.opacity = apple.settled ? 0 : clamp((elapsed - dropAt + 0.08) / 0.08);
      if (!apple.settled && falling) {
        apple.y += apple.velocity * falling + 0.5 * gravity * falling * falling;
        apple.velocity += gravity * falling;
        if (apple.y >= 1.3) {
          apple.y = 1.3; hitAt = elapsed; apple.velocity = 0; apple.settled = true; apple.opacity = 0;
          compression.velocity += lite ? 0.45 : 1.35;
        }
      }
      rotation = stepSpring(rotation, 0, seconds, { stiffness: 150, damping: 19, mass: 1 });
      compression = stepSpring(compression, 0, seconds, { stiffness: 490, damping: lite ? 39 : 27, mass: 1 });
      return (closing && settled(opening, 0) && settled(rotation, 0) && settled(compression, 0)) || elapsed > (lite ? 1.15 : 1.6);
    },
    final: () => ({ apple: { transform: STILL, opacity: '0' }, shell: { transform: STILL }, left: { transform: STILL }, right: { transform: STILL } }),
    metadata: () => ({ dropAt: dropAt * 1000, landedAt: hitAt * 1000, gravity }),
  };
}

function people(lite) {
  let progress = { position: 0, velocity: 0 }, elapsed = 0, inFront = false;
  const swaps = [], distance = lite ? 3.8 : 9.3;
  return {
    swaps,
    frame() {
      const p = progress.position;
      return {
        back: { transform: `translate(${fmt(distance * p)}px, ${fmt(1.4 * p)}px) ${scale(7.2, 14, 1 + 0.055 * p)}`, opacity: fmt(clamp(0.82 + 0.18 * p)) },
        front: { transform: `translate(${fmt(-distance * p)}px, ${fmt(-1.4 * p)}px) ${scale(16.5, 15, 1 - 0.09 * p)}`, opacity: fmt(clamp(1 - 0.18 * p)) },
      };
    },
    advance(seconds) {
      elapsed += seconds;
      const target = elapsed < (lite ? 0.26 : 0.42) ? 1 : 0;
      progress = stepSpring(progress, target, seconds, { stiffness: 430, damping: lite ? 42 : 27, mass: 1 });
      const next = progress.position > 0.5;
      if (next !== inFront) { inFront = next; swaps.push({ time: elapsed * 1000, backInFront: next }); }
      return (target === 0 && settled(progress, 0)) || elapsed > 1.8;
    },
    final: () => ({ back: { transform: STILL, opacity: '0.82' }, front: { transform: STILL, opacity: '1' } }),
  };
}

function chart(lite) {
  const initial = lite ? [0.88, 0.84, 0.9, 0.86] : [0.62, 0.38, 0.72, 0.46];
  const stiffness = [480, 410, 520, 440], damping = [20, 18, 22, 19];
  let values = initial.map(position => ({ position, velocity: 0 })), elapsed = 0;
  return {
    frame: () => Object.fromEntries(values.map((value, index) => ['bar' + index, { transform: scale(0, 22.5, 1, value.position) }])),
    advance(seconds) {
      elapsed += seconds; let resting = true;
      values = values.map((value, index) => {
        if (elapsed < index * (lite ? 0.02 : 0.035)) { resting = false; return value; }
        const next = stepSpring(value, 1, seconds, { stiffness: stiffness[index], damping: lite ? 43 : damping[index], mass: 1 });
        if (!settled(next, 1)) resting = false;
        return next;
      });
      return resting || elapsed > 1.8;
    },
    final: () => Object.fromEntries(initial.map((_, index) => ['bar' + index, { transform: STILL }])),
  };
}

function calendar(lite) {
  let draw = { position: 0, velocity: 0 }, elapsed = 0;
  const spring = lite ? { stiffness: 320, damping: 36, mass: 1 } : { stiffness: 150, damping: 19, mass: 1 };
  return {
    frame: () => ({ tick: { strokeDashoffset: fmt(1 - clamp(draw.position)) } }),
    advance(seconds) {
      elapsed += seconds;
      if (elapsed < (lite ? 0.02 : 0.06)) return false;
      draw = stepSpring(draw, 1, seconds, spring);
      return settled(draw, 1) || elapsed > 1.2;
    },
    final: () => ({ tick: { strokeDashoffset: '0' } }),
  };
}

const simulations = { stock, people, chart, calendar };
function build(kind, lite) {
  const simulation = simulations[kind](lite), frames = [simulation.frame()];
  let steps = 0;
  for (let i = 1; i <= 120; i++) {
    steps = i;
    if (simulation.advance(STEP)) { frames.push(simulation.final()); break; }
    frames.push(simulation.frame());
  }
  const parts = Object.fromEntries(Object.keys(frames[0]).map(part => [part, Object.freeze(frames.map((frame, index) => Object.freeze({ ...frame[part], offset: index / steps })))]));
  return Object.freeze({ kind, lite, duration: steps * STEP * 1000, parts: Object.freeze(parts), swaps: Object.freeze((simulation.swaps || []).map(swap => Object.freeze(swap))), metadata: Object.freeze(simulation.metadata?.() || {}) });
}

export function getNavTrack(kind, lite = false) {
  if (!NAV_TRACK_KINDS.includes(kind)) throw new RangeError('Unknown navigation icon');
  const key = kind + ':' + !!lite;
  if (!cache.has(key)) cache.set(key, build(kind, !!lite));
  return cache.get(key);
}

export const navTrackCacheSize = () => cache.size;
