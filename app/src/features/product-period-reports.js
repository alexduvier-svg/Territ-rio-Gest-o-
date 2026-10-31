// Closed, deterministic summaries of the producer's own records. No catalogue,
// current price, receipt payment or remote AI is used to rank products.
const DAY = 86400000;
const PERIODS = { weekly: 7, monthly: 30 };
const roundQty = value => Math.round(value * 1000) / 1000;
const timestamp = value => new Date(value).getTime();
const collator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

export function reportContext(data = {}) {
  const type = data.dataContext?.type || (data.settings?.onboarding === 'clean' ? 'real' : data.settings?.onboarding === 'demo' ? 'demo' : 'unconfirmed');
  return { type, id: String(data.dataContext?.id || data.productMemory?.scopeId || 'local-' + type) };
}

function realRecord(record) {
  return record && !record.demo && !record.simulation && !record.simulated && !/^(exemplo-|demo-)/.test(String(record.id || '')) && (!record.dataContext?.type || record.dataContext.type === 'real');
}

export function realProductSales(data, now = Date.now()) {
  if (reportContext(data).type !== 'real') return [];
  const demoScopes = new Set((data.events || []).filter(e => e.demo || e.simulation).map(e => e.id));
  const byId = new Map();
  for (const sale of data.sales || []) {
    const at = timestamp(sale.date);
    if (!sale.id || !realRecord(sale) || demoScopes.has(sale.scope) || !['completed', 'returned'].includes(sale.status) || !Number.isFinite(at) || at > now || !sale.items?.length) continue;
    if (!byId.has(sale.id)) byId.set(sale.id, sale);
  }
  return [...byId.values()].sort((a, b) => timestamp(a.date) - timestamp(b.date) || collator.compare(a.id, b.id));
}

// Same cent-exact allocation as the sale UI: the last line receives the residual.
export function productNetItems(sale) {
  const items = sale.items || [], total = Math.max(0, Math.round(Number(sale.total) || 0));
  const exact = items.every(i => Number.isInteger(i.netTotal) && i.netTotal >= 0) && items.reduce((n, i) => n + i.netTotal, 0) === total;
  const subtotal = Number(sale.subtotal) > 0 ? Number(sale.subtotal) : items.reduce((n, i) => n + Math.max(0, Number(i.total) || 0), 0);
  let remaining = total;
  return items.map((i, index) => {
    const amount = exact ? i.netTotal : index === items.length - 1 ? remaining : Math.min(remaining, Math.max(0, Math.round((Number(i.total) || 0) * (subtotal ? total / subtotal : 0))));
    remaining -= amount;
    const costTotal = Number.isFinite(i.costTotal) ? i.costTotal : Number.isFinite(i.cost) ? Math.round(i.cost * (Number(i.qty) || 0)) : null;
    const costKnown = i.costKnown !== false && costTotal !== null && costTotal >= 0 && (i.costKnown === true || costTotal > 0);
    return { ...i, amount, historicalCost: costKnown ? Math.round(costTotal) : null };
  });
}

export function productPeriod(data, kind, now = Date.now(), requestedId = '') {
  const sales = realProductSales(data, now);
  if (!sales.length) return null;
  return periodFromAnchor(reportContext(data), timestamp(sales[0].date), kind, now, requestedId);
}

function periodFromAnchor(context, anchor, kind, now, requestedId = '') {
  if (!PERIODS[kind]) return null;
  const duration = PERIODS[kind] * DAY, completed = Math.floor((now - anchor) / duration);
  if (completed < 1) return null;
  const contextKey = encodeURIComponent(context.id);
  const prefix = contextKey + ':' + anchor + ':' + kind + ':';
  let index = completed - 1;
  if (requestedId) {
    if (!requestedId.startsWith(prefix)) return null;
    const raw = requestedId.slice(prefix.length);
    if (!/^\d+$/.test(raw) || String(Number(raw)) !== raw || Number(raw) >= completed) return null;
    index = Number(raw);
  }
  const start = anchor + index * duration, end = start + duration;
  const period = { kind, days: PERIODS[kind], anchor, start, end, index, id: contextKey + ':' + anchor + ':' + kind + ':' + index };
  return period;
}

