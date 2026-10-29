// One tidy table for analysis: currency in reais, ratios in %, missing data stays blank.
// Values are passed through from the canonical engines, never recomputed here.
export function analysisRows(entries, { kind, period = '', scope = '', origin = '', at = new Date().toISOString(), version = '' } = {}) {
  const header = ['Arquivo', 'Gerado em', 'Versão', 'Origem', 'Período', 'Local', 'Seção', 'Item', 'Campo', 'Valor', 'Unidade', 'Proveniência', 'Observação'];
  return [header, ...entries.map(e => [kind, at, version, origin, period, scope, e.section || '', e.item || '', e.field || '',
    typeof e.value === 'number' ? Number.isFinite(e.value) ? e.value : '' : e.value ?? '', e.unit || '', e.source || '', e.note || ''])];
}
