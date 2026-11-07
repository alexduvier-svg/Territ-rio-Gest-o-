import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { rankProducts, rankHours, rankWeekdays, rankValues, rankPayments, rankClients, eventShare, salesPatterns, TOP } from '../src/features/management-hub/ranking.js';

const dayOf = at => String(at).slice(0, 10), clockOf = at => String(at).slice(11, 16);
const addDays = (day, n) => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const sale = (date, total, extra = {}) => ({ status: 'completed', date, total, payments: [{ method: 'Pix', amount: total }], items: [{ productId: 'a', name: 'Café', description: '500 g' }], ...extra });

test('produtos: os 10 mais; quantidade só quando a unidade é a mesma; devolução líquida fica fora', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ id: 'p' + i, name: 'P' + i, qty: i + 1, revenue: 100 * (12 - i) }));
  const units = Object.fromEntries(rows.map(r => [r.id, 'Pacote']));
  const same = rankProducts(rows, units);
  assert.equal(same.byQuantity, true); assert.equal(same.rows.length, TOP); assert.equal(same.total, 12); assert.equal(same.rows[0].id, 'p11');
  const mixed = rankProducts(rows, { ...units, p0: 'kg' });
  assert.equal(mixed.byQuantity, false); assert.equal(mixed.rows[0].id, 'p0');
  assert.deepEqual(rankProducts([{ id: 'x', qty: 0, revenue: 0 }], {}).rows, []);
  assert.deepEqual(rankProducts(undefined).rows, []);
});
test('horários, dias, valores e pagamentos só com compras concluídas', () => {
  const list = [sale('2026-11-07T09:10', 1000), sale('2026-11-07T09:40', 3000), sale('2026-11-14T15:00', 15000), sale('2026-11-02T10:00', 25000, { payments: [{ method: 'Dinheiro', amount: 5000 }, { method: 'Pix', amount: 20000 }] }), sale('2026-11-02T10:30', 9000, { status: 'returned' }), sale('2026-11-03', 700)];
  const h = rankHours(list, clockOf);
  assert.equal(h.rows[0].hour, '09'); assert.equal(h.rows[0].count, 2); assert.equal(h.unknown, 1); assert.equal(h.rows.reduce((n, r) => n + r.count, 0) + h.unknown, 5);
  const w = rankWeekdays(list, dayOf);
  assert.equal(w[0].label, 'sábados'); assert.equal(w[0].count, 3); assert.equal(w[0].dates, 2); assert.equal(w[0].amount, 19000);
  const v = rankValues(list);
  assert.equal(v[0].to, 2000); assert.equal(v[0].count, 2); assert.equal(v.reduce((n, r) => n + r.amount, 0), 44700);
  const p = rankPayments(list);
  assert.equal(p[0].method, 'Pix'); assert.equal(p[0].count, 5); assert.equal(p[1].method, 'Dinheiro');
});
test('clientes por identificador; nomes iguais não se fundem; sem cliente fica de fora', () => {
  const r = rankClients([sale('2026-11-01T10:00', 500, { customerId: 'a' }), sale('2026-11-01T11:00', 900, { customerId: 'b' }), sale('2026-11-02T11:00', 100, { customerId: 'a' }), sale('2026-11-02T12:00', 300)], () => 'Maria');
  assert.equal(r.total, 2); assert.equal(r.anonymous, 1); assert.deepEqual(r.rows.map(x => [x.id, x.amount, x.count]), [['b', 900, 1], ['a', 600, 2]]);
});
test('observação de eventos conta as vendas e os nomes', () => {
  const r = eventShare([sale('2026-11-01T10:00', 1, { scope: 'f' }), sale('2026-11-01T10:00', 1, { scope: 'loja' }), sale('2026-11-01T10:00', 1, { scope: 'f', status: 'returned' })], id => id === 'f', () => 'Festa');
  assert.deepEqual(r, { count: 1, total: 2, names: ['Festa'] });
});
const opts = { today: '2026-11-07', addDays, dayOf, clockOf };
test('padrão: produto × horário × dia, com contagem exata', () => {
  const dates = ['2026-10-10', '2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07', '2026-11-03'];
  const list = dates.map((d, i) => sale(d + 'T' + (i === 5 ? '15:00' : '09:20'), 4500));
  const out = salesPatterns(list, opts);
  assert.equal(out.rows.length, 1);
  assert.equal(out.rows[0].text, 'Café · 500 g: 5 de 6 vendas entre 9h e 11h; 5 de 6 vendas aos sábados.');
});
test('sem repetição não há padrão: poucas vendas, um dia só, empate ou fora dos 90 dias', () => {
  const same = Array.from({ length: 8 }, () => sale('2026-11-07T09:00', 100));
  assert.deepEqual(salesPatterns(same, opts).rows, [], 'tudo no mesmo dia');
  assert.deepEqual(salesPatterns([sale('2026-11-01T09:00', 1), sale('2026-11-02T09:00', 1), sale('2026-11-03T09:00', 1), sale('2026-11-04T09:00', 1)], opts).rows, [], 'menos de 5 vendas');
  const old = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'].map(d => sale(d + 'T09:00', 1));
  assert.deepEqual(salesPatterns(old, opts).rows, [], 'fora da janela');
  const spread = ['2026-11-01T08:00', '2026-11-02T11:00', '2026-11-03T14:00', '2026-11-04T17:00', '2026-11-05T20:00', '2026-11-06T06:00'].map(d => sale(d, 1));
  assert.deepEqual(salesPatterns(spread, opts).rows, [], 'sem concentração');
  assert.deepEqual(salesPatterns([], opts).rows, []);
});
test('produto com dígitos no nome passa pela liberação; devolvida não conta', () => {
  const list = ['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map(d => sale(d + 'T09:00', 1));
  list.push({ ...sale('2026-11-06T18:00', 1), status: 'returned' });
  const out = salesPatterns(list, opts);
  assert.match(out.rows[0].text, /Café · 500 g: 5 de 5 vendas entre 9h e 11h/);
});
test('Ranking vem antes de Operação e Horários saiu de Vendas', () => {
  const ui = fs.readFileSync(new URL('../src/legacy/erp-ui.js', import.meta.url), 'utf8');
  const entry = ui.indexOf("'<nav class=\"mgh-hub\""), line = ui.slice(entry, ui.indexOf('\n', entry));
  assert.ok(line.indexOf("key:'ranking'") >= 0 && line.indexOf("key:'ranking'") < line.indexOf('HUB().HUB_GROUPS'));
  assert.ok(!ui.includes("mghFold('vendas-hora'"));
  assert.ok(ui.includes("'ranking-resumos'"));
});
test('dias da semana com a concordância certa', () => {
  const list = ['2026-11-05', '2026-11-12', '2026-11-19', '2026-11-26', '2026-10-29', '2026-10-27'].map(d => sale(d + 'T09:00', 1));
  const out = salesPatterns(list, { ...opts, today: '2026-11-30' });
  assert.match(out.rows[0].text, /5 de 6 vendas às quintas\.$/);
});
test('card recolhendo não aparece fora da área da janela', async () => {
  const { ghostClip } = await import('../src/features/motion/ghost-clip.js');
  assert.equal(ghostClip(610, 412, { top: 160, bottom: 699 }), 'inset(0px 0 323px 0)');
  assert.equal(ghostClip(100, 200, { top: 160, bottom: 699 }), 'inset(60px 0 0px 0)');
  assert.equal(ghostClip(200, 100, { top: 160, bottom: 699 }), 'inset(0px 0 0px 0)');
});
