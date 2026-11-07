import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { statement, productMargins, monthShares } from '../src/features/finance/finance.js';
import { payablesNow, financeIntent, HUB_GROUPS, HUB_KEYS, LEGACY_TOPIC, eligibleSales, ticketOf, linesPerSale, dailyRevenue, hourlyPurchases, salesEmptyMessage, clientStats, receivablesNow, cashOutlook, comparableDays, hubIndicators, breakEvenGap, investmentReturn } from '../src/features/management-hub/domain.js';

const dayOf = at => String(at).slice(0, 10);
const addDays = (day, n) => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const P = { A: [2500, 1500], B: [4500, 2700], C: [6500, 3900] };
const item = (id, qty) => ({ productId: id, name: id, qty, total: P[id][0] * qty, costTotal: P[id][1] * qty, cost: P[id][1], costKnown: true });
let n = 0;
const sale = (date, its, payments, extra = {}) => { const items = its.map(([id, q]) => item(id, q)), subtotal = items.reduce((v, i) => v + i.total, 0), discount = extra.discount || 0; return { id: 's' + (++n), date, scope: extra.scope || 'loja', status: extra.returnedAt ? 'returned' : 'completed', items, subtotal, discount, total: subtotal - discount, cost: items.reduce((v, i) => v + i.costTotal, 0), payments, ...extra }; };
const pay = (method, amount) => ({ method, amount });

// Cenário da diretriz (lançamentos de outubro/novembro), com o gabarito publicado nela.
const all = [
  sale('2026-10-10T10:00', [['A', 2]], [pay('Dinheiro', 5000)]),
  sale('2026-10-10T11:00', [['B', 1], ['C', 1]], [pay('Crédito', 10700)], { discount: 300 }),
  sale('2026-10-15T09:30', [['A', 1], ['B', 1]], [pay('Fiado', 7000)], { customerId: 'c1', credit: { dueDate: '2026-10-30', receipts: [{ id: 'r', amount: 7000, method: 'Débito', date: '2026-10-20T12:00' }] } }),
  sale('2026-10-18T14:00', [['C', 2]], [pay('Pix', 13000)], { returnedAt: '2026-11-01T10:00' }),
  sale('2026-10-25T16:00', [['A', 1], ['C', 1]], [pay('Dinheiro', 1000), pay('Crédito', 8000)], { returnedAt: '2026-10-26T10:00' }),
  sale('2026-10-31T10:00', [['A', 3]], [pay('Pix', 7500)], { scope: 'festa' }),
  sale('2026-10-31T15:00', [['B', 2], ['C', 1]], [pay('Crédito', 15500)], { scope: 'festa' }),
  sale('2026-11-02T10:00', [['C', 1]], [pay('Débito', 6500)]),
  sale('2026-11-02T11:00', [['B', 1]], [pay('Fiado', 4500)], { customerId: 'c1', credit: { dueDate: '2026-11-10', receipts: [] } }),
  sale('2026-11-01T11:00', [['A', 2], ['B', 1]], [pay('Dinheiro', 9500)], { scope: 'festa' }),
];
const oct = r => String(r).startsWith('2026-10');
const sales = all.filter(s => oct(s.date)), returns = all.filter(s => s.returnedAt && oct(s.returnedAt));
const expenses = [['feira', 4000, 'festa'], ['feira', 4500, 'festa'], ['feira', 2000, 'loja'], ['producao', 4500, 'loja'], ['marketing', 1500, 'loja'], ['retirada', 25000, 'loja'], ['investimento', 50000, 'loja']].map(([kind, amount, scope]) => ({ kind, amount, scope, date: '2026-10-20' }));
const settings = { cardFees: { Débito: 1.99, Crédito: 4.98 }, fixedCosts: [{ title: 'Energia', amount: 9000, since: '2026-10' }], drawOn: true, drawMonthly: 30000, drawSince: '2026-10' };
const receipts = [{ amount: 7000, method: 'Débito', date: '2026-10-20T12:00' }];
const st = statement({ sales, returns, expenses, receipts, losses: 7800, settings, shares: monthShares({ month: '2026-10' }), general: true });

