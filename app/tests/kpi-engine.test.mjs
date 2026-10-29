import test from 'node:test';
import assert from 'node:assert/strict';
import { contributionAbc, stockCoverage, periodChange } from '../src/features/kpi/kpi-engine.js';

const row = (id, revenue, cost, qty = 1, costKnown = true) => ({ id, name: id, revenue, cost, qty, costKnown });

test('ABC pelo lucro: A até 80%, B até 95%; sem custo fica fora e reduz a cobertura', () => {
  const r = contributionAbc([row('a', 10000, 2000), row('b', 3000, 1000), row('c', 1000, 500), row('d', 500, 400), row('x', 6500, 0, 1, false), row('z', 800, 900)]);
  assert.deepEqual(r.classes.map(c => [c.id, c.cls]), [['a', 'A'], ['b', 'A'], ['c', 'B'], ['d', 'C']]);
  assert.equal(r.total, 10600);
  assert.deepEqual(r.missing.map(m => m.id), ['x']);
  assert.deepEqual(r.negative.map(m => m.id), ['z']);
  assert.equal(Math.round(r.coverage * 1000), Math.round(15300 / 21800 * 1000));
});

test('ABC sem nenhum custo conhecido não inventa classes', () => {
  const r = contributionAbc([row('x', 500, 0, 1, false)]);
  assert.equal(r.classes.length, 0);
  assert.equal(r.coverage, 0);
});

test('cobertura do estoque: esgotado com procura, curto, parado e não informado', () => {
  const r = stockCoverage([
    { id: 'a', stock: 0, sold: 30 }, { id: 'b', stock: 3, sold: 30 }, { id: 'c', stock: 50, sold: 30 },
    { id: 'd', stock: 10, sold: 0 }, { id: 'e', stock: null, sold: 5 }, { id: 'f', stock: 0, sold: 0 },
  ]);
  assert.deepEqual(r.out.map(x => x.id), ['a']);
  assert.deepEqual(r.short.map(x => [x.id, x.days]), [['b', 3]]);
  assert.deepEqual(r.still.map(x => x.id), ['d']);
  assert.equal(r.ok, 1);
  assert.equal(r.unknown, 1);
});

test('variação: efeito quantidade + efeito preço fecham a diferença; lucro só com custo nos dois lados', () => {
  const r = periodChange([row('a', 12000, 6000, 12), row('n', 500, 200, 1)], [row('a', 10000, 4000, 10), row('g', 700, 300, 1)]);
  assert.equal(r.revenueDiff, 12500 - 10700);
  assert.equal(r.grossDiff, (6000 + 300) - (6000 + 400));
  const a = r.drivers.find(d => d.id === 'a');
  assert.equal(a.qtyEffect + a.priceEffect, a.revenueDiff);
  assert.equal(a.qtyEffect, 2000);
  assert.ok(r.drivers.find(d => d.id === 'g').isGone);
  assert.ok(r.drivers.find(d => d.id === 'n').isNew);
  const partial = periodChange([row('a', 100, 0, 1, false)], [row('a', 50, 20, 1)]);
  assert.equal(partial.grossDiff, null);
  assert.equal(partial.drivers[0].grossDiff, null);
});
test('coverage rejects invalid windows instead of presenting Infinity or a false duration',()=>{
 for(const windowDays of [0,-1,NaN,Infinity])assert.throws(()=>stockCoverage([{id:'q',stock:5,sold:10}],{windowDays}));
});
test('price and quantity effects are unavailable across different historical units',()=>{
 const r=periodChange([{...row('q',1500,500,2),unit:'kg'}],[{...row('q',1000,400,1),unit:'Caixa'}]);assert.equal(r.revenueDiff,500);assert.equal(r.drivers[0].qtyEffect,null);assert.equal(r.drivers[0].priceEffect,null);
});
