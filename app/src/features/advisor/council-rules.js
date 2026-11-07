// Conselho de Gestão: lentes de método sobre o motor único de Orientação (diretriz em data/management-council-guidelines.js).
// Os agentes interpretam; os motores calculam; a Auditoria confere; o produtor decide. Nada aqui grava ou executa.
import { MANAGEMENT_COUNCIL as COUNCIL } from '../../data/management-council-guidelines.js';

const P = COUNCIL.parameters;
const brl = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
const median = list => { const s = [...list].sort((a, b) => a - b), n = s.length; return !n ? null : n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const dayNumber = day => Date.parse(day + 'T12:00:00Z') / 86400000;

// Qual agente responde por uma regra já existente. Só etiqueta: cálculo e texto validados não mudam.
const LENS = [[/^(fin-meta|test-pending|trend|ticket|fin-feira|fin-custos)/, 'rotina'], [/^(abaixo-custo|preco-90|papel-produto|campeao-margem|encalhe|esgotou|repor|acaba-logo|previsao-feira|stock-low|dependencia|melhor)/, 'ganho'], [/^(rebuy|retorno|fieis|identificar|qr)/, 'cliente'], [/^(fin-retirada|fin-equilibrio|fin-taxas)/, 'caixa']];
export function lensOf(id) {
  const prefix = String(id).split(':')[0];
  if (COUNCIL.agents.some(a => a.id === prefix)) return prefix;
  return LENS.find(([re]) => re.test(id))?.[1] || null;
}
export const lensMethod = lens => COUNCIL.agents.find(a => a.id === lens)?.method || '';
export const lensName = lens => COUNCIL.agents.find(a => a.id === lens)?.name || '';

// Ganho por unidade do recurso que limita (Goldratt). Só com recurso informado; custo ausente não vira zero.
export function throughputPerConstraint(products, capacity) {
  const valid = (products || []).filter(p => Number.isFinite(p.gain) && p.use > 0 && p.demand >= 0);
  if (!(capacity > 0) || !valid.length || valid.length !== (products || []).length) return null;
  const plan = order => { let left = capacity, total = 0; const lines = []; for (const p of order) { const qty = Math.min(p.demand, Math.floor(left / p.use)); left -= qty * p.use; total += qty * p.gain; lines.push({ name: p.name, qty }); } return { total, lines }; };
  const byUnit = plan([...valid].sort((a, b) => b.gain - a.gain)), byConstraint = plan([...valid].sort((a, b) => b.gain / b.use - a.gain / a.use));
  return { byUnit, byConstraint, difference: byConstraint.total - byUnit.total };
}

// Concentração da receita nos maiores clientes identificados, contando pessoas pelo identificador.
export function clientConcentration(sales) {
  const by = new Map();
  for (const s of sales || []) if (s.status === 'completed' && s.customerId) by.set(s.customerId, (by.get(s.customerId) || 0) + s.total);
  const rows = [...by.values()].sort((a, b) => b - a), total = rows.reduce((n, v) => n + v, 0);
  if (rows.length < P.concentrationMinimumClients || total <= 0) return { clients: rows.length, share: null, concentrated: false };
  const share = rows.slice(0, P.concentrationTop).reduce((n, v) => n + v, 0) / total;
  return { clients: rows.length, share, concentrated: share >= P.concentrationShare };
}

// Leitura do histórico (RFM), com limites pela mediana do próprio produtor. Nunca projeta valor futuro.
export function rfmSegments(sales, today, dayOf) {
  const by = new Map();
  for (const s of sales || []) { if (s.status !== 'completed' || !s.customerId) continue; const knownDay=dayOf(s.date,s);if(!/^\d{4}-\d{2}-\d{2}$/.test(knownDay||'')||knownDay>today)continue; const row = by.get(s.customerId) || { id: s.customerId, days: new Set(), value: 0 }; row.days.add(knownDay); row.value += s.total; by.set(s.customerId, row); }
  const rows = [...by.values()].map(r => { const days = [...r.days].sort(), gaps = days.slice(1).map((d, i) => dayNumber(d) - dayNumber(days[i])); return { id: r.id, value: r.value, frequency: days.length, recency: dayNumber(today) - dayNumber(days.at(-1)), gap: median(gaps) }; });
  const repeat = rows.filter(r => r.frequency >= P.rfmMinimumBuyingDays), out = { clients: rows.length, available: repeat.length >= P.rfmMinimumClients, champions: 0, fading: 0, fresh: 0, dormant: 0 };
  out.fresh = rows.filter(r => r.frequency === 1 && r.recency <= P.newClientDays).length;
  out.dormant = rows.filter(r => r.recency > P.dormantDays).length;
  if (!out.available) return out;
  const midR = median(rows.map(r => r.recency)), midF = median(rows.map(r => r.frequency)), midV = median(rows.map(r => r.value));
  out.champions = rows.filter(r => r.recency <= midR && r.frequency >= midF && r.value >= midV).length;
  out.fading = rows.filter(r => r.value >= midV && r.gap !== null && r.recency > P.fadingRecencyMultiplier * r.gap && r.recency <= P.dormantDays).length;
  return out;
}

// Regras novas do Conselho dentro do motor único. Sem dados do Conselho, não dizem nada.
const advice = (id, level, lens, fields) => ({ id, level, impact: fields.impact || 0, steps: [], topics: [], numbers: [], ...fields, decision: { rule_id: id, rule_version: 1, lens, lens_method: lensMethod(lens), module: lens === 'compra' ? 'fornecedores' : 'finance', owner: 'produtor', requires_user_action: true } });
function caixaFiado({ council: c }) {
  if (!c?.receivable || !(c.revenue > 0) || c.receivable.overdue / c.revenue < P.receivableOverdueShare) return [];
  return [advice('caixa:fiado', 'atencao', 'caixa', { title: 'Fiado vencido pesa no caixa', happened: `Há ${brl(c.receivable.overdue)} de Fiado vencido, frente a uma receita de ${brl(c.revenue)} no período.`, todo: 'Combine o recebimento com quem está em atraso, respeitando cada cliente.', why: 'Venda no Fiado só vira dinheiro quando é recebida.', impact: c.receivable.overdue })];
}
function ganhoParado({ council: c }) {
  if (!(c?.stillValue > 0)) return [];
  return [advice('ganho:dinheiro-parado', 'oportunidade', 'ganho', { title: 'Dinheiro parado no estoque', happened: `Produtos sem venda em ${30} dias prendem ${brl(c.stillValue)} ao custo.`, todo: 'Pense em promoção ou kit antes de comprar mais desses produtos.', why: 'Estoque parado é dinheiro que não trabalha para o negócio.', impact: c.stillValue / 10 })];
}
function clienteConcentracao({ council: c }) {
  if (!c?.concentration?.concentrated) return [];
  return [advice('cliente:concentracao', 'atencao', 'cliente', { title: 'Receita concentrada em poucos clientes', happened: `Os ${P.concentrationTop} maiores clientes somam ${Math.round(c.concentration.share * 100)}% da receita identificada.`, todo: 'Cuide desses clientes e procure ampliar a base, com autorização para contato.', why: 'Perder um deles pesa muito no resultado.', impact: 1 })];
}
function compraUnico({ council: c }) {
  const list = c?.matrix?.available ? c.matrix.rows.filter(r => ['estrategico', 'gargalo'].includes(r.quadrant) && r.suppliers === 1) : [];
  if (!list.length) return [];
  return [advice('compra:fornecedor-unico', 'atencao', 'compra', { title: 'Compra importante com um só fornecedor', happened: `${list[0].name} depende de um único fornecedor registrado.`, todo: 'Cadastre uma alternativa antes de precisar dela.', why: 'Um item assim pode parar a produção se faltar.', impact: 1 })];
}
export const COUNCIL_RULES = [caixaFiado, ganhoParado, clienteConcentracao, compraUnico];
