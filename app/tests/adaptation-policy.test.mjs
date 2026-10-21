import test from 'node:test';
import assert from 'node:assert/strict';
import { computePolicy, layoutModeFor } from '../src/features/adaptation/policy.js';

test('janela pela largura disponível (classes do Android e a subfaixa de 360 dp do produto)', () => {
  assert.equal(layoutModeFor(320), 'narrow');
  assert.equal(layoutModeFor(359), 'narrow');
  assert.equal(layoutModeFor(360), 'compact');
  assert.equal(layoutModeFor(412), 'compact');
  assert.equal(layoutModeFor(600), 'medium');
  assert.equal(layoutModeFor(840), 'expanded');
});

test('texto ampliado numa janela compacta conta como estreita; altura baixa é compacta', () => {
  assert.equal(computePolicy({ width: 393, height: 852, fontScale: 1.3 }).layoutMode, 'narrow');
  assert.equal(computePolicy({ width: 393, height: 852, fontScale: 1 }).layoutMode, 'compact');
  assert.equal(computePolicy({ width: 800, height: 420 }).heightMode, 'compact');
});

test('layout e capacidade são saídas independentes', () => {
  const smallStrong = computePolicy({ width: 359, height: 788 });
  assert.equal(smallStrong.layoutMode, 'narrow');
  assert.equal(smallStrong.effectsMode, 'full');
  assert.equal(smallStrong.workloadMode, 'standard');
  const bigWeak = computePolicy({ width: 900, height: 1200, lite: true, frameBudgetLite: true });
  assert.equal(bigWeak.layoutMode, 'expanded');
  assert.equal(bigWeak.effectsMode, 'light');
  assert.equal(bigWeak.heavyTaskConcurrency, 1);
  assert.match(bigWeak.reasonCode, /measured-frames/);
});

test('escolha do produtor e do sistema prevalecem sobre efeitos', () => {
  assert.equal(computePolicy({ width: 412, height: 915, reduceEffects: true }).effectsMode, 'reduced');
  assert.equal(computePolicy({ width: 412, height: 915, reduceMotion: true }).effectsMode, 'reduced');
  assert.equal(computePolicy({ width: 412, height: 915, saveData: true }).workloadMode, 'light');
  assert.equal(computePolicy({ width: 412, height: 915 }).reasonCode, 'full');
});
