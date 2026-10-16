// A preparação é um rascunho de carga por evento. Ela nunca movimenta estoque.
const keyOf = item => `${item.productId}|${item.unit}`;
const rounded = value => Math.round(value * 1000) / 1000;

export function createDraft(event, products, load) {
  const saved = new Map((event.preparation?.items || []).map(item => [keyOf(item), item]));
  const recorded = new Map((load?.items || []).map(item => [keyOf(item), item]));
  return {
    eventId: event.id,
    products: products.map(product => ({
      ...product,
      raw: String(saved.has(keyOf(product)) ? saved.get(keyOf(product)).raw ?? '' : recorded.get(keyOf(product))?.qty ?? ''),
      fromRecord: !!load,
    })),
  };
}

export function mergeProducts(draft, products) {
  const previous = new Map(draft.products.map(item => [keyOf(item), item]));
  return {
    ...draft,
    products: products.map(product => ({ ...product, raw: previous.get(keyOf(product))?.raw ?? '', fromRecord: previous.get(keyOf(product))?.fromRecord || false })),
  };
}

export function snapshot(draft, updatedAt = new Date().toISOString()) {
  return {
    version: 1,
    status: 'pending',
    updatedAt,
    items: draft.products.map(({ productId, unit, raw }) => ({ productId, unit, raw: String(raw ?? '') })),
  };
}

export function addStockEntries(draft, entries) {
  const additions = new Map();
  for (const entry of entries) {
    if (!entry.productId || !entry.unit || !Number.isFinite(entry.qty) || entry.qty < 0) throw Error('Quantidade de estoque inválida.');
    additions.set(keyOf(entry), rounded((additions.get(keyOf(entry)) || 0) + entry.qty));
  }
  return {
    ...draft,
    products: draft.products.map(item => {
      if (!additions.has(keyOf(item))) return { ...item };
      const raw = String(item.raw ?? '').trim();
      if (raw && !/^\d+(?:[.,]\d{1,3})?$/.test(raw)) throw Error('Corrija a quantidade de ' + item.name + ' antes de adicionar estoque para a feira.');
      const before = raw ? Number(raw.replace(',', '.')) : 0;
      return { ...item, raw: String(rounded(before + additions.get(keyOf(item)))).replace('.', ',') };
    }),
  };
}
