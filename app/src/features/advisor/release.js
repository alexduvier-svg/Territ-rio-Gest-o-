// Presentation policy only. Facts and money remain in the canonical domain engines.
// Connect supplies local context; Action proposes; Audit is authoritative. No network here.
export const RELEASE_VERSION = 1;
const DAY = 86400000;
const levels = { urgente: 0, atencao: 1, oportunidade: 2, bom: 3 };
const integrity = id => /^(origem-dados|fin-conferencia|fin-audit|fin-erros|auditoria|audit-|fin-inconsistencia)/.test(id);
const family = id => /^guia-pdv:/.test(id)?'pdv':/^guia-crm:/.test(id)?'crm':/^(stock-low|repor|acaba-logo|esgotou)/.test(id) ? 'stock'
  : /^(fair-|encalhe|previsao-feira)/.test(id) ? 'fair'
  : /^(rebuy|retorno|fieis|identificar)/.test(id) ? 'crm'
  : /^(papel-produto|dependencia|ticket)/.test(id) ? 'mix' : id;
function digest(value) {
  let hash = 2166136261;
  for (const c of JSON.stringify(value)) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}
export function emptyRelease(actorId, dataOrigin) {
  return { version: RELEASE_VERSION, actorId, dataOrigin, entries: [] };
}
function normalize(d, source) {
  if (source === 'advisor') return { ...d, source, ruleId: d.id, originLabel: 'Motor de Orientação', evidence: d.happened, action: d.todo, urgentIntegrity: integrity(d.id) };
  return { ...d, source, ruleId: d.ruleId, level: { urgent: 'urgente', attention: 'atencao', opportunity: 'oportunidade', info: 'bom' }[d.severity] || 'atencao',
    title: { 'stock-low': 'Confira o Estoque', 'no-sale': 'Produto Sem Venda Registrada', 'fair-left': 'Sobra Conferida na Feira', 'fair-repeat': 'Sobra em Feiras Comparáveis', rebuy: 'Oportunidade de Recompra' }[d.ruleId] || 'Conferir Registros',
    evidence: d.observation, action: d.nextAction, originLabel: 'Agente Local · Registros Verificados', urgentIntegrity: false };
}
export function releaseInsights(guidance, operational, { actorId, dataOrigin, scopeId = 'all', period = {}, now = Date.now(), memory } = {}) {
  const ledger = memory?.actorId === actorId && memory?.dataOrigin === dataOrigin && memory?.version === RELEASE_VERSION
    ? { ...memory, entries: Array.isArray(memory.entries) ? memory.entries.filter(e => e && typeof e.key === 'string').map(e => ({ ...e })).slice(-160) : [] }
    : emptyRelease(actorId, dataOrigin);
  const quality = guidance.quality;
  // Operational facts are never allowed to conceal an audit or unknown data origin.
  const blocked = quality.errors > 0 || quality.context === 'unconfirmed';
  const rawOperational = !blocked && operational?.actorId === actorId && operational?.dataOrigin === dataOrigin ? (operational.insights || []) : [];
  const local = rawOperational.filter(d => !d.expiresAt || d.expiresAt > now).map(d => normalize(d, 'agent'));
  const covered = new Set(local.filter(d => d.ruleId !== 'no-sale').map(d => family(d.ruleId)));
  const canonical = guidance.all.map(d => normalize(d, 'advisor')).filter(d => !covered.has(family(d.id)) || d.urgentIntegrity);
  const candidates = [...canonical, ...local].filter(d => d.level !== 'bom' && (!blocked || d.urgentIntegrity || /^tempo-/.test(d.ruleId)));
  const waiting = [], eligible = [];
  for (const d of candidates) {
    // General advice remains in the reference guide; personalized opportunities need evidence.
    if (d.source === 'advisor' && d.level === 'oportunidade' && quality.sales < 5 && !/^preparar|test-pending/.test(d.ruleId)) { waiting.push(d); continue; }
    const context = [actorId, dataOrigin, scopeId, period.start ?? '', period.end ?? '', d.source, d.id];
    const key = digest(context), fingerprint = digest([RELEASE_VERSION, d.decision?.rule_version || d.ruleVersion || 1, d.evidence, d.action, d.numbers || [], d.evidenceRefs || []]);
    const prior = ledger.entries.find(e => e.key === key && e.fingerprint === fingerprint);
    const feedback = prior?.status;
    const suppressed = !d.urgentIntegrity && (['useful', 'dismissed'].includes(feedback) || feedback === 'snoozed' && prior.until > now);
    const item = { ...d, key, fingerprint, periodLabel: guidance.periodLabel, reason: d.urgentIntegrity ? 'A integridade dos registros tem prioridade.' : 'O recorte e os critérios desta regra possuem evidência suficiente.', firstSeenAt: prior?.firstSeenAt || now };
    if (suppressed) { waiting.push(item); continue; }
    eligible.push(item);
  }
  const rotationDay=Math.floor((now-3*3600000)/DAY),learning=eligible.filter(d=>d.educational).sort((a,b)=>a.id.localeCompare(b.id));
  const rotationRank=d=>{const prior=ledger.entries.find(e=>e.key===d.key&&e.fingerprint===d.fingerprint);if(prior?.rotationDay===rotationDay)return -1000;const sameArea=d.learningArea===(rotationDay%2?'pdv':'crm')?0:100;return sameArea+(learning.indexOf(d)-rotationDay%Math.max(1,learning.length)+learning.length)%Math.max(1,learning.length);};
  eligible.sort((a, b) => Number(b.urgentIntegrity) - Number(a.urgentIntegrity) || levels[a.level] - levels[b.level] || Number(!!a.educational)-Number(!!b.educational) || (a.educational&&b.educational?rotationRank(a)-rotationRank(b):0) || (b.impact || 0) - (a.impact || 0) || a.id.localeCompare(b.id));
  const selected = [], domains = new Set();
  for (const d of eligible) {
    if(d.educational&&selected.some(i=>i.educational))continue;
    const domain = family(d.ruleId);
    if (!d.urgentIntegrity && domains.has(domain)) continue;
    domains.add(domain); selected.push(d); if (selected.length === 3) break;
  }
  let changed = memory?.actorId !== actorId || memory?.dataOrigin !== dataOrigin || memory?.version !== RELEASE_VERSION;
  for (const d of selected) if (!ledger.entries.some(e => e.key === d.key && e.fingerprint === d.fingerprint)) {
    ledger.entries = ledger.entries.filter(e => e.key !== d.key);
    ledger.entries.push({ key: d.key, fingerprint: d.fingerprint, ruleId: d.ruleId, source: d.source, firstSeenAt: now, status: 'shown', at: now }); changed = true;
  }
  for(const d of selected.filter(i=>i.educational)){const entry=ledger.entries.find(e=>e.key===d.key&&e.fingerprint===d.fingerprint);if(entry.rotationDay!==rotationDay){entry.rotationDay=rotationDay;changed=true;}}
  ledger.entries = ledger.entries.slice(-160);
  return { version: RELEASE_VERSION, items: selected, waiting: waiting.length, memory: ledger, changed, blocked, candidates: eligible };
}
export function recordInsightFeedback(memory, insight, status, now = Date.now()) {
  if (!['useful', 'dismissed', 'snoozed'].includes(status) || !insight?.key || insight.urgentIntegrity) return memory;
  const entry = memory.entries.find(e => e.key === insight.key && e.fingerprint === insight.fingerprint);
  if (!entry) return memory;
  return { ...memory, entries: memory.entries.map(e => e === entry ? { ...e, status, at: now, until: status === 'snoozed' ? now + DAY : 0 } : e) };
}
