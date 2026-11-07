// Ranking: resumo da operação em ordem do que mais sai. Só organiza registros; o demonstrativo continua em finance.js.
// Padrão exige repetição: sem base mínima, não há frase. Horário é o do registro. Nada aqui prevê o futuro.
import { releaseCheck } from './decision-engine.js';

export const TOP = 10, PATTERN_DAYS = 90, MIN_SALES = 5, MIN_DAYS = 3, MIN_FOR_ADVICE = 5;
export const WEEKDAYS = Object.freeze(['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados']);
export const WEEKDAYS_ON = Object.freeze(['aos domingos', 'às segundas', 'às terças', 'às quartas', 'às quintas', 'às sextas', 'aos sábados']);
export const WEEKDAYS_FOR = Object.freeze(['os domingos', 'as segundas', 'as terças', 'as quartas', 'as quintas', 'as sextas', 'os sábados']);
export const VALUE_BANDS = Object.freeze([[0, 2000], [2000, 5000], [5000, 10000], [10000, 20000], [20000, Infinity]]);

const list = value => (Array.isArray(value) ? value : []);
const done = sales => list(sales).filter(s => s?.status === 'completed');
const byLabel = (a, b) => String(a.label ?? a.name ?? '').localeCompare(String(b.label ?? b.name ?? ''), 'pt-BR');
const weekdayOf = day => new Date(day + 'T12:00:00Z').getUTCDay();

// Quantidade só ordena quando todos usam a mesma unidade. Unidades misturadas ordenam pelo valor.
export function rankProducts(margins, units = {}) {
  const rows = list(margins).filter(p => p.qty > 0 && p.revenue > 0);
  const kinds = new Set(rows.map(p => units[p.id] || ''));
  const byQuantity = kinds.size === 1 && !kinds.has('');
  const sorted = [...rows].sort((a, b) => (byQuantity ? b.qty - a.qty : 0) || b.revenue - a.revenue || byLabel(a, b));
  return { byQuantity, total: rows.length, rows: sorted.slice(0, TOP) };
}

export function rankHours(sales, clockOf) {
  const map = new Map(); let unknown = 0;
  for (const s of done(sales)) { const hour = String(clockOf(s.date,s) || '').slice(0, 2); if (/^(?:[01]\d|2[0-3])$/.test(hour)) { const r = map.get(hour) || { hour, count: 0, amount: 0 }; r.count++; r.amount += s.total; map.set(hour, r); } else unknown++; }
  return { unknown, rows: [...map.values()].sort((a, b) => b.count - a.count || b.amount - a.amount || a.hour.localeCompare(b.hour)) };
}

export function rankWeekdays(sales, dayOf) {
  const map = new Map();
  for (const s of done(sales)) { const day = dayOf(s.date,s); if (!day) continue; const w = weekdayOf(day), r = map.get(w) || { weekday: w, label: WEEKDAYS[w], count: 0, amount: 0, dates: new Set() }; r.count++; r.amount += s.total; r.dates.add(day); map.set(w, r); }
  return [...map.values()].map(r => ({ ...r, dates: r.dates.size })).sort((a, b) => b.count - a.count || b.amount - a.amount || a.weekday - b.weekday);
}

export function rankValues(sales) {
  const rows = VALUE_BANDS.map(([from, to]) => ({ from, to, count: 0, amount: 0 }));
  for (const s of done(sales)) { const band = rows.find(r => s.total >= r.from && s.total < r.to); if (band) { band.count++; band.amount += s.total; } }
  return rows.filter(r => r.count).sort((a, b) => b.count - a.count || a.from - b.from);
}

// Cada forma usada numa venda conta uma vez; pagamento misto aparece nas duas formas.
export function rankPayments(sales) {
  const map = new Map();
  for (const s of done(sales)) for (const p of [...list(s.payments).reduce((by,p)=>{const row=by.get(p.method)||{method:p.method,amount:0};row.amount+=p.amount;by.set(p.method,row);return by;},new Map()).values()]) { const r = map.get(p.method) || { method: p.method, count: 0, amount: 0 }; r.count++; r.amount += p.amount; map.set(p.method, r); }
  return [...map.values()].sort((a, b) => b.count - a.count || b.amount - a.amount || a.method.localeCompare(b.method));
}