function rowOf(product, id, unit = '') {
  return { id, name: product?.name || 'Produto removido', description: product?.description || '', unit, quantity: 0, units: [], revenue: 0, cost: 0, grossProfit: null, margin: null, costKnown: true, missingCostLines: 0, frequency: 0, saleIds: new Set(), unitTotals: new Map() };
}

function finalizeRow(row) {
  const { saleIds, unitTotals, ...out } = row;
  out.quantity = roundQty(out.quantity);
  out.units = [...unitTotals].map(([unit, qty]) => ({ unit, qty: roundQty(qty) })).sort((a, b) => collator.compare(a.unit, b.unit));
  out.frequency = saleIds.size;
  out.revenue = Math.round(out.revenue);
  out.cost = Math.round(out.cost);
  out.grossProfit = out.costKnown ? out.revenue - out.cost : null;
  out.margin = out.costKnown && out.revenue > 0 ? out.grossProfit / out.revenue : null;
  out.noSale = out.frequency === 0 && out.quantity === 0 && out.revenue === 0;
  return out;
}

export function rankProductRows(rows, criterion = 'revenue', { disjoint = true } = {}) {
  const metric = criterion === 'quantity' ? 'quantity' : criterion === 'profit' ? 'grossProfit' : criterion === 'frequency' ? 'frequency' : 'revenue';
  const eligible = rows.filter(r => Number.isFinite(r[metric]));
  const tie = (a, b) => b.revenue - a.revenue || collator.compare(a.name, b.name) || collator.compare(a.description || '', b.description || '') || collator.compare(a.id, b.id);
  const ordered = [...eligible].sort((a, b) => b[metric] - a[metric] || tie(a, b));
  // A product cannot be both a winner and a laggard in a small sample.
  const topCount = Math.min(3, disjoint ? Math.ceil(ordered.length / 2) : ordered.length);
  const top = ordered.slice(0, topCount), topIds = new Set(top.map(r => r.id));
  const bottom = ordered.filter(r => !disjoint || !topIds.has(r.id)).sort((a, b) => a[metric] - b[metric] || tie(a, b)).slice(0, 3);
  return { criterion, top, bottom, eligible: ordered.length, excluded: rows.length - ordered.length };
}

export function buildProductPeriodReport(data, period, now = Date.now()) {
  return buildReportFromSales(data, period, now, realProductSales(data, now));
}

function buildReportFromSales(data, period, now, sales) {
  if (!period || reportContext(data).type !== 'real' || period.end > now) return null;
  const selectedSales = sales.filter(s => timestamp(s.date) >= period.start && timestamp(s.date) < period.end);
  const selectedReturns = sales.filter(s => s.status === 'returned' && timestamp(s.returnedAt || s.date) >= period.start && timestamp(s.returnedAt || s.date) < period.end && timestamp(s.returnedAt || s.date) <= now);
  return aggregateProductRecords(data, period, now, selectedSales, selectedReturns, false);
}

// Live queries reuse the canonical aggregator and the records selected by Gestão.
export function buildSelectedProductReport(data, { sales = [], returns = [], end = Date.now() + 1, now = Date.now() } = {}) {
  return aggregateProductRecords(data, { kind:'selected', end }, now, sales, returns, true);
}

