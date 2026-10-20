import test from 'node:test';
import assert from 'node:assert/strict';
import { properName, normalizeRecordNames } from '../src/features/proper-name.js';

test('every word of a name starts in capital, however it was typed', () => {
  assert.equal(properName('queijo meia cura'), 'Queijo Meia Cura');
  assert.equal(properName('Queijo meia cura'), 'Queijo Meia Cura');
  assert.equal(properName('QUEIJO MEIA CURA'), 'Queijo Meia Cura');
  assert.equal(properName('  banana   prata '), 'Banana Prata');
});

test('connectors stay low in the middle, acronyms and measures are kept', () => {
  assert.equal(properName('doce de leite'), 'Doce de Leite');
  assert.equal(properName('café do sítio são josé'), 'Café do Sítio São José');
  assert.equal(properName('leite UHT integral'), 'Leite UHT Integral');
  assert.equal(properName('mel 500 g'), 'Mel 500 g');
  assert.equal(properName('LEITE UHT integral'), 'Leite UHT Integral');
  assert.equal(properName('queijo MEIA cura'), 'Queijo Meia Cura');
  assert.equal(properName('AGRO Gestão'), 'AGRO Gestão');
  assert.equal(properName('suco 1 L de uva'), 'Suco 1 L de Uva');
  assert.equal(properName('pé-de-moleque'), 'Pé-de-Moleque');
  assert.equal(properName('vitamina a'), 'Vitamina A');
});

test('stored names are corrected in place and only names change', () => {
  const data = {
    products: [{ id: 'q', name: 'Queijo meia cura', baseName: 'queijo meia cura', price: 2800, stock: 6 }],
    clients: [{ id: 'c', name: 'maria da silva', city: 'carangola', neighborhood: 'santa maria' }],
    events: [{ id: 'e', name: 'feira do inventário rural', place: 'praça coronel maximiano' }],
    settings: { businessName: 'sítio boa vista' },
  };
  assert.equal(normalizeRecordNames(data), 8);
  assert.equal(data.products[0].name, 'Queijo Meia Cura');
  assert.equal(data.products[0].baseName, 'Queijo Meia Cura');
  assert.equal(data.products[0].price, 2800);
  assert.equal(data.clients[0].name, 'Maria da Silva');
  assert.equal(data.events[0].place, 'Praça Coronel Maximiano');
  assert.equal(data.settings.businessName, 'Sítio Boa Vista');
  assert.equal(normalizeRecordNames(data), 0, 'a second pass changes nothing');
});
