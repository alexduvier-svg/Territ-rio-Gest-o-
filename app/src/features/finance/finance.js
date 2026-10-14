// Finanças do produtor: demonstrativo do período, custos por tipo, indicadores e lucro por feira.
// Método (gestão de pequeno negócio / feira):
//   Total vendido (já com descontos)
//   − custo dos produtos vendidos (o custo informado no cadastro do produto, sempre)
//   − taxas de cartão (débito e crédito, configuráveis)
//   = margem de contribuição  → quanto cada venda deixa para pagar os outros custos
//   − custos da feira, produção, divulgação (lançados quando a pessoa quiser, inclusive depois)
//   − custos fixos do mês (cadastrados uma vez, rateados pelo período)
//   − retirada (pró-labore), se ligada
//   = resultado
// Ponto de equilíbrio = (fixos + retirada do mês) ÷ margem de contribuição em %.
// Tudo em centavos. Funções puras: recebem os dados, devolvem números (testadas em tests/finance.test.mjs).

export const COST_KINDS = [
  ['feira', 'Custos da feira', 'Barraca, transporte, ajudante, alimentação'],
  ['producao', 'Produção e insumos', 'Sementes, ração, adubo, embalagens'],
  ['marketing', 'Divulgação', 'Panfletos, anúncios, brindes'],
  ['retirada', 'Sua retirada', 'Dinheiro do negócio que vai para a casa'],
];
export const COST_PRESETS = {
  feira: ['Barraca', 'Transporte', 'Ajudante', 'Alimentação', 'Gelo'],
  producao: ['Embalagens', 'Insumos', 'Ração', 'Sementes', 'Adubo'],
  marketing: ['Panfletos', 'Anúncio', 'Brindes', 'Degustação'],
  retirada: ['Retirada do mês'],
};
export const FIXED_PRESETS = ['Energia', 'Internet', 'Celular', 'Combustível', 'Manutenção', 'Aluguel', 'Contador'];
export const DEFAULT_FEES = { Débito: 1.99, Crédito: 4.98 };

export function financeSettings(raw) {
  const f = raw || {};
  const fees = { ...DEFAULT_FEES, ...(f.cardFees || {}) };
  return {
    cardFees: { Débito: Math.max(0, Number(fees.Débito) || 0), Crédito: Math.max(0, Number(fees.Crédito) || 0) },
    goal: Math.max(0, Math.round(Number(f.goal) || 0)),
    drawOn: !!f.drawOn,
    drawMonthly: Math.max(0, Math.round(Number(f.drawMonthly) || 0)),
    fixedCosts: Array.isArray(f.fixedCosts) ? f.fixedCosts.filter(x => x && x.title && x.amount > 0) : [],
  };
}

// Despesas antigas não tinham tipo: "Marketing" vira divulgação; o resto, custo de feira/operação.
export function costKind(expense) {
  if (COST_KINDS.some(([id]) => id === expense.kind)) return expense.kind;
  return expense.category === 'Marketing' ? 'marketing' : 'feira';
}

const daysInMonth = month => new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();

// Quanto de cada mês o período cobre (para ratear custos fixos e retirada).
// days: lista de dias (AAAA-MM-DD) do período; month: um mês inteiro; year: os meses do ano até o mês atual.
export function monthShares({ days, month, year, today }) {
  if (year) {
    const last = today && today.slice(0, 4) === year ? Number(today.slice(5, 7)) : 12;
    return Array.from({ length: last }, (_, i) => ({ month: `${year}-${String(i + 1).padStart(2, '0')}`, share: 1 }));
  }
  if (days && days.length) {
    const by = new Map();
    for (const d of days) by.set(d.slice(0, 7), (by.get(d.slice(0, 7)) || 0) + 1);
    return [...by].map(([m, n]) => ({ month: m, share: n / daysInMonth(m) }));
  }
  if (month) return [{ month, share: 1 }];
  return [];
}

function fixedFor(settings, shares) {
  let total = 0;
  for (const { month, share } of shares) {
    for (const f of settings.fixedCosts) if (!f.since || f.since <= month) total += f.amount * share;
  }
  return Math.round(total);
}

const fixedMonthly = settings => settings.fixedCosts.reduce((n, f) => n + f.amount, 0);

