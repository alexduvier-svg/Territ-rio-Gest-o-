// Interpretador de voz do AGRO Gestão: transforma o texto final do reconhecimento em uma proposta
// de venda (produto, quantidade) usando o catálogo do próprio produtor. Não registra nada: quem
// confirma é o produtor, no fluxo de venda que já existe. Funções puras, testadas em
// tests/voice-interpreter.test.mjs com as frases das diretrizes de voz.

const strip = text => String(text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');
// Vírgula e ponto só ficam entre algarismos ("1,5"); no resto viram espaço ("especiais, duzentos").
export const normalize = text => strip(text).toLowerCase().replace(/[^a-z0-9,.\s]/g, ' ').replace(/(?<!\d)[.,]|[.,](?!\d)/g, ' ').replace(/\s+/g, ' ').trim();

// Singular só no índice de busca; o nome original continua na tela.
export function singular(word) {
  const w = String(word);
  if (w.length <= 3) return w;
  if (/(oes|aes|aos)$/.test(w)) return w.slice(0, -3) + 'ao';
  if (/ais$/.test(w)) return w.slice(0, -3) + 'al';
  if (/eis$/.test(w) && w.length > 4) return w.slice(0, -3) + 'el';
  if (/ois$/.test(w)) return w.slice(0, -3) + 'ol';
  if (/ns$/.test(w)) return w.slice(0, -2) + 'm';
  if (/(r|z)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/(ss|us|is)$/.test(w)) return w.slice(0, -1);
  return w;
}

const UNITS = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9 };
const TEENS = { dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezasseis: 16, dezessete: 17, dezoito: 18, dezenove: 19 };
const TENS = { vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90 };
const HUNDREDS = { cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900 };
const NUMBER_WORDS = { ...UNITS, ...TEENS, ...TENS, ...HUNDREDS };

// Medidas da apresentação (peso/volume): nunca viram quantidade de itens vendidos.
const MEASURES = {
  g: ['g', 'gr', 'grama', 'gramas'], kg: ['kg', 'quilo', 'quilos', 'kilo', 'kilos', 'kilograma', 'kilogramas', 'quilograma', 'quilogramas'],
  ml: ['ml', 'mililitro', 'mililitros'], l: ['l', 'litro', 'litros'],
};
const MEASURE_OF = Object.fromEntries(Object.entries(MEASURES).flatMap(([unit, words]) => words.map(word => [word, unit])));

// Palavras de embalagem/unidade de venda faladas. "mói"/"molho" valem como maço só para produtos
// vendidos em maço (folhas); num "molho de tomate" a palavra continua fazendo parte do nome.
const PACKAGES = {
  maco: ['maco', 'macos', 'moi', 'mois', 'molho', 'molhos', 'mao', 'maos'],
  duzia: ['duzia', 'duzias'], pacote: ['pacote', 'pacotes'], caixa: ['caixa', 'caixas'],
  saco: ['saco', 'sacos', 'sacola', 'sacolas'], unidade: ['unidade', 'unidades'], bandeja: ['bandeja', 'bandejas'],
  pote: ['pote', 'potes'], garrafa: ['garrafa', 'garrafas'], vidro: ['vidro', 'vidros'], lata: ['lata', 'latas'],
  peca: ['peca', 'pecas'], fatia: ['fatia', 'fatias'], kit: ['kit', 'kits'], cesta: ['cesta', 'cestas'],
};
const PACKAGE_OF = Object.fromEntries(Object.entries(PACKAGES).flatMap(([unit, words]) => words.map(word => [word, unit])));
const PACKAGE_UNITS = { maco: ['maco'], duzia: ['duzia'], pacote: ['pacote'], caixa: ['caixa'], saco: ['saco', 'sacola'], unidade: ['unidade'], bandeja: ['bandeja'], pote: ['pote'], garrafa: ['garrafa'], vidro: ['vidro'], lata: ['lata'], peca: ['peca'], fatia: ['fatia'], kit: ['kit'], cesta: ['cesta'] };

