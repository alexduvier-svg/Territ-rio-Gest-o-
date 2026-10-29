import test from 'node:test';
import assert from 'node:assert/strict';
import { getNavTrack, navTrackCacheSize, NAV_TRACK_KINDS } from '../src/features/motion/nav-tracks.js';
import { playNavTrack } from '../src/features/motion/nav-icons.js';
import { finishAll, liveCount, registerMotion } from '../src/features/motion/engine.js';

test('navigation tracks are immutable, bounded and reused across the eight icon/mode combinations', () => {
  for (let repeat = 0; repeat < 12; repeat++) for (const kind of NAV_TRACK_KINDS) for (const lite of [false, true]) {
    const track = getNavTrack(kind, lite);
    assert.strictEqual(track, getNavTrack(kind, lite));
    assert(Object.isFrozen(track) && Object.isFrozen(track.parts));
    assert(track.duration > 200 && track.duration < 1800);
    for (const frames of Object.values(track.parts)) {
      assert(Object.isFrozen(frames));
      assert.equal(frames[0].offset, 0); assert.equal(frames.at(-1).offset, 1);
      for (let i = 0; i < frames.length; i++) {
        assert(Object.isFrozen(frames[i]));
        assert(frames[i].offset >= 0 && frames[i].offset <= 1);
        if (i) assert(frames[i].offset > frames[i - 1].offset);
        for (const value of Object.values(frames[i])) assert(!/NaN|Infinity/.test(String(value)));
      }
    }
  }
  assert.equal(navTrackCacheSize(), 8);
  assert.throws(() => getNavTrack('unbounded-user-input'), RangeError);
  assert.equal(navTrackCacheSize(), 8);
});

test('stock apple waits for opening, follows gravity and disappears permanently on reaching the box', () => {
  for (const lite of [false, true]) {
    const track = getNavTrack('stock', lite), { dropAt, landedAt, gravity } = track.metadata;
    const theoreticalLanding = dropAt + Math.sqrt(2 * (1.3 + 8.6) / gravity) * 1000;
    assert(landedAt >= theoreticalLanding && landedAt - theoreticalLanding <= 1000 / 60 + 0.001);
    for (const frame of track.parts.apple.slice(0, -1)) {
      const time = frame.offset * track.duration;
      const y = Number(frame.transform.match(/^translate\(0px, ([\d.-]+)px\)/)[1]);
      assert(y >= -8.6001 && y <= 1.3001);
      if (time <= dropAt) assert.equal(y, -8.6);
      else if (time < landedAt - 0.001) {
        const expected = -8.6 + gravity * ((time - dropAt) / 1000) ** 2 / 2;
        assert(Math.abs(y - expected) < 0.00011, `${lite}/${time}: ${y} vs ${expected}`);
      } else assert.equal(Number(frame.opacity), 0);
    }
    assert.equal(track.parts.apple.at(-1).opacity, '0');
    assert.equal(track.parts.left.at(-1).transform, 'translate(0px, 0px)');
    assert.equal(track.parts.right.at(-1).transform, 'translate(0px, 0px)');
  }
});

