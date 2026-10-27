import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sellSections, useSections, cartByGroup, sectionLayout, orderSections, groupLabel } from '../src/features/sell-modes/model.js';

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

test('seções quando há pelo menos duas famílias; uma família só fica a grade simples', () => {
  assert.equal(useSections(sellSections(cafes(20, 'Especial'))), false);
  assert.equal(useSections(sellSections([...cafes(2, 'Especial'), p('q', 'Laticínios')])), true);
});

test('até 2 produtos a seção vira linhas; de 3 em diante, grade com 6 à mostra e o resto atrás da setinha', () => {
  assert.equal(sectionLayout(cafes(2, 'E')).mode, 'rows');
  const g = sectionLayout(cafes(9, 'E'));
  assert.deepEqual([g.mode, g.shown.length, g.extra.length, g.more], ['grid', 6, 3, 3]);
  const o = sectionLayout(cafes(9, 'E'), true);
  assert.deepEqual([o.shown.length, o.extra.length, o.more], [9, 0, 3]);
  assert.deepEqual([sectionLayout(cafes(6, 'E')).more, sectionLayout(cafes(3, 'E')).shown.length], [0, 3]);
});

test('carrinho por seção soma unidades; peso conta produtos', () => {
  const g = sellSections([p('a', 'Cafés', 'Especial'), p('b', 'Cafés', 'Especial'), p('t', 'Hortifruti-Granjeiro'), p('m', 'Mel e apícolas')]);
  assert.deepEqual(cartByGroup(g, [{ productId: 'a', rawQty: '2' }, { productId: 'b', rawQty: '1' }, { productId: 't', rawQty: '1,5' }]), [3, 1, 0]);
});

test('a ordem escolhida das seções vale; família nova fica no lugar do Estoque', () => {
  const g = sellSections([p('a', 'Cafés', 'Especial'), p('b', 'Cafés', 'Gourmet'), p('q', 'Laticínios'), p('d', 'Doces')]);
  assert.deepEqual(orderSections(g, ['Doces', 'Café Especial', 'Laticínios', 'Café Gourmet']).map(s => s.key), ['Doces', 'Café Especial', 'Laticínios', 'Café Gourmet']);
  assert.deepEqual(orderSections(g, ['Laticínios', 'Café Especial']).map(s => s.key), ['Laticínios', 'Café Gourmet', 'Café Especial', 'Doces']);
  assert.deepEqual(orderSections(g, null).map(s => s.key), g.map(s => s.key));
});