// Pessoas pelo identificador: nomes iguais não se fundem. Compra sem cliente fica fora e é contada à parte.
export function rankClients(sales, nameOf = () => '') {
  const map = new Map(); let anonymous = 0;
  for (const s of done(sales)) { if (!s.customerId) { anonymous++; continue; } const r = map.get(s.customerId) || { id: s.customerId, name: nameOf(s.customerId) || s.customerName || 'Cliente identificado', count: 0, amount: 0 }; r.count++; r.amount += s.total; map.set(s.customerId, r); }
  const all = [...map.values()].sort((a, b) => b.amount - a.amount || b.count - a.count || byLabel(a, b));
  return { anonymous, total: all.length, rows: all.slice(0, TOP) };
}

export function eventShare(sales, isEvent, nameOf = id => id) {
  const rows = done(sales), inEvents = rows.filter(s => isEvent(s.scope)), names = [...new Set(inEvents.map(s => nameOf(s.scope)))];
  return { count: inEvents.length, total: rows.length, names };
}

const plain = (name, description) => [name, description].filter(Boolean).join(' · ');

// Padrões: produto × horário × dia da semana, nos últimos 90 dias. Cada frase passa pela mesma liberação de números.
export function salesPatterns(sales, { today, addDays, dayOf, clockOf, nameOf = n => n }) {
  const since = addDays(today, -(PATTERN_DAYS-1)), rows = done(sales).filter(s => { const d = dayOf(s.date,s); return d && d >= since && d <= today; }), products = new Map();
  for (const s of rows) {
    const day = dayOf(s.date,s), hour = Number(String(clockOf(s.date,s) || '').slice(0, 2));
    for (const id of new Set(list(s.items).map(i => i.productId))) {
      const item = s.items.find(i => i.productId === id), p = products.get(id) || { id, name: nameOf(item.name), description: item.description || '', sales: 0, days: new Set(), hours: new Map(), hoursKnown: 0, weekdays: new Map() };
      p.sales++; p.days.add(day);
      if (Number.isInteger(hour) && hour>=0 && hour<24 && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(clockOf(s.date,s)||''))) { p.hoursKnown++; p.hours.set(hour, (p.hours.get(hour) || 0) + 1); }
      const w = weekdayOf(day), wd = p.weekdays.get(w) || { count: 0, dates: new Set() }; wd.count++; wd.dates.add(day); p.weekdays.set(w, wd);
      products.set(id, p);
    }
  }
  const out = [];
  for (const p of products.values()) {
    if (p.sales < MIN_SALES || p.days.size < MIN_DAYS) continue;
    let bestHour = null;
    for (const [hour] of [...p.hours].sort((a, b) => a[0] - b[0])) { const count = (p.hours.get(hour) || 0) + (p.hours.get(hour + 1) || 0); if (!bestHour || count > bestHour.count) bestHour = { from: hour, to: hour + 2, count }; }
    const hourOk = bestHour && p.hoursKnown >= MIN_SALES && bestHour.count / p.hoursKnown > 0.5;
    const ordered = [...p.weekdays].sort((a, b) => b[1].count - a[1].count), top = ordered[0], tied = ordered[1] && ordered[1][1].count === top[1].count;
    const dayOk = top && !tied && top[1].dates.size >= 2 && top[1].count / p.sales > 0.3;
    if (!hourOk && !dayOk) continue;
    const label = plain(p.name, p.description), facts = { label, n: String(p.sales), parts: '' }, parts = [];
    if (hourOk) { facts.hc = String(bestHour.count); facts.hn = String(p.hoursKnown); facts.hf = bestHour.from + 'h'; facts.ht = bestHour.to + 'h'; parts.push(`${facts.hc} de ${facts.hn} vendas entre ${facts.hf} e ${facts.ht}`); }
    if (dayOk) { facts.dc = String(top[1].count); facts.dn = facts.n; parts.push(`${facts.dc} de ${facts.dn} vendas ${WEEKDAYS_ON[top[0]]}`); }
    const text = label + ': ' + parts.join('; ') + '.';
    if (!releaseCheck(text, facts).ok) continue;
    out.push({ id: p.id, text, sales: p.sales, strength: (hourOk ? bestHour.count / p.hoursKnown : 0) + (dayOk ? top[1].count / p.sales : 0) });
  }
  return { windowDays: PATTERN_DAYS, products: products.size, rows: out.sort((a, b) => b.sales - a.sales || b.strength - a.strength).slice(0, TOP) };
}
