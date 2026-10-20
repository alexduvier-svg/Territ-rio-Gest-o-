// Testes-ouro do docs/motor (MOTOR_INTELIGENCIA_AGRO_GESTAO, seção 11). Tolerância relativa 1e-3.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/features/decision/math.js';

const near = (actual, expected, rel = 1e-3, abs = 0) => assert.ok(Math.abs(actual - expected) <= Math.max(abs, Math.abs(expected) * rel), `${actual} ≈ ${expected}`);

test('T-CLI-01/02 pressão de saturação de vapor', () => {
  near(M.saturationVapourPressure(20), 2.338);
  near(M.saturationVapourPressure(25), 3.168);
});
test('T-CLI-03 declividade da curva de vapor a 25 °C', () => near(M.vapourSlope(25), 0.1887));
test('T-CLI-04 pressão ao nível do mar e constante psicrométrica', () => {
  near(M.pressureAtAltitude(0), 101.3);
  near(M.psychrometricConstant(M.pressureAtAltitude(0)), 0.0674);
});
test('T-CLI-05 ponto de orvalho (25 °C, 60 %)', () => near(M.dewPoint(25, 60), 16.7, 0, 0.1));
test('T-CLI-06 graus-dia (Tmax 28, Tmin 14, Tb 10, TB 34)', () => near(M.degreeDays(28, 14, 10, 34), 11.0));
test('T-MER-01 ICE 300 ¢/lb, câmbio 5,40 → R$ 2.142,89/saca', () => near(M.iceToSaca(300, 5.4), 2142.89, 1e-5));
test('T-EST-01 lote econômico (D 1200, S 50, H 2)', () => near(M.economicOrderQuantity(1200, 50, 2), 244.9));
test('T-DEC-01 custo-perda (C 200, L 1000) → agir se p > 0,20', () => near(M.costLossThreshold(200, 1000), 0.2));
test('T-EST-02 Wilson (k 8, n 10) ≈ [0,49; 0,94]', () => {
  const [lo, hi] = M.wilsonInterval(8, 10);
  near(lo, 0.49, 0, 0.005); near(hi, 0.94, 0, 0.005);
});
// T-EST-03: o documento espera 0,25, mas a própria fórmula dele, (k + α)/(n + α + β), dá 3/11 ≈ 0,273.
// Mantida a fórmula; a divergência está em docs/motor/RELATORIO_DUPLICIDADE.md (pendência P1).
test('T-EST-03 Beta-Binomial (k 1, n 1, α 2, β 8) = 3/11', () => near(M.betaBinomialShrink(1, 1, 2, 8), 3 / 11));

test('divisões e domínios protegidos devolvem null, nunca Infinity/NaN', () => {
  assert.equal(M.safeDiv(1, 0), null);
  assert.equal(M.economicOrderQuantity(10, 5, 0), null);
  assert.equal(M.costLossThreshold(10, 0), null);
  assert.equal(M.dewPoint(20, 0), null);
  assert.equal(M.wetBulb(20, 100), null);
  assert.equal(M.wilsonInterval(5, 0), null);
});
test('somatório de Kahan e variância de Welford são estáveis', () => {
  assert.equal(M.kahanSum(Array(10).fill(0.1)), 1);
  const w = M.welford([1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]);
  near(w.mean, 1e9 + 10, 1e-12); near(w.variance, 30);
});
test('bulbo úmido (Stull) e ET0 dão ordens de grandeza físicas', () => {
  near(M.wetBulb(20, 50), 13.7, 0, 0.3);
  const ra = M.extraterrestrialRadiation(-20.7, 294);
  assert.ok(ra > 35 && ra < 45, String(ra));
  const pm = M.et0PenmanMonteith({ t: 25, rn: 15, u2: 2, es: 3.168, ea: 1.9 });
  assert.ok(pm > 3 && pm < 7, String(pm));
  assert.ok(M.et0Hargreaves({ tmin: 18, tmax: 30, ra }) > 3);
});
test('probabilidade exibida em múltiplos de 5 %', () => {
  assert.equal(M.roundProbability(0.3742), 0.35);
  assert.equal(M.roundProbability(1.2), 1);
});
