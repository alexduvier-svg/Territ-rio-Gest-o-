import test from 'node:test';
import assert from 'node:assert/strict';
import { naturalRect, reanchorPose, insightSheetGeometry, morphGeometry, revealClip } from '../src/features/motion/geometry.js';
import { stepSpring } from '../src/features/motion/spring.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ~= ${b}`);
const screenPoint = (rect, pose, x, y) => ({
  x: rect.left + pose.x + pose.originX + (x - pose.originX) * pose.scale,
  y: rect.top + pose.y + pose.originY + (y - pose.originY) * pose.scale,
});

test('closing an expanding sheet recovers natural bounds without a scale jump', () => {
  const rect = { left: 20, top: 120, width: 320, height: 600 };
  const pose = { x: -18, y: 42, scale: 0.81, originX: 85, originY: 455 };
  const corner = screenPoint(rect, pose, 0, 0);
  const recovered = naturalRect({ left: corner.x, top: corner.y, width: rect.width * pose.scale, height: rect.height * pose.scale }, pose);
  for (const key of Object.keys(rect)) near(recovered[key], rect[key]);
});

test('a new closing pivot preserves every rendered point and its velocity', () => {
  const rect = { left: 12, top: 80, width: 336, height: 500 };
  const pose = { x: -28, y: 35, scale: 0.87, originX: 55, originY: 470, velocityX: 140, velocityY: -210, velocityScale: 0.6 };
  const next = reanchorPose(pose, 310, 90);
  for (const [x, y] of [[0, 0], [336, 500], [120, 220]]) {
    const before = screenPoint(rect, pose, x, y), after = screenPoint(rect, next, x, y);
    near(before.x, after.x); near(before.y, after.y);
    near(pose.velocityX + (x - pose.originX) * pose.velocityScale, next.velocityX + (x - next.originX) * next.velocityScale);
    near(pose.velocityY + (y - pose.originY) * pose.velocityScale, next.velocityY + (y - next.originY) * next.velocityScale);
  }
});

test('closing opacity is invisible before the native 520ms retention ends', () => {
  const state = stepSpring({ position: 1, velocity: 0 }, 0, 0.52, { stiffness: 600, damping: 44, mass: 1 });
  assert.ok(Math.abs(state.position) < 0.0001);
});

test('the final adjustment is one subtle physical overshoot', () => {
  let state = { position: 0.72, velocity: 0 }, maximum = 0;
  for (let i = 0; i < 120; i++) { state = stepSpring(state, 1, 1 / 120, { stiffness: 420, damping: 30, mass: 1 }); maximum = Math.max(maximum, state.position); }
  assert.ok(maximum > 1.005 && maximum < 1.011);
});

test('a brain toolbar glyph cannot drag the distant edge of a tall insight sheet', () => {
  const rect = { left: 16, top: 52, width: 358, height: 740 };
  const entry = insightSheetGeometry(rect, { cx: 342, cy: 30, width: 48, height: 48 });
  const [originX, originY] = entry.origin.split(' ').map(parseFloat);
  const pose = { ...entry, originX, originY };
  assert.equal(entry.scale, 0.94);
  assert.ok(Math.abs(entry.x) <= 12 && Math.abs(entry.y) <= 18);
  for (const [x, y] of [[0, 0], [rect.width, rect.height]]) {
    const point = screenPoint(rect, pose, x, y);
    assert.ok(Math.abs(point.x - (rect.left + x)) < 27);
    assert.ok(Math.abs(point.y - (rect.top + y)) < 48);
  }
});

test('insight opening without a source and lite mode retain a small physical expansion', () => {
  const rect = { left: 16, top: 52, width: 358, height: 740 };
  const normal = insightSheetGeometry(rect, null);
  const lite = insightSheetGeometry(rect, { cx: -3000, cy: 4000 }, true);
  assert.equal(normal.scale, 0.94);
  assert.equal(normal.x, 0);
  assert.equal(normal.y, 14);
  assert.equal(lite.scale, 0.975);
  assert.equal(lite.x, -6);
  assert.equal(lite.y, 10);
  assert.equal(lite.origin, '125.30px 481.00px');
});

test('insight close is visually finished within 350 ms without visible opacity rebound', () => {
  const config = { stiffness: 720, damping: 52, mass: 1 };
  const opacity = stepSpring({ position: 1, velocity: 0 }, 0, 0.35, config);
  const position = stepSpring({ position: 0, velocity: 0 }, 18, 0.35, config);
  assert.ok(Math.abs(opacity.position) < 0.001);
  assert.ok(Math.abs(position.position - 18) < 0.02);
  let state = { position: 1, velocity: 0 }, invisible = false;
  for (let i = 0; i < 120; i++) {
    state = stepSpring(state, 0, 1 / 120, config);
    if (state.position < 0.01) invisible = true;
    if (invisible) assert.ok(state.position < 0.01);
  }
});

test('a tapped card is the first frame of the sheet: same centre, size and corners', () => {
  const rect = { left: 20, top: 120, width: 350, height: 600 };
  const source = { cx: 90, cy: 400, width: 130, height: 160, radius: 22 };
  const g = morphGeometry(rect, source, 28);
  const [originX, originY] = g.origin.split(' ').map(parseFloat);
  const pose = { x: g.x, y: g.y, scale: g.scale, originX, originY };
  const topLeft = screenPoint(rect, pose, g.clip.x, g.clip.y);
  const bottomRight = screenPoint(rect, pose, rect.width - g.clip.x, rect.height - g.clip.y);
  near(topLeft.x, source.cx - source.width / 2); near(topLeft.y, source.cy - source.height / 2);
  near(bottomRight.x, source.cx + source.width / 2); near(bottomRight.y, source.cy + source.height / 2);
  near(g.clip.radius * g.scale, 22);
  assert.equal(revealClip(g.clip, 1), 'inset(0.00px 0.00px round 28.00px)');
  assert.equal(revealClip(g.clip, 1.04), 'inset(0.00px 0.00px round 28.00px)');
});

test('a small icon starts from a bounded scale, and a wide card never enlarges the sheet', () => {
  const rect = { left: 20, top: 120, width: 350, height: 600 };
  assert.equal(morphGeometry(rect, { cx: 360, cy: 40, width: 44, height: 44 }).scale, 0.18);
  const wide = morphGeometry(rect, { cx: 195, cy: 300, width: 390, height: 100, radius: 24 });
  assert.equal(wide.scale, 1);
  assert.equal(wide.clip.x, 0);
  assert.equal(wide.clip.y, 250);
  assert.equal(morphGeometry(rect, null), null);
});
