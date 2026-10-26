// Conferência da sobra. Funções puras: nenhuma gravação, relógio, rede ou mutação do modelo.
// eventLoads.items[].qty já contém a carga inicial + todas as reposições.
// Preços, totais e check.vendasNaoRegistradas.valor seguem o ERP: centavos.

const PAYMENTS = ['Pix', 'Dinheiro', 'Débito', 'Crédito', 'Outro', 'Fiado'];
const milli = n => Math.round(n * 1000);
const quantity = n => n / 1000;
const validNumber = n => typeof n === 'number' && Number.isFinite(n);
const sortJSON = values => values.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
const checkedSum = (a, b) => {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new SurplusCheckError('INVALID_TOTAL', 'A quantidade ou o valor ultrapassa o limite seguro. Revise os registros do evento.');
  return sum;
};

export class SurplusCheckError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'SurplusCheckError';
    this.code = code;
    this.details = details;
  }
}

export const surplusKey = (productId, unit) => String(productId) + '|' + String(unit || '');

export function parseSurplusQuantity(raw, unit) {
  const decimal = ['kg', 'Litro', 'L', 'l', 'g', 'ml'].includes(unit);
  const text = typeof raw === 'number' ? String(raw) : String(raw ?? '').trim();
  if (!/^\d+(?:[.,]\d{1,3})?$/.test(text)) {
    throw new SurplusCheckError('INVALID_QUANTITY', 'Informe uma quantidade válida. Use até três casas decimais para kg e litros.');
  }
  const value = Number(text.replace(',', '.'));
  if (!Number.isFinite(value) || value < 0 || !Number.isSafeInteger(milli(value)) || (!decimal && !Number.isInteger(value))) {
    throw new SurplusCheckError('INVALID_QUANTITY', decimal ? 'Informe uma quantidade válida de até três casas decimais.' : 'Use uma quantidade inteira nessa unidade.');
  }
  return quantity(milli(value));
}

// "Mais usada" é frequência entre vendas, depois valor; empate final estável pela ordem do ERP.
// Uma venda dividida conta uma vez para cada forma usada, mesmo com parcelas repetidas.
export function dominantEventPayment(sales, eventId) {
  const usage = new Map(PAYMENTS.map(method => [method, { method, count: 0, amount: 0 }]));
  for (const sale of sales || []) {
    if (sale.scope !== eventId || sale.status !== 'completed') continue;
    const seen = new Set();
    for (const p of sale.payments || []) {
      if (!usage.has(p.method) || !validNumber(p.amount) || p.amount <= 0) continue;
      const entry = usage.get(p.method);
      entry.amount += p.amount;
      if (!seen.has(p.method)) { entry.count++; seen.add(p.method); }
    }
  }
  return [...usage.values()].sort((a, b) => b.count - a.count || b.amount - a.amount || PAYMENTS.indexOf(a.method) - PAYMENTS.indexOf(b.method))[0].method;
}

/**
 * Snapshot da carga e das vendas do evento. Só rows com sobra positiva são editáveis.
 * Perdas já registradas no evento são abatidas por padrão, para não baixá-las de novo.
 * includeRecordedLosses:false expõe literalmente carga + reposição − vendido.
 * O fingerprint inclui carga, transações, preços, unidade e estoque relevantes; não é um hash.
 */
