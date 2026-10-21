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

import {principal,collections,refundedCash} from '../receivables/receivables.js';

export const COST_KINDS = [
  ['feira', 'Custos da feira', 'Barraca, transporte, ajudante, alimentação'],
  ['producao', 'Produção e insumos', 'Sementes, ração, adubo, embalagens'],
  ['marketing', 'Divulgação', 'Panfletos, anúncios, brindes'],
  ['retirada', 'Sua retirada', 'Dinheiro do negócio que vai para a casa'],
  ['investimento', 'Investimentos', 'Equipamento, ferramenta, reforma: sai do caixa, mas não é custo do mês'],
];
export const COST_PRESETS = {
  feira: ['Barraca', 'Transporte', 'Ajudante', 'Alimentação', 'Gelo'],
  producao: ['Embalagens', 'Insumos', 'Ração', 'Sementes', 'Adubo'],
  marketing: ['Panfletos', 'Anúncio', 'Brindes', 'Degustação'],
  retirada: ['Retirada do mês'],
  investimento: ['Barraca nova', 'Balança', 'Freezer', 'Ferramentas', 'Reforma'],
};
export const FIXED_PRESETS = ['Energia', 'Internet', 'Celular', 'Combustível', 'Manutenção', 'Aluguel', 'Contador', 'DAS (MEI)'];
export const DEFAULT_FEES = { Débito: 1.99, Crédito: 4.98 };