function aggregateProductRecords(data, period, now, selectedSales, selectedReturns, live) {
  const all = new Map(), quantities = new Map();
  const ensure = (product, id, unit) => {
    if (!all.has(id)) all.set(id, rowOf(product, id));
    const key = id + '|' + unit;
    if (!quantities.has(key)) quantities.set(key, rowOf(product, id, unit));
    return [all.get(id), quantities.get(key)];
  };
  const products = new Map((data.products || []).filter(p => live || realRecord(p)).map(p => [p.id, p]));
  const registered = new Map();
  for (const m of data.movements || []) if (m.kind === 'initial' && realRecord(m) && Number.isFinite(timestamp(m.date))) {
    registered.set(m.productId, Math.min(registered.get(m.productId) ?? Infinity, timestamp(m.date)));
  }
  for (const p of products.values()) {
    if (live && (p.active === false || p.archived)) continue;
    const created = p.createdAt ? timestamp(p.createdAt) : registered.get(p.id);
    if (!Number.isFinite(created) || created < period.end) ensure(p, p.id, String(p.unit || 'Unidade'));
  }
  const selected = new Map();
  for (const sale of selectedSales) selected.set(sale.id, { sale, inSales:true, inReturns:false });
  for (const sale of selectedReturns) { const prior=selected.get(sale.id); selected.set(sale.id, { sale:prior?.sale || sale, inSales:!!prior?.inSales, inReturns:true }); }
  const salesCount=selectedSales.length, returnsCount=selectedReturns.length;
  for (const {sale, inSales, inReturns} of selected.values()) {
    for (const item of productNetItems(sale)) {
      if (!item.productId || !(Number(item.qty) > 0)) continue;
      const unit = String(item.unit || products.get(item.productId)?.unit || 'Unidade');
      const product = { ...products.get(item.productId), ...item };
      const rows = ensure(product, item.productId, unit);
      const sign = (inSales ? 1 : 0) - (inReturns ? 1 : 0);
      for (const row of rows) {
        row.quantity += sign * item.qty;
        row.unitTotals.set(unit, (row.unitTotals.get(unit) || 0) + sign * item.qty);
        row.revenue += sign * item.amount;
        if (item.historicalCost === null && sign !== 0) { row.costKnown = false; row.missingCostLines++; }
        else row.cost += sign * item.historicalCost;
        // Full returns within this window remove that sale from frequency.
        if (inSales && !inReturns) row.saleIds.add(sale.id);
      }
    }
  }
  const rows = [...all.values()].map(finalizeRow), quantityRows = [...quantities.values()].map(finalizeRow);
  // Gross profit has no basis for an item with neither a sale nor a return.
  rows.filter(r => r.noSale).forEach(r => { r.grossProfit = null; r.margin = null; });
  quantityRows.filter(r => r.noSale).forEach(r => { r.grossProfit = null; r.margin = null; });
  const unitGroups = [...new Set(quantityRows.map(r => r.unit))].map(unit => {
    const items = quantityRows.filter(r => r.unit === unit);
    return { unit, frequency: items.reduce((n, r) => n + r.frequency, 0), ...rankProductRows(items, 'quantity') };
  }).sort((a, b) => b.frequency - a.frequency || collator.compare(a.unit, b.unit));
  const report = { ...period, salesCount, returnsCount, rows, units: unitGroups, revenue: rankProductRows(rows, 'revenue'), profit: rankProductRows(rows, 'profit'), missingCostProducts: rows.filter(r => !r.costKnown).length, computedAt: new Date(now).toISOString() };
  report.revision = reportHash(JSON.stringify({ rows, salesCount, returnsCount }));
  return report;
}

export function reportHash(value) {
  let hash = 2166136261;
  for (const ch of String(value)) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(36);
}

