// Tempo na interface: uma pílula na barra da Loja (agora, na cidade dos Ajustes), uma janela com as
// próximas horas e dias, e uma linha em cada feira dos próximos 9 dias com o tempo no horário dela.
// Tudo é desenhado com o que estiver guardado e atualizado em segundo plano, sem redesenhar a tela.
import * as Weather from './index.js';

const bridge = () => window.TerritorioWorkflowBridge;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const settings = () => bridge()?.data()?.settings || {};
// Each producer sees the weather of the city in their own Ajustes; there is no default city.
const homeCity = () => { const st = settings(); return st.city && st.uf ? { city: st.city, uf: st.uf } : null; };
const PIN = '<svg class="wx-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>';
const failures = new Map(); // city|uf -> message, when the IBGE does not know the city
const deg = value => Number.isFinite(value) ? Math.round(value) + '°' : '—°';
const weekday = date => new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(new Date(date + 'T12:00:00Z')).replace('-feira', '');
const hourLabel = time => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(time)) + 'h';
const clock = time => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(time));
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dayName = date => { const t = todayKey(); if (date === t) return 'Hoje'; const d = new Date(Date.parse(t + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10); return date === d ? 'Amanhã' : weekday(date).replace(/^./, c => c.toUpperCase()); };

// Line icons in the app's stroke style; the sun is warm, rain is cool, the rest follows the text.
const SUN = '<circle cx="12" cy="12" r="4.2" class="wx-sun"/><path class="wx-sun" d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M5.4 18.6 7 17M17 7l1.6-1.6"/>';
const CLOUD = '<path d="M7.5 18.5h9.2a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.1A4.4 4.4 0 0 0 7.5 18.5Z"/>';
const SMALL_CLOUD = '<path d="M9.5 20h7.6a3.1 3.1 0 0 0 .3-6.2 4.3 4.3 0 0 0-8.2-.9A3.6 3.6 0 0 0 9.5 20Z"/>';
const ICONS = {
  sun: SUN,
  moon: '<path class="wx-moon" d="M19.5 14.6A7.8 7.8 0 0 1 9.4 4.5a7.8 7.8 0 1 0 10.1 10.1Z"/>',
  'sun-cloud': '<g transform="translate(-2.2 -2.6) scale(.78)">' + SUN + '</g>' + SMALL_CLOUD,
  'night-cloud': '<path class="wx-moon" d="M13.6 9.4A5 5 0 0 1 7.2 3a5 5 0 1 0 6.4 6.4Z"/>' + SMALL_CLOUD,
  cloud: CLOUD,
  fog: '<path d="M4 9.5h16M2.8 13.5h18.4M5 17.5h14"/>',
  rain: '<path d="M7.5 15h9.2a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.1A4.4 4.4 0 0 0 7.5 15Z"/><path class="wx-rain" d="M8.6 18l-1 2.4M12.6 18l-1 2.4M16.6 18l-1 2.4"/>',
  thunder: '<path d="M7.5 14.5h9.2a3.8 3.8 0 0 0 .4-7.6 5.2 5.2 0 0 0-10-1.1A4.4 4.4 0 0 0 7.5 14.5Z"/><path class="wx-bolt" d="m12.6 15.6-2.2 3.6h3l-2 3.4"/>',
};
export const icon = (code, extra = '') => '<svg class="wx-icon ' + extra + '" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[Weather.kind(code)] || CLOUD) + '</svg>';

// ---------------------------------------------------------------- pill on the Loja bar
export function chip() {
  const home = homeCity();
  if (!home) return '<button type="button" data-action="weather-city" class="glass-weather is-ask" data-weather-chip aria-label="Informe sua cidade para ver o tempo">' + PIN + '<span>Cidade</span></button>';
  const data = Weather.cachedForCity(home.city, home.uf);
  const now = data?.summary?.now;
  const text = now ? deg(now.temp) : '—°';
  const name = now ? 'Tempo em ' + (data.place?.name || home.city) + ': ' + Math.round(now.temp) + ' graus, ' + Weather.label(now.symbol) : 'Tempo em ' + home.city;
  return '<button type="button" data-action="weather-open" class="glass-weather' + (now ? '' : ' is-loading') + '" data-weather-chip aria-label="' + esc(name) + '">' + icon(now?.symbol || 'cloudy') + '<span class="tabular">' + text + '</span></button>';
}

// ---------------------------------------------------------------- line in a fair card
export function eventLine(e) {
  if (!e || e.status === 'finished') return '';
  const days = (Date.parse(e.start + 'T12:00:00Z') - Date.parse(todayKey() + 'T12:00:00Z')) / 86400000;
  if (!(days >= 0 && days <= 9)) return '';
  return '<p class="event-weather" data-event-weather="' + esc(e.id) + '">' + eventText(e) + '</p>';
}
const placeOf = e => { const home = homeCity(); const city = e.city || home?.city, uf = e.uf || home?.uf; return city && uf ? { city, uf } : null; };
function eventText(e) {
  const where = placeOf(e);
  if (!where) return icon('cloudy', 'is-muted') + '<span>Informe a cidade nos Ajustes para ver o tempo da feira.</span>';
  const data = Weather.cachedForCity(where.city, where.uf);
  const date = e.start >= todayKey() ? e.start : todayKey();
  const w = data?.series && Weather.eventWindow(data.summary, data.series, date, e.from, e.until);
  if (!w) return icon('cloudy', 'is-muted') + '<span>' + (failures.has(where.city + '|' + where.uf) ? 'Cidade da feira não encontrada no IBGE: ' + esc(where.city) + ' / ' + esc(where.uf) : 'Previsão para ' + esc(dayName(date).toLowerCase()) + ' em ' + esc(where.city) + '…') + '</span>';
  return icon(w.symbol) + '<span><strong>' + esc(dayName(date)) + ', ' + esc(e.from) + '–' + esc(e.until) + ':</strong> ' + esc(Weather.label(w.symbol)) + ' · ' + w.min + '–' + w.max + '° · ' + esc(Weather.rainText(w.rain)) + '</span>';
}
export const askCity = () => bridge()?.actions?.['business-settings']?.();

// ---------------------------------------------------------------- the weather sheet
export async function open() {
  const b = bridge();
  const home = homeCity();
  if (!home) return askCity();
  const { city, uf } = home;
  let data = Weather.cachedForCity(city, uf);
  const paint = d => {
    const now = d?.summary?.now;
    if (!now) return '<p class="wx-empty">Buscando a previsão para ' + esc(city) + '…</p>';
    const hours = d.summary.hours.map((h, i) => '<li><span>' + (i === 0 && Date.parse(h.time) <= Date.now() ? 'Agora' : hourLabel(h.time)) + '</span>' + icon(h.symbol) + '<strong class="tabular">' + deg(h.temp) + '</strong><small>' + (h.rain > 0.05 ? String(h.rain).replace('.', ',') + ' mm' : '') + '</small></li>').join('');
    const days = d.summary.days;
    const low = Math.min(...days.map(x => x.min)), high = Math.max(...days.map(x => x.max)), span = Math.max(1, high - low);
    const rows = days.map(x => '<li><span class="wx-day">' + esc(dayName(x.date)) + '</span>' + icon(x.symbol) + '<span class="wx-rain-text">' + esc(x.rain > 0.05 ? Weather.rainText(x.rain).replace(/^Chuva (forte |fraca )?/, '') : '') + '</span><span class="tabular wx-min">' + x.min + '°</span><span class="wx-bar"><i style="left:' + ((x.min - low) / span * 100).toFixed(1) + '%;right:' + ((high - x.max) / span * 100).toFixed(1) + '%"></i></span><span class="tabular wx-max">' + x.max + '°</span></li>').join('');
    return '<div class="wx-hero">' + icon(now.symbol, 'wx-hero-icon') + '<div><strong class="tabular">' + deg(now.temp) + '</strong><span>' + esc(Weather.label(now.symbol)) + '</span></div></div>'
      + '<p class="wx-place">' + esc((d.place?.name || city) + ' · ' + (d.place?.uf || uf)) + '</p>'
      + '<h3 class="wx-title">Próximas horas</h3><ul class="wx-hours">' + hours + '</ul>'
      + '<h3 class="wx-title">Próximos dias</h3><ul class="wx-days">' + rows + '</ul>'
      + '<p class="wx-source">' + (d.stale ? 'Sem conexão: mostrando a previsão de ' : 'Atualizado às ') + clock(d.fetchedAt) + '. Dados: MET Norway (yr.no), pelo centro do município (IBGE).</p>';
  };
  // One way out at the bottom, as in the other sheets (the top X is removed for this kind).
  b.open('Tempo', '<div class="wx-sheet" data-weather-sheet>' + paint(data) + '</div>', '<button type="button" class="sheet-back" data-action="close-modal"><span>Sair</span></button>', 'weather');
  try {
    data = await Weather.forCity(city, uf);
    const sheet = document.querySelector('dialog[open] [data-weather-sheet]');
    if (sheet) sheet.innerHTML = paint(data);
    refresh(false);
  } catch (error) {
    const sheet = document.querySelector('dialog[open] [data-weather-sheet]');
    if (sheet && !data?.summary?.now) sheet.innerHTML = /IBGE|Cidade|UF|coordenadas/.test(error.message || '')
      ? '<p class="wx-empty">' + esc(error.message) + '. Confira o município e o estado nos Ajustes.</p><button type="button" data-action="weather-city" class="choice modal-action">Corrigir cidade</button>'
      : '<p class="wx-empty">Sem conexão agora. A previsão aparece sozinha assim que a internet voltar.</p>';
  }
}

// ---------------------------------------------------------------- background refresh
let lastRun = 0, lastKey = '', nextTimer = 0;

// While the app is on screen: one timer, set for the moment the forecast expires (MET says when,
// about every 30 minutes). No polling; it stops when the app leaves the screen and starts again
// when it comes back. While the app is closed, Android's background check takes over.
function scheduleNext() {
  clearTimeout(nextTimer);
  nextTimer = 0;
  const home = homeCity();
  if (document.hidden || !home) return;
  const data = Weather.cachedForCity(home.city, home.uf);
  const due = data?.fetchedAt ? Math.max(data.expires || 0, data.fetchedAt + 30 * 60000) : Date.now() + 15000;
  nextTimer = setTimeout(() => { lastRun = 0; refresh().finally(scheduleNext); }, Math.max(15000, due - Date.now() + 2000));
}
export async function refresh(fetchNew = true) {
  const repaint = () => {
    document.querySelectorAll('[data-weather-chip]').forEach(el => { const next = document.createElement('div'); next.innerHTML = chip(); el.replaceWith(next.firstElementChild); });
    const events = bridge()?.data()?.events || [];
    document.querySelectorAll('[data-event-weather]').forEach(el => { const e = events.find(x => x.id === el.dataset.eventWeather); if (e) el.innerHTML = eventText(e); });
  };
  repaint();
  const places = new Map();
  const home = homeCity();
  if (home) places.set(home.city + '|' + home.uf, home);
  for (const e of bridge()?.data()?.events || []) if (e.status !== 'finished') { const p = placeOf(e); if (p) places.set(p.city + '|' + p.uf, p); }
  const key = [...places.keys()].join(';');
  // Android keeps the home town fresh while the app is closed (scheduled once per town).
  if (home) { const known = Weather.cachedForCity(home.city, home.uf); if (known?.place) Weather.keepFresh(known.place); }
  // A new city (Ajustes saved, a fair elsewhere) is fetched at once; otherwise at most once a minute.
  if (!fetchNew || !places.size || (key === lastKey && Date.now() - lastRun < 60000)) { scheduleNext(); return; }
  lastRun = Date.now(); lastKey = key;
  const results = await Promise.allSettled([...places.entries()].slice(0, 4).map(([k, p]) => Weather.forCity(p.city, p.uf).then(
    value => { failures.delete(k); return value; },
    error => { if (/IBGE|Cidade|coordenadas/.test(error.message || '')) failures.set(k, error.message); throw error; })));
  if (results.some(x => x.status === 'rejected')) lastRun = Date.now() - 50000; // try again in about 10 s
  if (home) { const done = Weather.cachedForCity(home.city, home.uf); if (done?.place) Weather.keepFresh(done.place); }
  repaint();
  scheduleNext();
}

export function installWeather() {
  window.TerritorioWeatherUI = Object.freeze({ chip, eventLine, open, refresh, askCity });
  // After each page is drawn, fill in what is known and ask for news (at most once a minute).
  let pending = 0;
  new MutationObserver(() => {
    if (pending || !document.querySelector('[data-weather-chip], [data-event-weather]')) return;
    pending = requestAnimationFrame(() => { pending = 0; refresh(); });
  }).observe(document.getElementById('app'), { childList: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(nextTimer); nextTimer = 0; } else refresh(); });
  // First use without internet: the forecast appears by itself when the connection comes back.
  window.addEventListener('online', () => { lastRun = 0; refresh(); });
}