export function cardFeesOf(sales, settings) {
  let fees = 0;
  for (const s of sales) for (const p of s.payments || []) {
    const rate = settings.cardFees[p.method];
    if (rate) fees += (p.amount * rate) / 100;
  }
  return Math.round(fees);
}

// Demonstrativo. sales = vendas concluídas do período/local; returned = devolvidas do período;
// expenses = custos lançados no período/local; shares = monthShares(...); general = true quando
// o local é "Todos" (só então entram fixos e retirada mensal, que não são de uma feira só).
export function statement({ sales, returned = [], expenses, settings: raw, shares = [], general = true }) {
  const settings = financeSettings(raw);
  const revenue = sales.reduce((n, s) => n + s.total, 0);
  const discounts = sales.reduce((n, s) => n + (s.discount || 0), 0);
  const cmv = sales.reduce((n, s) => n + (s.cost || 0), 0);
  const fees = cardFeesOf(sales, settings);
  const contribution = revenue - cmv - fees;
  const kinds = Object.fromEntries(COST_KINDS.map(([id]) => [id, 0]));
  for (const x of expenses) kinds[costKind(x)] += x.amount;
  const fixed = general ? fixedFor(settings, shares) : 0;
  const drawPlanned = general && settings.drawOn ? Math.round(shares.reduce((n, s) => n + s.share, 0) * settings.drawMonthly) : 0;
  const draw = drawPlanned + kinds.retirada;
  const result = contribution - kinds.feira - kinds.producao - kinds.marketing - fixed - draw;
  const contributionRate = revenue > 0 ? contribution / revenue : 0;
  const monthlyFixed = fixedMonthly(settings) + (settings.drawOn ? settings.drawMonthly : 0);
  return {
    revenue, discounts, returns: returned.reduce((n, s) => n + s.total, 0), cmv, fees, contribution, contributionRate,
    costs: kinds, fixed, draw, result, salesCount: sales.length,
    monthlyFixed,
    breakEven: contributionRate > 0 && monthlyFixed > 0 ? Math.round(monthlyFixed / contributionRate) : null,
    costsLogged: expenses.length > 0,
  };
}

// Lucro de cada feira/local: o que a venda deixou menos os custos lançados naquele local.
export function profitByPlace({ sales, expenses, settings: raw, nameOf }) {
  const settings = financeSettings(raw);
  const places = new Map();
  const get = id => places.get(id) || places.set(id, { id, name: nameOf(id), revenue: 0, cmv: 0, fees: 0, costs: 0, sales: 0 }).get(id);
  for (const s of sales) { const p = get(s.scope || 'loja'); p.revenue += s.total; p.cmv += s.cost || 0; p.fees += cardFeesOf([s], settings); p.sales++; }
  for (const x of expenses) if (costKind(x) !== 'retirada') get(x.scope || 'loja').costs += x.amount;
  return [...places.values()].map(p => ({ ...p, profit: p.revenue - p.cmv - p.fees - p.costs })).sort((a, b) => b.profit - a.profit);
}

// Margem de cada produto vendido (desconto da venda repartido pelos itens).
export function productMargins(sales) {
  const by = new Map();
  for (const s of sales) {
    const factor = s.subtotal > 0 ? s.total / s.subtotal : 1;
    for (const i of s.items || []) {
      const r = by.get(i.productId) || { id: i.productId, name: i.name, description: i.description, revenue: 0, cost: 0, qty: 0 };
      r.revenue += (i.netTotal ?? i.total ?? 0) * (i.netTotal != null ? 1 : factor);
      r.cost += i.costTotal || 0;
      r.qty += i.qty || 0;
      by.set(i.productId, r);
    }
  }
  return [...by.values()].map(r => ({ ...r, revenue: Math.round(r.revenue), margin: r.revenue > 0 ? (r.revenue - r.cost) / r.revenue : null })).sort((a, b) => b.revenue - a.revenue);
}

// Meta do mês: a definida pela pessoa ou, se não houver, a média dos últimos resultados positivos + 10%.
export function suggestedGoal(pastResults) {
  const good = pastResults.filter(n => n > 0);
  if (!good.length) return 0;
  return Math.ceil(Math.round((good.reduce((n, v) => n + v, 0) / good.length) * 1.1) / 1000) * 1000;
}