const FILLER = new Set(['vendi', 'vende', 'vender', 'vendeu', 'vendemos', 'venda', 'registrar', 'registra', 'registre', 'lanca', 'lancar', 'lance', 'anota', 'anotar', 'coloca', 'colocar', 'bota', 'botar', 'poe', 'por', 'pra', 'para', 'de', 'do', 'da', 'dos', 'das', 'o', 'a', 'os', 'as', 'e', 'com', 'foi', 'foram', 'eu', 'agora', 'aqui', 'hoje', 'mais', 'favor', 'ai', 'la', 'ta', 'tá', 'entao', 'tipo', 'ne', 'uh', 'hum', 'ok', 'certo', 'isso', 'ja', 'acabei', 'acabou', 'cliente', 'reais', 'real', 'conto', 'contos', 'pila', 'na', 'verdade', 'corrigir', 'corrige', 'corrija', 'quantidade', 'quero', 'gostaria', 'me', 've', 'manda', 'mandar', 'dar', 'da', 'deu', 'levou', 'levaram', 'compraram', 'comprou']);

// Apelidos regionais confirmados nas diretrizes (escopo: só valem se o produto existir no cadastro).
// O nome falado continua valendo: o apelido só ajuda se o produtor não tiver um produto com aquele nome.
export const REGIONAL_ALIASES = { serraia: 'serralha', serraias: 'serralha', aipim: 'mandioca', macaxeira: 'mandioca' };

function parseDigits(token) {
  if (!/^\d+([.,]\d+)?$/.test(token)) return null;
  return Number(token.replace(',', '.'));
}

// Lê um número a partir de tokens[i]: dígitos ("250", "1,5") ou por extenso ("duzentos e cinquenta").
export function readNumber(tokens, i) {
  const digits = parseDigits(tokens[i] ?? '');
  if (digits !== null) return { value: digits, end: i + 1 };
  if (tokens[i] === 'meia' || tokens[i] === 'meio') return { value: 0.5, end: i + 1, half: true };
  let total = 0, current = 0, j = i, read = false;
  while (j < tokens.length) {
    const t = tokens[j];
    if (t in NUMBER_WORDS) { current += NUMBER_WORDS[t]; read = true; j++; continue; }
    if (t === 'mil' ) { total += (current || 1) * 1000; current = 0; read = true; j++; continue; }
    if (t === 'e' && read && j + 1 < tokens.length && (tokens[j + 1] in NUMBER_WORDS || tokens[j + 1] === 'meio' || tokens[j + 1] === 'meia')) {
      if (tokens[j + 1] === 'meio' || tokens[j + 1] === 'meia') { current += 0.5; j += 2; break; }
      j++; continue;
    }
    break;
  }
  return read ? { value: total + current, end: j } : null;
}

// ------------------------------------------------------------------ índice do catálogo

const UNIT_KEY = unit => normalize(unit).split(' ')[0];

function productTokens(product) {
  const words = new Set();
  for (const field of [product.name, product.baseName, product.type]) {
    for (const word of normalize(field).split(' ')) if (word && !/^\d/.test(word) && !FILLER.has(word)) words.add(singular(word));
  }
  return [...words];
}

export function buildIndex(products) {
  return (products || []).filter(p => p && p.id && p.name && !p.archived && !p.deleted).map(p => ({
    product: p, tokens: productTokens(p), nameTokens: normalize(p.name).split(' ').filter(Boolean).map(singular),
    unit: UNIT_KEY(p.unit), weight: Number(p.weight) || null, volume: Number(p.volume) || null,
  }));
}

const similar = (a, b) => {
  if (a === b) return true;
  if (a.length < 5 || b.length < 5 || Math.abs(a.length - b.length) > 1) return false;
  // Uma letra trocada/sobrando, para erros pequenos do reconhecimento ("serralha"/"serralia").
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
};

// ------------------------------------------------------------------ interpretação

const has = (tokens, ...words) => words.some(w => tokens.includes(w));

export function detectIntent(text) {
  const n = normalize(text), tokens = n.split(' ');
  if (!n) return 'empty';
  if (/^(cancela|cancelar|cancele|esquece|esqueca|deixa pra la|deixa)\b/.test(n)) return 'cancel';
  if (has(tokens, 'nao') ) return 'negation';
  if (/\?$/.test(String(text).trim()) || /^(quanto|quantos|quantas|qual|quais|quando|onde|como|tem|sera)\b/.test(n) || /\bquanto (da|fica|custa|e)\b/.test(n)) return 'question';
  if (has(tokens, 'ontem', 'anteontem') || /\b(semana|mes|ano) passad[oa]\b/.test(n) || /\bsemana retrasada\b/.test(n)) return 'past';
  if (/\bna verdade\b/.test(n) || /^(corrig|corrije|corrija|foram|era|eram|muda|mudar|troca|trocar)\b/.test(n)) return 'correction';
  return 'sale';
}

