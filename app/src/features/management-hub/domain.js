// Gestão única: três cards e 13 funções. Este módulo só apresenta projeções dos registros: não grava nada,
// não tem outro livro de vendas e o demonstrativo continua em features/finance/finance.js. Todas as funções
// são puras e aceitam base vazia (dados zerados) ou fictícia: sem base, devolvem null, nunca 0% inventado.
import {recordDay,recordClock} from '../record-date.js';
import { principal, balance } from '../receivables/receivables.js';

export const HUB_GROUPS = Object.freeze([
  ['Operação', [['vendas', 'Vendas'], ['resultado', 'Resultado'], ['caixa', 'Caixa'], ['custos', 'Custos']]],
  ['Análise', [['produtos', 'Produtos'], ['estoque', 'Estoque'], ['clientes', 'Clientes'], ['fornecedores', 'Fornecedores'], ['indicadores', 'Indicadores'], ['comparacao', 'Comparação']]],
  ['Decisão', [['orientacoes', 'Orientações'], ['simulacoes', 'Simulações'], ['arquivos', 'Arquivos']]],
]);
export const HUB_KEYS = Object.freeze(HUB_GROUPS.flatMap(([, items]) => items.map(([key]) => key)));
// Caminhos antigos continuam funcionando e apontam para quem responde hoje pelo assunto.
export const LEGACY_TOPIC = Object.freeze({ financas: 'resultado', pagamentos: 'caixa', onde: 'resultado', horarios: 'ranking', relatorios: 'arquivos', marca: null, banca: null, conferencia: null });

const list = value => (Array.isArray(value) ? value : []);
const cents = value => (Number.isFinite(value) ? value : 0);

// A mesma base vale para o ticket e para toda contagem que diz usar o ticket.
export const eligibleSales = sales => list(sales).filter(s => s?.status === 'completed');
export function ticketOf(sales) {
  const rows = eligibleSales(sales);
  return rows.length ? rows.reduce((n, s) => n + cents(s.total), 0) / rows.length : null;
}
export function linesPerSale(sales) {
  const rows = eligibleSales(sales);
  return rows.length ? rows.reduce((n, s) => n + list(s.items).length, 0) / rows.length : null;
}

// Venda no dia da ocorrência; estorno no dia da devolução. A soma é a receita do período.
export function dailyRevenue(sales, returns, dayOf=(_at,s)=>recordDay(s)) {
  const days = new Map();
  const add = (day, amount) => { if (day) days.set(day, (days.get(day) || 0) + amount); };
  for (const s of list(sales)) add(dayOf(s.date,s), cents(s.total));
  for (const s of list(returns)) add(dayOf(s.returnedAt || s.date,{...s,date:s.returnedAt||s.date,occurrenceConfirmed:false}), -cents(s.total));
  return [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({ date, amount }));
}

export function hourlyPurchases(sales, clockOf=(_at,s)=>recordClock(s)) {
  const hours = new Map();
  let unknown = 0;
  for (const s of eligibleSales(sales)) {
    const hour = String(clockOf(s.date,s) || '').slice(0, 2);
    if (/^(?:[01]\d|2[0-3])$/.test(hour)) hours.set(hour, (hours.get(hour) || 0) + 1); else unknown++;
  }
  return { rows: [...hours].sort(([a], [b]) => a.localeCompare(b)).map(([hour, count]) => ({ hour, count })), unknown };
}

export function salesEmptyMessage(filter, total) {
  if (total > 0 && filter === 'returned') return 'Nenhuma das vendas deste período está marcada como devolvida.';
  if (total > 0 && filter === 'completed') return 'Nenhuma venda deste período está marcada como concluída.';
  return 'Nenhuma venda registrada no período selecionado.';
}

// Pessoas por identificador estável: nomes iguais não fundem clientes.
export function clientStats(sales) {
  const rows = eligibleSales(sales), byClient = new Map();
  let identified = 0;
  for (const s of rows) if (s.customerId) { identified++; byClient.set(s.customerId, (byClient.get(s.customerId) || 0) + 1); }
  return {
    sales: rows.length, identified, anonymous: rows.length - identified, clients: byClient.size,
    repeat: [...byClient.values()].filter(n => n >= 2).length,
    frequency: byClient.size ? identified / byClient.size : null,
    ids: [...byClient.keys()],
  };
}

