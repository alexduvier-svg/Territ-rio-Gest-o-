import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret, interpretBest, voiceVocabulary, pluralForms, readNumber, singular, normalize, detectIntent } from '../src/features/voice/interpreter.js';

// Catálogo de exemplo das diretrizes de voz (Agro_Gestao_Diretrizes_Voz_Vosk_Android, v1.1).
const catalog = [
  { id: 'esp250', name: 'Café especial', baseName: 'Café', type: 'Especial', unit: 'Pacote', weight: 250, stock: 40, price: 2500 },
  { id: 'esp500', name: 'Café especial', baseName: 'Café', type: 'Especial', unit: 'Pacote', weight: 500, stock: 20, price: 4500 },
  { id: 'gourmet', name: 'Café gourmet', baseName: 'Café', type: 'Gourmet', unit: 'Pacote', weight: 500, stock: 8, price: 3000 },
  { id: 'conilon', name: 'Café Conilon Especial', baseName: 'Café', unit: 'Pacote', weight: 250, stock: 10, price: 2500 },
  { id: 'papaia', name: 'Mamão Papaia', unit: 'Unidade', stock: 30, price: 500 },
  { id: 'taioba', name: 'Taioba', unit: 'Maço', stock: 15, price: 400 },
  { id: 'serralha', name: 'Serralha', unit: 'Maço', stock: 12, price: 300 },
  { id: 'ovos', name: 'Ovos caipira', unit: 'Dúzia', stock: 20, price: 1500 },
  { id: 'tilapia', name: 'Tilápia', unit: 'Sacola', weight: 1000, stock: 9, price: 3500 },
  { id: 'molho', name: 'Molho de tomate', unit: 'Pote', stock: 6, price: 1200 },
  { id: 'queijo', name: 'Queijo Minas', unit: 'Unidade', stock: 10, price: 3000 },
];
const withTwoMamoes = [...catalog, { id: 'formosa', name: 'Mamão Formosa', unit: 'Unidade', stock: 5, price: 700 }];

const ok = (text, id, quantity, products = catalog) => {
  const r = interpret(text, products);
  assert.equal(r.status, 'ok', `${text} → ${JSON.stringify(r)}`);
  assert.equal(r.productId, id, text);
  assert.equal(r.quantity, quantity, text);
};

test('números falados e escritos', () => {
  const n = text => readNumber(normalize(text).split(' '), 0)?.value;
  assert.equal(n('três'), 3);
  assert.equal(n('duzentos e cinquenta'), 250);
  assert.equal(n('mil'), 1000);
  assert.equal(n('dois mil e quinhentos'), 2500);
  assert.equal(n('vinte e dois'), 22);
  assert.equal(n('1,5'), 1.5);
  assert.equal(n('um e meio'), 1.5);
  assert.equal(singular('cafes'), 'cafe');
  assert.equal(singular('especiais'), 'especial');
  assert.equal(singular('mamoes'), 'mamao');
  assert.equal(singular('macos'), 'maco');
});

test('venda com apresentação falada: três cafés especiais de 250 gramas', () => {
  ok('Vendi três cafés especiais de 250 gramas', 'esp250', 3);
  ok('vendi três cafés especiais de duzentos e cinquenta gramas', 'esp250', 3);
  ok('três cafés especiais, duzentos e cinquenta', 'esp250', 3);
  ok('vendi um café especial de meio quilo', 'esp500', 1);
});

test('numeral com nome no singular dá a mesma quantidade que no plural', () => {
  ok('Vendi 3 mamão papaia', 'papaia', 3);
  ok('vendi três mamões papaia', 'papaia', 3);
  ok('Vendi 3 taioba', 'taioba', 3);
  ok('vendi três taiobas', 'taioba', 3);
});

