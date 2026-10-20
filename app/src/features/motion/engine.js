// Motor de aberturas: every opening and closing in the interface runs here.
// A spring is solved once, ahead of time, and handed to the compositor as a Web Animation of
// translate/scale/opacity only. Once started, a movement no longer needs the main thread: a
// page being rendered, a list being built or a save in progress cannot make it stutter.
// Interrupting a movement samples the same curve at the current instant, so the next movement
// starts from the exact pose and velocity on screen (no jump, no restart).
import { stepSpring } from './spring.js';

const STEP = 1 / 120;
const KEY_STEP = 1 / 60;

// Apple-style parameters: response (seconds for one oscillation) and damping ratio.
export function springFrom(response, dampingRatio = 1) {
  const stiffness = (2 * Math.PI / response) ** 2;
  return { stiffness, damping: 4 * Math.PI * dampingRatio / response, mass: 1 };
}

// Named characters of the system. Opening is lively with a hint of settle; closing is quicker
// and lands without bouncing into its card; pages carry more mass than sheets.
export const SPRINGS = Object.freeze({
  open: springFrom(0.42, 0.86),
  close: springFrom(0.34, 1),
  page: springFrom(0.46, 0.9),
  back: springFrom(0.38, 1),
  tab: springFrom(0.36, 0.92),
  // Entering a tab (Vender, Estoque…): a visible, iOS-like settle (about 8% overshoot).
  tabEnter: springFrom(0.5, 0.64),
  nested: springFrom(0.4, 0.88),
  press: springFrom(0.18, 0.75),
  release: springFrom(0.32, 0.6),
  section: springFrom(0.38, 0.92),
  toast: springFrom(0.4, 0.8),
  lite: springFrom(0.32, 1),
});

const curves = new Map();
// Normalised progress 0 → 1 (any overshoot included), sampled every 1/120 s until at rest.
export function springCurve(config, velocity = 0) {
  const key = `${config.stiffness.toFixed(3)}|${config.damping.toFixed(3)}|${velocity.toFixed(2)}`;
  const cached = curves.get(key);
  if (cached) return cached;
  const values = [0];
  let state = { position: 0, velocity };
  for (let i = 1; i < 240; i++) {
    state = stepSpring(state, 1, STEP, config);
    values.push(state.position);
    if (Math.abs(1 - state.position) < 0.0006 && Math.abs(state.velocity) < 0.02) break;
  }
  values[values.length - 1] = 1;
  const curve = { values, duration: (values.length - 1) * STEP * 1000 };
  if (curves.size > 200) curves.clear();
  curves.set(key, curve);
  return curve;
}

function sample(curve, ms) {
  const at = Math.max(0, ms / 1000 / STEP), index = Math.floor(at);
  if (index >= curve.values.length - 1) return { position: 1, velocity: 0 };
  const a = curve.values[index], b = curve.values[index + 1], f = at - index;
  return { position: a + (b - a) * f, velocity: (b - a) / STEP };
}

const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
// Piecewise opacity windows used by the choreography (fade only inside [start, end] of progress).
export const ramp = (p, start, end) => clamp((p - start) / Math.max(0.0001, end - start), 0, 1);

export function poseLerp(from, to, p) {
  const pose = {};
  for (const key of Object.keys(to)) pose[key] = lerp(from[key] ?? to[key], to[key], p);
  return pose;
}

function keyframe(pose, offset, extra, p) {
  const frame = { offset };
  if ('x' in pose || 'y' in pose) frame.translate = `${(pose.x || 0).toFixed(2)}px ${(pose.y || 0).toFixed(2)}px`;
  if ('scale' in pose) frame.scale = Math.max(0.0001, pose.scale).toFixed(5);
  if ('opacity' in pose) frame.opacity = clamp(pose.opacity, 0, 1).toFixed(4);
  return extra ? Object.assign(frame, extra(pose, p)) : frame;
}

const handles = new WeakMap();
const live = new Set();
// Hidden app, a preference change: every movement jumps to its destination.
export function finishAll() { for (const handle of [...live]) handle.finish(); }
export const liveCount = () => live.size;
export const motionOf = element => handles.get(element) || null;

