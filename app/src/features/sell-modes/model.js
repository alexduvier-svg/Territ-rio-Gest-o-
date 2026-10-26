// Tela de vendas em três modelos (Grade, Lâminas em pé, Carrossel) e o Automático que escolhe entre eles.
// Funções puras: recebem a lista já na ordem do Estoque e devolvem os grupos sem reordenar nada; a família
// aparece na ordem em que o seu primeiro produto aparece. Testes em tests/sell-modes.test.mjs.
export const MODES = Object.freeze([
  ['auto', 'Automático', 'O app escolhe pelo seu catálogo.'],
  ['grade', 'Grade', 'Todos os cards, rolando para baixo.'],
  ['pe', 'Lâminas em Pé', 'Uma família aberta; as outras encaixadas embaixo.'],
  ['carrossel', 'Carrossel', 'Uma família por cartão; passe para o lado.'],
]);
export const FIT = 9; // cards que cabem inteiros num celular de 6,3"
const SHORT = { 'Hortifruti-Granjeiro': 'Hortifruti', 'Mel e apícolas': 'Mel', 'Conservas e temperos': 'Conservas', 'Carnes e aves': 'Carnes', 'Plantas e flores': 'Plantas' };
export const groupLabel = name => SHORT[name] || name || 'Outros';

// Grupos: por categoria; quem vende só café (uma categoria, vários tipos) ganha um grupo por tipo.
export function sellGroups(products, { typeOf = p => p.type || '' } = {}) {
  const by = (key) => { const map = new Map(); for (const p of products) { const k = key(p); if (!map.has(k)) map.set(k, []); map.get(k).push(p); } return [...map]; };
  let groups = by(p => p.category || 'Outros');
  if (groups.length === 1 && groups[0][0] === 'Cafés') { const types = by(p => typeOf(p) || 'Cafés'); if (types.length > 1) groups = types; }
  return groups.map(([key, items]) => ({ key, label: groupLabel(key), items }));
}

// Automático: até 9 produtos ou uma família só, grade; 2 ou 3 famílias, carrossel; 4 ou mais, lâminas em pé.
// A escolha da pessoa vale, menos quando tudo cabe na tela (aí lâminas só atrapalhariam).
export function resolveMode(setting, groups) {
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  if (total <= FIT || groups.length < 2) return 'grade';
  if (setting === 'grade' || setting === 'pe' || setting === 'carrossel') return setting;
  return groups.length <= 3 ? 'carrossel' : 'pe';
}

// Carrinho por família: quantas unidades de cada grupo já estão na venda em andamento.
export function cartByGroup(groups, items = []) {
  const qty = new Map();
  for (const i of items) { const n = Number(String(i.rawQty ?? i.qty ?? '').replace(',', '.')); if (i.productId && Number.isFinite(n) && n > 0) qty.set(i.productId, (qty.get(i.productId) || 0) + n); }
  return groups.map(g => { let units = 0, lines = 0, whole = true; for (const p of g.items) { const n = qty.get(p.id); if (n) { units += n; lines++; if (!Number.isInteger(n)) whole = false; } } return lines ? (whole ? units : lines) : 0; });
}

// Grupo ativo sempre dentro do intervalo; uma venda nova (ou a lista mudar) não deixa índice perdido.
export const clampActive = (active, groups) => Math.max(0, Math.min(Number.isInteger(active) ? active : 0, groups.length - 1));
