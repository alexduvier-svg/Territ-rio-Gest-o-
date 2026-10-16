// Evidence quality, not a probability that a business recommendation will succeed.
// Costs come from sale snapshots; a later catalog edit must not repair past evidence.
export function evidenceQuality(input) {
  const margins = input.finance?.margins;
  const rank = input.current?.rank || [];
  const index = new Map((input.products || []).map(p => [p.id, p]));
  const lines = (margins || rank).filter(r => (r.revenue ?? r.amount ?? 0) > 0);
  let coveredRevenue = 0, totalRevenue = 0, knownProducts = 0;
  for (const row of lines) {
    const revenue = Math.max(0, row.revenue ?? row.amount ?? 0);
    const known = margins ? (row.costKnown ?? row.cost > 0) : index.get(row.id)?.cost > 0;
    totalRevenue += revenue;
    if (known) { coveredRevenue += revenue; knownProducts++; }
    else if (margins && row.costCoverage != null) {
      coveredRevenue += revenue * Math.min(1, Math.max(0, row.costCoverage));
    }
  }
  const missingProducts = lines.length - knownProducts;
  const errors = input.audit?.errors || [];
  const missingDays = input.finance?.missingDays?.length || 0;
  const completeCosts = lines.length > 0 && missingProducts === 0;
  return {
    context: ['real', 'demo', 'simulation'].includes(input.dataContext?.type) ? input.dataContext.type : 'unconfirmed',
    knownProducts, products: lines.length, missingProducts, coveredRevenue, totalRevenue,
    costCoverage: totalRevenue > 0 ? coveredRevenue / totalRevenue : null,
    completeCosts, errors: errors.length, missingDays,
    sales: input.current?.salesCount || 0,
    status: errors.length ? 'Corrigir registros' : !completeCosts || missingDays ? 'Dados parciais' : 'Custos dos produtos informados',
    // Absence of an expense/settlement record never proves that it was zero/received.
    resultIsPartial: !completeCosts || missingDays > 0,
  };
}