test('mais de uma apresentação compatível: pergunta qual, sem escolher por popularidade', () => {
  const r = interpret('Vendi 3 café especial', catalog);
  assert.equal(r.status, 'choose');
  assert.equal(r.quantity, 3);
  assert.deepEqual(r.candidates.map(c => c.id), ['esp250', 'esp500']);
  assert.match(r.question, /250 g.*500 g/);
  const cafes = interpret('vendi três cafés', catalog);
  assert.equal(cafes.status, 'choose');
  assert.ok(cafes.candidates.length >= 3);
  const mamao = interpret('Vendi 3 mamão', withTwoMamoes);
  assert.equal(mamao.status, 'choose', 'com Papaia e Formosa, não assume Papaia');
  ok('Vendi 3 mamão', 'papaia', 3);
});

test('apelido regional e maço: vendi 5 mói de serraia', () => {
  ok('Vendi 5 mói de serraia', 'serralha', 5);
  ok('vendi cinco molhos de serralha', 'serralha', 5);
  ok('vendi dois maços de taioba', 'taioba', 2);
  // "molho" não transforma molho de tomate em maço
  ok('vendi dois molhos de tomate', 'molho', 2);
});

test('embalagem e medida: sacola de tilápia de um quilo; meia dúzia de ovos', () => {
  ok('Vendi uma sacola de tilápia de um quilo', 'tilapia', 1);
  ok('Vendi uma meia dúzia de ovos', 'ovos', 0.5);
  ok('vendi duas dúzias de ovos', 'ovos', 2);
});

test('frases que não autorizam lançamento', () => {
  assert.equal(interpret('Não vendi três cafés', catalog).status, 'negation');
  assert.equal(interpret('quanto dá três cafés?', catalog).status, 'question');
  assert.equal(interpret('ontem vendi três cafés especiais', catalog).status, 'past');
  assert.equal(interpret('três vendas de café', catalog).status, 'ask-quantity');
  assert.equal(interpret('', catalog).status, 'empty');
  assert.equal(interpret('cancela', catalog).status, 'cancel');
  assert.equal(interpret('vendi três abacaxis', catalog).status, 'not-found');
  assert.equal(interpret('vendi queijo minas', catalog).status, 'ask-quantity');
});

test('correção natural da proposta aberta: na verdade, foram dois', () => {
  assert.equal(detectIntent('na verdade, foram dois'), 'correction');
  const r = interpret('Na verdade, foram dois', catalog, { pendingProductId: 'esp250' });
  assert.equal(r.status, 'correction');
  assert.equal(r.quantity, 2);
  assert.equal(r.productId, 'esp250');
});

test('entre as alternativas do motor, vale a que já traz o peso: abre direto, sem perguntar', () => {
  const best = interpretBest(['vendi dois cafés especiais', 'vendi dois cafés especiais de duzentos e cinquenta gramas'], catalog);
  assert.equal(best.result.status, 'ok');
  assert.equal(best.result.productId, 'esp250');
  assert.equal(best.result.quantity, 2);
  // Sem peso em nenhuma alternativa: pergunta a apresentação.
  assert.equal(interpretBest(['vendi três cafés especiais'], catalog).result.status, 'choose');
  // Empate: a primeira alternativa (a mais provável) vence.
  assert.equal(interpretBest(['vendi dois queijos minas', 'vendi duas taiobas'], catalog).result.productId, 'queijo');
});

test('vocabulário para o Vosk: catálogo no singular e no plural, números e medidas', () => {
  const words = voiceVocabulary(catalog);
  for (const word of ['café', 'cafés', 'especial', 'especiais', 'mamão', 'mamões', 'taioba', 'taiobas', 'serralha', 'serraia', 'duzentos', 'cinquenta', 'gramas', 'quilo', 'maço', 'maços', 'dúzia', 'vendi', 'não', '[unk]']) {
    assert.ok(words.includes(word), word);
  }
  assert.deepEqual(pluralForms('queijo'), ['queijo', 'queijos']);
  assert.deepEqual(pluralForms('especial'), ['especial', 'especiais']);
});
