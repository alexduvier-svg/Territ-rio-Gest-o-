// Tela de vendas em seções (AGRO Gestão Claude 0.12.94): a grade de sempre, dividida em seções de família.
// Cada tipo de café é uma seção (Café Especial, Café Gourmet...); os outros produtos, pela categoria.
// Funções puras: recebem a lista já na ordem do Estoque e não reordenam nada; a seção aparece na ordem do
// seu primeiro produto. Só existem seções do que foi cadastrado. Testes em tests/sell-modes.test.mjs.
export const FIT = 9; // cards que cabem inteiros num celular de 6,3": até aqui, grade simples
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

// Seções só quando ajudam: mais produtos do que cabem na tela e pelo menos duas seções.
export const useSections = sections => sections.length >= 2 && sections.reduce((n, s) => n + s.items.length, 0) > FIT;

// Carrinho por seção: quantas unidades de cada seção já estão na venda em andamento (peso conta produtos).
export function cartByGroup(groups, items = []) {
  const qty = new Map();
  for (const i of items) { const n = Number(String(i.rawQty ?? i.qty ?? '').replace(',', '.')); if (i.productId && Number.isFinite(n) && n > 0) qty.set(i.productId, (qty.get(i.productId) || 0) + n); }
  return groups.map(g => { let units = 0, lines = 0, whole = true; for (const p of g.items) { const n = qty.get(p.id); if (n) { units += n; lines++; if (!Number.isInteger(n)) whole = false; } } return lines ? (whole ? units : lines) : 0; });
}

export const clampActive = (active, groups) => Math.max(0, Math.min(Number.isInteger(active) ? active : 0, groups.length - 1));