test('people cross twice, return to their original order and retain the quieter lite excursion', () => {
  const peak = track => Math.max(...track.parts.back.map(frame => Math.abs(Number(frame.transform.match(/^translate\(([\d.-]+)px/)[1]))));
  for (const lite of [false, true]) {
    const track = getNavTrack('people', lite);
    assert.equal(track.swaps.length, 2);
    assert.deepEqual(track.swaps.map(swap => swap.backInFront), [true, false]);
    assert(track.swaps[0].time > 0 && track.swaps[1].time < track.duration);
    assert.equal(track.parts.back.at(-1).opacity, '0.82');
    assert.equal(track.parts.front.at(-1).opacity, '1');
  }
  assert(peak(getNavTrack('people', false)) > peak(getNavTrack('people', true)) * 2);
});

test('four chart bars preserve elastic overshoot and the calendar stroke stays within its path', () => {
  const chart = getNavTrack('chart', false);
  assert.deepEqual(Object.keys(chart.parts), ['bar0', 'bar1', 'bar2', 'bar3']);
  for (const frames of Object.values(chart.parts)) {
    const scales = frames.slice(0, -1).map(frame => Number(frame.transform.match(/scale\(1.0000, ([\d.-]+)\)/)[1]));
    assert(Math.max(...scales) > 1 && Math.max(...scales) < 1.4);
    assert.equal(frames.at(-1).transform, 'translate(0px, 0px)');
  }
  assert(getNavTrack('chart', true).duration < chart.duration);
  for (const lite of [false, true]) {
    const frames = getNavTrack('calendar', lite).parts.tick;
    assert.equal(Number(frames[0].strokeDashoffset), 1);
    assert.equal(Number(frames.at(-1).strokeDashoffset), 0);
    assert(frames.every(frame => Number(frame.strokeDashoffset) >= 0 && Number(frame.strokeDashoffset) <= 1));
  }
});

function fixture(kind) {
  const svg = { children: [], isConnected: true, append(part) { this.children.splice(this.children.indexOf(part), 1); this.children.push(part); } };
  const timers = new Map(), animations = []; let nextTimer = 0;
  const makePart = (name, initialStyle = null) => {
    const classes = new Set(name === 'back' ? ['nav-physical-part'] : []);
    const attrs = new Map([['transform', 'translate(1 2)']]);
    if (initialStyle !== null) attrs.set('style', initialStyle);
    const part = {
      name, parentNode: svg, style: {}, classList: { contains: name => classes.has(name), add: name => classes.add(name), remove: name => classes.delete(name) },
      getAttribute: name => attrs.get(name) ?? null,
      setAttribute(name, value) { attrs.set(name, value); if (name === 'style') this.style = {}; },
      removeAttribute(name) { attrs.delete(name); if (name === 'style') this.style = {}; },
      after(other) { svg.children.splice(svg.children.indexOf(other), 1); svg.children.splice(svg.children.indexOf(this) + 1, 0, other); },
      before(other) { svg.children.splice(svg.children.indexOf(other), 1); svg.children.splice(svg.children.indexOf(this), 0, other); },
      animate(frames, options) {
        let resolve, reject;
        const animation = { frames, options, cancelled: false, finished: new Promise((yes, no) => { resolve = yes; reject = no; }), complete: () => resolve(), cancel() { this.cancelled = true; reject(Error('cancelled')); } };
        animations.push(animation); return animation;
      },
    };
    svg.children.push(part); return part;
  };
  const parts = Object.fromEntries(Object.keys(getNavTrack(kind).parts).map((name, index) => [name, makePart(name, index ? null : 'opacity:.73!important;transform:scale(.9)')]));
  svg.querySelectorAll = selector => {
    const role = kind === 'people' ? selector.includes('back') ? 'back' : 'front' : kind === 'calendar' ? 'tick' : kind === 'stock' ? ['apple', 'shell', 'left', 'right'].find(name => selector.includes(name)) : 'bar' + selector.match(/data-index="(\d)"/)[1];
    return parts[role] ? [parts[role]] : [];
  };
  return { svg, parts, animations, timers, schedule(callback, time) { const id = ++nextTimer; timers.set(id, { callback: () => { timers.delete(id); callback(); }, time }); return id; }, clear(id) { timers.delete(id); } };
}

test('cancelling a crossing restores styles/classes/order, removes timers and ignores stale completion', async () => {
  const f = fixture('people'), original = [...f.svg.children], styles = original.map(part => part.getAttribute('style'));
  let rests = 0;
  const motion = playNavTrack(f.svg, getNavTrack('people'), { schedule: f.schedule, clear: f.clear, onRest: cancelled => { assert(cancelled); rests++; } });
  assert.equal(liveCount(), 1); assert.equal(f.timers.size, 2);
  const pending = [...f.timers.values()]; pending[0].callback();
  assert.deepEqual(f.svg.children, [f.parts.front, f.parts.back]);
  motion.cancel(); motion.cancel();
  assert.equal(liveCount(), 0); assert.equal(f.timers.size, 0); assert.equal(rests, 1);
  assert.deepEqual(f.svg.children, original);
  original.forEach((part, index) => { assert.equal(part.getAttribute('style'), styles[index]); assert.equal(part.getAttribute('transform'), 'translate(1 2)'); });
  assert(f.parts.back.classList.contains('nav-physical-part'));
  assert(!f.parts.front.classList.contains('nav-physical-part'));
  pending[1].callback(); f.animations.forEach(animation => animation.complete());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(rests, 1); assert.deepEqual(f.svg.children, original);
});

test('global motion finish and natural WAAPI completion release groups and restore original calendar dash styles', async () => {
  const f = fixture('calendar'); let rests = 0;
  playNavTrack(f.svg, getNavTrack('calendar'), { onRest: cancelled => { assert.equal(cancelled, false); rests++; } });
  assert.equal(liveCount(), 1); assert.equal(f.parts.tick.style.strokeDasharray, '1');
  finishAll(); assert.equal(liveCount(), 0); assert.equal(rests, 1);
  assert.equal(f.parts.tick.getAttribute('style'), 'opacity:.73!important;transform:scale(.9)');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(rests, 1);
  const chart = fixture('chart');
  playNavTrack(chart.svg, getNavTrack('chart'), { onRest: cancelled => { assert.equal(cancelled, false); rests++; } });
  chart.animations.forEach(animation => animation.complete());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(liveCount(), 0); assert.equal(rests, 2);
  assert(chart.animations.every(animation => animation.cancelled));
});

test('a missing SVG part never starts a partial group or schedules order changes', () => {
  const f = fixture('stock'); delete f.parts.left;
  assert.equal(playNavTrack(f.svg, getNavTrack('stock')), null);
  assert.equal(f.animations.length, 0); assert.equal(f.timers.size, 0); assert.equal(liveCount(), 0);
});

test('an immediate budget finish while registering cannot leave orphan animations or timers', async () => {
  const f = fixture('people'); let rests = 0;
  const motion = playNavTrack(f.svg, getNavTrack('people'), {
    schedule: f.schedule, clear: f.clear, onRest: () => rests++,
    register(handle) { const release = registerMotion(handle); finishAll(); return release; },
  });
  assert.equal(motion.running, false); assert.equal(liveCount(), 0); assert.equal(f.timers.size, 0);
  assert(f.animations.every(animation => animation.cancelled));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(rests, 1);
});
