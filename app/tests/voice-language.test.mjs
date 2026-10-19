import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLanguage } from '../src/features/voice/language-core.js';
import { interpretBest } from '../src/features/voice/interpreter.js';

// Camada de linguagem (agro-linguagem v1.0.0) antes do interpretador do app.
const dictionary = JSON.parse(fs.readFileSync(new URL('../src/features/voice/linguagem/dicionario_agro_ptbr.json', import.meta.url), 'utf8'));
const language = createLanguage(dictionary);
const catalog = [
  { id: 'esp250', name: 'Café especial', category: 'Cafés', unit: 'Pacote', weight: 250, stock: 40, price: 2500 },
  { id: 'esp500', name: 'Café especial', category: 'Cafés', unit: 'Pacote', weight: 500, stock: 20, price: 4500 },
  { id: 'queijo', name: 'Queijo Meia Cura', category: 'Laticínios', unit: 'Unidade', stock: 10, price: 3000 },
  { id: 'serralha', name: 'Serralha', category: 'Hortifruti', unit: 'Maço', stock: 12, price: 300 },
];
const understandAndInterpret = text => {
  const u = language.understand(text, catalog);
  return { u, best: interpretBest([u.text, text], catalog) };
};

test('corrige a fala e entende o pagamento: vemdi tres cafe especial de 250 gramas no pics', () => {
  const { u, best } = understandAndInterpret('vemdi tres cafe especial de 250 gramas a 25 no pics');
  assert.equal(u.payment, 'Pix');
  assert.equal(u.action, 'venda');
  assert.equal(best.result.status, 'ok');
  assert.equal(best.result.productId, 'esp250');
  assert.equal(best.result.quantity, 3);
});

test('erros de fala corrigidos pelo dicionário: quejo, dinhero', () => {
  const { u, best } = understandAndInterpret('vendi dois quejo meia cura em dinhero');
  assert.match(u.text, /queijo/);
  assert.equal(u.payment, 'Dinheiro');
  assert.equal(best.result.productId, 'queijo');
  assert.equal(best.result.quantity, 2);
});

test('sem peso falado, continua perguntando a apresentação; "caiu no Pix" é venda', () => {
  const { u, best } = understandAndInterpret('caiu no pix três café especial');
  assert.equal(u.action, 'venda');
  assert.equal(u.payment, 'Pix');
  assert.equal(best.result.status, 'choose');
});

test('perda não vira venda', () => {
  assert.equal(language.understand('perdi 4 queijos', catalog).action, 'perda');
});

test('vocabulário do dicionário para o reconhecimento offline', () => {
  const words = language.vocabulary();
  for (const w of ['pix', 'dinheiro', 'débito', 'crédito', 'vendi']) assert.ok(words.includes(w), w);
});
