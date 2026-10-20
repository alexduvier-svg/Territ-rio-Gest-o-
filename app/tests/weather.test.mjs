import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize, eventWindow, rainText, kind, label } from '../src/features/weather/index.js';

const at = (iso, temp, symbol, rain, six) => ({ time: iso, data: { instant: { details: { air_temperature: temp } },
  ...(rain === undefined ? {} : { next_1_hours: { summary: { symbol_code: symbol }, details: { precipitation_amount: rain } } }),
  ...(six ? { next_6_hours: { summary: { symbol_code: six.symbol || symbol }, details: { precipitation_amount: six.rain } } } : {}) } });

test('rain is described in plain words and millimetres', () => {
  assert.equal(rainText(0), 'Sem chuva');
  assert.equal(rainText(0.4), 'Garoa');
  assert.equal(rainText(2.3), 'Chuva fraca 2,3 mm');
  assert.equal(rainText(12), 'Chuva 12 mm');
  assert.equal(rainText(25), 'Chuva forte 25 mm');
  assert.equal(kind('partlycloudy_day'), 'sun-cloud');
  assert.equal(kind('heavyrainandthunder'), 'thunder');
  assert.equal(label('cloudy'), 'Nublado');
});

test('days follow the Brazilian calendar and add hourly rain, then 6-hour blocks, once', () => {
  const base = Date.UTC(2030, 0, 10, 12); // 09h in São Paulo
  const series = [];
  for (let h = 0; h < 30; h++) series.push(at(new Date(base + h * 3600000).toISOString(), 20 + (h % 10), h < 3 ? 'rain' : 'cloudy', h < 3 ? 1 : 0));
  for (let k = 0; k < 6; k++) series.push(at(new Date(base + (30 + k * 6) * 3600000).toISOString(), 18, undefined, undefined, { symbol: 'lightrain', rain: 2 }));
  const s = summarize(series);
  const first = s.days.find(d => d.date === '2030-01-10');
  assert.equal(first.rain, 3);
  assert.ok(s.days.some(d => d.rain >= 2));
  const w = eventWindow(s, series, '2030-01-10', '09:00', '12:00');
  assert.equal(w.rain, 3);
  assert.match(w.symbol, /rain/);
});
