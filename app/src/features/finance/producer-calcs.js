// Contas do produtor (modo "Contas" da calculadora): preço pelo markup, ponto de equilíbrio,
// indicadores do período, impacto do desconto e taxa da maquininha. Funções puras em reais (não em
// centavos, porque são contas de consulta e não gravam nada); arredondamento só na exibição.
// Entrada vazia ou inválida devolve null; o resultado nunca inventa um número que o produtor não deu.
// Percentuais chegam como número de 0 a 100 (20 = 20%). Teste-ouro em tests/producer-calcs.test.mjs e
// entrada no docs/motor/registry.json. O ponto de equilíbrio do mês com as vendas registradas continua
// em finance.js (statement.breakEven); este aqui é a simulação por unidade.

const ok = (...values) => values.every(Number.isFinite);
const opt = v => Number.isFinite(v) ? v : 0;

// Preço que cobre as despesas da venda e deixa a margem desejada. As despesas incidem sobre o preço,
// por isso é divisão: preço = custo ÷ (1 − despesas − margem). "naive" é o erro comum de somar as
// porcentagens ao custo, e naiveMargin é a margem que sobraria de verdade com aquele preço.
export function markupPrice({ cost, margin, card, fair, tax }) {
  if (!ok(cost, margin) || cost <= 0 || margin < 0) return null;
  const rates = [card, fair, tax].map(opt);
  if (rates.some(r => r < 0)) return null;
  const expenseRate = rates.reduce((n, r) => n + r, 0) / 100, m = margin / 100;
  if (expenseRate + m >= 1) return { status: 'impossible', expenseRate, marginRate: m };
  const markup = 1 / (1 - expenseRate - m), price = cost * markup;
  const naive = cost * (1 + expenseRate + m), naiveMargin = (naive * (1 - expenseRate) - cost) / naive;
  return { status: 'ok', price, markup, profit: price * m, expenses: price * expenseRate, expenseRate, marginRate: m, overCost: (price - cost) / cost, naive, naiveMargin };
}

// Unidades para pagar os custos fixos do mês e para chegar ao lucro desejado.
export function breakEvenUnits({ fixed, price, variable, profit }) {
  if (!ok(fixed, price, variable) || fixed < 0 || price <= 0 || variable < 0) return null;
  const contribution = price - variable;
  if (contribution <= 0) return { status: 'no-margin', contribution };
  const units = Math.ceil(fixed / contribution), goal = Math.ceil((fixed + Math.max(0, opt(profit))) / contribution);
  return { status: 'ok', contribution, contributionRate: contribution / price, units, revenue: units * price, goalUnits: goal, goalRevenue: goal * price, hasGoal: ok(profit) && profit > 0 };
}

// Ticket médio, variação contra o período anterior e perdas/sobras do que foi levado.
export function periodIndicators({ revenue, count, previous, taken, lost }) {
  if (!ok(revenue, count) || count <= 0 || revenue < 0) return null;
  const change = ok(previous) && previous > 0 ? (revenue - previous) / previous : null;
  const lossRate = ok(taken, lost) && taken > 0 && lost >= 0 && lost <= taken ? lost / taken : null;
  return { ticket: revenue / count, change, lossRate, used: lossRate == null ? null : 1 - lossRate };
}

// Quanto a mais vender para manter o mesmo lucro depois do desconto, e o desconto máximo sem prejuízo.
export function discountImpact({ price, variable, discount, qty }) {
  if (!ok(price, variable, discount) || price <= 0 || variable < 0 || discount < 0 || discount >= 100) return null;
  const before = price - variable, maxDiscount = before / price;
  if (before <= 0) return { status: 'no-margin', before, maxDiscount: 0 };
  const newPrice = price * (1 - discount / 100), after = newPrice - variable;
  if (after <= 0) return { status: 'loss', newPrice, before, after, maxDiscount };
  const extra = before / after - 1, hasQty = ok(qty) && qty > 0;
  return { status: 'ok', newPrice, before, after, extra, marginCut: 1 - after / before, maxDiscount,
    newQty: hasQty ? Math.ceil(qty * (1 + extra) - 1e-9) : null, profitSame: hasQty ? after * qty : null, profitBefore: hasQty ? before * qty : null };
}

// Quanto fica depois da taxa e quanto cobrar para receber um valor líquido exato.
export function cardNet({ value, rate, wanted }) {
  if (!ok(rate) || rate < 0 || rate >= 100) return null;
  const keep = 1 - rate / 100, hasValue = ok(value) && value > 0, hasWanted = ok(wanted) && wanted > 0;
  if (!hasValue && !hasWanted) return null;
  return { net: hasValue ? value * keep : null, fee: hasValue ? value * rate / 100 : null, grossFor: hasWanted ? wanted / keep : null, increase: hasWanted ? 1 / keep - 1 : null };
}

// Número digitado em pt-BR: "1.234,56", "12,5", "R$ 9" ou "9.5". Vazio é desconhecido (NaN), não zero.
export function parseBR(text) {
  let s = String(text ?? '').trim().replace(/\s/g, '').replace(/^R\$/i, '').replace(/%$/, '');
  if (s === '') return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}
