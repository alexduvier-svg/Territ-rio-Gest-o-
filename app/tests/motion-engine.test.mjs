import test from 'node:test';
import assert from 'node:assert/strict';
import { springFrom, springCurve, SPRINGS, ramp, poseLerp } from '../src/features/motion/engine.js';

test('every named spring settles at its destination within a short, bounded time', () => {
  for (const [name, spring] of Object.entries(SPRINGS)) {
    const curve = springCurve(spring);
    assert.equal(curve.values.at(-1), 1, name);
    assert.ok(curve.duration > 120 && curve.duration < 900, `${name}: ${curve.duration}ms`);
  }
});

test('closing and returning springs never overshoot into the card they land on', () => {
  for (const name of ['close', 'back', 'lite']) {
    const { values } = springCurve(SPRINGS[name]);
    assert.ok(Math.max(...values) <= 1.0005, name);
    for (let i = 1; i < values.length; i++) assert.ok(values[i] >= values[i - 1] - 1e-9, `${name} is monotonic`);
  }
});

test('opening springs settle with one subtle overshoot, as in iOS and ColorOS', () => {
  const peak = Math.max(...springCurve(SPRINGS.open).values);
  assert.ok(peak > 1.002 && peak < 1.02, String(peak));
});

test('response and damping ratio map to the physical spring', () => {
  const { stiffness, damping } = springFrom(0.5, 1);
  assert.ok(Math.abs(stiffness - (2 * Math.PI / 0.5) ** 2) < 1e-9);
  assert.ok(Math.abs(damping - 2 * Math.sqrt(stiffness)) < 1e-9);
});

test('an inherited velocity shortens the first part of the curve without a jump', () => {
  const still = springCurve(SPRINGS.close), moving = springCurve(SPRINGS.close, 6);
  assert.equal(moving.values[0], 0);
  assert.ok(moving.values[3] > still.values[3]);
  assert.ok(Math.abs(moving.values[1] - moving.values[0]) < 0.1);
});

test('opacity windows and poses interpolate inside their bounds', () => {
  assert.equal(ramp(-1, 0, 0.3), 0);
  assert.equal(ramp(0.15, 0, 0.3), 0.5);
  assert.equal(ramp(2, 0, 0.3), 1);
  assert.deepEqual(poseLerp({ x: 10, scale: 0.5 }, { x: 0, scale: 1 }, 0.5), { x: 5, scale: 0.75 });
});
