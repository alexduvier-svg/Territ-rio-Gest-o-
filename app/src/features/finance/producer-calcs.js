// Contas do produtor (modo "Contas" da calculadora): preço pelo markup, ponto de equilíbrio,
// indicadores do período, impacto do desconto, taxa da maquininha e fornecedor à vista ou a prazo. Funções puras em reais (não em
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
  const units = Math.ceil(fixed / contribution - 1e-9), goal = Math.ceil((fixed + Math.max(0, opt(profit))) / contribution - 1e-9);
  // exact: a divisão fecha certinho; nessa unidade os custos ficam pagos e a sobra só começa na seguinte.
  const exact = Math.abs(fixed / contribution - Math.round(fixed / contribution)) < 1e-9;
  return { status: 'ok', contribution, contributionRate: contribution / price, units, exact, revenue: units * price, goalUnits: goal, goalRevenue: goal * price, hasGoal: ok(profit) && profit > 0 };
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

// Fornecedor: pagar à vista ou a prazo. "implicit" é o juro ao mês que o preço a prazo embute; com a
// taxa que o dinheiro rende (ou o crédito custa) ao mês, o preço a prazo é trazido para hoje e comparado.
// Não considera falta de caixa, prazo de entrega ou qualidade: isso fica para o produtor pesar.
export function cashOrTerm({ cash, term, days, rate }) {
  if (!ok(cash, term, days) || cash <= 0 || term <= 0 || days <= 0 || days > 3650) return null;
  const implicit = Math.pow(term / cash, 30 / days) - 1;
  if (!ok(rate)) return { status: 'ok', implicit, hasRate: false };
  if (rate < 0 || rate >= 100) return null;
  const today = term / Math.pow(1 + rate / 100, days / 30), diff = cash - today;
  const best = Math.abs(diff) < 0.005 ? 'same' : diff > 0 ? 'term' : 'cash';
  return { status: 'ok', implicit, hasRate: true, today, diff, best };
}

// Fornecedores, comparação rápida: até 3 ofertas com preço, quantidade e frete; vence o menor custo por
// unidade. Só compara o que foi informado; qualidade, prazo e pagamento ficam para a comparação completa.
export function quickCompare(offers) {
  const rows = (offers || []).map((o, i) => ({ i, ...o })).filter(o => ok(o.price, o.qty) && o.price > 0 && o.qty > 0 && (!ok(o.freight) || o.freight >= 0))
    .map(o => { const total = o.price + opt(o.freight); return { i: o.i, total, unit: total / o.qty, freightKnown: ok(o.freight) }; });
  if (rows.length < 2) return null;
  const sorted = [...rows].sort((a, b) => a.unit - b.unit || a.i - b.i), best = sorted[0], next = sorted[1];
  const tie = Math.abs(next.unit - best.unit) < 1e-9;
  return { rows, best: tie ? null : best.i, tie, saving: tie ? 0 : (next.unit - best.unit) / next.unit, missingFreight: rows.some(r => !r.freightKnown) };
}

// Estoque: quando pedir e quanto comprar. Ponto de pedido = venda por dia × (dias até chegar + folga);
// a compra cobre os dias pedidos depois que a mercadoria chega, descontado o que já está no estoque.
export function restockPlan({ daily, onHand, leadDays, safetyDays, coverDays }) {
  if (!ok(daily, onHand, leadDays, coverDays) || daily <= 0 || onHand < 0 || leadDays < 0 || coverDays <= 0) return null;
  const safety = Math.max(0, opt(safetyDays)), reorderAt = daily * (leadDays + safety);
  const daysLeft = (onHand - reorderAt) / daily, quantity = Math.max(0, Math.ceil(daily * (leadDays + safety + coverDays) - onHand - 1e-9));
  return { reorderAt, daysLeft, orderNow: daysLeft <= 0, quantity, lastsDays: onHand / daily };
}

// Ciclo de caixa: quantos dias o dinheiro fica parado entre pagar o fornecedor e receber do cliente.
// Com o custo do mês, mostra o dinheiro de giro que esse ciclo prende.
export function cashCycle({ stockDays, receiveDays, payDays, monthlyCost }) {
  if (!ok(stockDays, receiveDays, payDays) || stockDays < 0 || receiveDays < 0 || payDays < 0) return null;
  const cycle = stockDays + receiveDays - payDays, hasCost = ok(monthlyCost) && monthlyCost > 0;
  return { cycle, operating: stockDays + receiveDays, working: hasCost && cycle > 0 ? monthlyCost / 30 * cycle : hasCost ? 0 : null };
}

