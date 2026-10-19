// Camada de linguagem da voz (diretrizes "Linguagem e Fala", agro-linguagem v1.0.0).
// O motor de linguagem corrige o que o reconhecimento escreveu ("vemdi", "quejo", "pics"),
// entende a forma de pagamento e separa venda de perda/sobra. A escolha do produto e da
// apresentação (250 g, 500 g, 1 kg) continua no interpretador do app, que conhece os pesos.

import { criarMotor, limparEntrada, semAcento } from './linguagem/motor-linguagem.js';

// Pagamentos do motor → formas da venda do app. Cartão sem tipo e fiado ficam para o produtor escolher.
const PAYMENT = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' };

export function createLanguage(dictionary) {
  let motor = null, revision = '';
  const engine = products => {
    if (!motor) motor = criarMotor(dictionary);
    const next = (products || []).map(p => `${p.id}:${p.name}`).join('|');
    if (next !== revision) {
      motor.carregarCatalogo(products || [], { id: 'id', nome: 'name', categoria: 'category', unidade: 'unit' });
      revision = next;
    }
    return motor;
  };

  /** Texto do reconhecimento → texto corrigido para o interpretador, pagamento e ação. */
  function understand(text, products) {
    const clean = limparEntrada(String(text || ''));
    if (!clean.trim()) return { text: '', original: text, action: null, payment: null, corrections: [] };
    const result = engine(products).interpretar(clean);
    // Só as trocas de palavra do motor são aplicadas; o resto da frase do produtor fica como foi dita.
    const swaps = new Map((result.correcoes || []).filter(c => c.de && c.para).map(c => [semAcento(c.de), c.para]));
    // O pagamento já fica guardado à parte: as palavras dele (mesmo com erro, "dinhero", "pics") saem do texto.
    const paymentWords = new Set(Object.values(dictionary.pagamentos || {}).flatMap(p => p.gatilhos || []).map(w => semAcento(w)));
    const corrected = clean.split(/(\s+)/).map(part => {
      const key = semAcento(part).replace(/[^a-z0-9]/g, '');
      if (paymentWords.has(key)) return '';
      return swaps.get(key) ?? part;
    }).join('').replace(/\s+/g, ' ').trim();
    return {
      text: corrected,
      original: text,
      action: result.acao || null,
      actionLabel: result.acaoRotulo || '',
      payment: PAYMENT[result.pagamento] || null,
      paymentHeard: result.pagamento || null,
      corrections: result.correcoes || [],
      confidence: result.confianca,
    };
  }

  /** Palavras de pagamento e de ação do dicionário, para o vocabulário do reconhecimento offline. */
  function vocabulary() {
    const words = new Set();
    const add = list => (list || []).forEach(w => { if (/^[a-zà-ÿ]+$/i.test(w) && w.length > 1) words.add(w.toLowerCase()); });
    for (const p of Object.values(dictionary.pagamentos || {})) add(p.gatilhos);
    for (const key of ['venda', 'perda', 'sobra', 'troca', 'brinde', 'cancelar']) add(dictionary.acoes?.[key]?.gatilhos);
    return [...words];
  }

  return { understand, vocabulary, engine };
}
