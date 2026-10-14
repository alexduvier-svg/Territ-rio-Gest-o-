import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Carrega o núcleo (script global) num contexto isolado, como o app faz no navegador.
const ctx = { console, Date, Math, JSON, Intl };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js', import.meta.url), 'utf8'), ctx);
const E = ctx.ERP;

test('atualização de versão: mamão vendido por kg continua em kg (estoque, preço e unidade)', () => {
  const data = E.seed();
  data.products.push({ id: 'mamao-real', name: 'Mamão Formosa', baseName: 'Mamão Formosa', category: 'Hortifruti-Granjeiro', unit: 'kg', stock: 10, min: 2, price: 800, cost: 300, weight: 0, volume: 0 });
  const m = new E.ERPModel(data);
  const p = m.product('mamao-real');
  assert.equal(p.unit, 'kg');
  assert.equal(p.stock, 10);
  assert.equal(p.price, 800);
  assert.equal((m.data.productUnitCorrections || []).some(c => c.productId === 'mamao-real'), false);
});
