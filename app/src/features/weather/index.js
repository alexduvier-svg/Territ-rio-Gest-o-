// Tempo para a Loja e para as feiras. Previsão: MET Norway (Locationforecast 2.0, dados abertos
// CC BY 4.0, uso comercial permitido, com crédito à fonte). Coordenadas: centro do município no IBGE,
// consultado uma vez por cidade. Sem GPS: usa a cidade dos Ajustes ou a do evento. A última previsão
// fica guardada no aparelho e é mostrada sem internet, com o horário em que foi atualizada.
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';

const AGENT = 'AGROGestao/0.12.39 github.com/alexduvier-svg/Territ-rio-Gest-o-';
const TZ = 'America/Sao_Paulo';
const MIN_REFRESH = 30 * 60000;
// Background check while the app is closed (WorkManager, android/…/AgroWeatherWorker.java).
const NativeWeather = Capacitor.isNativePlatform() ? registerPlugin('AgroWeather') : null;
const store = {
  get(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
};
const normalize = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

async function getJSON(url, headers = {}) {
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.get({ url, headers: { 'User-Agent': AGENT, Accept: 'application/json', ...headers }, connectTimeout: 12000, readTimeout: 15000 });
    if (response.status === 304) return { status: 304, headers: response.headers };
    if (response.status < 200 || response.status >= 300) throw new Error('HTTP ' + response.status);
    return { status: response.status, data: typeof response.data === 'string' ? JSON.parse(response.data) : response.data, headers: response.headers || {} };
  }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers });
    if (response.status === 304) return { status: 304, headers: {} };
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return { status: response.status, data: await response.json(), headers: Object.fromEntries(response.headers.entries()) };
  } finally { clearTimeout(timer); }
}
const header = (headers, name) => Object.entries(headers || {}).find(([k]) => k.toLowerCase() === name)?.[1];

// ---------------------------------------------------------------- where
const places = new Map();
export async function locate(city, uf) {
  const key = 'agro-geo:' + normalize(city) + '|' + String(uf || '').toUpperCase();
  const known = store.get(key);
  if (known?.lat) return known;
  if (!city || !uf) throw new Error('Informe a cidade e a UF nos Ajustes.');
  if (places.has(key)) return places.get(key);
  const job = (async () => {
    const list = (await getJSON('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' + encodeURIComponent(String(uf).toUpperCase()) + '/municipios')).data;
    const town = (list || []).find(m => normalize(m.nome) === normalize(city));
    if (!town) throw new Error('Cidade não encontrada no IBGE: ' + city + ' / ' + uf);
    const meta = (await getJSON('https://servicodados.ibge.gov.br/api/v3/malhas/municipios/' + town.id + '/metadados')).data;
    const center = meta?.[0]?.centroide;
    if (!center) throw new Error('Sem coordenadas para ' + town.nome);
    const place = { name: town.nome, uf: String(uf).toUpperCase(), lat: +(+center.latitude).toFixed(4), lon: +(+center.longitude).toFixed(4) };
    store.set(key, place);
    return place;
  })();
  places.set(key, job);
  try { return await job; } finally { places.delete(key); }
}

