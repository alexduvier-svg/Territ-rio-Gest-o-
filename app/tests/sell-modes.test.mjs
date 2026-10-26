import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sellGroups, resolveMode, cartByGroup, clampActive, groupLabel } from '../src/features/sell-modes/model.js';

const p = (id, category, type = '') => ({ id, category, type });
const cafes = (n, type) => Array.from({ length: n }, (_, i) => p(type + i, 'Cafés', type));

test('grupos seguem a ordem do Estoque, sem intercalar famílias', () => {
  const list = [p('a', 'Cafés', 'Especial'), p('b', 'Hortifruti-Granjeiro'), p('c', 'Cafés', 'Gourmet'), p('d', 'Laticínios')];
  const g = sellGroups(list);
  assert.deepEqual(g.map(x => x.label), ['Cafés', 'Hortifruti', 'Laticínios']);
  assert.deepEqual(g[0].items.map(x => x.id), ['a', 'c']); // a ordem interna é a da lista recebida
  assert.equal(groupLabel('Mel e apícolas'), 'Mel');
});

test('só café com vários tipos vira um grupo por tipo', () => {
  const g = sellGroups([...cafes(3, 'Especial'), ...cafes(3, 'Gourmet'), ...cafes(3, 'Superior'), ...cafes(3, 'Tradicional')]);
  assert.deepEqual(g.map(x => x.label), ['Especial', 'Gourmet', 'Superior', 'Tradicional']);
  assert.equal(sellGroups(cafes(4, 'Especial')).length, 1);
});

test('automático: grade até 9, carrossel com 2 ou 3 famílias, lâminas com 4 ou mais', () => {
  const few = sellGroups([...cafes(5, 'Especial'), p('h', 'Hortifruti-Granjeiro')]);
  assert.equal(resolveMode('auto', few), 'grade');
  assert.equal(resolveMode('carrossel', few), 'grade'); // tudo cabe: a escolha não atrapalha
  const three = sellGroups([...cafes(8, 'Especial'), p('h', 'Hortifruti-Granjeiro'), p('m', 'Mel e apícolas')]);
  assert.equal(resolveMode('auto', three), 'carrossel');
  const five = sellGroups([...cafes(8, 'Especial'), p('h', 'Hortifruti-Granjeiro'), p('m', 'Mel e apícolas'), p('l', 'Laticínios'), p('d', 'Doces')]);
  assert.equal(resolveMode('auto', five), 'pe');
  assert.equal(resolveMode('grade', five), 'grade');
  assert.equal(resolveMode('carrossel', five), 'carrossel');
  assert.equal(resolveMode('qualquer', five), 'pe');
  assert.equal(resolveMode('pe', sellGroups(cafes(20, 'Especial'))), 'grade'); // uma família só
});

test('carrinho por família soma unidades; peso conta produtos', () => {
  const g = sellGroups([p('a', 'Cafés'), p('b', 'Cafés'), p('t', 'Hortifruti-Granjeiro'), p('m', 'Mel e apícolas')]);
  assert.deepEqual(cartByGroup(g, [{ productId: 'a', rawQty: '2' }, { productId: 'b', rawQty: '1' }, { productId: 't', rawQty: '1,5' }]), [3, 1, 0]);
  assert.deepEqual(cartByGroup(g, []), [0, 0, 0]);
});

test('família ativa nunca sai do intervalo', () => {
  const g = sellGroups([p('a', 'Cafés'), p('b', 'Doces')]);
  assert.equal(clampActive(5, g), 1);
  assert.equal(clampActive(-1, g), 0);
  assert.equal(clampActive(undefined, g), 0);
});
