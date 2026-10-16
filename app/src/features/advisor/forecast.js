// Referências históricas locais, sem promessa de demanda ou intervalo probabilístico.
// Cada produto usa suas últimas quatro observações, com duração da própria feira.
const WEIGHTS = [0.4, 0.3, 0.2, 0.1];
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DAY_MS = 864e5;
const MIN_REFERENCE_SAMPLES = 3;
const unitsRound = (qty, decimal) => {
  const scale = decimal ? 2 : 1, scaled = qty * scale, nearest = Math.round(scaled);
  const stable = nearest > 0 && Math.abs(scaled - nearest) <= Number.EPSILON * Math.max(1, Math.abs(scaled)) * 8 ? nearest : scaled;
  return Math.ceil(stable) / scale;
};
const finite = value => typeof value === 'number' && Number.isFinite(value);

function dayStamp(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return NaN;
  const stamp = Date.parse(day + 'T12:00:00Z');
  return Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === day ? stamp : NaN;
}

// One pass; each product has its own observed calendar window.
function dailyWindow(daily, today) {
  const end = dayStamp(today || new Date().toISOString().slice(0, 10));
  const by = new Map();
  if (!Number.isFinite(end)) return by;
  const start = end - 30 * DAY_MS;
  for (const d of daily || []) {
    const stamp = dayStamp(d.day);
    if (!(stamp > start && stamp <= end) || !d.productId || !finite(d.qty) || d.qty < 0) continue;
    const entry = by.get(d.productId) || { qty: 0, first: stamp, dates: new Set() };
    entry.qty += d.qty;
    entry.first = Math.min(entry.first, stamp);
    entry.dates.add(d.day);
    by.set(d.productId, entry);
  }
  for (const entry of by.values()) {
    entry.daysObserved = Math.max(1, Math.round((end - entry.first) / DAY_MS) + 1);
    entry.samples = entry.dates.size;
    entry.perDay = entry.qty / entry.daysObserved;
  }
  return by;
}

// Index once instead of searching every event for every product.
function eventObservations(events, today, wanted) {
  const by = new Map(), seenEvents = new Set(), end = today ? dayStamp(today) : Infinity;
  let complete = 0;
  const sorted = (events || []).filter(e => {
    const stamp = dayStamp(e.start);
    return Number.isFinite(stamp) && stamp <= end;
  }).slice().sort((a, b) => b.start.localeCompare(a.start));
  for (const e of sorted) {
    if (!finite(e.days) || e.days <= 0) continue;
    const duration = e.days, eventId = e.id || e.start + '|' + e.name;
    if (seenEvents.has(eventId)) continue;
    seenEvents.add(eventId);
    const rows = new Map();
    for (const i of e.items || []) {
      if (!wanted.has(i.productId) || by.get(i.productId)?.length >= WEIGHTS.length || !finite(i.sold) || i.sold < 0 || !(i.sold > 0 || i.taken > 0)) continue;
      const row = rows.get(i.productId) || { sold: 0, soldOut: false };
      row.sold += i.sold;
      row.soldOut ||= i.taken > 0 && finite(i.left) && i.left <= 0 && i.sold > 0;
      rows.set(i.productId, row);
    }
    for (const [id, row] of rows) {
      const observations = by.get(id) || [];
      if (observations.length >= WEIGHTS.length) continue;
      observations.push({ perDay: row.sold / duration, soldOut: row.soldOut, eventId });
      by.set(id, observations);
      if (observations.length === WEIGHTS.length) complete++;
    }
    if (complete === wanted.size) break;
  }
  return by;
}