// ---------------------------------------------------------------- what
const LABELS = {
  clearsky: 'Céu limpo', fair: 'Poucas nuvens', partlycloudy: 'Parcialmente nublado', cloudy: 'Nublado', fog: 'Neblina',
  lightrain: 'Chuva fraca', rain: 'Chuva', heavyrain: 'Chuva forte',
  lightrainshowers: 'Pancadas fracas', rainshowers: 'Pancadas de chuva', heavyrainshowers: 'Pancadas fortes',
  lightrainandthunder: 'Chuva fraca e trovoadas', rainandthunder: 'Chuva e trovoadas', heavyrainandthunder: 'Chuva forte e trovoadas',
  lightrainshowersandthunder: 'Pancadas e trovoadas', rainshowersandthunder: 'Pancadas e trovoadas', heavyrainshowersandthunder: 'Pancadas fortes e trovoadas',
};
export const symbolBase = code => String(code || '').replace(/_(day|night|polartwilight)$/, '');
export const isNight = code => /_night$/.test(String(code || ''));
export const label = code => LABELS[symbolBase(code)] || (/thunder/.test(code) ? 'Trovoadas' : /rain|sleet|snow/.test(code) ? 'Chuva' : 'Nublado');
export function kind(code) {
  const base = symbolBase(code);
  if (/thunder/.test(base)) return 'thunder';
  if (/rain|sleet|snow/.test(base)) return 'rain';
  if (base === 'fog') return 'fog';
  if (base === 'cloudy') return 'cloud';
  if (base === 'partlycloudy' || base === 'fair') return isNight(code) ? 'night-cloud' : 'sun-cloud';
  return isNight(code) ? 'moon' : 'sun';
}
export function rainText(mm) {
  if (!(mm > 0.05)) return 'Sem chuva';
  if (mm < 1) return 'Garoa';
  const amount = mm < 10 ? mm.toFixed(1).replace('.', ',') : Math.round(mm);
  return (mm < 5 ? 'Chuva fraca ' : mm < 20 ? 'Chuva ' : 'Chuva forte ') + amount + ' mm';
}

const dayKey = time => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time));
const hourOf = time => +new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false }).format(new Date(time)) % 24;

// The series in plain terms: now, the next hours and the coming days (local calendar).
export function summarize(series) {
  const points = (series || []).map(p => ({
    time: p.time,
    temp: p.data?.instant?.details?.air_temperature,
    symbol: p.data?.next_1_hours?.summary?.symbol_code || p.data?.next_6_hours?.summary?.symbol_code,
    rain: p.data?.next_1_hours?.details?.precipitation_amount ?? null,
    rain6: p.data?.next_6_hours?.details?.precipitation_amount ?? null,
    symbol6: p.data?.next_6_hours?.summary?.symbol_code,
  })).filter(p => Number.isFinite(p.temp));
  const now = Date.now();
  const future = points.filter(p => Date.parse(p.time) > now - 3600000);
  const current = future[0] || points.at(-1) || null;
  const hours = future.filter(p => p.rain !== null).slice(0, 12);
  const days = new Map();
  for (const p of points) {
    const key = dayKey(p.time);
    const day = days.get(key) || { date: key, min: Infinity, max: -Infinity, rain: 0, symbols: [] };
    day.min = Math.min(day.min, p.temp); day.max = Math.max(day.max, p.temp);
    // Rain: hourly amounts while they exist, then the 6-hour blocks (no double counting).
    if (p.rain !== null) day.rain += p.rain;
    else if (p.rain6 !== null) day.rain += p.rain6; // beyond the hourly range, points are 6 h apart
    const h = hourOf(p.time);
    if (h >= 9 && h <= 15) day.symbols.push(p.symbol || p.symbol6);
    days.set(key, day);
  }
  const today = dayKey(now);
  const list = [...days.values()].filter(d => d.date >= today).map(d => ({
    date: d.date, min: Math.round(d.min), max: Math.round(d.max), rain: Math.round(d.rain * 10) / 10,
    symbol: dominant(d.symbols.filter(Boolean)) || 'cloudy',
  }));
  return { now: current, hours, days: list };
}
function dominant(symbols) {
  // The wettest daytime symbol wins (a fair day with a shower is a day with a shower).
  const weight = s => /thunder/.test(s) ? 5 : /heavyrain/.test(s) ? 4 : /rain|sleet|snow/.test(s) ? 3 : /cloudy/.test(s) && !/partly/.test(s) ? 2 : /partly|fair/.test(s) ? 1 : 0;
  return symbols.slice().sort((a, b) => weight(b) - weight(a))[Math.floor(symbols.length / 3)] || symbols[0];
}

