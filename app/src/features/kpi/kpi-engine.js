// Indicadores da Gestão tirados da referência "CRM e PDV Profissional" (knowledge/crm-pdv-profissional.md):
// curva ABC de contribuição, cobertura do estoque em dias e o que explica a diferença entre dois períodos.
// Só calcula sobre os registros recebidos, em centavos; custo ausente nunca vira zero nem margem de 100%.

const byName = (a, b) => String(a.id).localeCompare(String(b.id));

/**
 * Curva ABC pelo lucro bruto (receita − custo histórico), só com produtos de custo conhecido.
 * A: até 80% do lucro positivo · B: de 80% a 95% · C: o resto. A cobertura diz quanto da receita
 * positiva entrou na conta; o que ficou de fora (sem custo) aparece à parte, sem estimativa.
 */
export function contributionAbc(rows = []) {
  const sold = rows.filter(r => Number.isFinite(r.revenue) && r.revenue > 0);
  const known = sold.filter(r => r.costKnown && Number.isFinite(r.cost));
  const totalRevenue = sold.reduce((n, r) => n + r.revenue, 0);
  const knownRevenue = known.reduce((n, r) => n + r.revenue, 0);
  const positive = known.map(r => ({ ...r, value: r.revenue - r.cost })).filter(r => r.value > 0)
    .sort((a, b) => b.value - a.value || byName(a, b));
  const total = positive.reduce((n, r) => n + r.value, 0);
  let cumulative = 0;
  const classes = positive.map(r => {
    const before = cumulative;
    cumulative += r.value;
    const cls = before < total * 0.8 ? 'A' : before < total * 0.95 ? 'B' : 'C';
    return { id: r.id, name: r.name, description: r.description || '', value: r.value, share: r.value / total, margin: r.value / r.revenue, cls };
  });
  const count = cls => classes.filter(r => r.cls === cls).length;
  return {
    total, classes, counts: { A: count('A'), B: count('B'), C: count('C') },
    coverage: totalRevenue > 0 ? knownRevenue / totalRevenue : 0,
    missing: sold.filter(r => !(r.costKnown && Number.isFinite(r.cost))).map(r => ({ id: r.id, name: r.name, description: r.description || '', revenue: r.revenue })),
    negative: known.filter(r => r.revenue - r.cost <= 0).map(r => ({ id: r.id, name: r.name, description: r.description || '', value: r.revenue - r.cost })),
  };
}

/**
 * Quantos dias o saldo de agora dura pela média de venda da janela (30 dias por padrão).
 * rows: { id, name, description, unit, stock (null = não informado), sold (quantidade vendida na janela) }.
 * Esgotado com procura, curto (menos de shortDays) e parado (saldo sem venda na janela).
 */
export function stockCoverage(rows = [], { windowDays = 30, shortDays = 7 } = {}) {
  if(!Number.isFinite(windowDays)||windowDays<=0||!Number.isFinite(shortDays)||shortDays<=0)throw Error('Janela de cobertura inválida');
  const out = [], short = [], still = [];
  let ok = 0, unknown = 0;
  for (const r of rows) {
    const sold = Math.max(0, Number(r.sold) || 0), stock = Number.isFinite(r.stock) ? r.stock : null;
    const daily = sold / windowDays;
    const item = { id: r.id, name: r.name, description: r.description || '', unit: r.unit || '', stock, sold, daily, days: null };
    if (stock === null) { if (sold > 0) unknown++; continue; }
    if (stock <= 0) { if (sold > 0) out.push(item); continue; }
    if (!sold) { still.push(item); continue; }
    item.days = stock / daily;
    if (item.days < shortDays) short.push(item); else ok++;
  }
  short.sort((a, b) => a.days - b.days || byName(a, b));
  out.sort((a, b) => b.daily - a.daily || byName(a, b));
  still.sort((a, b) => b.stock - a.stock || byName(a, b));
  return { windowDays, shortDays, out, short, still, ok, unknown };
}

/**
 * O que mudou de um período para o outro, produto a produto (linhas de productMargins).
 * Receita = efeito quantidade (Δqtd × preço médio anterior) + efeito preço (Δpreço médio × qtd atual),
 * quando o produto vendeu nos dois períodos. Lucro bruto só quando os dois lados têm custo conhecido.
 */
export function periodChange(current = [], previous = [], { limit = 5 } = {}) {
  const prev = new Map(previous.map(r => [r.id, r])), cur = new Map(current.map(r => [r.id, r]));
  const ids = [...new Set([...cur.keys(), ...prev.keys()])];
  const known = r => !r || (r.costKnown && Number.isFinite(r.cost));
  const gross = r => (r ? r.revenue - r.cost : 0);
  const rows = ids.map(id => {
    const c = cur.get(id), p = prev.get(id), base = c || p;
    const revenueDiff = (c?.revenue || 0) - (p?.revenue || 0);
    const grossDiff = known(c) && known(p) ? gross(c) - gross(p) : null;
    let qtyEffect = null, priceEffect = null;
    if (c?.qty > 0 && p?.qty > 0 && c.unitsComparable!==false && p.unitsComparable!==false && (!c.unit || !p.unit || c.unit===p.unit)) {
      qtyEffect = Math.round((c.qty - p.qty) * (p.revenue / p.qty));
      priceEffect = revenueDiff - qtyEffect;
    }
    return { id, name: base.name, description: base.description || '', revenueDiff, grossDiff, qtyEffect, priceEffect,
      qty: c?.qty || 0, previousQty: p?.qty || 0, isNew: !p, isGone: !c };
  }).filter(r => r.revenueDiff !== 0 || (r.grossDiff || 0) !== 0);
  const allKnown = [...current, ...previous].every(r => r.costKnown && Number.isFinite(r.cost));
  const weight = r => Math.abs(allKnown && r.grossDiff !== null ? r.grossDiff : r.revenueDiff);
  const drivers = rows.sort((a, b) => weight(b) - weight(a) || byName(a, b)).slice(0, limit);
  const sum = (list, f) => list.reduce((n, r) => n + f(r), 0);
  return {
    revenueDiff: sum(current, r => r.revenue) - sum(previous, r => r.revenue),
    grossDiff: allKnown ? sum(current, gross) - sum(previous, gross) : null,
    drivers, byGross: allKnown,
  };
}