export function financeSettings(raw) {
  const f = raw || {};
  const fees = { ...DEFAULT_FEES, ...(f.cardFees || {}) };
  return {
    cardFees: { Débito: Math.max(0, Number(fees.Débito) || 0), Crédito: Math.max(0, Number(fees.Crédito) || 0) },
    goal: Math.max(0, Math.round(Number(f.goal) || 0)),
    drawOn: !!f.drawOn,
    drawMonthly: Math.max(0, Math.round(Number(f.drawMonthly) || 0)),
    // Imposto sobre a venda (ex.: Funrural do produtor pessoa física). Começa em 0: cada caso é um caso.
    salesTaxRate: Math.min(30, Math.max(0, Number(f.salesTaxRate) || 0)),
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

const fixedMonthly = (settings, referenceMonth) => Math.round(settings.fixedCosts
  .filter(f => !referenceMonth || !f.since || f.since <= referenceMonth)
  .reduce((n, f) => n + Number(f.amount), 0));

export function cardFeesOf(sales, settings) {
  let fees = 0;
  for (const s of sales) for (const p of s.payments || []) {
    const rate = settings.cardFees[p.method];
    // Each recorded payment is a separate charge estimate, rounded to a cent.
    // This same function is used by the statement and by each sales location.
    if (rate) fees += Math.round((p.amount * rate) / 100);
  }
  return Math.round(fees);
}

// Demonstrativo (regime de competência: cada fato entra no dia em que aconteceu; período fechado não muda).
//   sales    = vendas feitas no período (inclusive as devolvidas depois: a venda aconteceu naquele dia)
//   returns  = vendas devolvidas NO período (pela data da devolução): estornam receita e custo do produto
//   expenses = custos lançados no período/local · losses = valor das perdas de estoque no período
//   shares   = monthShares(...) · general = local "Todos" (só então entram fixos, perdas e retirada mensal)
// A taxa do cartão não volta na devolução (a maquininha não devolve a taxa).
export function statement({ sales, returns = [], expenses, receipts = collections(sales), losses = 0, settings: raw, shares = [], general = true }) {
  const settings = financeSettings(raw);
  const grossSales = sales.reduce((n, s) => n + s.total, 0);
  const returned = returns.reduce((n, s) => n + s.total, 0);
  const revenue = grossSales - returned;
  const discounts = sales.reduce((n, s) => n + (s.discount || 0), 0);
  const cmv = sales.reduce((n, s) => n + (s.cost || 0), 0) - returns.reduce((n, s) => n + (s.cost || 0), 0);
  const fees = cardFeesOf(sales, settings) + cardFeesOf(receipts.map(r=>({payments:[r]})),settings);
  const taxes = Math.round(Math.max(0, revenue) * settings.salesTaxRate / 100);
  const contribution = revenue - cmv - fees - taxes;
  const kinds = Object.fromEntries(COST_KINDS.map(([id]) => [id, 0]));
  for (const x of expenses) kinds[costKind(x)] += x.amount;
  const fixed = general ? fixedFor(settings, shares) : 0;
  const lossValue = general ? Math.round(losses) : 0;
  // Retirada: a realizada (lançada) vale mais que a planejada; nunca as duas somadas.
  const drawPlanned = general && settings.drawOn ? Math.round(shares.reduce((n, s) => n + s.share, 0) * settings.drawMonthly) : 0;
  const draw = kinds.retirada > 0 ? kinds.retirada : drawPlanned;
  const operating = kinds.feira + kinds.producao + kinds.marketing;
  const result = contribution - operating - lossValue - fixed - draw;
  const contributionRate = revenue > 0 ? contribution / revenue : 0;
  // Use the selected period, never the machine's current date. Without a reference,
  // retain the legacy all-costs indicator and expose its unspecified month.
  const monthlyFixedReference = shares.map(s => s.month).filter(m => /^\d{4}-\d{2}$/.test(m || '')).sort().at(-1) || null;
  const monthlyFixed = fixedMonthly(settings, monthlyFixedReference) + (settings.drawOn ? settings.drawMonthly : 0);
  // Caixa do período (o dinheiro que entrou e saiu, diferente do resultado): recebimentos por forma de
  // pagamento, menos devoluções pagas, taxas, custos, contas fixas, retirada e investimentos.
  const received = {};
  for (const s of sales) for (const p of s.payments || []) if(p.method!=='Fiado') received[p.method] = (received[p.method] || 0) + p.amount;
  for (const r of receipts) received[r.method]=(received[r.method]||0)+r.amount;
  const creditSold=sales.reduce((n,s)=>n+principal(s),0),collected=receipts.reduce((n,r)=>n+r.amount,0),cashRefunded=returns.reduce((n,s)=>n+refundedCash(s),0);
  const cashIn = grossSales - creditSold + collected - cashRefunded - fees;
  const cashOut = operating + fixed + draw + kinds.investimento + taxes;
  return {
    grossSales, returned, revenue, discounts, cmv, fees, taxes, contribution, contributionRate,
    costs: kinds, operating, losses: lossValue, fixed, draw, drawPlanned, result, salesCount: sales.length,
    creditSold, collected, cashRefunded, investments: kinds.investimento, received, cashIn, cashOut, cash: cashIn - cashOut,
    monthlyFixed, monthlyFixedReference,
    chargeEstimates: {
      fees: { basis: 'configured-rate-per-recorded-payment', rounding: 'integer-cent-per-payment' },
      taxes: { basis: 'positive-net-sales-in-selected-period', rate: settings.salesTaxRate },
      settlementTracked: false,
    },
    breakEven: contributionRate > 0 && monthlyFixed > 0 ? Math.round(monthlyFixed / contributionRate) : null,
    costsLogged: expenses.length > 0,
    // Prova real: o resultado é exatamente a soma das linhas do demonstrativo.
    checks: revenue - cmv - fees - taxes - operating - lossValue - fixed - draw === result,
  };
}

// Valor das perdas de estoque: quantidade perdida × custo do produto (o gravado na perda ou o atual).
export function lossValue(movements, costOf) {
  return Math.round(movements.filter(m => m.kind === 'loss').reduce((n, m) => n + m.qty * (m.cost ?? costOf(m.productId) ?? 0), 0));
}

// Lucro de cada feira/local, com as mesmas regras do demonstrativo: vendas pela data da venda (inclusive
// as devolvidas depois), devoluções pela data da devolução, taxa do cartão, imposto sobre a venda e os
// custos lançados naquele local (sem retirada nem investimento).
export function profitByPlace({ sales, returns = [], expenses, receipts = collections(sales), settings: raw, nameOf }) {
  const settings = financeSettings(raw);
  const places = new Map();
  const get = id => places.get(id) || places.set(id, { id, name: nameOf(id), revenue: 0, returned: 0, cmv: 0, fees: 0, taxes: 0, costs: 0, sales: 0 }).get(id);
  for (const s of sales) { const p = get(s.scope || 'loja'); p.revenue += s.total; p.cmv += s.cost || 0; p.fees += cardFeesOf([s], settings); p.sales++; }
  for (const s of returns) { const p = get(s.scope || 'loja'); p.revenue -= s.total; p.returned += s.total; p.cmv -= s.cost || 0; }
  for (const r of receipts) get(r.scope||'loja').fees += cardFeesOf([{payments:[r]}],settings);
  for (const x of expenses) if (!['retirada', 'investimento'].includes(costKind(x))) get(x.scope || 'loja').costs += x.amount;
  return [...places.values()].map(p => {
    const taxes = Math.round(Math.max(0, p.revenue) * settings.salesTaxRate / 100);
    return { ...p, taxes, profit: p.revenue - p.cmv - p.fees - taxes - p.costs };
  }).sort((a, b) => b.profit - a.profit);
}

// Margem de cada produto vendido (desconto da venda repartido pelos itens). Devoluções do período
// (pela data da devolução) descontam o produto, como no demonstrativo.
export function productMargins(sales, returns = []) {
  const by = new Map();
  const add = (s, sign) => {
    const factor = s.subtotal > 0 ? s.total / s.subtotal : 1;
    for (const i of s.items || []) {
      const r = by.get(i.productId) || { id: i.productId, name: i.name, description: i.description, revenue: 0, cost: 0, qty: 0,
        costKnown: true, unknownCostQty: 0, unknownCostRevenue: 0, observedCostQty: 0, observedCostRevenue: 0 };
      const revenue = (i.netTotal ?? i.total ?? 0) * (i.netTotal != null ? 1 : factor);
      r.revenue += sign * revenue;
      r.cost += sign * (i.costTotal || 0);
      r.qty += sign * (i.qty || 0);
      // Coverage describes the historical line, never today's product registration.
      // Absolute exposures keep a return from cancelling an unknown-cost warning.
      const known = i.costKnown !== false && (i.costKnown === true || (Number.isFinite(i.costTotal) && i.costTotal > 0));
      r.observedCostQty += Math.abs(i.qty || 0);
      r.observedCostRevenue += Math.abs(revenue);
      if (!known) {
        r.costKnown = false;
        r.unknownCostQty += Math.abs(i.qty || 0);
        r.unknownCostRevenue += Math.abs(revenue);
      }
      by.set(i.productId, r);
    }
  };
  for (const s of sales) add(s, 1);
  for (const s of returns) add(s, -1);
  return [...by.values()].filter(r => r.qty !== 0 || Math.round(r.revenue) !== 0 || !r.costKnown).map(r => {
    const { observedCostQty, observedCostRevenue, ...row } = r;
    const costCoverage = observedCostRevenue > 0 ? 1 - r.unknownCostRevenue / observedCostRevenue
      : observedCostQty > 0 ? 1 - r.unknownCostQty / observedCostQty : r.costKnown ? 1 : 0;
    return { ...row, unknownCostRevenue: Math.round(r.unknownCostRevenue), costCoverage: Math.max(0, Math.min(1, costCoverage)),
      revenue: Math.round(r.revenue), margin: r.revenue > 0 ? (r.revenue - r.cost) / r.revenue : null };
  }).sort((a, b) => b.revenue - a.revenue);
}

// Meta do mês: a definida pela pessoa ou, se não houver, a média dos últimos resultados positivos + 10%.
export function suggestedGoal(pastResults) {
  const good = pastResults.filter(n => n > 0);
  if (!good.length) return 0;
  return Math.ceil(Math.round((good.reduce((n, v) => n + v, 0) / good.length) * 1.1) / 1000) * 1000;
}