// Fiado aberto é uma fotografia de agora, independente do período escolhido no topo.
export function receivablesNow(sales, today, { horizonDays = 30, addDays } = {}) {
  const limit = addDays ? addDays(today, horizonDays) : '';
  const out = { open: 0, count: 0, overdue: 0, overdueCount: 0, dueSoon: 0, later: 0, undated: 0 };
  for (const s of list(sales)) {
    const left = principal(s) > 0 ? balance(s) : 0;
    if (left <= 0) continue;
    out.open += left; out.count++;
    const due = s.credit?.dueDate || '';
    if (!due) out.undated += left;
    else if (due < today) { out.overdue += left; out.overdueCount++; }
    else if (limit && due <= limit) out.dueSoon += left;
    else out.later += left;
  }
  return out;
}

// Compras a pagar: fotografia de agora. Sem situação informada não vira dívida; desconsiderada não conta.
export function payablesNow(purchases, today, { horizonDays = 30, addDays } = {}) {
  const limit = addDays ? addDays(today, horizonDays) : '';
  const out = { open: 0, count: 0, overdue: 0, overdueCount: 0, dueSoon: 0, later: 0, unknown: 0 };
  for (const p of list(purchases)) {
    if (!p || p.voidedAt) continue;
    if (!p.settlement) { out.unknown++; continue; }
    if (p.settlement.status !== 'open') continue;
    const amount = cents(p.total);
    out.open += amount; out.count++;
    if (p.settlement.dueDate < today) { out.overdue += amount; out.overdueCount++; }
    else if (limit && p.settlement.dueDate <= limit) out.dueSoon += amount;
    else out.later += amount;
  }
  return out;
}

// Previsão dos próximos 30 dias: só o que já está registrado ou configurado. Sem saldo inicial, é variação.
export function cashOutlook({ dueSoon = 0, payableSoon = 0, fixedMonthly = 0, drawMonthly = 0 } = {}) {
  const out = cents(fixedMonthly) + cents(drawMonthly) + cents(payableSoon);
  return { entering: cents(dueSoon), payable: cents(payableSoon), leaving: out, net: cents(dueSoon) - out, known: cents(dueSoon) > 0 || out > 0 };
}

const pad = n => String(n).padStart(2, '0');
const lastDay = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();
function range(start, end, addDays) {
  const out = [];
  for (let day = start; day <= end && out.length < 367; day = addDays(day, 1)) out.push(day);
  return out;
}

// Período em aberto só se compara com o mesmo pedaço do período anterior. Um mês com 2 dias contra um mês
// inteiro daria uma queda falsa. Período encerrado devolve open:false e usa a comparação inteira.
export function comparableDays({ mode, anchor, today, addDays }) {
  if (mode === 'dia') return anchor === today ? { open: true, current: [today], previous: [addDays(today, -1)] } : { open: false };
  if (mode === 'semana') {
    const back = (new Date(anchor + 'T12:00:00Z').getUTCDay() + 6) % 7, start = addDays(anchor, -back), end = addDays(start, 6);
    if (today < start || today > end) return { open: false };
    if (today === end) return { open: false };
    const current = range(start, today, addDays);
    return { open: true, current, previous: current.map(day => addDays(day, -7)) };
  }
  if (mode === 'mes') {
    if (anchor.slice(0, 7) !== today.slice(0, 7)) return { open: false };
    const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7)), day = Number(today.slice(8));
    if (day === lastDay(year, month)) return { open: false };
    const py = month === 1 ? year - 1 : year, pm = month === 1 ? 12 : month - 1, prefix = py + '-' + pad(pm) + '-';
    const previous = [];
    for (let d = 1; d <= Math.min(day, lastDay(py, pm)); d++) previous.push(prefix + pad(d));
    return { open: true, current: range(today.slice(0, 8) + '01', today, addDays), previous };
  }
  if (mode === 'ano') {
    if (anchor.slice(0, 4) !== today.slice(0, 4) || today.slice(5) === '12-31') return { open: false };
    const year = Number(today.slice(0, 4)), current = range(year + '-01-01', today, addDays);
    return { open: true, current, previous: current.map(day => (year - 1) + day.slice(4)).filter(day => day !== (year - 1) + '-02-29' || lastDay(year - 1, 2) === 29) };
  }
  return { open: false };
}