/** Extrai quantidade, medida, embalagem e as palavras do produto de uma frase. */
export function parseUtterance(text) {
  const tokens = normalize(text).replace(/(\d)(kg|g|ml|l)\b/g, '$1 $2').split(' ').filter(Boolean);
  let quantity = null, quantityHalfDozen = false, measure = null, pack = null, salesCount = false;
  const words = [];
  for (let i = 0; i < tokens.length;) {
    const t = tokens[i];
    // "meia dúzia" / "uma meia dúzia"
    if ((t === 'meia' || t === 'meio') && tokens[i + 1] && PACKAGE_OF[tokens[i + 1]] === 'duzia') {
      if (quantity === null || quantity === 1) { quantity = 0.5; quantityHalfDozen = true; }
      pack = 'duzia'; i += 2; continue;
    }
    const number = readNumber(tokens, i);
    if (number) {
      const next = tokens[number.end];
      const unit = next && MEASURE_OF[next];
      if (unit) {
        const grams = unit === 'kg' ? number.value * 1000 : unit === 'l' ? number.value * 1000 : number.value;
        measure = { kind: unit === 'g' || unit === 'kg' ? 'weight' : 'volume', value: grams };
        i = number.end + 1; continue;
      }
      // "três vendas de café": quantas vendas, não quantos itens.
      if (next && singular(next) === 'venda') { salesCount = true; quantity = number.value; i = number.end + 1; continue; }
      if (quantity === null) quantity = number.value;
      else if (!measure && number.value >= 50) measure = { kind: 'weight', value: number.value, implicit: true }; // "três cafés, duzentos e cinquenta"
      i = number.end; continue;
    }
    if (MEASURE_OF[t] && (t.length > 1 || (i > 0 && parseDigits(tokens[i - 1]) !== null))) {
      // "um quilo de…" já foi lido acima; "quilo de tomate" sem número = 1 kg.
      if (!measure && ['kg', 'l'].includes(MEASURE_OF[t])) measure = { kind: MEASURE_OF[t] === 'kg' ? 'weight' : 'volume', value: 1000 };
      i++; continue;
    }
    if (PACKAGE_OF[t]) { pack = pack || PACKAGE_OF[t]; words.push({ word: t, pack: PACKAGE_OF[t] }); i++; continue; }
    if (!FILLER.has(t)) words.push({ word: singular(t), alt: REGIONAL_ALIASES[t] ? singular(REGIONAL_ALIASES[t]) : null });
    i++;
  }
  return { quantity, quantityHalfDozen, measure, pack, salesCount, words };
}

function scoreProducts(index, words, pack) {
  const query = words.filter(w => !w.pack);
  // Uma palavra de embalagem que também está no nome ("molho de tomate") conta como nome.
  const named = [...query, ...words.filter(w => w.pack)];
  const fits = (w, token) => similar(w.word, token) || (w.alt && similar(w.alt, token));
  return index.map(entry => {
    const pool = entry.tokens;
    const matched = pool.filter(token => named.some(w => fits(w, token)));
    const extra = query.filter(w => !pool.some(token => fits(w, token))).length;
    const packOk = !pack || pack === 'unidade' || (PACKAGE_UNITS[pack] || []).includes(entry.unit) || entry.tokens.includes(pack);
    return { entry, matched: matched.length, full: matched.length === pool.length, extra, packOk };
  }).filter(s => s.matched > 0);
}

const describe = product => {
  const parts = [product.name];
  if (product.weight) parts.push(product.weight >= 1000 ? `${String(product.weight / 1000).replace('.', ',')} kg` : `${product.weight} g`);
  else if (product.volume) parts.push(product.volume >= 1000 ? `${String(product.volume / 1000).replace('.', ',')} L` : `${product.volume} ml`);
  return parts.join(' · ');
};

