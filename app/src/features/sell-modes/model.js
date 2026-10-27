// Tela de vendas em seções (AGRO Gestão Claude 0.12.101): a página de cards de sempre, dividida em seções de
// família, uma embaixo da outra. Cada tipo de café é uma seção (Café Especial, Café Gourmet...); os outros
// produtos, pela categoria. Funções puras: recebem a lista já na ordem do Estoque e não reordenam nada; a seção
// aparece na ordem do seu primeiro produto. Só existem seções do que foi cadastrado. Testes em
// tests/sell-modes.test.mjs.
export const FAM_FIT = 6; // cards à mostra numa seção em grade; o resto abre pela setinha "Mais"
export const ROWS_MAX = 2; // até aqui a seção mostra linhas largas (como no Estoque) em vez da grade
const SHORT = { 'Hortifruti-Granjeiro': 'Hortifruti', 'Mel e apícolas': 'Mel', 'Conservas e temperos': 'Conservas', 'Carnes e aves': 'Carnes', 'Plantas e flores': 'Plantas' };
export const groupLabel = name => SHORT[name] || name || 'Outros';

export function sellSections(products, { typeOf = p => p.type || '' } = {}) {
  const map = new Map();
  for (const p of products) {
    const type = p.category === 'Cafés' ? typeOf(p) : '';
    const key = type ? 'Café ' + type : (p.category || 'Outros');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(p);
  }
  return [...map].map(([key, items]) => ({ key, label: groupLabel(key), items }));
}

// Seções só quando separam alguma coisa: pelo menos duas famílias.
export const useSections = sections => sections.length >= 2;

// Como a seção se mostra: até 2 produtos em linhas; de 3 em diante, grade com 6 à mostra e o resto guardado
// atrás da setinha. "more" é quantos ficam guardados (a setinha continua lá, para fechar, com a seção aberta).
export function sectionLayout(items, open = false) {
  if (items.length <= ROWS_MAX) return { mode: 'rows', shown: items, extra: [], more: 0 };
  const more = Math.max(0, items.length - FAM_FIT);
  return { mode: 'grid', shown: open ? items : items.slice(0, FAM_FIT), extra: open ? [] : items.slice(FAM_FIT), more };
}

// Carrinho por seção: quantas unidades de cada seção já estão na venda em andamento (peso conta produtos).
export function cartByGroup(groups, items = []) {
  const qty = new Map();
  for (const i of items) { const n = Number(String(i.rawQty ?? i.qty ?? '').replace(',', '.')); if (i.productId && Number.isFinite(n) && n > 0) qty.set(i.productId, (qty.get(i.productId) || 0) + n); }
  return groups.map(g => { let units = 0, lines = 0, whole = true; for (const p of g.items) { const n = qty.get(p.id); if (n) { units += n; lines++; if (!Number.isInteger(n)) whole = false; } } return lines ? (whole ? units : lines) : 0; });
}