// Indicadores: sem denominador válido o valor é null e a tela explica; nunca "0%".
export function hubIndicators({ st, sales, margins }) {
  const rows = list(margins), complete = rows.length > 0 && rows.every(m => m.costKnown), revenue = cents(st?.revenue);
  const rate = (value, why) => ({ value: revenue > 0 && complete ? value / revenue * 100 : null, why: revenue <= 0 ? 'Não há receita neste período para calcular esta proporção.' : complete ? '' : why });
  const missing = 'Há custos históricos ausentes. Confira as vendas.', ticket = ticketOf(sales), lines = linesPerSale(sales);
  const noSales = 'Não há compras concluídas e não devolvidas neste período.';
  const breakEven = Number.isFinite(st?.breakEven) && st.breakEven > 0 && complete ? st.breakEven : null;
  return [
    { id: 'gross-margin', title: 'Margem bruta', unit: 'percent', ...rate(revenue - cents(st?.cmv), missing), meaning: 'Quanto da receita sobra depois do custo dos produtos, antes de taxas e despesas.', formula: 'Lucro bruto ÷ receita após devoluções, com custos históricos completos.' },
    { id: 'ticket', title: 'Ticket médio', unit: 'money', value: ticket, why: ticket === null ? noSales : '', meaning: 'Média das compras concluídas e não devolvidas. Devoluções continuam no Resultado, sem alterar esta base.', formula: 'Valor das compras concluídas e não devolvidas ÷ quantidade dessas compras.' },
    { id: 'contribution-rate', title: 'Margem de contribuição (%)', unit: 'percent', ...rate(cents(st?.contribution), missing), meaning: 'Quanto de cada real vendido sobra para pagar os outros custos.', formula: 'Contribuição total ÷ receita após devoluções, sem fazer média das margens dos produtos.' },
    { id: 'operating-margin', title: 'Margem operacional', unit: 'percent', ...rate(cents(st?.result), missing), meaning: 'Quanto da receita sobra depois de todos os custos do demonstrativo.', formula: 'Resultado gerencial ÷ receita após devoluções.' },
    { id: 'break-even', title: 'Ponto de equilíbrio mensal', unit: 'money', value: breakEven, why: breakEven !== null ? '' : !complete && rows.length ? missing : cents(st?.monthlyFixed) <= 0 ? 'Informe os custos fixos e a retirada mensal, se houver.' : 'A margem de contribuição precisa ser positiva para estimar o equilíbrio.', meaning: 'Receita mensal estimada para pagar os fixos e a retirada, com o mix observado. Não é o total vendido no período.', formula: 'Custos fixos do mês, com a retirada prevista quando ligada ÷ margem de contribuição em %.' },
    { id: 'lines-per-sale', title: 'Linhas por venda', unit: 'number', value: lines, why: lines === null ? noSales : '', meaning: 'Permite ler cestas com unidades diferentes sem somar quilos com pacotes ou dúzias.', formula: 'Linhas de produtos das compras concluídas ÷ quantidade dessas compras.' },
  ];
}

export function breakEvenGap(breakEven, revenue, ticket) {
  if (!Number.isFinite(breakEven) || breakEven <= 0) return null;
  const shortfall = Math.max(0, breakEven - cents(revenue));
  return { shortfall, purchases: Number.isFinite(ticket) && ticket > 0 ? Math.ceil(shortfall / ticket) : null };
}

// Retorno de um investimento: a pessoa diz quanto do resultado veio dele. Nada é presumido.
export function investmentReturn({ amount, result, percent }) {
  if (!(amount > 0)) return { error: 'Escolha um investimento registrado.' };
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return { error: 'Informe de 1% a 100%: quanto do resultado se deve a este investimento.' };
  const gain = Math.round(cents(result) * percent / 100);
  if (gain <= 0) return { gain, roi: (gain - amount) / amount, periods: null, error: '' };
  return { gain, roi: (gain - amount) / amount, periods: amount / gain, error: '' };
}

const plain = text => String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
// Pergunta sobre dinheiro do negócio. Venda ditada e pergunta sobre um produto seguem os caminhos próprios.
export function financeIntent(text, products = []) {
  const q = plain(text);
  if (!q.trim() || /^(eu )?(vendi|vende|vender|venda)\b/.test(q) || /\b(vendi|vende)\b.*\d/.test(q)) return '';
  if (/fiado|a receber|para receber|pra receber|devendo|inadimpl/.test(q)) return 'receivable';
  if (/a pagar|para pagar|pra pagar|\bdevo\b|boleto/.test(q)) return 'payable';
  if (/\bcaixa\b/.test(q)) return 'cash';
  if (/ponto de equilibrio|empatar/.test(q)) return 'break-even';
  if (/ticket|compra media/.test(q)) return 'ticket';
  const aboutProduct = list(products).some(p => [p.baseName, p.name, p.category].some(name => { const n = plain(name); return n.length > 2 && q.includes(n); }));
  if (aboutProduct) return '';
  if (/margem/.test(q)) return 'margin';
  if (/resultado|\blucro\b|prejuizo/.test(q)) return 'result';
  if (/receita(?!s)(?! de\b| culin)|faturamento|faturei|faturou/.test(q)) return 'revenue';
  if (/\bcustos?\b|despesas?|\bgastos?\b|gastei/.test(q)) return 'costs';
  return '';
}