export function forecastNextEvent(input) {
  const history = input.history || {};
  const products = input.products || [];
  const events = eventObservations(history.events, input.today, new Set(products.map(p => p.id))), daily = dailyWindow(history.daily, input.today);
  const days = finite(input.upcoming?.days) && input.upcoming.days > 0 ? input.upcoming.days : 1;
  const lines = [], eventIds = new Set(), warnings = new Set();
  for (const p of products) {
    const observations = events.get(p.id) || [], rhythm = daily.get(p.id);
    let qty = 0, lowTake = null, highTake = null, basis = '', samples = 0, source = 'none', soldOutObserved = false;
    if (observations.length) {
      const weights = WEIGHTS.slice(0, observations.length), total = weights.reduce((a, b) => a + b, 0);
      qty = observations.reduce((n, d, i) => n + d.perDay * weights[i], 0) / total * days;
      const quantities = observations.map(d => d.perDay * days);
      lowTake = unitsRound(Math.min(...quantities), p.decimal);
      highTake = unitsRound(Math.max(...quantities), p.decimal);
      samples = observations.length;
      source = 'events';
      soldOutObserved = observations.some(d => d.soldOut);
      observations.forEach(d => eventIds.add(d.eventId));
      basis = `${samples} ${samples === 1 ? 'feira registrada' : 'feiras registradas'} · quantidade por dia × ${days} ${days === 1 ? 'dia' : 'dias'}`;
      if (soldOutObserved) {
        basis += ' · houve estoque esgotado';
        warnings.add('Estoque esgotado limita a venda observada; o histórico não mede a demanda que deixou de ser atendida.');
      }
    } else if (rhythm?.perDay > 0) {
      qty = rhythm.perDay * days;
      samples = rhythm.samples;
      source = 'daily';
      basis = `${samples} ${samples === 1 ? 'dia com registro' : 'dias com registro'} em ${rhythm.daysObserved} ${rhythm.daysObserved === 1 ? 'dia corrido' : 'dias corridos'} · ritmo diário × duração`;
      warnings.add('Sem feiras comparáveis para alguns produtos: a referência usa dias corridos desde o primeiro registro, sem ajuste por movimento da feira.');
    }
    if (!finite(qty) || !(qty > 0)) continue;
    const take = unitsRound(qty, p.decimal), stock = finite(p.stock) && p.stock >= 0 ? p.stock : null;
    const priceKnown = finite(p.price) && p.price >= 0;
    if (!priceKnown) warnings.add('Há preços ausentes: os valores monetários são parciais.');
    lines.push({ id: p.id, name: p.name, unit: p.unitShort || '', take, stock,
      missing: stock == null ? null : Math.max(0, take - stock), revenue: priceKnown ? Math.round(take * p.price) : 0,
      lowRevenue: priceKnown && lowTake != null ? Math.round(lowTake * p.price) : null,
      highRevenue: priceKnown && highTake != null ? Math.round(highTake * p.price) : null,
      basis, samples, source, lowTake, highTake, soldOutObserved, priceKnown, daysObserved: rhythm?.daysObserved || null,
    });
  }
  lines.sort((a, b) => b.revenue - a.revenue);
  const limited = !lines.length || lines.some(l => l.samples < MIN_REFERENCE_SAMPLES || l.source !== 'events');
  if (limited) warnings.add('Histórico limitado: use estas quantidades como referência para um teste pequeno e registre o resultado.');
  const observedRange = lines.length > 0 && lines.every(l => l.lowRevenue != null && l.highRevenue != null);
  const source = !lines.length ? 'none' : lines.every(l => l.source === 'events') ? 'events' : lines.every(l => l.source === 'daily') ? 'daily' : 'mixed';
  const minimumSamples = lines.length ? Math.min(...lines.map(l => l.samples)) : 0;
  return {
    lines, revenue: lines.reduce((n, l) => n + l.revenue, 0),
    low: observedRange ? lines.reduce((n, l) => n + l.lowRevenue, 0) : null,
    high: observedRange ? lines.reduce((n, l) => n + l.highRevenue, 0) : null,
    rangeKind: observedRange ? 'observed-history' : null,
    // Compatibility only: no confidence level has been calibrated.
    confidence: null, eventsUsed: eventIds.size, minimumSamples, limited, source,
    sampleLabel: lines.length ? `Menor base por produto: ${minimumSamples} ${source === 'events' ? 'feiras' : 'registros de dias/feiras'}` : 'Sem histórico utilizável',
    warnings: [...warnings], revenueKnown: lines.every(l => l.priceKnown),
  };
}

export function dailyRates(daily, today) {
  return new Map([...dailyWindow(daily, today)].map(([id, entry]) => [id, entry.perDay]));
}

export function runOut(input) {
  const rates = dailyWindow(input.history?.daily, input.today);
  return (input.products || []).filter(p => rates.get(p.id)?.perDay > 0 && finite(p.stock) && p.stock > 0)
    .map(p => { const r = rates.get(p.id); return { id: p.id, name: p.name, stock: p.stock, min: p.min, price: p.price,
      unitLabel: p.unitLabel, perDay: r.perDay, days: p.stock / r.perDay, samples: r.samples,
      daysObserved: r.daysObserved, limited: r.samples < MIN_REFERENCE_SAMPLES,
    }; }).sort((a, b) => a.days - b.days);
}

export function bestMoments(daily) {
  const byDay = new Map(), byHour = new Map(), dates = new Set();
  const add = (map, key, d) => {
    const entry = map.get(key) || { amount: 0, dates: new Set() };
    entry.amount += d.amount; entry.dates.add(d.day); map.set(key, entry);
  };
  for (const d of daily || []) {
    const stamp = dayStamp(d.day);
    if (!Number.isFinite(stamp) || !finite(d.amount) || d.amount < 0) continue;
    dates.add(d.day);
    add(byDay, new Date(stamp).getUTCDay(), d);
    if (Number.isInteger(d.hour) && d.hour >= 0 && d.hour <= 23) add(byHour, d.hour, d);
  }
  if (!dates.size) return null;
  const pick = map => {
    const sorted = [...map].sort((a, b) => b[1].amount - a[1].amount), winner = sorted[0];
    const tied = !!(winner && sorted[1] && winner[1].amount === sorted[1][1].amount), samples = winner?.[1].dates.size || 0;
    return { value: winner && !tied && winner[1].amount > 0 && dates.size >= MIN_REFERENCE_SAMPLES && samples >= 2 ? winner[0] : null, samples, tied };
  };
  const day = pick(byDay), hour = pick(byHour);
  return { day: day.value == null ? null : DAY_NAMES[day.value], hour: hour.value, daysObserved: dates.size,
    daySamples: day.samples, hourSamples: hour.samples, dayTied: day.tied, hourTied: hour.tied,
    tied: day.tied || hour.tied, limited: day.value == null || hour.value == null,
    basis: 'Maior receita registrada, sem ajuste por dias ou horas em que a banca esteve aberta.',
  };
}
