import test from 'node:test';
import assert from 'node:assert/strict';
import { stepSpring, springAtRest } from '../src/features/motion/spring.js';

const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≈ ${expected}`);

test('a damped spring reaches its destination with no residual velocity', () => {
  let state = { position: 40, velocity: 0 };
  for (let i = 0; i < 120; i++) state = stepSpring(state, 0, 1 / 60);
  assert.ok(springAtRest(state, 0));
});

test('120Hz, 60Hz and a single analytic step agree across all damping regimes', () => {
  for (const damping of [8, 40, 80]) {
    const options = { stiffness: 400, damping, mass: 1 };
    const initial = { position: -12, velocity: 48 };
    const expected = stepSpring(initial, 6, 0.5, options);
    for (const hz of [60, 120]) {
      let state = initial;
      for (let i = 0; i < hz / 2; i++) state = stepSpring(state, 6, 1 / hz, options);
      close(state.position, expected.position);
      close(state.velocity, expected.velocity);
    }
  }
});

test('retargeting retains momentum rather than restarting at zero velocity', () => {
  const moving = stepSpring({ position: 0, velocity: 0 }, 100, 0.08);
  assert.ok(moving.velocity > 0);
  const interrupted = stepSpring(moving, -20, 0);
  assert.deepEqual(interrupted, moving);
  const next = stepSpring(interrupted, -20, 0.001);
  assert.ok(next.position > moving.position, 'the spring first brakes its existing forward momentum');
  assert.ok(next.velocity < moving.velocity);
  let final = next;
  for (let i = 0; i < 180; i++) final = stepSpring(final, -20, 1 / 60);
  assert.ok(springAtRest(final, -20));
});

test('critical damping approaches without overshooting at rest', () => {
  let state = { position: 0, velocity: 0 }, previous = 0;
  for (let i = 0; i < 120; i++) {
    state = stepSpring(state, 1, 1 / 60, { stiffness: 400, damping: 40, mass: 1 });
    assert.ok(state.position >= previous && state.position <= 1);
    previous = state.position;
  }
});

test('an underdamped spring has bounded elastic overshoot', () => {
  let state = { position: 0, velocity: 0 }, maximum = 0;
  for (let i = 0; i < 180; i++) {
    state = stepSpring(state, 1, 1 / 120, { stiffness: 400, damping: 24, mass: 1 });
    maximum = Math.max(maximum, state.position);
  }
  assert.ok(maximum > 1 && maximum < 1.1);
  assert.ok(springAtRest(state, 1));
});

test('long frames and heavily damped motion remain finite and stable', () => {
  const state = stepSpring({ position: 300, velocity: -200 }, 0, 30, { stiffness: 400, damping: 80, mass: 1 });
  assert.ok(Number.isFinite(state.position) && Number.isFinite(state.velocity));
  assert.ok(springAtRest(state, 0));
  const heavy = stepSpring({ position: 5, velocity: 0 }, 0, 1, { stiffness: 400, damping: 1e9, mass: 1 });
  assert.ok(heavy.position <= 5 && heavy.position > 0);
});

test('invalid physical values fail instead of poisoning the frame loop', () => {
  assert.throws(() => stepSpring({ position: NaN, velocity: 0 }, 0, 0.1), TypeError);
  assert.throws(() => stepSpring({ position: 0, velocity: 0 }, 0, -1), RangeError);
  assert.throws(() => stepSpring({ position: 0, velocity: 0 }, 0, 1, { mass: 0 }), RangeError);
});