export function buildSurplusSnapshot({ eventId, load = null, sales = [], products = [], productOf, movements = [], includeRecordedLosses = true }) {
  const lookup = productOf || (id => products.find(p => p.id === id));
  const hasLoad = !!load && (!load.eventId || load.eventId === eventId) && Array.isArray(load.items);
  const eventSales = sales.filter(s => s.scope === eventId);
  const eventLosses = movements.filter(m => m.kind === 'loss' && m.eventId === eventId);
  const sold = new Map(), losses = new Map(), lines = new Map();
  for (const s of eventSales) if (s.status === 'completed') for (const i of s.items || []) {
    const key = surplusKey(i.productId, i.unit);
    if (!validNumber(i.qty) || i.qty <= 0) throw new SurplusCheckError('INVALID_SALE', 'Uma venda do evento contém uma quantidade inválida. Revise os registros antes de conferir.');
    const qty = parseSurplusQuantity(i.qty, i.unit);
    sold.set(key, checkedSum(sold.get(key) || 0, milli(qty)));
  }
  for (const m of eventLosses) if (validNumber(m.qty) && m.qty > 0) {
    const key = surplusKey(m.productId, m.unit);
    losses.set(key, (losses.get(key) || 0) + milli(m.qty));
  }
  const sourceItems = hasLoad ? load.items : [];
  for (const i of sourceItems) {
    if (!validNumber(i.qty) || i.qty < 0 || !i.productId || !i.unit) {
      throw new SurplusCheckError('INVALID_LOAD', 'A carga do evento contém uma quantidade inválida. Revise os produtos levados.');
    }
    try { parseSurplusQuantity(i.qty, i.unit); }
    catch { throw new SurplusCheckError('INVALID_LOAD', 'A carga do evento contém uma quantidade inválida. Revise os produtos levados.'); }
    const key = surplusKey(i.productId, i.unit), p = lookup(i.productId) || null;
    const restocked = (i.restocks || []).reduce((n, r) => n + (validNumber(r.qty) && r.qty > 0 ? milli(r.qty) : 0), 0);
    const line = lines.get(key) || {
      key, productId: i.productId, name: i.name || p?.name || 'Produto', description: i.description || '', unit: i.unit,
      loaded: 0, restocked: 0, price: p?.price ?? null, cost: p?.cost ?? null, stock: p?.stock ?? null,
      missingProduct: !p, unitMismatch: !!p && p.unit !== i.unit,
    };
    line.loaded = checkedSum(line.loaded, milli(i.qty));
    line.restocked = checkedSum(line.restocked, restocked);
    lines.set(key, line);
  }
  const allRows = [...lines.values()].map(line => {
    const saleQty = sold.get(line.key) || 0, lostQty = losses.get(line.key) || 0;
    return {
      ...line,
      loaded: quantity(line.loaded), restocked: quantity(line.restocked), taken: quantity(Math.max(0, line.loaded - line.restocked)),
      sold: quantity(saleQty), recordedLoss: quantity(lostQty),
      calculated: quantity(Math.max(0, line.loaded - saleQty - (includeRecordedLosses ? lostQty : 0))),
    };
  });
  const fingerprint = JSON.stringify({
    eventId, hasLoad, includeRecordedLosses,
    load: hasLoad ? [load.createdAt || '', load.updatedAt || '', sortJSON(sourceItems.map(i => [i.productId, i.unit, i.qty, i.name || '', sortJSON((i.restocks || []).map(r => [r.at || '', r.qty]))]))] : null,
    products: sortJSON(allRows.map(r => [r.productId, r.unit, r.price, r.cost, r.stock, r.missingProduct, r.unitMismatch])),
    sales: sortJSON(eventSales.map(s => [s.id || '', s.status, s.date || '', s.total, sortJSON((s.items || []).map(i => [i.productId, i.unit, i.qty])), sortJSON((s.payments || []).map(p => [p.method, p.amount]))])),
    losses: sortJSON(eventLosses.map(m => [m.id || '', m.productId, m.unit, m.qty, m.date || ''])),
  });
  const rows = allRows.filter(row => row.calculated > 0);
  return { eventId, hasLoad, eligible: hasLoad && rows.length > 0, rows, fingerprint, payment: dominantEventPayment(sales, eventId) };
}

const EMPTY_CHECK = () => ({ conferido: false, corrigido: false, vendasNaoRegistradas: { qtd: 0, valor: 0 }, perdas: { qtd: 0 }, itens: [] });
const timeValue = value => typeof value === 'number' ? value : Date.parse(value);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

/**
 * counts/reasons usam row.key. Ausência em counts mantém o calculado, sem toques extras.
 * reasons para diminuições: 'sale' ou 'loss'. Aumentos viram ajuste da carga inicial.
 * O chamador aplica sales/losses/loadAdjustments numa cópia do modelo e persiste uma vez.
 * currentSnapshot deve ser reconstruído antes da gravação para recusar contagem desatualizada.
 */
