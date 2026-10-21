// Núcleo de cálculo do motor de decisões (docs/motor). Funções puras, SI por dentro, arredondamento
// só na exibição. Cada função tem teste-ouro em tests/decision-math.test.mjs e entrada no
// docs/motor/registry.json. Finanças (margem, ponto de equilíbrio, resultado) NÃO estão aqui: a
// fórmula canônica é src/features/finance/finance.js (classe D1 no relatório de duplicidade).
// Divisões protegidas: valor indefinido devolve null (nunca Infinity/NaN silencioso).

const finite = (...values) => values.every(Number.isFinite);
export const safeDiv = (a, b) => finite(a, b) && b !== 0 ? a / b : null;

// ---------------------------------------------------------------- somas e variância estáveis
export function kahanSum(values) {
  let sum = 0, carry = 0;
  for (const v of values) { if (!Number.isFinite(v)) continue; const y = v - carry, t = sum + y; carry = (t - sum) - y; sum = t; }
  return sum;
}
// Welford (online): média e variância amostral sem cancelamento catastrófico.
export function welford(values) {
  let n = 0, mean = 0, m2 = 0;
  for (const v of values) { if (!Number.isFinite(v)) continue; n++; const d = v - mean; mean += d / n; m2 += d * (v - mean); }
  return { n, mean: n ? mean : null, variance: n > 1 ? m2 / (n - 1) : null };
}

// ---------------------------------------------------------------- ar úmido (FAO-56), T em °C, kPa
export const saturationVapourPressure = t => finite(t) ? 0.6108 * Math.exp(17.27 * t / (t + 237.3)) : null;
export const vapourSlope = t => finite(t) ? 4098 * saturationVapourPressure(t) / (t + 237.3) ** 2 : null;
export const pressureAtAltitude = z => finite(z) ? 101.3 * ((293 - 0.0065 * z) / 293) ** 5.26 : null;
export const psychrometricConstant = pressure => finite(pressure) ? 0.665e-3 * pressure : null;
export function dewPoint(t, rh) {
  if (!finite(t, rh) || rh <= 0 || rh > 100) return null;
  const g = Math.log(rh / 100) + 17.27 * t / (t + 237.3);
  return 237.3 * g / (17.27 - g);
}
// Stull (2011): válido para UR 5–99 % e T −20 a 50 °C (erro típico < 0,3 °C).
export function wetBulb(t, rh) {
  if (!finite(t, rh) || rh < 5 || rh > 99 || t < -20 || t > 50) return null;
  return t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) + Math.atan(t + rh) - Math.atan(rh - 1.676331)
    + 0.00391838 * rh ** 1.5 * Math.atan(0.023101 * rh) - 4.686035;
}
export const vapourPressureDeficit = (t, rh) => finite(t, rh) ? saturationVapourPressure(t) * (1 - rh / 100) : null;

// ---------------------------------------------------------------- radiação e ET0 (FAO-56)
export function extraterrestrialRadiation(latitudeDeg, julianDay) {
  if (!finite(latitudeDeg, julianDay)) return null;
  const phi = latitudeDeg * Math.PI / 180, dr = 1 + 0.033 * Math.cos(2 * Math.PI * julianDay / 365);
  const delta = 0.409 * Math.sin(2 * Math.PI * julianDay / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  return 24 * 60 / Math.PI * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
}
// Penman-Monteith diário (método canônico). Rn, G em MJ m⁻² dia⁻¹; u2 em m/s; es, ea em kPa.
export function et0PenmanMonteith({ t, rn, g = 0, u2, es, ea, pressure = 101.3 }) {
  if (!finite(t, rn, g, u2, es, ea, pressure)) return null;
  const d = vapourSlope(t), y = psychrometricConstant(pressure);
  return (0.408 * d * (rn - g) + y * (900 / (t + 273)) * u2 * (es - ea)) / (d + y * (1 + 0.34 * u2));
}
// Hargreaves (fallback D2, só temperatura): reduzir a confiança do conselho em um nível.
export function et0Hargreaves({ tmin, tmax, ra }) {
  if (!finite(tmin, tmax, ra) || tmax < tmin) return null;
  return 0.0023 * ((tmin + tmax) / 2 + 17.8) * Math.sqrt(tmax - tmin) * 0.408 * ra;
}
// Graus-dia pela média com limites (Tb base, TB teto).
export function degreeDays(tmax, tmin, tb, tB = Infinity) {
  if (!finite(tmax, tmin, tb)) return null;
  return Math.max(0, (Math.min(tmax, tB) + Math.max(tmin, tb)) / 2 - tb);
}
// Geada: a folha esfria c °C abaixo do abrigo em noite limpa e calma (padrão 4 °C, calibrável).
export const leafTemperature = (shelterMin, c = 4) => finite(shelterMin, c) ? shelterMin - c : null;

// ---------------------------------------------------------------- mercado
export const SACA_LB = 132.277;
export const iceToSaca = (centsPerLb, brlPerUsd) => finite(centsPerLb, brlPerUsd) ? centsPerLb / 100 * SACA_LB * brlPerUsd : null;

// ---------------------------------------------------------------- estoque
export const economicOrderQuantity = (demand, orderCost, holdingCost) => finite(demand, orderCost, holdingCost) && holdingCost > 0 && demand >= 0 && orderCost >= 0 ? Math.sqrt(2 * demand * orderCost / holdingCost) : null;
export const reorderPoint = (dailyMean, dailySd, leadDays, z = 1.65) => finite(dailyMean, dailySd, leadDays, z) && leadDays >= 0 ? dailyMean * leadDays + z * dailySd * Math.sqrt(leadDays) : null;

// ---------------------------------------------------------------- decisão
// Custo-perda: proteger compensa quando a chance do evento passa de C/L (L = perda evitada).
export const costLossThreshold = (cost, loss) => finite(cost, loss) && loss > 0 && cost >= 0 ? cost / loss : null;
export const expectedValue = scenarios => Array.isArray(scenarios) && scenarios.length ? kahanSum(scenarios.map(s => s.p * s.value)) : null;

// ---------------------------------------------------------------- poucos dados
export function wilsonInterval(k, n, z = 1.96) {
  if (!finite(k, n, z) || n <= 0 || k < 0 || k > n) return null;
  const p = k / n, z2 = z * z, den = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / den, margin = z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den;
  return [center - margin, center + margin];
}
export const betaBinomialShrink = (k, n, alpha, beta) => finite(k, n, alpha, beta) && n + alpha + beta > 0 ? (k + alpha) / (n + alpha + beta) : null;

// Exibição: probabilidade em múltiplos de 5 % ("cerca de 35 %"), nunca precisão falsa.
export const roundProbability = p => finite(p) ? Math.round(Math.max(0, Math.min(1, p)) * 20) / 20 : null;