export function reportExplanation(report, criterion, unit = '') {
  const rank = criterion === 'quantity' ? report.units.find(g => g.unit === unit) : criterion === 'profit' ? report.profit : report.revenue;
  const lead = rank?.top[0];
  if (!lead) return criterion === 'profit' && report.missingCostProducts ? 'Ainda faltam custos históricos para comparar a contribuição bruta dos produtos.' : 'Não há registros líquidos suficientes neste grupo para comparar os produtos.';
  if (lead.noSale) return 'Sem venda registrada neste grupo no período. Isso não prova falta de demanda.';
  if (criterion === 'quantity' && lead.quantity <= 0) return 'Não houve giro líquido positivo neste grupo: as devoluções podem zerar ou superar as quantidades vendidas. Isso não prova falta de demanda.';
  if (criterion === 'revenue' && lead.revenue <= 0) return 'Não houve valor vendido líquido positivo neste grupo. Confira as devoluções do período antes de interpretar o faturamento.';
  if (criterion === 'profit' && lead.grossProfit <= 0) return 'Não houve contribuição bruta positiva entre os produtos com custo conhecido. Confira descontos, devoluções e custos históricos; despesas fixas ficam fora deste cálculo.';
  const label = lead.name + (lead.description ? ' · ' + lead.description : '');
  if (criterion === 'quantity') return label + ' lidera o giro registrado em ' + unit + '. Quantidades de unidades diferentes ficam separadas.';
  if (criterion === 'profit') return label + ' tem a maior contribuição bruta registrada entre os produtos com custo conhecido. Despesas da feira e custos fixos ficam fora deste cálculo.';
  return label + ' contribui mais para o valor vendido neste período. Faturamento maior não garante lucro maior; confira os custos e o lucro bruto.';
}

function snapshot(report) {
  return { id: report.id, kind: report.kind, days: report.days, start: report.start, end: report.end, revision: report.revision, salesCount: report.salesCount, returnsCount: report.returnsCount, revenue: report.revenue, profit: report.profit, units: report.units, missingCostProducts: report.missingCostProducts };
}

// State belongs to the business model/backup, not to a global device counter.
// Rebuild on reset/context/date changes and retain seen markers within a period.
export function reconcileProductPeriods(data, now = Date.now()) {
  const context = reportContext(data), sales = realProductSales(data, now), anchor = sales.length ? timestamp(sales[0].date) : null;
  const previous = data.productPeriodReports;
  const key = context.type === 'real' && anchor !== null ? context.id + ':' + anchor : '';
  const compatible = previous?.version === 1 && previous.contextKey === key;
  const state = { version: 1, contextKey: key, anchor, entries: {} }, reports = [];
  if (key) for (const kind of Object.keys(PERIODS)) {
    const period = periodFromAnchor(context, anchor, kind, now);
    if (!period) continue;
    const report = buildReportFromSales(data, period, now, sales), old = compatible ? previous.entries?.[kind] : null;
    const markers = old?.id === period.id ? { seenAt: old.seenAt || '', deferredAt: old.deferredAt || '', lastNotifiedAt: old.lastNotifiedAt || '' } : { seenAt: '', deferredAt: '', lastNotifiedAt: '' };
    state.entries[kind] = { ...snapshot(report), ...markers };
    reports.push(report);
  }
  return { state, reports, changed: JSON.stringify(previous || null) !== JSON.stringify(state) };
}

export function productPeriodNotices(data, now = Date.now()) {
  // Scheduling only needs dates/markers, not a second calculation of rankings.
  const context = reportContext(data), sales = realProductSales(data, now);
  if (!sales.length) return { notices: [], validIds: [] };
  const anchor = timestamp(sales[0].date), contextKey = encodeURIComponent(context.id), notices = [], validIds = [];
  const saved = data.productPeriodReports?.contextKey === context.id + ':' + anchor ? data.productPeriodReports : null;
  for (const [kind, days] of Object.entries(PERIODS)) {
    const duration = days * DAY, completed = Math.floor((now - anchor) / duration), period = periodFromAnchor(context, anchor, kind, now);
    const entry = period ? saved?.entries?.[kind]?.id === period.id ? saved.entries[kind] : period : null;
    if (entry) {
      validIds.push(entry.id);
      if (!entry.seenAt && !entry.deferredAt && !entry.lastNotifiedAt) notices.push({ id: entry.id, kind, at: now + 1200, due: true });
    }
    // A bounded horizon keeps reminders working through several missed app visits.
    // These are invitations: Android does not calculate rankings while JS is closed.
    for (let step = 0; step < (kind === 'weekly' ? 8 : 3); step++) {
      const index = completed + step;
      const next = { id: contextKey + ':' + anchor + ':' + kind + ':' + index, kind, at: anchor + (index + 1) * duration, due: false };
      validIds.push(next.id);notices.push(next);
    }
  }
  return { notices, validIds };
}
