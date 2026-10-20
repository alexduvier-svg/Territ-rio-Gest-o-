import test from 'node:test';
import assert from 'node:assert/strict';
import { naturalRect, reanchorPose, insightSheetGeometry, morphGeometry, wholeReturnGeometry, revealClip, closingOpacity } from '../src/features/motion/geometry.js';
import { stepSpring } from '../src/features/motion/spring.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ~= ${b}`);
const nearPx = (a, b) => assert.ok(Math.abs(a - b) < 0.01, `${a} ~= ${b}px`);
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

test('a tapped card is the first frame of the sheet: same place, size and corners, title on top', () => {
  const rect = { left: 20, top: 120, width: 350, height: 600 };
  const source = { cx: 90, cy: 400, width: 130, height: 160, radius: 22 };
  const g = morphGeometry(rect, source, 28);
  const [originX, originY] = g.origin.split(' ').map(parseFloat);
  const pose = { x: g.x, y: g.y, scale: g.scale, originX, originY };
  // The visible window starts at the sheet's top edge, where the title lives.
  const topLeft = screenPoint(rect, pose, g.clip.x, 0);
  const bottomRight = screenPoint(rect, pose, rect.width - g.clip.x, rect.height - g.clip.bottom);
  nearPx(topLeft.x, source.cx - source.width / 2); nearPx(topLeft.y, source.cy - source.height / 2);
  nearPx(bottomRight.x, source.cx + source.width / 2); nearPx(bottomRight.y, source.cy + source.height / 2);
  near(g.clip.radius * g.scale, 22);
  assert.equal(revealClip(g.clip, 1), 'inset(0px 0.00px 0.00px round 28.00px)');
  assert.equal(revealClip(g.clip, 1.04), 'inset(0px 0.00px 0.00px round 28.00px)');
  assert.ok(revealClip(g.clip, 0).startsWith('inset(0px '));
});

test('a top-bar chip keeps the sheet title inside the screen from the first frame', () => {
  const rect = { left: 20, top: 60, width: 335, height: 640 };
  const chip = { cx: 105, cy: 57, width: 160, height: 44, radius: 22 };
  const g = morphGeometry(rect, chip);
  const [originX, originY] = g.origin.split(' ').map(parseFloat);
  const titleTop = screenPoint(rect, { x: g.x, y: g.y, scale: g.scale, originX, originY }, 0, 0).y;
  nearPx(titleTop, chip.cy - chip.height / 2);
  assert.ok(titleTop >= 0);
});

test('a small icon starts from a bounded scale, and a wide card never enlarges the sheet', () => {
  const rect = { left: 20, top: 120, width: 350, height: 600 };
  assert.equal(morphGeometry(rect, { cx: 360, cy: 40, width: 44, height: 44 }).scale, 0.18);
  const wide = morphGeometry(rect, { cx: 195, cy: 300, width: 390, height: 100, radius: 24 });
  assert.equal(wide.scale, 1);
  assert.equal(wide.clip.x, 0);
  assert.equal(wide.clip.bottom, 500);
  assert.equal(morphGeometry(rect, null), null);
});

test('a closing sheet stays whole until it is back at its source', () => {
  for (const reveal of [1, 0.6, 0.3, 0.1, 0.08]) assert.equal(closingOpacity(reveal), 1);
  assert.ok(closingOpacity(0.04) < 1 && closingOpacity(0.04) > 0);
  assert.equal(closingOpacity(0), 0);
});

test('return fits the entire sheet inside a wide stock row or small toolbar icon without wiping its content', () => {
  const rect = { left: 20, top: 70, width: 320, height: 610 };
  for (const source of [{ cx: 180, cy: 520, width: 280, height: 90 }, { cx: 290, cy: 70, width: 44, height: 44 }]) {
    const g = wholeReturnGeometry(rect, source);
    const [originX, originY] = g.origin.split(' ').map(parseFloat);
    const pose = { ...g, originX, originY };
    const tl = screenPoint(rect, pose, 0, 0), br = screenPoint(rect, pose, rect.width, rect.height);
    near((tl.x + br.x) / 2, source.cx); near((tl.y + br.y) / 2, source.cy);
    assert.ok(br.x - tl.x <= source.width + 0.01);
    assert.ok(br.y - tl.y <= source.height + 0.01);
    for (const progress of [0, 0.1, 0.5, 1]) {
      assert.equal(revealClip(g.clip, progress), 'inset(0px 0.00px 0.00px round 28.00px)');
    }
  }
  assert.equal(wholeReturnGeometry(rect, null), null);
});