// Run one movement. `paint(pose, p)` may add other properties per keyframe (a reveal clip).
// `from`/`to` are poses ({x, y, scale, opacity}); `shape(pose, p)` may bend a
// pose along the way (opacity windows, for instance). Returns a handle that can report the
// pose on screen at any instant, be retargeted, cancelled or awaited.
export function animate(element, { from, to, spring = SPRINGS.open, velocity = 0, shape, origin, pseudoElement, fill = 'forwards', onFinish, delay = 0, persist = false, paint }) {
  if (!element?.animate) { onFinish?.(false); return null; }
  const key = pseudoElement ? null : element;
  if (key) handles.get(key)?.cancel(true);
  const curve = springCurve(spring, velocity);
  const poseAt = p => {
    const pose = poseLerp(from, to, p);
    return shape ? shape(pose, p) : pose;
  };
  const frames = [];
  const count = Math.max(2, Math.ceil(curve.duration / 1000 / KEY_STEP));
  for (let i = 0; i <= count; i++) {
    const ms = curve.duration * i / count;
    const p = sample(curve, ms).position;
    frames.push(keyframe(poseAt(p), i / count, paint, p));
  }
  const saved = origin && !pseudoElement ? [element.style.transformOrigin, element.style.willChange] : null;
  if (saved) element.style.transformOrigin = origin;
  if (!pseudoElement) element.style.willChange = paint ? 'translate, scale, opacity, clip-path' : 'translate, scale, opacity';
  const animation = element.animate(frames, { duration: curve.duration, easing: 'linear', fill, delay, pseudoElement, composite: 'replace' });
  // running → (finished | cancelled). A persistent movement (a pressed key) keeps its last frame
  // after finishing, until the next movement of the same element replaces it.
  let phase = 'running', resolveFinished;
  const handle = {
    element, animation, from, to, spring, poseAt, curve, duration: curve.duration + delay,
    get running() { return phase === 'running'; },
    // Pose and normalised velocity on screen right now.
    now() {
      if (phase !== 'running') return { pose: poseAt(phase === 'held' ? 1 : 0), progress: 1, velocity: 0, time: curve.duration };
      const time = Math.max(0, (Number(animation.currentTime) || 0) - delay);
      const { position, velocity: speed } = sample(curve, time);
      return { pose: poseAt(position), progress: position, velocity: speed, time };
    },
    // Keep moving from where it is towards a new destination, inheriting speed.
    retarget(next, options = {}) {
      const { pose } = this.now();
      const target = { ...to, ...next };
      const carried = phase === 'running' ? carriedVelocity(this, pose, target) : 0;
      return animate(element, { from: pose, to: target, spring: options.spring || spring, velocity: carried, shape: options.shape ?? shape, origin, pseudoElement, fill, persist, onFinish: options.onFinish ?? onFinish });
    },
    cancel(replaced = false) {
      const wasRunning = phase === 'running';
      if (phase === 'cancelled') return;
      phase = 'cancelled';
      release();
      try { animation.cancel(); } catch {}
      if (wasRunning) onFinish?.(false, replaced);
      resolveFinished?.(false);
    },
    finish() { if (phase === 'running') { try { animation.finish(); } catch { this.cancel(); } } },
    finished: null,
  };
  const release = () => {
    live.delete(handle);
    if (key && handles.get(key) === handle) handles.delete(key);
    if (saved) { element.style.transformOrigin = saved[0]; element.style.willChange = saved[1]; }
    else if (!pseudoElement) element.style.removeProperty('will-change');
  };
  handle.finished = new Promise(resolve => { resolveFinished = resolve; });
  animation.onfinish = () => {
    if (phase !== 'running') return;
    if (persist) {
      phase = 'held';
      live.delete(handle);
      onFinish?.(true);
      resolveFinished(true);
      return;
    }
    phase = 'finished';
    release();
    // The last frame stays (fill) while the caller restores its own styles, then it lets go.
    onFinish?.(true);
    try { animation.cancel(); } catch {}
    resolveFinished(true);
  };
  if (key) handles.set(key, handle);
  live.add(handle);
  return handle;
}

// Velocity of a running handle, expressed in the units of a new movement from its current pose.
export function carriedVelocity(handle, nextFrom, nextTo) {
  if (!handle) return 0;
  const { velocity } = handle.now();
  const keys = Object.keys(nextTo).filter(k => k !== 'opacity');
  const before = keys.reduce((max, k) => Math.max(max, Math.abs((handle.to[k] ?? 0) - (handle.from[k] ?? 0))), 0);
  const after = keys.reduce((max, k) => Math.max(max, Math.abs((nextTo[k] ?? 0) - (nextFrom[k] ?? 0))), 0);
  if (!before || !after) return 0;
  return clamp(velocity * before / after, -10, 10);
}