export function planSurplusCheck({ snapshot, currentSnapshot, counts = {}, reasons = {}, confirmed = true, direct = false, openedAt, now }) {
  if (!snapshot || typeof snapshot.fingerprint !== 'string') throw new SurplusCheckError('INVALID_SNAPSHOT', 'Abra novamente a conferência.');
  if (currentSnapshot && currentSnapshot.fingerprint !== snapshot.fingerprint) {
    throw new SurplusCheckError('STALE_CHECK', 'As vendas, a carga ou o estoque mudaram. Confira as quantidades atualizadas.');
  }
  const end = timeValue(now);
  if (!Number.isFinite(end)) throw new SurplusCheckError('INVALID_TIME', 'Informe o horário do fechamento.');
  const start = timeValue(openedAt ?? end);
  if (!Number.isFinite(start)) throw new SurplusCheckError('INVALID_TIME', 'Informe o início da conferência.');
  const check = EMPTY_CHECK(), sales = [], losses = [], loadAdjustments = [];
  const metrics = { tempoConferenciaMs: 0, confereDireto: false, diferencaTotal: 0, diferencaLiquida: 0 };
  if (!confirmed || !snapshot.eligible) return { check, metrics, sales, losses, loadAdjustments, payment: snapshot.payment };
  const keys = new Set(snapshot.rows.map(row => row.key));
  for (const key of Object.keys(counts)) if (!keys.has(key)) throw new SurplusCheckError('UNKNOWN_ITEM', 'Este produto não faz parte da sobra calculada.', { key });
  const missingReasons = [];
  const prepared = snapshot.rows.map(row => {
    const real = own(counts, row.key) ? parseSurplusQuantity(counts[row.key], row.unit) : row.calculated;
    const difference = milli(real) - milli(row.calculated);
    if (difference < 0 && !['sale', 'loss'].includes(reasons[row.key])) missingReasons.push({ ...row, real, difference: quantity(-difference) });
    return { row, real, difference };
  });
  if (missingReasons.length) throw new SurplusCheckError('REASON_REQUIRED', 'O que aconteceu com a diferença?', { items: missingReasons });
  const date = new Date(end).toISOString(), stockUsed = new Map();
  let absoluteDifference = 0, netDifference = 0, saleQty = 0, lostQty = 0;
  for (const { row, real, difference } of prepared) {
    let motivo = '';
    absoluteDifference = checkedSum(absoluteDifference, Math.abs(difference));
    netDifference = checkedSum(netDifference, difference);
    if (difference) {
      if (row.missingProduct || row.unitMismatch) throw new SurplusCheckError('PRODUCT_CHANGED', 'O cadastro de ' + row.name + ' mudou. Revise a unidade antes de corrigir a sobra.', { key: row.key });
      const qty = quantity(Math.abs(difference));
      if (difference > 0) {
        motivo = 'ajuste_carga';
        loadAdjustments.push({ key: row.key, productId: row.productId, unit: row.unit, qty, previous: row.loaded, next: quantity(milli(row.loaded) + difference), date });
      } else {
        const used = (stockUsed.get(row.productId) || 0) + Math.abs(difference);
        if (!validNumber(row.stock) || used > milli(row.stock)) throw new SurplusCheckError('INSUFFICIENT_STOCK', 'O estoque disponível de ' + row.name + ' é menor que a diferença. Revise o saldo antes de finalizar.', { key: row.key });
        stockUsed.set(row.productId, used);
        if (reasons[row.key] === 'sale') {
          if (!Number.isSafeInteger(row.price) || row.price <= 0 || !Number.isSafeInteger(Math.round(row.price * qty))) throw new SurplusCheckError('INVALID_PRICE', 'Informe um preço válido para ' + row.name + ' antes de registrar a venda.', { key: row.key });
          const total = Math.round(row.price * qty);
          if (total <= 0) throw new SurplusCheckError('INVALID_PRICE', 'O valor da venda de ' + row.name + ' deve ser maior que zero.', { key: row.key });
          motivo = 'vendi_sem_registrar';
          saleQty += Math.abs(difference);
          check.vendasNaoRegistradas.valor = checkedSum(check.vendasNaoRegistradas.valor, total);
          sales.push({ productId: row.productId, name: row.name, unit: row.unit, qty, price: row.price, total, payment: snapshot.payment, status: 'completed', unregistered: true, date });
        } else {
          motivo = 'perda_brinde';
          lostQty += Math.abs(difference);
          losses.push({ productId: row.productId, name: row.name, unit: row.unit, qty, kind: 'loss', eventId: snapshot.eventId, date, note: 'Perda / brinde na conferência da sobra' });
        }
      }
    }
    check.itens.push({ produto: row.name, unidade: row.unit, calculado: row.calculated, real, motivo });
  }
  check.conferido = true;
  check.corrigido = absoluteDifference > 0;
  check.vendasNaoRegistradas.qtd = quantity(saleQty);
  check.perdas.qtd = quantity(lostQty);
  Object.assign(metrics, {
    tempoConferenciaMs: Math.max(0, Math.round(end - start)), confereDireto: !!direct && !check.corrigido,
    diferencaTotal: quantity(absoluteDifference), diferencaLiquida: quantity(netDifference),
  });
  return { check, metrics, sales, losses, loadAdjustments, payment: snapshot.payment };
}
