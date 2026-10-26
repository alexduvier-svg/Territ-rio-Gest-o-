import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statement } from '../src/features/finance/finance.js';

const fiado = (receivable) => ({ total: 10000, subtotal: 10000, discount: 0, cost: 5000, scope: 'loja', items: [], payments: [{ method: 'Fiado', amount: 10000 }], receivable });

test('fiado em aberto: entra na venda e no resultado, mas não no caixa', () => {
  const s = statement({ sales: [fiado({ status: 'open', due: '2026-11-05', amount: 10000 })], expenses: [], settings: {}, shares: [] });
  assert.equal(s.revenue, 10000);
  assert.equal(s.receivableOpen, 10000);
  assert.equal(s.cash, 0);
  assert.equal(s.received.Fiado, undefined);
});

test('fiado recebido: entra no caixa na forma em que foi pago', () => {
  const s = statement({ sales: [fiado({ status: 'paid', due: '2026-11-05', amount: 10000, method: 'Pix', paidAt: '2026-11-04T12:00:00Z' })], expenses: [], settings: {}, shares: [] });
  assert.equal(s.receivableOpen, 0);
  assert.equal(s.cash, 10000);
  assert.equal(s.received.Pix, 10000);
});