/**
 * Interpreta uma frase final. Resultado:
 *  { status: 'ok', productId, quantity, product, says }          proposta única (ainda sem registrar)
 *  { status: 'choose', candidates:[{id,label}], quantity, question }  falta escolher produto/apresentação
 *  { status: 'ask-quantity' | 'not-found' | 'negation' | 'question' | 'past' | 'cancel' | 'empty', message }
 *  { status: 'correction', quantity }                             nova quantidade para a proposta aberta
 */
export function interpret(text, products, options = {}) {
  const intent = detectIntent(text);
  const parsed = parseUtterance(text);
  if (intent === 'empty') return { status: 'empty', message: 'Não ouvi nada. Toque no microfone e fale.' };
  if (intent === 'cancel') return { status: 'cancel', message: 'Proposta cancelada. Nada foi registrado.' };
  if (intent === 'negation') return { status: 'negation', message: 'Entendi uma negação. Nada foi registrado.' };
  if (intent === 'question') return { status: 'question', message: 'Isso parece uma pergunta. Para vender, diga por exemplo “vendi três cafés”.' };
  if (intent === 'past') return { status: 'past', message: 'Essa venda é de outro dia. Por voz, o app registra só vendas de agora.' };
  if (parsed.salesCount) return { status: 'ask-quantity', message: 'Quantos itens foram vendidos ao todo? Diga, por exemplo, “vendi seis cafés”.' };

  const index = buildIndex(products);
  const scored = scoreProducts(index, parsed.words, parsed.pack);
  let quantity = parsed.quantity;

  if (intent === 'correction' && (!scored.length || options.pendingProductId)) {
    if (quantity === null) return { status: 'ask-quantity', message: 'Qual é a quantidade certa?' };
    return { status: 'correction', quantity, productId: options.pendingProductId || null };
  }
  if (!scored.length) return { status: 'not-found', message: parsed.words.length ? 'Não achei esse produto no seu cadastro. Repita ou escolha na lista.' : 'Qual produto? Diga, por exemplo, “vendi dois queijos”.' };

  // Melhor correspondência: nome completo antes de parcial; depois mais palavras em comum.
  const best = Math.max(...scored.map(s => (s.full ? 1000 : 0) + s.matched * 10 - s.extra));
  let pool = scored.filter(s => (s.full ? 1000 : 0) + s.matched * 10 - s.extra === best).map(s => s);
  const packMatches = pool.filter(s => s.packOk);
  if (packMatches.length) pool = packMatches;
  if (parsed.measure) {
    const exact = pool.filter(s => parsed.measure.kind === 'weight' ? s.entry.weight === parsed.measure.value : s.entry.volume === parsed.measure.value);
    if (exact.length) pool = exact;
  }
  // Mesma família com várias apresentações: perguntar qual, nunca escolher por popularidade.
  const sameFamily = (() => {
    const names = new Set(scored.filter(s => pool.includes(s) || s.full === pool[0].full && s.matched === pool[0].matched).map(s => s.entry.nameTokens.join(' ')));
    return names.size === 1;
  })();
  if (pool.length > 1 && !sameFamily) {
    const family = new Map(pool.map(s => [s.entry.product.id, s.entry.product]));
    return { status: 'choose', quantity, question: 'Qual produto?', candidates: [...family.values()].slice(0, 6).map(p => ({ id: p.id, label: describe(p) })) };
  }
  if (pool.length > 1) {
    const sizes = pool.map(s => s.entry.product).sort((a, b) => (a.weight || a.volume || 0) - (b.weight || b.volume || 0));
    return { status: 'choose', quantity, question: `É ${sizes.map(p => 'o de ' + describe(p).split(' · ')[1]).filter(Boolean).join(' ou ') || 'qual deles'}?`, candidates: sizes.map(p => ({ id: p.id, label: describe(p) })) };
  }
  const product = pool[0].entry.product;
  const unit = UNIT_KEY(product.unit);
  if (parsed.quantityHalfDozen) quantity = unit === 'duzia' ? 0.5 : unit.startsWith('meia') ? 1 : 6;
  if (quantity === null) quantity = parsed.pack || parsed.measure ? 1 : null;
  if (quantity === null) return { status: 'ask-quantity', productId: product.id, message: `Quantos ${product.name}?` };
  if (!(quantity > 0)) return { status: 'ask-quantity', productId: product.id, message: 'A quantidade precisa ser maior que zero.' };
  return { status: 'ok', productId: product.id, product, quantity, intent };
}
