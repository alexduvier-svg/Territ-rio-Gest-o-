import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleFairsApi, listReports } from '../src/fairs.js';

const event = { name: 'Feira do Inventário', start: '2026-10-15', end: '2026-10-15', from: '09:00', until: '14:00' };
const body = () => ({
  reportId: 'feira-test-0125', producer: { name: 'Produtor de teste' }, event,
  consent: { at: '2026-10-15T17:00:00.000Z', text: 'Teste local' },
  totals: { took: 10, sold: 6, left: 3, revenue: 6000, sales: 2 },
  status: 'finalizado', finalizedAt: '2026-10-15T17:00:00.000Z',
});
function memoryEnv() {
  const records = new Map();
  return { BACKUPS: {
    put: async (key, value) => records.set(key, value),
    get: async (key, format) => format === 'json' ? JSON.parse(records.get(key) || 'null') : records.get(key),
    list: async ({ prefix }) => ({ keys: [...records.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  } };
}
const send = (env, value) => handleFairsApi(new Request('https://example.test/api/fairs/feira-inventario/reports', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) }), env, 'feira-inventario', 'reports');
const expected = { conferido: true, corrigido: true, vendasNaoRegistradas: { qtd: 2, valor: 2000 }, perdas: { qtd: 1 }, itens: [{ produto: 'Banana Prata', unidade: 'dz', calculado: 6, real: 3, motivo: 'Vendi e não registrei' }] };

test('POST reports guarda conferência no relatório da organização', async () => {
  const env = memoryEnv(), report = { ...body(), check: structuredClone(expected) };
  const response = await send(env, report);
  assert.equal(response.status, 200);
  const saved = await listReports(env, 'feira-inventario');
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0].check, expected);
  assert.deepEqual(report.check, expected);
});

test('relatório de versão anterior recebe conferido false e totais zero', async () => {
  const env = memoryEnv();
  assert.equal((await send(env, body())).status, 200);
  assert.deepEqual((await listReports(env, 'feira-inventario'))[0].check, { conferido: false, corrigido: false, vendasNaoRegistradas: { qtd: 0, valor: 0 }, perdas: { qtd: 0 }, itens: [] });
});

test('valida números e booleanos; limita texto e itens; não publica medição local', async () => {
  const env = memoryEnv();
  const report = { ...body(), check: {
    conferido: 'true', corrigido: 1, tempoMs: 49000, direto: true,
    vendasNaoRegistradas: { qtd: -3, valor: 'NaN' }, perdas: { qtd: 1.12345 },
    itens: Array.from({ length: 250 }, () => ({ produto: 'x'.repeat(300), unidade: 'kg'.repeat(60), calculado: -2, real: 1.56789, motivo: 'motivo'.repeat(80), local: 'não enviar' })),
  } };
  assert.equal((await send(env, report)).status, 200);
  const c = (await listReports(env, 'feira-inventario'))[0].check;
  assert.equal(c.conferido, false);
  assert.equal(c.corrigido, false);
  assert.deepEqual(c.vendasNaoRegistradas, { qtd: 0, valor: 0 });
  assert.deepEqual(c.perdas, { qtd: 1.123 });
  assert.equal(c.itens.length, 200);
  assert.deepEqual(c.itens[0], { produto: 'x'.repeat(160), unidade: 'kg'.repeat(20), calculado: 0, real: 1.568, motivo: 'motivo'.repeat(33) + 'mo' });
  assert.equal('tempoMs' in c, false);
  assert.equal('direto' in c, false);
});

test('atualização da mesma feira preserva conferência e substitui totais', async () => {
  const env = memoryEnv(), first = { ...body(), check: expected };
  assert.equal((await send(env, first)).status, 200);
  assert.equal((await send(env, { ...first, totals: { ...first.totals, sold: 7, left: 2, revenue: 7000, sales: 3 } })).status, 200);
  const saved = await listReports(env, 'feira-inventario');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].totals.revenue, 7000);
  assert.equal(saved[0].totals.left, 2);
  assert.deepEqual(saved[0].check, expected);
});

test('contrato preserva unregistered e lancada_depois de vendas corrigidas', async () => {
  const env = memoryEnv(), report = { ...body(), check: expected, contrato: {
    produtor: { id: 'p-teste', nome: 'Produtor de teste' }, evento: { data: event.start },
    vendas: [{ id: 'corrigida', hora: '2026-10-15T14:00:00-03:00', itens: [{ produto_id: 'banana', qtd: 2, preco_unit: 10 }], total: 20, pagamento: 'PIX', unregistered: true, lancada_depois: true, registrada_em: '2026-10-15T17:00:00.000Z' }],
  } };
  assert.equal((await send(env, report)).status, 200);
  const sale = (await listReports(env, 'feira-inventario'))[0].contrato.vendas[0];
  assert.equal(sale.unregistered, true);
  assert.equal(sale.lancada_depois, true);
  assert.equal(sale.registrada_em, '2026-10-15T17:00:00.000Z');
});
