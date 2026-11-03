import test from 'node:test';
import assert from 'node:assert/strict';
import { pluralWord, pluralName, itemPhrase, count } from '../src/features/report-language.js';

const q = n => String(n).replace('.', ',');

test('plural de palavras segue as regras gerais do português', () => {
  const cases = { 'Café': 'Cafés', 'Acará': 'Acarás', 'Especial': 'Especiais', 'Pastel': 'Pastéis', 'Limão': 'Limões', 'Pão': 'Pães', 'Pudim': 'Pudins', 'Flor': 'Flores', 'Noz': 'Nozes', 'Ovos': 'Ovos', 'Moído': 'Moídos', 'Superior': 'Superiores', 'Barril': 'Barris', 'Mel': 'Méis', 'Anzol': 'Anzóis' };
  for (const [s, p] of Object.entries(cases)) assert.equal(pluralWord(s), p, s);
});

test('plural do nome concorda o substantivo e seus adjetivos, e para em conectivo ou segundo substantivo', () => {
  const cases = {
    'Café Especial TC Moído': 'Cafés Especiais TC Moídos',
    'Café Gourmet TM Moído': 'Cafés Gourmet TM Moídos',
    'Acará-Bandeira Vivo': 'Acarás-Bandeiras Vivos',
    'Ovos Caipiras': 'Ovos Caipiras',
    'Ovo Caipira': 'Ovos Caipiras',
    'Geleia de Morango': 'Geleias de Morango',
    'Queijo Meia Cura': 'Queijos Meia Cura',
    'Banana Prata': 'Bananas Prata',
    'Banana Nanica': 'Bananas Nanicas',
    'Betta Cauda Dupla': 'Bettas Cauda Dupla',
    'Pé-de-Moleque': 'Pés-de-Moleque',
    'Cachaça Artesanal': 'Cachaças Artesanais',
    'Pacu Inteiro': 'Pacus Inteiros',
  };
  for (const [s, p] of Object.entries(cases)) assert.equal(pluralName(s), p, s);
});

test('frase do item vendido usa a unidade como o produtor fala', () => {
  assert.equal(itemPhrase({ qty: 2, name: 'Ovos Caipiras', description: 'Dúzia', unit: 'Dúzia' }, q), '2 dúzias de Ovos Caipiras');
  assert.equal(itemPhrase({ qty: 1, name: 'Ovos Caipiras', description: 'Dúzia', unit: 'Dúzia' }, q), '1 dúzia de Ovos Caipiras');
  assert.equal(itemPhrase({ qty: 2, name: 'Café Especial TC', description: 'Moído · 250 g', unit: 'Pacote' }, q), '2 Cafés Especiais TC Moídos · 250 g');
  assert.equal(itemPhrase({ qty: 1, name: 'Café Especial TC', description: 'Moído · 250 g', unit: 'Pacote' }, q), '1 Café Especial TC Moído · 250 g');
  assert.equal(itemPhrase({ qty: 3, name: 'Acará-Bandeira', description: 'Vivo · Unidade', unit: 'Unidade' }, q), '3 Acarás-Bandeiras Vivos');
  assert.equal(itemPhrase({ qty: 1.5, name: 'Pacu', description: 'Inteiro · Venda por kg', unit: 'kg' }, q), '1,5 kg de Pacu Inteiro');
  assert.equal(itemPhrase({ qty: 2, name: 'Queijo Meia Cura', description: 'Unidade', unit: 'Unidade' }, q), '2 Queijos Meia Cura');
  assert.equal(itemPhrase({ qty: 1, name: 'Geleia de Morango', description: '250 g', unit: 'Pote' }, q), '1 Geleia de Morango · 250 g');
  assert.equal(itemPhrase({ qty: 2, name: 'Café Verde', description: '60 kg', unit: 'Saca' }, q), '2 sacas de Café Verde · 60 kg');
});

test('contagem simples concorda com o número', () => {
  assert.equal(count(1, 'venda', 'vendas'), '1 venda');
  assert.equal(count(5, 'venda', 'vendas'), '5 vendas');
  assert.equal(count(2, 'cliente'), '2 clientes');
});
