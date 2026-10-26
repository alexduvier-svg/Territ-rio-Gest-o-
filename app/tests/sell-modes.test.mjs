import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sellSections, useSections, cartByGroup, clampActive, groupLabel } from '../src/features/sell-modes/model.js';

const p = (id, category, type = '') => ({ id, category, type });
const cafes = (n, type) => Array.from({ length: n }, (_, i) => p(type + i, 'Cafés', type));

test('cada tipo de café é uma seção; os outros produtos, pela categoria, na ordem do Estoque', () => {
  const list = [...cafes(9, 'Especial'), p('b', 'Hortifruti-Granjeiro'), ...cafes(9, 'Gourmet'), p('m', 'Mel e apícolas'), ...cafes(9, 'Tradicional')];
  const s = sellSections(list);
  assert.deepEqual(s.map(x => x.label), ['Café Especial', 'Hortifruti', 'Café Gourmet', 'Mel', 'Café Tradicional']);
  assert.equal(s[0].items.length, 9);
  assert.equal(groupLabel('Mel e apícolas'), 'Mel');
});

test('só existem seções do que foi cadastrado; café sem tipo fica em Cafés', () => {
  assert.deepEqual(sellSections([p('a', 'Cafés'), p('b', 'Cafés')]).map(x => x.label), ['Cafés']);
  assert.deepEqual(sellSections(cafes(3, 'Especial')).map(x => x.label), ['Café Especial']);
});

test('até 9 produtos, ou uma seção só, fica a grade simples', () => {
  assert.equal(useSections(sellSections([...cafes(5, 'Especial'), ...cafes(4, 'Gourmet')])), false);
  assert.equal(useSections(sellSections(cafes(20, 'Especial'))), false);
  assert.equal(useSections(sellSections([...cafes(9, 'Especial'), ...cafes(9, 'Gourmet')])), true);
});

test('carrinho por seção soma unidades; peso conta produtos', () => {
  const g = sellSections([p('a', 'Cafés', 'Especial'), p('b', 'Cafés', 'Especial'), p('t', 'Hortifruti-Granjeiro'), p('m', 'Mel e apícolas')]);
  assert.deepEqual(cartByGroup(g, [{ productId: 'a', rawQty: '2' }, { productId: 'b', rawQty: '1' }, { productId: 't', rawQty: '1,5' }]), [3, 1, 0]);
});

test('seção aberta nunca sai do intervalo', () => {
  const g = sellSections([p('a', 'Cafés', 'Especial'), p('b', 'Doces')]);
  assert.equal(clampActive(5, g), 1);
  assert.equal(clampActive(undefined, g), 0);
});
