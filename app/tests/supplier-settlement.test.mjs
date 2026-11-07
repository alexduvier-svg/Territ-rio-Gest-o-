import test from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../src/features/suppliers/model.js';

const NOW = '2026-11-05T15:00:00.000Z';
const base = () => { const d = { dataContext: { id: 'a', type: 'real' }, products: [], clients: [], sales: [], movements: [], expenses: [] }; M.saveSupplier(d, { name: 'Fornecedor Fictício' }, { id: 's1', uid: () => 'x', now: NOW }); return d; };
const input = (extra = {}) => ({ supplierId: 's1', confirmed: true, name: 'Embalagem', specification: 'Caixa 250 g', unit: 'Unidade', quantity: '10', occurredOn: '2026-11-01', goods: '100', freight: '0', discount: '0', charges: '0', ...extra });
let n = 0;
const uid = () => 'id' + (++n);

test('compra antiga ou sem informação continua válida e sem situação', () => {
  const d = base(), p = M.recordPurchase(d, input(), { id: 'p1', uid, now: NOW });
  assert.equal(p.settlement, undefined);
  M.validateBook(d);
});
test('a pagar exige vencimento; paga usa a data da compra quando não há outra', () => {
  const d = base();
  assert.throws(() => M.recordPurchase(d, input({ paymentStatus: 'open' }), { id: 'p2', uid, now: NOW }), /vencimento/);
  assert.deepEqual(M.recordPurchase(d, input({ paymentStatus: 'open', dueDate: '2026-12-01' }), { id: 'p3', uid, now: NOW }).settlement, { status: 'open', dueDate: '2026-12-01' });
  assert.deepEqual(M.recordPurchase(d, input({ paymentStatus: 'paid' }), { id: 'p4', uid, now: NOW }).settlement, { status: 'paid', paidOn: '2026-11-01' });
  M.validateBook(d);
});
test('registrar pagamento atualiza só a situação; data futura e compra desconsiderada são recusadas', () => {
  const d = base(); M.recordPurchase(d, input({ paymentStatus: 'open', dueDate: '2026-12-01' }), { id: 'p5', uid, now: NOW });
  const before = JSON.stringify([d.products, d.movements, d.expenses]);
  assert.throws(() => M.settlePurchase(d, 'p5', { paymentStatus: 'paid', paidOn: '2099-01-01' }, NOW), /futura/);
  const paid = M.settlePurchase(d, 'p5', { paymentStatus: 'paid', paidOn: '2026-11-04' }, NOW);
  assert.deepEqual(paid.settlement, { status: 'paid', paidOn: '2026-11-04' }); assert.equal(paid.total, 10000);
  assert.equal(JSON.stringify([d.products, d.movements, d.expenses]), before);
  assert.equal(M.settlePurchase(d, 'p5', { paymentStatus: '' }, NOW).settlement, undefined);
  M.voidPurchase(d, 'p5', 'Lançada errado', NOW);
  assert.throws(() => M.settlePurchase(d, 'p5', { paymentStatus: 'paid' }, NOW), /desconsiderada/);
});
test('backup com situação inválida é recusado; exportação traz as colunas novas', () => {
  const d = base(); M.recordPurchase(d, input({ paymentStatus: 'open', dueDate: '2026-12-01' }), { id: 'p6', uid, now: NOW });
  const rows = M.exportPurchaseRows(d);
  assert.deepEqual(rows[0].slice(-3), ['Situação do Pagamento', 'Vencimento', 'Pago em']);
  assert.deepEqual(rows[1].slice(-3), ['A pagar', '2026-12-01', '']);
  d.supplierBook.purchases[0].settlement = { status: 'open', dueDate: 'amanhã' };
  assert.throws(() => M.validateBook(d), /Pagamento da compra/);
});