// Produção rural: custo da safra por unidade colhida (saca, kg, caixa) e, com o preço, a sobra por unidade.
export function harvestCost({ inputs, labor, machines, other, produced, price }) {
  const parts = [inputs, labor, machines, other].filter(v => Number.isFinite(v));
  if (!parts.length || parts.some(v => v < 0) || !ok(produced) || produced <= 0) return null;
  const total = parts.reduce((n, v) => n + v, 0), unit = total / produced, hasPrice = ok(price) && price > 0;
  return { total, unit, informed: parts.length, margin: hasPrice ? (price - unit) / price : null, perUnit: hasPrice ? price - unit : null, breakEvenQty: hasPrice ? total / price : null };
}

// Medidas do campo. Saca de café/grãos 60 kg, arroba 15 kg; alqueire mineiro 48.400 m², paulista 24.200 m².
export const MEASURES = {
  peso: { kg: ['Quilo (kg)', 1, 'kg'], saca: ['Saca de 60 kg', 60, 'sacas'], arroba: ['Arroba (15 kg)', 15, 'arrobas'], t: ['Tonelada', 1000, 't'] },
  area: { ha: ['Hectare', 10000, 'ha'], alqmg: ['Alqueire mineiro', 48400, 'alqueires mineiros'], alqsp: ['Alqueire paulista', 24200, 'alqueires paulistas'], m2: ['Metro quadrado', 1, 'm²'] },
};
export function convertMeasure({ value, from }) {
  if (!ok(value) || value < 0) return null;
  const group = Object.entries(MEASURES).find(([, units]) => units[from]);
  if (!group) return null;
  const [name, units] = group, base = value * units[from][1];
  return { group: name, rows: Object.entries(units).filter(([id]) => id !== from).map(([id, [label, size, short]]) => ({ id, label, short, value: base / size })) };
}

// Financiamento pela tabela Price (parcela fixa). Juro 0 divide em partes iguais.
export function loanPayment({ principal, rate, months }) {
  if (!ok(principal, rate, months) || principal <= 0 || rate < 0 || rate >= 100 || months < 1 || months > 600 || !Number.isInteger(months)) return null;
  const i = rate / 100, payment = i === 0 ? principal / months : principal * i / (1 - Math.pow(1 + i, -months));
  return { payment, total: payment * months, interest: payment * months - principal };
}

// Investimento (balança, freezer, barraca): em quantos meses volta e quanto rende na vida útil.
export function investmentReturn({ cost, monthlyGain, lifeMonths }) {
  if (!ok(cost, monthlyGain) || cost <= 0) return null;
  if (monthlyGain <= 0) return { status: 'no-return' };
  const payback = cost / monthlyGain, hasLife = ok(lifeMonths) && lifeMonths > 0;
  return { status: 'ok', payback, gainLife: hasLife ? monthlyGain * lifeMonths : null, roi: hasLife ? (monthlyGain * lifeMonths - cost) / cost : null, paysBeforeEnd: hasLife ? payback <= lifeMonths : null };
}

// Número digitado em pt-BR: "1.234,56", "12,5", "R$ 9", "1.200" ou "9.5". Vazio é desconhecido (NaN),
// não zero, e agrupamento errado ("1.23.4", "12.34,5", "1,2,3") também não vira número.
export function parseBR(text) {
  let s = String(text ?? '').trim().replace(/\s/g, '').replace(/^R\$/i, '').replace(/%$/, '');
  if (s === '') return NaN;
  const negative = s.startsWith('-');
  if (negative) s = s.slice(1);
  let n;
  if (s.includes(',')) {
    const [whole, cents, ...rest] = s.split(',');
    if (rest.length || !/^\d+$/.test(cents) || whole !== '' && !/^\d+$/.test(whole) && !/^\d{1,3}(\.\d{3})+$/.test(whole)) return NaN;
    n = Number((whole.replace(/\./g, '') || '0') + '.' + cents);
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) n = Number(s.replace(/\./g, ''));
  else if (/^\d+(\.\d+)?$/.test(s)) n = Number(s);
  else return NaN;
  return Number.isFinite(n) ? (negative ? -n : n) : NaN;
}
