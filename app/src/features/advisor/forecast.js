// Agente de previsões local: só o histórico real do app, sem internet. Valores em centavos.
//
// - Próxima feira: quanto levar de cada produto = média ponderada do que vendeu nas últimas feiras
//   (a mais recente pesa mais). Se esgotou numa feira, a procura foi maior que o vendido: +25% naquela.
//   Sem feiras no histórico, usa o ritmo diário das vendas × dias da feira.
// - Ritmo e fim do estoque: vendas dos últimos 30 dias ÷ dias com movimento → dias até zerar.
// - Melhor dia da semana e horário pelo histórico de vendas.

const WEIGHTS = [0.4, 0.3, 0.2, 0.1];
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const unitsRound = (qty, decimal) => (decimal ? Math.ceil(qty * 2) / 2 : Math.ceil(qty));

// Quanto vendeu por feira, de cada produto, nas feiras mais recentes primeiro.
function eventDemand(events, productId) {
  return events
    .map(e => {
      const item = e.items.find(i => i.productId === productId);
      if (!item) return null;
      const soldOut = item.taken > 0 && item.left <= 0;
      return { qty: item.sold * (soldOut ? 1.25 : 1), soldOut, eventName: e.name };
    })
    .filter(Boolean);
}

export function forecastNextEvent(input) {
  const h = input.history || { events: [], daily: [] };
  const products = input.products || [];
  const events = (h.events || []).slice().sort((a, b) => b.start.localeCompare(a.start)).slice(0, WEIGHTS.length);
  const days = Math.max(1, input.upcoming?.days || 1);
  const rate = dailyRates(h.daily || [], input.today);
  const lines = [];
  for (const p of products) {
    const demand = eventDemand(events, p.id);
    let qty = 0, basis = '';
    if (demand.length) {
      const w = WEIGHTS.slice(0, demand.length), total = w.reduce((a, b) => a + b, 0);
      qty = demand.reduce((n, d, i) => n + d.qty * w[i], 0) / total * days / Math.max(1, avgEventDays(events));
      basis = demand.length === 1 ? 'última feira' : `últimas ${demand.length} feiras`;
      if (demand.some(d => d.soldOut)) basis += ' · esgotou, ajustado para cima';
    } else if (rate.get(p.id)) {
      qty = rate.get(p.id) * days * 1.5; // dia de feira costuma vender mais que dia comum
      basis = 'ritmo dos últimos 30 dias';
    }
    if (qty <= 0) continue;
    const take = unitsRound(qty, p.decimal);
    lines.push({ id: p.id, name: p.name, unit: p.unitShort || '', take, stock: p.stock, missing: Math.max(0, take - p.stock), revenue: Math.round(take * p.price), basis });
  }
  lines.sort((a, b) => b.revenue - a.revenue);
  const revenue = lines.reduce((n, l) => n + l.revenue, 0);
  const confidence = events.length >= 4 ? 'boa' : events.length >= 2 ? 'média' : events.length === 1 ? 'baixa' : 'muito baixa';
  return { lines, revenue, low: Math.round(revenue * 0.8), high: Math.round(revenue * 1.15), confidence, eventsUsed: events.length };
}

function avgEventDays(events) {
  if (!events.length) return 1;
  return events.reduce((n, e) => n + Math.max(1, e.days || 1), 0) / events.length;
}

// Vendas por dia de cada produto nos últimos 30 dias (dias com venda registrada contam como base).
export function dailyRates(daily, today) {
  const end = Date.parse((today || new Date().toISOString().slice(0, 10)) + 'T12:00:00Z');
  const start = end - 30 * 864e5;
  const recent = daily.filter(d => { const t = Date.parse(d.day + 'T12:00:00Z'); return t > start && t <= end; });
  if (!recent.length) return new Map();
  // Período observado: do primeiro registro até hoje (mínimo de 7 dias, para não exagerar o ritmo).
  const first = Math.min(...recent.map(d => Date.parse(d.day + 'T12:00:00Z')));
  const span = Math.max(7, Math.round((end - first) / 864e5) + 1);
  const sums = new Map();
  for (const d of recent) sums.set(d.productId, (sums.get(d.productId) || 0) + d.qty);
  return new Map([...sums].map(([id, qty]) => [id, qty / span]));
}

export function runOut(input) {
  const rate = dailyRates(input.history?.daily || [], input.today);
  return (input.products || [])
    .filter(p => rate.get(p.id) > 0 && p.stock > 0)
    .map(p => ({ id: p.id, name: p.name, stock: p.stock, min: p.min, price: p.price, unitLabel: p.unitLabel, perDay: rate.get(p.id), days: p.stock / rate.get(p.id) }))
    .sort((a, b) => a.days - b.days);
}

export function bestMoments(daily) {
  if (!daily?.length) return null;
  const byDay = new Map(), byHour = new Map();
  for (const d of daily) {
    const dow = new Date(d.day + 'T12:00:00Z').getUTCDay();
    byDay.set(dow, (byDay.get(dow) || 0) + d.amount);
    if (Number.isInteger(d.hour)) byHour.set(d.hour, (byHour.get(d.hour) || 0) + d.amount);
  }
  const top = map => [...map].sort((a, b) => b[1] - a[1])[0];
  const day = top(byDay), hour = top(byHour);
  return { day: day ? DAY_NAMES[day[0]] : null, hour: hour ? hour[0] : null };
}
