import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import * as Catalog from '../src/features/product-catalog.js';
import { STOCK_CATALOG_GUIDELINES } from '../src/data/stock-catalog-guidelines.js';
import { CATALOG_KNOWLEDGE } from '../src/data/catalog-knowledge.js';
import { INTERFACE_GUIDELINES } from '../src/data/interface-guidelines.js';

test('Café Tradicional Torra Escura is visible on the initial coffee page with all six distinct presentations', async () => {
  await Catalog.loadCatalog();
  const page = Catalog.searchFamilies('', { category: 'Cafés', limit: STOCK_CATALOG_GUIDELINES.initialFamilyLimit });
  const dark = page.items.find(f => f.name === 'Café Tradicional Torra escura');
  assert.ok(dark, 'the ninth coffee family must not be hidden behind the original limit of eight');
  const records = Catalog.familyPresentations(dark.key);
  assert.equal(records.length, 6);
  assert.deepEqual(records.map(r => [r.forma, r.conteudo_quantidade]), [
    ['Moído', 250], ['Moído', 500], ['Moído', 1000],
    ['Em grãos', 250], ['Em grãos', 500], ['Em grãos', 1000],
  ]);
  const identities = records.map(r => Catalog.commercialIdentity(Catalog.toProductSuggestion(r)).key);
  assert.equal(new Set(identities).size, 6);
  for (const record of records) {
    const suggested = Catalog.toProductSuggestion(record);
    assert.equal(suggested.type, 'Tradicional');
    assert.equal(suggested.flavor, 'Torra escura');
    assert.equal(suggested.unit, 'Pacote');
    assert.equal(Catalog.commercialIdentity(record).key, Catalog.commercialIdentity(suggested).key);
    for (const key of ['id', 'price', 'cost', 'stock', 'min']) assert.equal(Object.hasOwn(suggested, key), false);
  }
  const light = Catalog.searchCatalog('café tradicional torra clara').items[0];
  assert.equal(Catalog.duplicateCandidates([light], records[0]).status, 'none', 'roasts remain commercially distinct');
});

test('cold starts repeatedly rebuild the same offline vocabulary independently of storage', async () => {
  const expected = (await Catalog.loadCatalog(), Catalog.searchCatalog('café tradicional torra escura', { limit: 100 }).items.map(r => r.id));
  for (let reset = 0; reset < 12; reset++) {
    const cold = await import(new URL('../src/features/product-catalog.js?reset=' + reset, import.meta.url));
    assert.equal(cold.isCatalogReady(), false);
    await cold.loadCatalog();
    assert.equal(cold.catalogInfo().total, 2479);
    assert.equal(cold.STOCK_CATALOG_GUIDELINES, STOCK_CATALOG_GUIDELINES);
    assert.deepEqual(cold.searchCatalog('café tradicional torra escura', { limit: 100 }).items.map(r => r.id), expected);
    assert.equal(cold.searchFamilies('taioba').items[0].name, 'Taioba');
  }
});

test('restarting an empty producer model never turns catalog suggestions into stock or activity', async () => {
  await Catalog.loadCatalog();
  const source = await fs.readFile(new URL('../src/legacy/erp-core.js', import.meta.url), 'utf8');
  const ctx = { console, Date, Math, JSON, Intl, crypto: globalThis.crypto,
    TerritorioProductCatalog: Catalog, TerritorioCatalogKnowledge: CATALOG_KNOWLEDGE,
    TerritorioInterfaceGuidelines: INTERFACE_GUIDELINES };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx); vm.runInContext(source, ctx);
  for (let reset = 0; reset < 25; reset++) {
    const input = { schema: 1, inventoryRevision: 20, products: [], sales: [], clients: [],
      events: [], movements: [], expenses: [], profiles: {}, productLibrary: { entries: [], dimensions: {} },
      dataContext: { type: 'real', confirmedAt: '2026-10-16T12:00:00.000Z' } };
    const model = new ctx.ERP.ERPModel(input);
    const restored = new ctx.ERP.ERPModel(JSON.parse(JSON.stringify(model.data)));
    for (const key of ['products', 'sales', 'clients', 'events', 'movements', 'expenses']) {
      assert.equal(restored.data[key].length, 0, key + ' remains empty on reset ' + reset);
    }
    assert.equal(restored.data.catalogKnowledge.total, 2479);
    assert.equal(Catalog.searchFamilies('café tradicional torra escura').items.length, 1);
    assert.equal(Catalog.searchCatalog('taioba').items[0].unidade_venda, 'maco');
  }
});