// Hours of a fair (local "HH:MM" from/until) on a given date: what the producer will face.
export function eventWindow(summary, raw, date, from = '07:00', until = '13:00') {
  const day = summary.days.find(d => d.date === date);
  if (!day) return null;
  const [fh] = String(from).split(':').map(Number), [uh] = String(until).split(':').map(Number);
  const inside = (raw || []).filter(p => dayKey(p.time) === date && hourOf(p.time) >= fh && hourOf(p.time) < Math.max(fh + 1, uh));
  const temps = inside.map(p => p.data?.instant?.details?.air_temperature).filter(Number.isFinite);
  let rain = 0;
  for (const p of inside) { const r = p.data?.next_1_hours?.details?.precipitation_amount; if (Number.isFinite(r)) rain += r; }
  if (!inside.some(p => p.data?.next_1_hours)) {
    // Beyond the hourly range: the 6-hour blocks that overlap the fair hours.
    for (const p of (raw || []).filter(p => dayKey(p.time) === date && p.data?.next_6_hours)) {
      const h = hourOf(p.time);
      if (h + 6 > fh && h < uh) rain += p.data.next_6_hours.details?.precipitation_amount || 0;
    }
  }
  const symbols = inside.map(p => p.data?.next_1_hours?.summary?.symbol_code || p.data?.next_6_hours?.summary?.symbol_code).filter(Boolean);
  return { date, min: temps.length ? Math.round(Math.min(...temps)) : day.min, max: temps.length ? Math.round(Math.max(...temps)) : day.max,
    rain: Math.round(rain * 10) / 10, symbol: dominant(symbols) || day.symbol };
}

// ---------------------------------------------------------------- forecast, cached
const running = new Map();
const placeKey = place => place.lat.toFixed(4) + ',' + place.lon.toFixed(4);

// Asks Android to keep this town's forecast fresh about every 30 minutes while the app is closed.
const scheduled = new Set();
export function keepFresh(place) {
  if (!NativeWeather || !place || scheduled.has(placeKey(place))) return;
  scheduled.clear(); scheduled.add(placeKey(place));
  NativeWeather.schedule({ lat: place.lat, lon: place.lon, agent: AGENT }).catch(() => scheduled.clear());
}

// Takes the forecast saved by the background check when it is newer than the one in the app.
async function adoptNative(place, key) {
  if (!NativeWeather) return;
  try {
    const saved = await NativeWeather.latest();
    if (!saved?.body || saved.place !== placeKey(place)) return;
    const entry = store.get(key);
    if (entry && entry.fetchedAt >= saved.fetchedAt) return;
    const series = JSON.parse(saved.body)?.properties?.timeseries;
    if (Array.isArray(series) && series.length) store.set(key, { series, fetchedAt: saved.fetchedAt, expires: saved.expires, lastModified: saved.lastModified || '', place });
  } catch {}
}
export function cached(place) {
  const entry = place && store.get('agro-wx:' + place.lat + ',' + place.lon);
  return entry ? { ...entry, summary: summarize(entry.series) } : null;
}
export async function forecast(place) {
  const key = 'agro-wx:' + place.lat + ',' + place.lon;
  await adoptNative(place, key);
  const entry = store.get(key);
  if (entry && Date.now() < Math.max(entry.expires || 0, entry.fetchedAt + MIN_REFRESH)) return { ...entry, summary: summarize(entry.series) };
  if (running.has(key)) return running.get(key);
  const job = (async () => {
    try {
      const url = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=' + place.lat + '&lon=' + place.lon;
      const response = await getJSON(url, entry?.lastModified ? { 'If-Modified-Since': entry.lastModified } : {});
      const expires = Date.parse(header(response.headers, 'expires') || '') || Date.now() + MIN_REFRESH;
      const next = response.status === 304 && entry
        ? { ...entry, fetchedAt: Date.now(), expires }
        : { series: response.data?.properties?.timeseries || [], fetchedAt: Date.now(), expires, lastModified: header(response.headers, 'last-modified') || '', place };
      store.set(key, next);
      return { ...next, summary: summarize(next.series) };
    } catch (error) {
      if (entry) return { ...entry, stale: true, summary: summarize(entry.series) };
      throw error;
    }
  })();
  running.set(key, job);
  try { return await job; } finally { running.delete(key); }
}

export async function forCity(city, uf) {
  const place = await locate(city, uf);
  return { place, ...(await forecast(place)) };
}
export function cachedForCity(city, uf) {
  const place = store.get('agro-geo:' + normalize(city) + '|' + String(uf || '').toUpperCase());
  return place ? { place, ...(cached(place) || {}) } : null;
}
