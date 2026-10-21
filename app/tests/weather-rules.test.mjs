import test from 'node:test';
import assert from 'node:assert/strict';
import { WEATHER_RULES } from '../src/features/advisor/weather-rules.js';

const run = weather => WEATHER_RULES.flatMap(rule => rule({ weather }));
const fair = (daysUntil, window) => ({ id: 'f' + daysUntil, name: 'Feira de Teste', date: '2030-01-1' + daysUntil, from: '07:00', until: '12:00', daysUntil, window });
const fresh = extra => ({ fetchedAt: Date.now() - 600000, nights: [], events: [], ...extra });

test('chuva no horário da feira vira conselho em mm, sem porcentagem', () => {
  const [advice] = run(fresh({ events: [fair(1, { min: 18, max: 23, rain: 4.2, symbol: 'rain' })] }));
  assert.equal(advice.id, 'tempo-chuva:f1');
  assert.match(advice.happened, /4,2 mm/);
  assert.doesNotMatch(advice.happened + advice.todo + advice.why, /%/);
  assert.equal(advice.decision.confidence, 'media');
  assert.equal(advice.decision.module, 'clima');
});

test('trovoada e geada passam na frente (urgente) e geada é qualitativa', () => {
  const out = run(fresh({ nights: [{ date: '2030-06-10', min: 2, label: 'nesta madrugada' }], events: [fair(0, { min: 15, max: 20, rain: 8, symbol: 'rainandthunder' })] }));
  const ids = out.map(o => o.id);
  assert.ok(ids.includes('tempo-geada:2030-06-10') && ids.includes('tempo-trovoada:f0'));
  assert.ok(out.filter(o => o.level === 'urgente').length === 2);
  const frost = out.find(o => o.id.startsWith('tempo-geada'));
  assert.equal(frost.decision.confidence, 'baixa');
  assert.match(frost.todo, /Fique atento/);
});

test('calor forte no horário pede sombra e caixa térmica', () => {
  const out = run(fresh({ events: [fair(2, { min: 24, max: 32, rain: 0, symbol: 'clearsky_day' })] }));
  assert.deepEqual(out.map(o => o.id), ['tempo-calor:f2']);
  assert.equal(out[0].decision.confidence, 'baixa');
});

test('nenhuma certeza além de 3 dias: feira distante não gera conselho de tempo', () => {
  assert.deepEqual(run(fresh({ events: [fair(5, { min: 18, max: 33, rain: 20, symbol: 'heavyrainandthunder' })] })), []);
});

test('previsão velha suspende os conselhos e pede atualização', () => {
  const out = run({ fetchedAt: Date.now() - 9 * 3600000, nights: [{ date: 'x', min: 1, label: 'hoje' }], events: [fair(1, { min: 18, max: 23, rain: 9, symbol: 'rain' })] });
  assert.deepEqual(out.map(o => o.id), ['tempo-desatualizado']);
  assert.equal(out[0].decision.confidence, 'nula');
});

test('sem previsão e sem feira próxima: silêncio', () => {
  assert.deepEqual(run(null), []);
  assert.deepEqual(run(fresh({})), []);
});