test('gabarito da diretriz: outubro em Todos os locais', () => {
  assert.equal(st.revenue, 58700); assert.equal(st.cmv, 35400); assert.equal(st.fees, 1842); assert.equal(st.contribution, 21458);
  assert.equal(st.operating, 16500); assert.equal(st.losses, 7800); assert.equal(st.fixed, 9000); assert.equal(st.draw, 25000); assert.equal(st.result, -36842);
  assert.equal(st.cash, -34642); assert.equal(st.cashForecast, 9000); assert.equal(st.cashAfterForecast, -43642);
  assert.equal(ticketOf(sales), 9140); assert.equal(linesPerSale(sales), 1.6);
  assert.equal(st.breakEven, 106687);
  assert.deepEqual(breakEvenGap(st.breakEven, st.revenue, ticketOf(sales)), { shortfall: 47987, purchases: 6 });
});
test('receita por dia reconcilia com o mês; devolução no dia do estorno', () => {
  const days = dailyRevenue(sales, returns, dayOf);
  assert.deepEqual(days, [['2026-10-10', 15700], ['2026-10-15', 7000], ['2026-10-18', 13000], ['2026-10-25', 9000], ['2026-10-26', -9000], ['2026-10-31', 23000]].map(([date, amount]) => ({ date, amount })));
  assert.equal(days.reduce((v, d) => v + d.amount, 0), st.revenue);
});
test('Loja: resultado sem a retirada geral, e a soma dos locais reconcilia', () => {
  const loja = statement({ sales: sales.filter(s => s.scope === 'loja'), returns, expenses: expenses.filter(x => x.scope === 'loja'), receipts, settings, shares: monthShares({ month: '2026-10' }), general: false });
  assert.equal(loja.result, 5030); assert.equal(loja.draw, 0); assert.equal(loja.cashForecast, 0);
  const festa = statement({ sales: sales.filter(s => s.scope === 'festa'), expenses: expenses.filter(x => x.scope === 'festa'), receipts: [], settings, shares: monthShares({ month: '2026-10' }), general: false });
  assert.equal(festa.result, -72);
  assert.equal(loja.result + festa.result - st.losses - st.fixed - st.draw, st.result);
});
test('retirada prevista não vale antes do início', () => {
  const sept = statement({ sales: [], expenses: [], settings, shares: monthShares({ month: '2026-09' }), general: true });
  assert.equal(sept.draw, 0); assert.equal(sept.fixed, 0); assert.equal(sept.result, 0);
  const noStart = statement({ sales: [], expenses: [], settings: { ...settings, drawSince: undefined }, shares: monthShares({ month: '2026-09' }), general: true });
  assert.equal(noStart.draw, 30000);
});
test('comparação: período aberto usa o mesmo pedaço; encerrado usa o inteiro', () => {
  const nov = comparableDays({ mode: 'mes', anchor: '2026-11-15', today: '2026-11-02', addDays });
  assert.equal(nov.open, true); assert.deepEqual(nov.current, ['2026-11-01', '2026-11-02']); assert.deepEqual(nov.previous, ['2026-10-01', '2026-10-02']);
  assert.equal(comparableDays({ mode: 'mes', anchor: '2026-10-15', today: '2026-11-02', addDays }).open, false);
  assert.deepEqual(comparableDays({ mode: 'mes', anchor: '2026-03-15', today: '2026-03-31', addDays }), { open: false });
  const march = comparableDays({ mode: 'mes', anchor: '2026-03-30', today: '2026-03-30', addDays });
  assert.equal(march.previous.at(-1), '2026-02-28');
  const week = comparableDays({ mode: 'semana', anchor: '2026-11-04', today: '2026-11-04', addDays });
  assert.deepEqual(week.current, ['2026-11-02', '2026-11-03', '2026-11-04']); assert.equal(week.previous[0], '2026-10-26');
  const year = comparableDays({ mode: 'ano', anchor: '2026-06-01', today: '2026-03-01', addDays });
  assert.equal(year.previous[0], '2025-01-01'); assert.equal(year.previous.at(-1), '2025-03-01');
  assert.equal(comparableDays({ mode: 'dia', anchor: '2026-11-01', today: '2026-11-02', addDays }).open, false);
});
test('a receber: Fiado aberto, vencido e devolvido; nada de venda recebida', () => {
  const r = receivablesNow(all, '2026-11-02', { addDays });
  assert.equal(r.open, 4500); assert.equal(r.count, 1); assert.equal(r.dueSoon, 4500); assert.equal(r.overdue, 0);
  assert.equal(receivablesNow(all, '2026-11-20', { addDays }).overdue, 4500);
  assert.equal(cashOutlook({ dueSoon: 4500, fixedMonthly: 9000, drawMonthly: 30000 }).net, -34500);
});
test('clientes por identificador; vazio não inventa frequência', () => {
  const c = clientStats(sales);
  assert.equal(c.identified, 1); assert.equal(c.anonymous, 4); assert.equal(c.repeat, 0);
  const twin = clientStats([{ status: 'completed', customerId: 'x' }, { status: 'completed', customerId: 'y' }, { status: 'completed', customerId: 'x' }]);
  assert.equal(twin.clients, 2); assert.equal(twin.repeat, 1); assert.equal(twin.frequency, 1.5);
});
test('base zerada: nada inventado, nada quebra', () => {
  const empty = statement({ sales: [], expenses: [], settings: {}, shares: monthShares({ month: '2026-11' }), general: true });
  assert.equal(empty.result, 0); assert.equal(empty.checks, true);
  assert.equal(ticketOf([]), null); assert.equal(linesPerSale(undefined), null); assert.deepEqual(eligibleSales(null), []);
  assert.deepEqual(dailyRevenue([], [], dayOf), []); assert.deepEqual(hourlyPurchases([], dayOf), { rows: [], unknown: 0 });
  assert.equal(clientStats([]).frequency, null); assert.equal(receivablesNow([], '2026-11-02', { addDays }).open, 0);
  assert.equal(cashOutlook({}).known, false); assert.equal(breakEvenGap(null, 0, null), null);
  const rows = hubIndicators({ st: empty, sales: [], margins: [] });
  for (const k of rows) { assert.equal(k.value, null, k.id); assert.ok(k.why.length > 5, k.id); }
  assert.equal(salesEmptyMessage('all', 0), 'Nenhuma venda registrada no período selecionado.');
});
test('devolvidas vazio descreve o filtro certo', () => {
  assert.equal(salesEmptyMessage('returned', 3), 'Nenhuma das vendas deste período está marcada como devolvida.');
});
test('custo desconhecido torna as margens indisponíveis, nunca 100%', () => {
  const blind = [{ id: 'a', revenue: 5000, qty: 1, costKnown: false }];
  const rows = hubIndicators({ st: { revenue: 5000, cmv: 0, contribution: 5000, result: 5000, breakEven: 900, monthlyFixed: 900 }, sales: [{ status: 'completed', total: 5000, items: [{}] }], margins: blind });
  for (const id of ['gross-margin', 'contribution-rate', 'operating-margin', 'break-even']) assert.equal(rows.find(k => k.id === id).value, null, id);
  assert.equal(rows.find(k => k.id === 'ticket').value, 5000);
  assert.equal(productMargins([], []).length, 0);
});
test('retorno de investimento exige a parte informada e ganho positivo', () => {
  assert.ok(investmentReturn({ amount: 50000, result: 10000 }).error);
  assert.ok(investmentReturn({ amount: 0, result: 10000, percent: 10 }).error);
  const good = investmentReturn({ amount: 50000, result: 10000, percent: 50 });
  assert.equal(good.gain, 5000); assert.equal(good.roi, -.9); assert.equal(good.periods, 10);
  assert.equal(investmentReturn({ amount: 50000, result: -10000, percent: 50 }).periods, null);
});
test('três cards, 13 funções, uma vez cada, na ordem da diretriz', () => {
  assert.deepEqual(HUB_GROUPS.map(g => g[0]), ['Operação', 'Análise', 'Decisão']);
  assert.deepEqual(HUB_KEYS, ['vendas', 'resultado', 'caixa', 'custos', 'produtos', 'estoque', 'clientes', 'fornecedores', 'indicadores', 'comparacao', 'orientacoes', 'simulacoes', 'arquivos']);
  assert.equal(new Set(HUB_KEYS).size, 13);
  for (const target of Object.values(LEGACY_TOPIC)) assert.ok(target === null || target === 'ranking' || HUB_KEYS.includes(target));
});
test('a tela não refaz cálculo nem esconde recursos antigos', () => {
  const ui = fs.readFileSync(new URL('../src/legacy/erp-ui.js', import.meta.url), 'utf8'), block = ui.slice(ui.indexOf('Gestão única: três cards'));
  for (const kept of ['auditBadge()', 'data-result-places', 'export-fair', "'brain'", 'advisor-tests', 'Vendas em ordem de horário', 'Receita por dia', 'Horários', 'productPeriodCard()']) assert.ok(block.includes(kept), kept);
  assert.ok(!/model\.data\.(sales|expenses|movements|products)\.(push|unshift|splice)/.test(block), 'consultar não grava registros');
});
test('regra das janelas: cards que expandem, olho próprio e Voltar', () => {
  const ui = fs.readFileSync(new URL('../src/legacy/erp-ui.js', import.meta.url), 'utf8'), block = ui.slice(ui.indexOf('Gestão única: três cards'));
  assert.ok(!block.includes('mghSelect'), 'sem seletor que troca o conteúdo');
  assert.ok(block.includes("btn('mgh-eye'"), 'olho na janela');
  assert.ok(!/actions\['mg-detail'\]=[^\n]*mg-privacy-note/.test(block), 'sem caixa de Mostrar Valores');
  assert.ok(ui.includes('const FINANCIAL_PEEK_MS=60000;'), 'olho fecha em 1 minuto sem uso');
  assert.ok(block.includes("dialog.addEventListener('close'"), 'olho fecha com a janela');
  assert.ok(ui.includes("(!footer&&!WINDOW_OWN_CONTROLS.has(kind))"), 'janela sem rodapé ganha Voltar');
});
test('as regras de qualidade ficam gravadas no sistema', async () => {
  const { INTERFACE_GUIDELINES } = await import('../src/data/interface-guidelines.js');
  for (const part of ['desconfigurado', 'Voltar', 'olho', '1 minuto', 'precisos']) assert.ok(INTERFACE_GUIDELINES.windowQuality.includes(part), part);
  assert.ok(fs.readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8').includes('Qualidade de toda janela'));
  assert.ok(fs.readFileSync(new URL('../public/knowledge/premissas-interface.md', import.meta.url), 'utf8').includes('Qualidade de Toda Janela'));
});
test('motor: pergunta de dinheiro vai ao demonstrativo; venda e receita culinária não', () => {
  const products = [{ baseName: 'Café', name: 'Café Especial', category: 'Cafés' }];
  const cases = { 'tem fiado em aberto?': 'receivable', 'qual o caixa?': 'cash', 'qual foi o resultado do mês?': 'result', 'qual foi a receita deste período?': 'revenue', 'qual o ticket médio?': 'ticket', 'qual a margem?': 'margin', 'quanto falta para empatar?': 'break-even', 'quanto gastei?': 'costs', 'qual o lucro da Festa de Teste?': 'result' };
  for (const [q, want] of Object.entries(cases)) { assert.equal(financeIntent(q, products), want, q); assert.equal(financeIntent(q, []), want, q + ' sem produtos'); }
  for (const q of ['vendi 2 no fiado', 'venda de café', 'receitas de bolo', 'receita de bolo','qual a margem do café?', 'o que mais vendeu?', '']) assert.equal(financeIntent(q, products), '', q);
});
test('contas a pagar: aberta, vencida, paga, desconsiderada e sem informação', () => {
  const rows = [{ total: 1000, settlement: { status: 'open', dueDate: '2026-11-01' } }, { total: 2000, settlement: { status: 'open', dueDate: '2026-11-20' } }, { total: 4000, settlement: { status: 'open', dueDate: '2027-01-20' } }, { total: 8000, settlement: { status: 'paid', paidOn: '2026-11-01' } }, { total: 16000, voidedAt: 'x', settlement: { status: 'open', dueDate: '2026-11-01' } }, { total: 32000 }];
  assert.deepEqual(payablesNow(rows, '2026-11-05', { addDays }), { open: 7000, count: 3, overdue: 1000, overdueCount: 1, dueSoon: 2000, later: 4000, unknown: 1 });
  assert.deepEqual(payablesNow(undefined, '2026-11-05', { addDays }), { open: 0, count: 0, overdue: 0, overdueCount: 0, dueSoon: 0, later: 0, unknown: 0 });
  const o = cashOutlook({ dueSoon: 4500, payableSoon: 3000, fixedMonthly: 9000, drawMonthly: 30000 });
  assert.equal(o.net, 4500 - 42000); assert.equal(o.payable, 3000);
  for (const q of ['o que tenho a pagar?', 'quanto devo?', 'tem boleto vencendo?']) assert.equal(financeIntent(q, []), 'payable', q);
});
test('compra paga sai do caixa e não do resultado; só em Todos os locais', () => {
  const base = { sales, returns, expenses, receipts, losses: 7800, settings, shares: monthShares({ month: '2026-10' }) };
  const paid = statement({ ...base, general: true, purchasesPaid: 12345 });
  assert.equal(paid.result, st.result); assert.equal(paid.cash, st.cash - 12345); assert.equal(paid.purchasesPaid, 12345);
  assert.equal(statement({ ...base, general: false, purchasesPaid: 12345 }).purchasesPaid, 0);
  assert.equal(st.purchasesPaid, 0);
});
