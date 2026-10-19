/**
 * AGRO Gestão — Motor de Linguagem e Fala (pt-BR)
 * ------------------------------------------------
 * Normaliza, corrige, interpreta e prevê o que o produtor digita ou fala
 * ("vendi tres cafe especial a 25 no pics") e devolve um lançamento estruturado
 * + a frase corrigida ("Vendi 3 cafés especiais a R$ 25,00 cada, no Pix.").
 *
 * - ES Module, zero dependências, roda 100% offline (WebView/Capacitor, React, Node).
 * - O catálogo do app (2 mil+ produtos) é a FONTE PRIMÁRIA: chame motor.carregarCatalogo().
 * - O dicionário (dicionario_agro_ptbr.json) é a semente: gramática, erros, unidades, numerais.
 *
 * Autor do conteúdo: Alex Duvier / Território OS — versão 1.0.0 (19/10/2026)
 */

// ============================================================================
// 1. Utilidades de texto
// ============================================================================
const RX_MARCAS = /[̀-ͯ]/g;
export const semAcento = (s) => String(s ?? '').normalize('NFD').replace(RX_MARCAS, '').toLowerCase();

const PONTUACAO_CJK = {
  '，': ',', '。': '.', '、': ',', '；': ';', '：': ':', '？': '?', '！': '!', '“': '"', '”': '"', '‘': "'", '’': "'",
  '（': '(', '）': ')', '【': '[', '】': ']', '《': '"', '》': '"', '…': '...', '—': '-', '–': '-', '¥': ' R$ ', '￥': ' R$ ',
};

/** Limpa o que teclados chineses (Sogou, Baidu, iFlytek, teclados de fábrica OPPO/Xiaomi/Vivo) e o ditado podem injetar. */
export function limparEntrada(texto) {
  let t = String(texto ?? '');
  t = t.replace(/[​-‏⁠﻿­]/g, '');                         // zero-width, BOM, hífen suave
  t = t.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)); // ＡＢＣ１２３ → ABC123
  t = t.replace(/[　   ]/g, ' ');                               // espaços ideográficos / não separáveis
  t = t.replace(/[，。、；：？！“”‘’（）【】《》…—–¥￥]/g, (c) => PONTUACAO_CJK[c] ?? ' ');
  t = t.normalize('NFC');                                                           // acentos compostos → pré-compostos
  t = t.replace(/\p{Extended_Pictographic}|️/gu, ' ');                          // emojis
  return t.replace(/\s+/g, ' ').trim();
}

/** Chave fonética pt-BR: aproxima grafias que soam igual (quejo/kejo/queju → keju). */
export function chaveFonetica(palavra) {
  let w = String(palavra ?? '').toLowerCase().replace(/ç/g, 's');
  w = semAcento(w).replace(/[^a-z]/g, '');
  if (!w) return '';
  w = w.replace(/^h/, '').replace(/ph/g, 'f').replace(/y/g, 'i').replace(/w/g, 'u')
    .replace(/ch|sh/g, 'x').replace(/lh/g, 'li').replace(/nh/g, 'ni')
    .replace(/qu(?=[ei])/g, 'k').replace(/qu/g, 'ku').replace(/gu(?=[ei])/g, 'g')
    .replace(/c(?=[ei])/g, 's').replace(/c/g, 'k').replace(/g(?=[ei])/g, 'j')
    .replace(/ss/g, 's').replace(/rr/g, 'r').replace(/z$/, 's').replace(/z/g, 's')
    .replace(/sc(?=[ei])/g, 's').replace(/xc/g, 's')
    .replace(/aum$/, 'ao').replace(/am$/, 'ao').replace(/l$/, 'u')
    .replace(/ei/g, 'e').replace(/ou/g, 'o')
    .replace(/o$/, 'u').replace(/e$/, 'i')
    .replace(/(.)\1+/g, '$1');
  return w;
}

/** Singular aproximado (sem acento) — só para casar grafias, nunca para exibir. */
function singularBruto(w) {
  if (w.length <= 3) return w;
  if (/oes$|aes$/.test(w)) return w.slice(0, -3) + 'ao';
  if (/ais$/.test(w)) return w.slice(0, -3) + 'al';
  if (/eis$/.test(w) && w.length > 4) return w.slice(0, -3) + 'el';
  if (/ois$/.test(w)) return w.slice(0, -3) + 'ol';
  if (/ns$/.test(w)) return w.slice(0, -2) + 'm';
  if (/(r|z)es$/.test(w)) return w.slice(0, -2);
  if (/s$/.test(w) && !/(is|us|ss)$/.test(w)) return w.slice(0, -1);
  return w;
}
export const lema = (w) => chaveFonetica(singularBruto(semAcento(w)));

// --- Teclado (QWERTY): letras vizinhas custam menos ------------------------
const LINHAS = ['qwertyuiop', 'asdfghjklç', 'zxcvbnm'];
const VIZ = new Map();
LINHAS.forEach((linha, r) => [...linha].forEach((ch, c) => {
  const s = new Set();
  [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c], [r + 1, c - 1]].forEach(([rr, cc]) => {
    if (LINHAS[rr] && LINHAS[rr][cc]) s.add(LINHAS[rr][cc]);
  });
  VIZ.set(ch, s);
}));
const vizinhas = (a, b) => VIZ.get(a)?.has(b) ?? false;

/** Damerau-Levenshtein ponderado (vizinhança de teclado, letra dobrada, transposição). */
export function distancia(a, b, max = 3) {
  const la = a.length, lb = b.length;
  if (Math.abs(la - lb) > max) return Infinity;
  const d = Array.from({ length: la + 1 }, () => new Float32Array(lb + 1));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;
  for (let i = 1; i <= la; i++) {
    let menor = Infinity;
    for (let j = 1; j <= lb; j++) {
      const ca = a[i - 1], cb = b[j - 1];
      const sub = ca === cb ? 0 : vizinhas(ca, cb) ? 0.6 : 1;
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + sub);
      if (i > 1 && j > 1 && ca === b[j - 2] && a[i - 2] === cb) v = Math.min(v, d[i - 2][j - 2] + 0.7);
      if (i > 1 && ca === a[i - 2]) v = Math.min(v, d[i - 1][j] + 0.4); // "bananna"
      if (j > 1 && cb === b[j - 2]) v = Math.min(v, d[i][j - 1] + 0.4); // "toresmo"
      d[i][j] = v; if (v < menor) menor = v;
    }
    if (menor > max) return Infinity;
  }
  return d[la][lb];
}

// ============================================================================
// 2. Flexão (plural e concordância)
// ============================================================================
const PLURAIS_IRREGULARES = {
  'pão': 'pães', 'mão': 'mãos', 'irmão': 'irmãos', 'grão': 'grãos', 'cão': 'cães', 'alemão': 'alemães', 'capitão': 'capitães',
  'mel': 'méis', 'real': 'reais', 'gol': 'gols', 'mal': 'males', 'cônsul': 'cônsules', 'caráter': 'caracteres', 'júnior': 'juniores',
  'lápis': 'lápis', 'pires': 'pires', 'ônibus': 'ônibus', 'vírus': 'vírus', 'brócolis': 'brócolis', 'própolis': 'própolis', 'tórax': 'tórax',
  'kit': 'kits', 'drip': 'drip', 'gourmet': 'gourmet', 'mês': 'meses', 'gás': 'gases', 'país': 'países', 'cartão': 'cartões',
  'fácil': 'fáceis', 'útil': 'úteis', 'difícil': 'difíceis', 'açúcar': 'açúcares', 'mascavo': 'mascavos', 'arroz': 'arrozes', 'noz': 'nozes',
};
const INVARIAVEIS = new Set(['minas', 'meia', 'cura', 'gourmet', 'drip', 'canastra', 'parmesão', 'cascão', 'diet', 'light', 'zero', 'premium', 'tipo', 'extra', 'ora-pro-nóbis']);
const ADJETIVOS = new Set(['especial', 'caipira', 'caseiro', 'caseira', 'artesanal', 'torrado', 'torrada', 'moído', 'moída', 'curado', 'curada', 'congelado', 'congelada',
  'tradicional', 'verde', 'doce', 'orgânico', 'orgânica', 'integral', 'natural', 'temperado', 'temperada', 'defumado', 'defumada', 'recheado', 'recheada',
  'cremoso', 'cremosa', 'ralado', 'ralada', 'fresco', 'fresca', 'maduro', 'madura', 'colonial', 'mineiro', 'mineira', 'gelado', 'gelada', 'assado', 'assada',
  'frito', 'frita', 'inteiro', 'inteira', 'grande', 'pequeno', 'pequena', 'médio', 'média', 'coado', 'cru', 'crua', 'amanteigado', 'azedo', 'mimoso', 'aromática', 'aromático']);
const PREPOSICOES = new Set(['de', 'do', 'da', 'dos', 'das', 'em', 'com', 'sem', 'para', 'ao', 'à', 'no', 'na']);

/** Plural de uma palavra portuguesa (regras + exceções). */
export function pluralizarPalavra(w) {
  if (!w) return w;
  const low = w.toLowerCase();
  if (PLURAIS_IRREGULARES[low]) return casar(w, PLURAIS_IRREGULARES[low]);
  if (INVARIAVEIS.has(low) || /\d/.test(low)) return w;
  if (low.includes('-')) return w.split('-').map((p) => pluralizarPalavra(p)).join('-');
  let p;
  if (/ão$/.test(low)) p = low.replace(/ão$/, 'ões');
  else if (/[aeiouãõáéíóúâêô]$/.test(low)) p = low + 's';
  else if (/[áéó]l$/.test(low)) p = low.slice(0, -2) + { 'á': 'ais', 'é': 'éis', 'ó': 'óis' }[low.at(-2)];
  else if (/al$/.test(low)) p = low.slice(0, -1) + 'is';
  else if (/el$/.test(low)) p = low.slice(0, -2) + 'éis';
  else if (/ol$/.test(low)) p = low.slice(0, -2) + 'óis';
  else if (/ul$/.test(low)) p = low.slice(0, -1) + 'is';
  else if (/il$/.test(low)) p = low.slice(0, -1) + 's'; // fuzil → fuzis (oxítonas, maioria)
  else if (/m$/.test(low)) p = low.slice(0, -1) + 'ns';
  else if (/[rz]$/.test(low)) p = low + 'es';
  else if (/s$/.test(low)) p = /[áéíóúâêô]s$/.test(low) ? semAcentoFinal(low) + 'es' : low;
  else if (/x$/.test(low)) p = low;
  else p = low + 's';
  return casar(w, p);
}
const semAcentoFinal = (w) => w.replace(/[áéíóúâêô](?=s$)/, (c) => semAcento(c));
const casar = (modelo, novo) => (modelo[0] && modelo[0] === modelo[0].toUpperCase() && modelo[0] !== modelo[0].toLowerCase()) ? novo[0].toUpperCase() + novo.slice(1) : novo;

/** Plural de expressão: núcleo + adjetivos flexionam; o que vem depois de preposição não (pão de queijo → pães de queijo). */
export function pluralizarExpressao(expr) {
  const partes = String(expr).trim().split(/\s+/);
  let antesDaPreposicao = true;
  return partes.map((w, i) => {
    if (PREPOSICOES.has(w.toLowerCase())) { antesDaPreposicao = false; return w; }
    if (!antesDaPreposicao) return w;
    if (i === 0 || ADJETIVOS.has(w.toLowerCase())) return pluralizarPalavra(w);
    return w; // substantivo-tipo invariável (queijo minas, café gourmet)
  }).join(' ');
}
export function inferirGenero(nome) {
  const nucleo = semAcento(String(nome).split(/\s+/)[0]);
  if (/(a|ade|cao|gem|ice|ez)$/.test(nucleo) && !/(dia|mapa|cha|sofa)$/.test(nucleo)) return 'f';
  return 'm';
}

// ============================================================================
// 3. Números
// ============================================================================
const NUM_COMPOSTOS_E = new Set(['e']);
const fmtNum = (n) => Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000).replace('.', ',');
export const formatarReais = (v) => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function lerNumeroDigitado(tok) {
  if (!/^\d/.test(tok)) return null;
  let s = tok;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.'); // 1.500,00
  else if (/^\d+,\d+$/.test(s)) s = s.replace(',', '.');                                // 1,5
  else if (/^\d+\.\d{1,2}$/.test(s)) s = s;                                               // 25.50
  else if (/^\d+\.\d{3}$/.test(s)) s = s.replace('.', '');                                // 1.500
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const UNIDADES_EXTENSO = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS_EXTENSO = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS_EXTENSO = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
/** Número por extenso com gênero (para confirmação por voz/TTS): 2,'f' → "duas". */
export function numeroPorExtenso(n, genero = 'm') {
  n = Math.floor(Math.abs(n));
  const fem = (s) => genero === 'f' ? s.replace(/\bum\b/g, 'uma').replace(/\bdois\b/g, 'duas').replace(/entos\b/g, 'entas') : s;
  if (n < 20) return fem(UNIDADES_EXTENSO[n]);
  if (n < 100) { const d = Math.floor(n / 10), u = n % 10; return fem(DEZENAS_EXTENSO[d] + (u ? ' e ' + UNIDADES_EXTENSO[u] : '')); }
  if (n === 100) return 'cem';
  if (n < 1000) { const c = Math.floor(n / 100), r = n % 100; return fem(CENTENAS_EXTENSO[c] + (r ? ' e ' + numeroPorExtenso(r) : '')); }
  if (n < 1000000) {
    const m = Math.floor(n / 1000), r = n % 1000;
    const pre = m === 1 ? 'mil' : numeroPorExtenso(m, genero) + ' mil';
    return pre + (r ? ((r < 100 || r % 100 === 0) ? ' e ' : ' ') + numeroPorExtenso(r, genero) : '');
  }
  return String(n);
}

// ============================================================================
// 4. Motor
// ============================================================================
const PALAVRAS_FUNCIONAIS = ['de', 'do', 'da', 'dos', 'das', 'd', 'com', 'sem', 'em', 'no', 'na', 'nos', 'nas', 'e', 'a', 'o', 'os', 'as', 'um', 'uma', 'por', 'para', 'pra', 'pro',
  'cada', 'tudo', 'todo', 'toda', 'total', 'reais', 'real', 'r$', 'hoje', 'mais', 'mas', 'que', 'eu', 'ele', 'ela', 'nos', 'nós', 'gente', 'cliente', 'clientes', 'valor',
  'preço', 'custou', 'deu', 'fechou', 'ao', 'todo', 'via', 'pelo', 'pela', 'pago', 'paguei', 'x', 'kg', 'quilo', 'quilos', 'unidade', 'unidades', 'centavos', 'centavo', 'vezes', 'feira'];

const UNIDADES_COLETIVAS = new Set(['duzia', 'bandeja', 'caixa', 'saco', 'penca', 'cartela', 'kit']);
const UNIDADES_SIMBOLO = new Set(['kg', 'g', 'l', 'ml']);
const VERBO_SAIDA = {
  venda: 'Vendi', estoque_entrada: 'Levei', perda: 'Perdi', brinde: 'Dei de brinde', troca: 'Troquei',
  reposicao: 'Repus', fiado: 'Vendi fiado', recebimento: 'Recebi', cancelar: 'Cancelar',
};
const PAGAMENTO_SAIDA = { pix: 'no Pix', credito: 'no cartão de crédito', debito: 'no cartão de débito', cartao: 'no cartão', dinheiro: 'em dinheiro', fiado: 'fiado' };

export class MotorLinguagem {
  /**
   * @param {object} dicionario  conteúdo de dicionario_agro_ptbr.json
   * @param {object} [opcoes]
   * @param {{get:(k:string)=>any, set:(k:string,v:any)=>void}} [opcoes.armazenamento]  persistência da memória (SQLite/IndexedDB/Preferences). Padrão: localStorage protegido.
   * @param {string} [opcoes.chaveMemoria]
   */
  constructor(dicionario, opcoes = {}) {
    this.dic = dicionario;
    this.chaveMemoria = opcoes.chaveMemoria ?? 'agro_gestao_linguagem_v1';
    this.armazenamento = opcoes.armazenamento ?? armazenamentoPadrao();
    this.produtorAtual = null;
    this.produtos = new Map();        // id → produto
    this.indiceProduto = new Map();   // "lema lema" → id
    this.vocab = new Map();           // palavraSemAcento → { forma, peso, tipo }
    this.porFonetica = new Map();     // chaveFonetica → [palavraSemAcento]
    this.cacheCorrecao = new Map();
    this.memoria = this._lerMemoria();
    this._montarIndices();
  }

  // -------------------------------------------------------------- índices
  _addVocab(palavra, peso, tipo, forma = palavra) {
    const k = semAcento(palavra);
    if (!k || /[^a-z0-9$\-]/.test(k)) return;
    const atual = this.vocab.get(k);
    if (!atual || atual.peso < peso) this.vocab.set(k, { forma, peso, tipo });
    const f = chaveFonetica(k);
    if (f) { const l = this.porFonetica.get(f) ?? []; if (!l.includes(k)) l.push(k); this.porFonetica.set(f, l); }
  }
  _chaveExpr(expr) {
    return String(expr).replace(/-/g, ' ').split(/\s+/).filter(Boolean).map(lema).join(' ');
  }
  _indexarProduto(p) {
    const formas = [[p.nome, 3], [p.plural, 3], ...(p.sinonimos ?? []).map((x) => [x, 2]), ...(p.apelidos ?? []).map((x) => [x, 2]), ...(p.variantes ?? []).map((x) => [x, 1])].filter(([f]) => f);
    this.prioridadeIndice ??= new Map();
    for (const [f, prio] of formas) {
      const chaves = [[this._chaveExpr(f), prio], [this._chaveExpr(String(f).replace(/\s(de|do|da|em)\s/g, ' ')), prio - 0.5]];
      for (const [k, pr] of chaves) {
        const existente = this.indiceProduto.get(k);
        const prioAtual = this.prioridadeIndice.get(k) ?? -1;
        const bonus = p.origem === 'catalogo' ? 0.25 : 0;
        if (!existente || existente === p.id || pr + bonus > prioAtual) { this.indiceProduto.set(k, p.id); this.prioridadeIndice.set(k, Math.max(pr + bonus, existente === p.id ? prioAtual : -1)); }
      }
    }
    const canonicas = [p.nome, p.plural, ...(p.sinonimos ?? []), ...(p.apelidos ?? [])].filter(Boolean);
    for (const f of canonicas) String(f).replace(/-/g, ' ').split(/\s+/).forEach((w) => { if (w.length > 1 && !PREPOSICOES.has(w.toLowerCase())) this._addVocab(w.toLowerCase(), p.origem === 'catalogo' ? 3.2 : 3, 'produto', w.toLowerCase()); });
    // alinhamento palavra a palavra: "cafe espesial" ↔ "café especial" ensina espesial→especial
    const canon = String(p.nome).replace(/-/g, ' ').split(/\s+/);
    for (const v of p.variantes ?? []) {
      const vs = String(v).replace(/-/g, ' ').split(/\s+/);
      if (vs.length === canon.length) vs.forEach((w, i) => {
        const kw = semAcento(w), kc = semAcento(canon[i]);
        if (kw === kc || this.vocab.has(kw) || PREPOSICOES.has(kw) || PREPOSICOES.has(kc) || kw.length < 3) return;
        if (distancia(kw, kc, 3) <= Math.max(1.5, kc.length * 0.4)) this.vocab.set(kw, { forma: canon[i], peso: 2.5, tipo: 'erro' });
      });
      // palavras de variante não alinhadas ficam "conhecidas" (não são corrigidas para outra coisa)
      vs.forEach((w) => { const kw = semAcento(w); if (kw.length > 1 && !this.vocab.has(kw)) this._addVocab(kw, 1, 'variante', kw); });
    }
  }
  _montarIndices() {
    const d = this.dic;
    PALAVRAS_FUNCIONAIS.forEach((w) => this._addVocab(w, 1.5, 'funcional'));
    for (const p of d.produtos ?? []) { const q = { ...p, origem: 'semente' }; this.produtos.set(q.id, q); this._indexarProduto(q); }
    this.unidadePorPalavra = new Map();
    for (const u of d.unidades ?? []) {
      for (const f of [u.singular, u.plural, u.simbolo, ...(u.variantes ?? [])]) {
        const k = semAcento(f).replace(/\.$/, '');
        if (k) { this.unidadePorPalavra.set(k, u.id); this._addVocab(k, 2, 'unidade', k === semAcento(u.singular) || k === semAcento(u.plural) ? f : k); }
      }
    }
    this.unidades = new Map((d.unidades ?? []).map((u) => [u.id, u]));
    this.numerais = new Map(Object.entries(d.numerais ?? {}).map(([k, v]) => [semAcento(k), v]));
    for (const k of this.numerais.keys()) this._addVocab(k, 2, 'numeral');
    this.acaoPorGatilho = new Map(); this.acaoMulti = [];
    for (const [id, a] of Object.entries(d.acoes ?? {})) for (const g of a.gatilhos) {
      const k = semAcento(g); if (k.includes(' ')) this.acaoMulti.push([k.split(' '), id]); else { this.acaoPorGatilho.set(k, id); this._addVocab(k, 2, 'acao'); }
    }
    this.pagPorGatilho = new Map(); this.pagMulti = [];
    for (const [id, a] of Object.entries(d.pagamentos ?? {})) for (const g of a.gatilhos) {
      const k = semAcento(g); if (k.includes(' ')) this.pagMulti.push([k.split(' '), id]); else { if (!this.pagPorGatilho.has(k)) this.pagPorGatilho.set(k, id); this._addVocab(k, 2, 'pagamento'); }
    }
    this.abrev = new Map(Object.entries(d.abreviacoes ?? {}).map(([k, v]) => [semAcento(k), v]));
    this.preenchimento = new Set((d.preenchimento ?? []).map(semAcento));
    this.preenchimento.forEach((w) => { if (!w.includes(' ')) this._addVocab(w, 1.2, 'preenchimento'); });
    this.errosPalavra = new Map(); this.errosFrase = [];
    for (const e of d.erros ?? []) {
      const k = semAcento(e.errado);
      if (!k.includes(' ') && /^[a-z]+$/.test(k)) this.errosPalavra.set(k, e.correto); else this.errosFrase.push(e);
    }
    this.cacheCorrecao.clear();
  }

  /**
   * Mescla o catálogo do app (fonte primária). Aceita qualquer formato via mapeamento de campos.
   * @param {Array<object>} lista
   * @param {{id?:string,nome?:string,categoria?:string,unidade?:string,produtor?:string,apelidos?:string,plural?:string,genero?:string}} [campos]
   * @returns {{adicionados:number, mesclados:number, ignorados:number}}
   */
  carregarCatalogo(lista, campos = {}) {
    const c = { id: 'id', nome: 'nome', categoria: 'categoria', unidade: 'unidade', produtor: 'produtorId', apelidos: 'apelidos', plural: 'plural', genero: 'genero', ...campos };
    let adicionados = 0, mesclados = 0, ignorados = 0;
    for (const item of lista ?? []) {
      const nomeBruto = limparEntrada(item?.[c.nome] ?? '');
      if (!nomeBruto) { ignorados++; continue; }
      const nome = nomeBruto.toLowerCase();
      const chave = this._chaveExpr(nome);
      const idSemente = this.indiceProduto.get(chave);
      const semente = idSemente ? this.produtos.get(idSemente) : null;
      const id = String(item?.[c.id] ?? ('cat_' + chave.replace(/\s/g, '_')));
      const apelidos = [].concat(item?.[c.apelidos] ?? []).flatMap((a) => String(a).split(/[;,|]/)).map((a) => a.trim()).filter(Boolean);
      const p = {
        id, nome, origem: 'catalogo',
        plural: item?.[c.plural] ?? semente?.plural ?? pluralizarExpressao(nome),
        genero: item?.[c.genero] ?? semente?.genero ?? inferirGenero(nome),
        categoria: item?.[c.categoria] ?? semente?.categoria ?? 'outros',
        unidadePadrao: item?.[c.unidade] ?? semente?.unidadePadrao ?? 'unidade',
        contavel: semente?.contavel ?? true,
        variantes: [...(semente?.variantes ?? [])], sinonimos: [...(semente?.sinonimos ?? [])], apelidos,
        produtores: new Set([].concat(item?.[c.produtor] ?? []).filter(Boolean).map(String)),
        idSemente: semente?.id ?? null, original: item,
      };
      const ja = this.produtos.get(id);
      if (ja?.produtores) ja.produtores.forEach((x) => p.produtores.add(x));
      this.produtos.set(id, p);
      this._indexarProduto(p);
      if (semente) mesclados++; else adicionados++;
    }
    this.cacheCorrecao.clear();
    return { adicionados, mesclados, ignorados };
  }

  /** Define o produtor logado: os produtos dele ganham prioridade na previsão e nas keywords de voz. */
  definirProdutor(produtorId) { this.produtorAtual = produtorId == null ? null : String(produtorId); }

  // -------------------------------------------------------------- correção
  /** Corrige UMA palavra. Retorna {forma, tipo, custo} ou null se não souber. */
  corrigirPalavra(token) {
    const k = semAcento(token);
    if (!k || /^\d/.test(k) || k === 'r$') return null;
    if (this.cacheCorrecao.has(k)) return this.cacheCorrecao.get(k);
    let r = null;
    if (this.errosPalavra.has(k)) r = { forma: this.errosPalavra.get(k), tipo: 'dicionario', custo: 0 };
    else if (this.vocab.has(k)) { const v = this.vocab.get(k); r = { forma: v.forma, tipo: v.tipo === 'erro' ? 'dicionario' : 'exato', custo: 0 }; }
    else if (this.abrev.has(k)) r = { forma: this.abrev.get(k), tipo: 'abreviacao', custo: 0 };
    else if (k.length >= 3) {
      const f = chaveFonetica(k);
      const fon = this.porFonetica.get(f);
      if (fon?.length) {
        const melhor = fon.map((c) => ({ c, p: this.vocab.get(c).peso })).sort((a, b) => b.p - a.p)[0];
        r = { forma: this.vocab.get(melhor.c).forma, tipo: 'fonetica', custo: 0.5 };
      } else {
        const max = k.length <= 3 ? 0.6 : k.length <= 5 ? 1.0 : k.length <= 8 ? 1.6 : 2.2;
        let best = null;
        for (const [cand, info] of this.vocab) {
          if (Math.abs(cand.length - k.length) > 2 || cand.length < 3) continue;
          const dist = Math.min(distancia(k, cand, max), distancia(f, chaveFonetica(cand), max) + 0.3);
          if (dist <= max) {
            const score = dist - info.peso * 0.05;
            if (!best || score < best.score) best = { score, dist, cand, info };
          }
        }
        if (best) r = { forma: best.info.forma, tipo: 'aproximada', custo: best.dist };
      }
    }
    this.cacheCorrecao.set(k, r);
    return r;
  }

  /** Correção de texto livre (feedback, observações). Preserva o original (regra R16). */
  corrigirTexto(texto) {
    const original = limparEntrada(texto);
    let t = original;
    const correcoes = [];
    for (const e of this.errosFrase) {
      const rx = new RegExp('(^|[^\\p{L}])' + escaparRx(e.errado) + '(?=$|[^\\p{L}])', 'giu');
      if (rx.test(t)) { t = t.replace(rx, (m, p1) => p1 + e.correto); correcoes.push({ de: e.errado, para: e.correto, tipo: e.tipo, nota: e.nota }); }
    }
    t = t.replace(/\p{L}+/gu, (w) => {
      const r = this.corrigirPalavra(w);
      if (!r || r.tipo === 'exato' || r.tipo === 'abreviacao' || r.custo > 1.2) return w;
      if (semAcento(r.forma) === semAcento(w) && r.forma === w) return w;
      const nova = casar(w, r.forma);
      if (nova !== w) correcoes.push({ de: w, para: nova, tipo: r.tipo });
      return nova;
    });
    t = t.replace(/\bpix\b/gi, 'Pix').replace(/(^|[.!?]\s+)(\p{Ll})/gu, (m, a, b) => a + b.toUpperCase());
    return { original, texto: t, correcoes };
  }

  // -------------------------------------------------------------- tokenização
  _tokenizar(texto) {
    let t = limparEntrada(texto).toLowerCase();
    t = t.replace(/(\d)\s*(kgs?|kilos?|quilos?|g|gr|grs|l|lts?|ml|dz|un|und|pct|pcts|cx|x)\b/g, '$1 $2')
      .replace(/r\s*\$\s*/g, ' r$ ').replace(/(\d)\s*(reais|real|conto|contos|pila)\b/g, '$1 $2')
      .replace(/\b1\/2\b/g, ' meio ').replace(/\s+/g, ' ');
    const rx = /r\$|\d+(?:[.,]\d+)*|[\p{L}]+(?:-[\p{L}]+)*|[,;+\/]/gu;
    return [...t.matchAll(rx)].map((m) => ({ bruto: m[0], ini: m.index, fim: m.index + m[0].length }));
  }

  _normalizarTokens(tokens) {
    const correcoes = [];
    const out = tokens.map((tk) => {
      const k = semAcento(tk.bruto);
      if (/^\d/.test(k) || /^[,;+\/]$/.test(k) || k === 'r$') return { ...tk, k, forma: tk.bruto };
      if (this.numerais.has(k) || this.unidadePorPalavra.has(k) || this.acaoPorGatilho.has(k) || this.pagPorGatilho.has(k)) return { ...tk, k, forma: tk.bruto };
      const r = this.corrigirPalavra(tk.bruto);
      if (!r) return { ...tk, k, forma: tk.bruto, desconhecida: true };
      const fk = semAcento(r.forma);
      if (fk !== k) correcoes.push({ de: tk.bruto, para: r.forma, tipo: r.tipo });
      if (fk.includes(' ')) return { ...tk, k: fk.split(' ')[0], forma: r.forma, extra: fk.split(' ').slice(1), custo: r.custo };
      return { ...tk, k: fk, forma: r.forma, custo: r.custo };
    });
    // expande abreviações multi-palavra ("pro" → "para o")
    const exp = [];
    out.forEach((t) => { exp.push(t); (t.extra ?? []).forEach((e) => exp.push({ ...t, k: e, forma: e, extra: undefined })); });
    return { tokens: exp, correcoes };
  }

  _casarProduto(toks, i) {
    for (let n = Math.min(6, toks.length - i); n >= 1; n--) {
      const janela = toks.slice(i, i + n);
      if (janela.some((t) => /^\d/.test(t.k) || /^[,;+\/]$/.test(t.k))) continue;
      const chave = janela.map((t) => lema(t.k)).join(' ');
      const id = this.indiceProduto.get(chave);
      if (id) return { id, n };
    }
    return null;
  }

  _lerQuantidade(toks, i) {
    const t = toks[i];
    const dig = lerNumeroDigitado(t.k);
    if (dig != null) {
      let n = 1;
      if (toks[i + 1]?.k === 'x' ) n = 2;
      return { valor: dig, n, digitado: true };
    }
    if (!this.numerais.has(t.k)) return null;
    // "uma dúzia e meia", "vinte e cinco", "cento e vinte", "dois mil"
    let total = 0, atual = 0, j = i, usou = false;
    while (j < toks.length) {
      const k = toks[j].k;
      if (this.numerais.has(k) && !(k === 'meia' || k === 'meio') ) {
        const v = this.numerais.get(k);
        if (v === 1000) { atual = (atual || 1) * 1000; total += atual; atual = 0; }
        else atual += v;
        usou = true; j++;
        if (toks[j]?.k === 'e' && this.numerais.has(toks[j + 1]?.k) && !['meia', 'meio'].includes(toks[j + 1]?.k)) { j++; continue; }
        if (this.numerais.has(toks[j]?.k) && !['meia', 'meio'].includes(toks[j]?.k)) continue;
        break;
      }
      if ((k === 'meia' || k === 'meio') && !usou) { return { valor: 0.5, n: 1 }; }
      break;
    }
    if (!usou) return null;
    return { valor: total + atual, n: j - i };
  }

  _casarMulti(lista, toks, i) {
    for (const [seq, id] of lista) if (seq.every((w, d) => toks[i + d]?.k === w)) return { id, n: seq.length };
    return null;
  }

  // -------------------------------------------------------------- interpretação
  /**
   * Interpreta uma frase de lançamento.
   * @returns {{acao:string, acaoRotulo:string, itens:Array, pagamento:string|null, totalGeral:number|null, total:number|null,
   *            textoOriginal:string, textoCorrigido:string, correcoes:Array, confianca:number, pendencias:string[]}}
   */
  interpretar(texto) {
    const textoOriginal = limparEntrada(texto);
    const { tokens: toks, correcoes } = this._normalizarTokens(this._tokenizar(textoOriginal));
    let acao = null, pagamento = null, totalGeral = null;
    const itens = []; const pendencias = []; const ignorados = [];
    let atual = null, qtdPendente = null, unidadePendente = null, marcadorPreco = null, flagTudo = false, ultimoPreco = null;
    const pagamentosParciais = [];
    const novoItem = () => ({ produtoId: null, produto: null, quantidade: null, unidade: null, precoUnitario: null, precoTotal: null, precoTipo: null });
    const fecharItem = () => { if (atual && (atual.produtoId || atual.quantidade != null)) itens.push(atual); atual = null; };

    for (let i = 0; i < toks.length; i++) {
      const t = toks[i], k = t.k;
      // ação
      const am = this._casarMulti(this.acaoMulti, toks, i);
      if (am) { acao ??= am.id; i += am.n - 1; continue; }
      if (this.acaoPorGatilho.has(k) && !(k === 'venda' && atual)) {
        const id = this.acaoPorGatilho.get(k);
        if (id === 'fiado') { pagamento ??= 'fiado'; acao ??= 'fiado'; } else acao ??= id;
        continue;
      }
      // pagamento
      const pm = this._casarMulti(this.pagMulti, toks, i);
      if (pm) { pagamento = pm.id; i += pm.n - 1; continue; }
      if (this.pagPorGatilho.has(k)) {
        const id = this.pagPorGatilho.get(k);
        if (!(pagamento && id === 'cartao' && (pagamento === 'credito' || pagamento === 'debito'))) pagamento = (pagamento === 'cartao' && (id === 'credito' || id === 'debito')) ? id : (pagamento && id === 'cartao' ? pagamento : id);
        continue;
      }
      // marcadores de total
      if (['tudo', 'total', 'deu', 'fechou'].includes(k) || (k === 'ao' && toks[i + 1]?.k === 'todo')) {
        if (k === 'tudo' && (toks[i - 1] && this.acaoPorGatilho.has(toks[i - 1].k))) { flagTudo = true; continue; }
        if (ultimoPreco && ultimoPreco.item === atual && itens.length > 0 && ['total', 'tudo'].includes(k)) { // "... por 70 total"
          totalGeral = atual.precoTotal ?? atual.precoUnitario; atual.precoTotal = null; atual.precoUnitario = null; atual.precoTipo = null; ultimoPreco = null; continue;
        }
        marcadorPreco = 'total_geral'; if (k === 'ao') i++; continue;
      }
      if (k === 'cada' || (k === 'a' && ['unidade', 'peca'].includes(toks[i + 1]?.k))) {
        if (atual?.precoTotal != null && atual.precoTipo === 'total_assumido') { atual.precoUnitario = atual.precoTotal; atual.precoTotal = null; atual.precoTipo = 'unitario'; }
        else if (atual?.precoTipo !== 'unitario') marcadorPreco = 'unitario';
        if (k === 'a') i++; continue;
      }
      if ((k === 'o' || k === 'por') && ['kg', 'quilo'].includes(semAcento(toks[i + 1]?.k ?? '')) && atual?.precoUnitario != null) { atual.precoTipo = 'por_kg'; i++; continue; }
      if (k === 'r$' || ((k === 'a' || k === 'por' || k === 'de' || k === 'custou' || k === 'valor') && (lerNumeroDigitado(toks[i + 1]?.k ?? '') != null || toks[i + 1]?.k === 'r$') && atual?.produtoId)) {
        if (k === 'a') marcadorPreco = 'unitario'; else if (k === 'por') marcadorPreco = marcadorPreco ?? 'total';
        continue;
      }
      // produto (tenta antes de número/unidade: "queijo meia cura", "molho de tomate")
      const pr = this._casarProduto(toks, i);
      if (pr && !(pr.n === 1 && (this.unidadePorPalavra.has(k) || this.numerais.has(k)))) {
        if (atual?.produtoId) fecharItem();
        atual ??= novoItem();
        atual.produtoId = pr.id; atual.produto = this.produtos.get(pr.id);
        if (qtdPendente != null) { atual.quantidade = qtdPendente; qtdPendente = null; }
        if (unidadePendente) { atual.unidade = unidadePendente; unidadePendente = null; }
        i += pr.n - 1; continue;
      }
      // número: quantidade ou preço
      const q = this._lerQuantidade(toks, i);
      if (q) {
        const proximo = toks[i + q.n]?.k;
        // pagamento dividido: "<n> no crédito e <n> no Pix"
        const viaPag = ['no', 'na', 'em', 'pelo', 'pela'].includes(proximo) ? this.pagPorGatilho.get(toks[i + q.n + 1]?.k) : this.pagPorGatilho.get(proximo);
        if (viaPag && atual?.produtoId && atual.quantidade != null && !marcadorPreco && toks[i - 1]?.k !== 'r$'
            && q.valor < atual.quantidade && Number.isInteger(q.valor)) {
          pagamentosParciais.push({ quantidade: q.valor, forma: viaPag });
          i += q.n + (['no', 'na', 'em', 'pelo', 'pela'].includes(proximo) ? 1 : 0); continue;
        }
        // número logo após produto sem quantidade ("queijo 3"): quantidade se for inteiro pequeno sem moeda
        if (atual?.produtoId && atual.quantidade == null && !marcadorPreco && toks[i - 1]?.k !== 'r$' && Number.isInteger(q.valor) && q.valor <= 12
            && !['reais', 'real', 'conto', 'contos', 'pila'].includes(proximo) && !this._casarProduto(toks, i + q.n)) {
          atual.quantidade = q.valor; pendencias.push(`Confirme: ${fmtNum(q.valor)} é a QUANTIDADE de ${atual.produto.nome} (e não o preço)?`);
          i += q.n - 1; continue;
        }
        const ehPreco = marcadorPreco || toks[i - 1]?.k === 'r$' || ['reais', 'real', 'conto', 'contos', 'pila', 'centavos'].includes(proximo)
          || (atual?.produtoId && !this.unidadePorPalavra.has(proximo) && !this._casarProduto(toks, i + q.n));
        if (ehPreco) {
          let valor = q.valor;
          let n = q.n;
          if (['reais', 'real', 'conto', 'contos', 'pila'].includes(proximo)) {
            n++; const c = toks[i + n]?.k === 'e' ? this._lerQuantidade(toks, i + n + 1) : null; // "vinte reais e cinquenta"
            if (c && ['centavos', 'centavo'].includes(toks[i + n + 1 + c.n]?.k)) { valor += c.valor / 100; n += c.n + 2; }
          }
          let tipo = marcadorPreco ?? 'total_assumido';
          if (tipo === 'total_geral') { if (itens.length > 0 || !atual) { totalGeral = valor; marcadorPreco = null; i += n - 1; continue; } tipo = 'total'; }
          if (!atual) totalGeral = valor;
          else {
            if (tipo === 'unitario') { atual.precoUnitario = valor; atual.precoTipo = 'unitario'; }
            else { atual.precoTotal = valor; atual.precoTipo = tipo; }
            ultimoPreco = { item: atual };
          }
          marcadorPreco = null; i += n - 1; continue;
        }
        // é quantidade
        if (atual?.produtoId) fecharItem();
        let valor = q.valor; let n = q.n;
        // "uma dúzia e meia"
        const un = this.unidadePorPalavra.get(semAcento(toks[i + n]?.k ?? ''));
        if (un && toks[i + n + 1]?.k === 'e' && ['meia', 'meio'].includes(toks[i + n + 2]?.k)) { valor += 0.5; toks.splice(i + n + 1, 2); }
        if (atual && atual.produtoId == null) atual.quantidade = valor; else qtdPendente = valor;
        i += n - 1; continue;
      }
      // unidade
      const u = this.unidadePorPalavra.get(k);
      if (u) {
        if (atual?.produtoId && atual.unidade == null && atual.quantidade != null) atual.unidade = u;
        else unidadePendente = u;
        if (toks[i + 1]?.k === 'de' || toks[i + 1]?.k === 'd') i++;
        continue;
      }
      if (/^[,;+\/]$/.test(k) || k === 'e' || k === 'mais') {
        const n1 = toks[i + 1], n2 = toks[i + 2], n3 = toks[i + 3];
        const continuaPagamento = pagamentosParciais.length && n1 && lerNumeroDigitado(n1.k) != null
          && (this.pagPorGatilho.has(n2?.k) || (['no', 'na', 'em'].includes(n2?.k) && this.pagPorGatilho.has(n3?.k)));
        if (!continuaPagamento && atual?.produtoId) fecharItem();
        continue;
      }
      // elipse: "2 bolos de fubá e 1 de cenoura" → bolo de cenoura
      if ((k === 'de' || k === 'd') && qtdPendente != null && itens.length) {
        const cabeca = this.produtos.get(itens.at(-1).produtoId)?.nome.split(/\s(?:de|do|da)\s/)[0];
        let achou = null;
        if (cabeca) for (let n = Math.min(4, toks.length - i - 1); n >= 1 && !achou; n--) {
          const chave = [...cabeca.replace(/-/g, ' ').split(/\s+/).map(lema), lema('de'), ...toks.slice(i + 1, i + 1 + n).map((t) => lema(t.k))].join(' ');
          const id = this.indiceProduto.get(chave); if (id) achou = { id, n };
        }
        if (achou) {
          atual = novoItem(); atual.produtoId = achou.id; atual.produto = this.produtos.get(achou.id);
          atual.quantidade = qtdPendente; qtdPendente = null; if (unidadePendente) { atual.unidade = unidadePendente; unidadePendente = null; }
          i += achou.n; continue;
        }
      }
      if (t.desconhecida && !this.preenchimento.has(k) && k.length > 2) ignorados.push(t.bruto);
    }
    fecharItem();
    if (qtdPendente != null && !itens.length) pendencias.push('Quantidade sem produto: qual produto?');

    // pós-processamento
    if (!acao && itens.length) acao = 'venda';
    acao ??= 'desconhecida';
    for (const it of itens) {
      if (it.quantidade == null) it.quantidade = flagTudo ? null : 1;
      if (flagTudo) pendencias.push(`"Tudo" de ${it.produto?.nome}: confirme a quantidade vendida (estoque).`);
      if (it.precoTipo === 'total_assumido' && it.quantidade > 1) pendencias.push(`${formatarReais(it.precoTotal)} é o valor TOTAL de ${it.produto.plural}? (se for por unidade, toque em "cada")`);
      if (it.precoTipo === 'total_assumido') it.precoTipo = 'total';
      if (it.precoTipo === 'unitario' && it.quantidade != null) it.precoTotal = round2(it.precoUnitario * it.quantidade);
      if (it.precoTipo === 'por_kg') it.precoTotal = it.unidade === 'kg' ? round2(it.precoUnitario * it.quantidade) : null;
      if (it.precoTipo === 'total' && it.quantidade) it.precoUnitario = round2(it.precoTotal / it.quantidade);
      it.unidade ??= null;
      const f = this.unidades.get(it.unidade)?.fator ?? 1;
      it.quantidadeBase = it.quantidade != null ? it.quantidade * f : null;
      it.nome = it.produto?.nome; it.categoria = it.produto?.categoria;
      if (!it.produtoId) pendencias.push('Produto não reconhecido.');
      // sugere último preço praticado
      const mem = this.memoria.produtos[it.produtoId];
      if (it.precoUnitario == null && it.precoTotal == null && mem?.ultimoPreco) it.precoSugerido = mem.ultimoPreco;
    }
    if (pagamentosParciais.length) pagamento = new Set(pagamentosParciais.map((p) => p.forma)).size > 1 ? 'misto' : pagamentosParciais[0].forma;
    const somaItens = itens.every((i) => i.precoTotal != null) && itens.length ? round2(itens.reduce((s, i) => s + i.precoTotal, 0)) : null;
    if (totalGeral != null && itens.length === 1 && itens[0].precoTotal == null) {
      itens[0].precoTotal = totalGeral; itens[0].precoTipo = 'total'; itens[0].precoUnitario = itens[0].quantidade ? round2(totalGeral / itens[0].quantidade) : null; totalGeral = null;
    }
    const total = totalGeral ?? somaItens;
    if (totalGeral != null && somaItens != null && Math.abs(totalGeral - somaItens) > 0.009) pendencias.push(`Soma dos itens (${formatarReais(somaItens)}) difere do total informado (${formatarReais(totalGeral)}).`);
    if (ignorados.length) pendencias.push(`Palavras não entendidas: ${ignorados.join(', ')}`);
    if (acao === 'venda' && !pagamento) pendencias.push('Forma de pagamento não informada.');

    const custoCorr = correcoes.reduce((s, c) => s + (c.tipo === 'aproximada' ? 0.08 : c.tipo === 'fonetica' ? 0.04 : 0.01), 0);
    let confianca = 1 - custoCorr - ignorados.length * 0.15 - pendencias.filter((p) => !p.startsWith('Forma de pagamento')).length * 0.1;
    if (!itens.length && acao !== 'cancelar') confianca = Math.min(confianca, 0.2);
    confianca = Math.max(0, Math.min(1, round2(confianca)));

    const res = {
      acao, acaoRotulo: this.dic.acoes?.[acao]?.rotulo ?? 'Não identificada',
      itens: itens.map(({ produto, ...r }) => r), pagamento, pagamentosParciais, pagamentoRotulo: pagamento === 'misto' ? 'Pagamento dividido' : pagamento ? this.dic.pagamentos?.[pagamento]?.rotulo : null,
      totalGeral, total, textoOriginal, correcoes, confianca, pendencias,
    };
    res.textoCorrigido = this.montarFrase(res);
    return res;
  }

  /** Frase canônica com concordância (R01–R10). */
  formatarItem(it) {
    const p = this.produtos.get(it.produtoId);
    const nomeProd = p?.nome ?? it.nome ?? 'produto';
    const q = it.quantidade;
    const u = it.unidade ? this.unidades.get(it.unidade) : null;
    let s;
    if (q == null) s = `todo o estoque de ${nomeProd}`;
    else if (u && u.id !== 'unidade') {
      const usaPluralProd = UNIDADES_COLETIVAS.has(u.id) && p?.contavel !== false;
      const prod = usaPluralProd ? (p?.plural ?? pluralizarExpressao(nomeProd)) : nomeProd;
      if (u.id === 'duzia' && q === 0.5) s = `meia dúzia de ${prod}`;
      else if (q === 0.5 && u.id !== 'g' && u.id !== 'ml') s = `${u.genero === 'f' ? 'meia' : 'meio'} ${u.singular} de ${prod}`;
      else if (UNIDADES_SIMBOLO.has(u.id)) s = `${fmtNum(q)} ${u.simbolo} de ${prod}`;
      else if (q === 0.5) s = `${u.genero === 'f' ? 'meia' : 'meio'} ${u.singular} de ${prod}`;
      else s = `${fmtNum(q)} ${q >= 2 ? u.plural : u.singular} de ${prod}`;
    } else {
      s = `${fmtNum(q)} ${q >= 2 ? (p?.plural ?? pluralizarExpressao(nomeProd)) : nomeProd}`;
    }
    if (it.precoTipo === 'unitario' && it.precoUnitario != null) s += ` a ${formatarReais(it.precoUnitario)} ${u && UNIDADES_SIMBOLO.has(u.id) ? 'o ' + u.simbolo : 'cada'}`;
    else if (it.precoTipo === 'por_kg') s += ` a ${formatarReais(it.precoUnitario)} o kg`;
    else if (it.precoTotal != null) s += ` por ${formatarReais(it.precoTotal)}`;
    return s;
  }

  montarFrase(r) {
    if (r.acao === 'cancelar') return 'Cancelar o último lançamento.';
    if (!r.itens?.length) return '';
    const partes = r.itens.map((it) => this.formatarItem(it));
    const lista = partes.length === 1 ? partes[0] : partes.slice(0, -1).join(', ') + ' e ' + partes.at(-1);
    let verbo = VERBO_SAIDA[r.acao] ?? 'Registrei';
    if (r.acao === 'sobra') verbo = (r.itens.length > 1 || (r.itens[0].quantidade ?? 0) >= 2) ? 'Sobraram' : 'Sobrou';
    if (r.acao === 'fiado') verbo = 'Vendi';
    let frase = `${verbo} ${lista}`;
    if (r.totalGeral != null) frase += `, total de ${formatarReais(r.totalGeral)}`;
    if (r.pagamento === 'misto' || r.pagamentosParciais?.length > 1) {
      const ps = r.pagamentosParciais.map((p) => `${fmtNum(p.quantidade)} ${PAGAMENTO_SAIDA[p.forma]}`);
      return `${frase}, sendo ${ps.slice(0, -1).join(', ')} e ${ps.at(-1)}.`;
    }
    if (r.pagamento && !(r.acao !== 'venda' && r.acao !== 'fiado' && r.acao !== 'recebimento')) frase += r.pagamento === 'fiado' ? ', fiado' : `, ${PAGAMENTO_SAIDA[r.pagamento]}`;
    return frase + '.';
  }

  /** Frase para o app LER EM VOZ ALTA na confirmação (números por extenso com gênero). */
  fraseParaFalar(r) {
    return (r.textoCorrigido || this.montarFrase(r))
      .replace(/R\$ (\d+(?:\.\d{3})*),(\d{2})/g, (m, a, b) => {
        const reais = Number(a.replace(/\./g, '')), cent = Number(b);
        return `${numeroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}${cent ? ' e ' + numeroPorExtenso(cent) + ' centavos' : ''}`;
      })
      .replace(/\b(\d+)\s+(\p{L}+)/gu, (m, n, w) => {
        const g = this._generoDaPalavra(w);
        return `${numeroPorExtenso(Number(n), g)} ${w}`;
      })
      .replace(/\bkg\b/g, 'quilos').replace(/\bPix\b/g, 'Pix');
  }
  _generoDaPalavra(w) {
    const k = semAcento(w);
    for (const u of this.unidades.values()) if ([u.singular, u.plural].map(semAcento).includes(k)) return u.genero;
    for (const p of this.produtos.values()) if (semAcento(p.nome.split(' ')[0]) === k || semAcento(p.plural.split(' ')[0]) === k) return p.genero;
    return inferirGenero(w);
  }

  // -------------------------------------------------------------- previsão
  /**
   * Sugestões enquanto digita.
   * @param {string} texto  conteúdo do campo
   * @param {{limite?:number}} [op]
   * @returns {{modo:'completar'|'proxima', sugestoes:Array<{texto:string, tipo:string, substituir:{inicio:number,fim:number}, score:number}>}}
   */
  prever(texto, op = {}) {
    const limite = op.limite ?? this.dic.regras_previsao?.limites?.sugestoes_max ?? 5;
    const bruto = String(texto ?? '');
    const terminaEspaco = /\s$/.test(bruto) || bruto === '';
    const toks = this._normalizarTokens(this._tokenizar(bruto)).tokens;
    const parcial = terminaEspaco ? null : toks.at(-1);
    const contexto = parcial ? toks.slice(0, -1) : toks;
    const estadoAnterior = this._estado(contexto, false);
    const estado = this._estado(parcial ? toks : contexto, !!parcial);
    const plural = (estado.qtd ?? 1) >= 2;
    const fimTexto = bruto.length;
    const sug = [];
    const add = (textoS, tipo, score, inicio = fimTexto) => sug.push({ texto: textoS, tipo, score, substituir: { inicio, fim: fimTexto } });

    if (parcial) {
      // prefixo do produto pode ter mais de uma palavra ("vendi 3 cafe es")
      const inicioProd = estado.inicioProdutoParcial ?? parcial.ini;
      const prefixo = semAcento(bruto.slice(inicioProd).trim()).replace(/-/g, ' ');
      const prefFon = chaveFonetica(prefixo.split(' ')[0]);
      const fonetica = [];
      for (const p of this.produtos.values()) {
        const nome = (plural && !estado.aposUnidade) || estado.unidadeColetiva ? p.plural : p.nome;
        const alvo = semAcento(nome).replace(/-/g, ' ');
        const outros = [p.nome, p.plural, ...(p.sinonimos ?? []), ...(p.apelidos ?? [])].map((x) => semAcento(x).replace(/-/g, ' '));
        const casa = alvo.startsWith(prefixo) ? 1 : outros.some((o) => o.startsWith(prefixo)) ? 0.85 : 0;
        if (casa) add(nome, 'produto', casa * this._pesoSlot(estado, 'produto') + this._pesoMemoria(p.id) + (this.produtorAtual && p.produtores?.has(this.produtorAtual) ? 0.3 : 0), inicioProd);
        else if (prefixo.length >= 3 && !prefixo.includes(' ') && (lema(alvo.split(' ')[0]).startsWith(prefFon) || lema(alvo.split(' ')[0]).startsWith(lema(prefixo)))) fonetica.push([nome, p]);
      }
      if (!sug.some((x) => x.tipo === 'produto')) fonetica.forEach(([nome, p]) => add(nome, 'produto', 0.6 + this._pesoMemoria(p.id), inicioProd));
      const kp = semAcento(parcial.bruto);
      const produtoMulti = inicioProd < parcial.ini && sug.length > 0;
      if (!produtoMulti) for (const u of this.unidades.values()) for (const f of [plural ? u.plural : u.singular]) if (semAcento(f).startsWith(kp)) add(f, 'unidade', this._pesoSlot(estado, 'unidade'), parcial.ini);
      if (!produtoMulti) for (const [id, a] of Object.entries(this.dic.pagamentos ?? {})) if (semAcento(a.rotulo).startsWith(kp) || a.gatilhos.some((g) => semAcento(g).startsWith(kp) && kp.length >= 2)) add(PAGAMENTO_SAIDA[id].replace(/^(no|em) /, ''), 'pagamento', this._pesoSlot(estado, 'pagamento') + this._pesoPagamento(id), parcial.ini);
      if (estadoAnterior.slot === 'inicio') for (const v of ['vendi', 'sobrou', 'sobraram', 'levei', 'perdi', 'troquei', 'recebi', 'cancelar']) if (v.startsWith(kp)) add(v, 'acao', 0.9, parcial.ini);
      const corr = this.corrigirPalavra(parcial.bruto);
      if (corr && corr.tipo !== 'exato' && kp.length >= 3 && !sug.some((s) => semAcento(s.texto).startsWith(semAcento(corr.forma)))) add(corr.forma, 'correcao', 0.5, parcial.ini);
      return { modo: 'completar', sugestoes: dedupe(sug).sort((a, b) => b.score - a.score).slice(0, limite) };
    }

    // próxima palavra
    if (estado.fraseProduto) {
      const pref = semAcento(estado.fraseProduto).replace(/-/g, ' ') + ' ';
      for (const p of this.produtos.values()) {
        const exibir = estado.qtdPlural && !estado.aposUnidade ? p.plural : (estado.unidadeColetiva ? p.plural : p.nome);
        const casa = [p.nome, p.plural].some((f) => { const a = semAcento(f).replace(/-/g, ' '); return a.startsWith(pref) && a.length > pref.length; });
        if (casa) add(exibir, 'produto', 1 + this._pesoMemoria(p.id), estado.inicioFraseProduto);
      }
      if (sug.length && !estado.produtoId) return { modo: 'proxima', sugestoes: dedupe(sug).sort((a, b) => b.score - a.score).slice(0, limite) };
    }
    const topProdutos = (n) => [...this.produtos.values()]
      .map((p) => ({ p, s: this._pesoMemoria(p.id) + (this.produtorAtual && p.produtores?.has(this.produtorAtual) ? 0.6 : 0) }))
      .sort((a, b) => b.s - a.s).slice(0, n);
    switch (estado.slot) {
      case 'inicio': ['Vendi', 'Sobrou', 'Levei', 'Perdi', 'Recebi'].forEach((v, i) => add(v, 'acao', 1 - i * 0.1)); break;
      case 'acao': case 'e':
        ['1', '2', '3', 'meia dúzia'].forEach((v, i) => add(v, 'quantidade', 0.9 - i * 0.1));
        topProdutos(3).forEach(({ p, s }) => add(p.nome, 'produto', 0.5 + s)); break;
      case 'quantidade': {
        topProdutos(4).forEach(({ p, s }) => add(plural ? p.plural : p.nome, 'produto', 0.7 + s));
        ['kg', 'dúzia', 'pacote', 'pote'].forEach((uid, i) => {
          const u = [...this.unidades.values()].find((x) => x.simbolo === uid || x.singular === uid);
          if (u) add(UNIDADES_SIMBOLO.has(u.id) ? u.simbolo : (plural ? u.plural : u.singular), 'unidade', 0.6 - i * 0.05);
        });
        break;
      }
      case 'unidade': add('de', 'conector', 1); break;
      case 'de': {
        const uSing = this.unidades.get(estado.unidadeId)?.singular;
        [...this.produtos.values()]
          .map((p) => ({ p, s: this._pesoMemoria(p.id) + (p.unidadePadrao === uSing || p.unidadePadrao === estado.unidadeId ? 0.5 : 0) + (this.produtorAtual && p.produtores?.has(this.produtorAtual) ? 0.6 : 0) }))
          .sort((a, b) => b.s - a.s).slice(0, 8)
          .forEach(({ p, s }) => add(estado.unidadeColetiva ? p.plural : p.nome, 'produto', 0.7 + s));
        break;
      }
      case 'produto': {
        const ult = estado.produtoId ? this.memoria.produtos[estado.produtoId]?.ultimoPreco : null;
        if (ult) add(`a ${formatarReais(ult)} cada`, 'preco', 1.1);
        add('a R$', 'preco', 0.8); add('por R$', 'preco', 0.6);
        this._pagamentosOrdenados().forEach((id, i) => add(PAGAMENTO_SAIDA[id], 'pagamento', 0.75 - i * 0.05));
        add('e', 'conector', 0.5);
        if (estado.produtoId) {
          const base = this.produtos.get(estado.produtoId);
          for (const p of this.produtos.values()) if (p.id !== base.id && semAcento(p.nome).startsWith(semAcento(base.nome) + ' ')) add(p.nome.slice(base.nome.length + 1), 'variedade', 0.55);
        }
        break;
      }
      case 'preco_marcador': { const ult = estado.produtoId ? this.memoria.produtos[estado.produtoId]?.ultimoPreco : null; if (ult) add(fmtNum(ult), 'valor', 1); break; }
      case 'valor': add('cada', 'preco', 0.9); this._pagamentosOrdenados().forEach((id, i) => add(PAGAMENTO_SAIDA[id], 'pagamento', 0.8 - i * 0.05)); add('o kg', 'preco', 0.4); break;
      case 'pagamento_marcador': this._pagamentosOrdenados().forEach((id, i) => add(PAGAMENTO_SAIDA[id].replace(/^(no|em) /, ''), 'pagamento', 1 - i * 0.1)); break;
      case 'pagamento': add('e', 'conector', 0.6); break;
      default: break;
    }
    return { modo: 'proxima', sugestoes: dedupe(sug).sort((a, b) => b.score - a.score).slice(0, limite) };
  }

  _estado(toks, completando = false) {
    const e = { slot: 'inicio', qtd: null, produtoId: null, aposUnidade: false, unidadeColetiva: false, inicioProdutoParcial: null };
    for (let i = 0; i < toks.length; i++) {
      const k = toks[i].k;
      const pr = this._casarProduto(toks, i);
      if (this.acaoPorGatilho.has(k)) { e.slot = 'acao'; continue; }
      if (pr && !(pr.n === 1 && (this.numerais.has(k) || this.unidadePorPalavra.has(k)))) { e.slot = 'produto'; e.produtoId = pr.id; i += pr.n - 1; continue; }
      if (lerNumeroDigitado(k) != null || this.numerais.has(k)) {
        e.slot = ['produto', 'preco_marcador'].includes(e.slot) || toks[i - 1]?.k === 'r$' ? 'valor' : 'quantidade';
        if (e.slot === 'quantidade') { e.qtd = lerNumeroDigitado(k) ?? this.numerais.get(k); e.aposUnidade = false; }
        continue;
      }
      if (this.unidadePorPalavra.has(k)) { e.slot = 'unidade'; e.aposUnidade = true; e.unidadeId = this.unidadePorPalavra.get(k); e.unidadeColetiva = UNIDADES_COLETIVAS.has(this.unidadePorPalavra.get(k)); continue; }
      if ((k === 'de' || k === 'd') && e.slot === 'unidade') { e.slot = 'de'; continue; }
      if ((k === 'a' || k === 'por' || k === 'r$') && (e.slot === 'produto')) { e.slot = 'preco_marcador'; continue; }
      if (k === 'r$') { e.slot = 'preco_marcador'; continue; }
      if (['no', 'na', 'em', 'via', 'pelo', 'pela'].includes(k) && ['produto', 'valor'].includes(e.slot)) { e.slot = 'pagamento_marcador'; continue; }
      if (this.pagPorGatilho.has(k)) { e.slot = 'pagamento'; continue; }
      if (k === 'cada' || k === 'reais') { e.slot = 'valor'; continue; }
      if (k === 'e' || /^[,;+]$/.test(k)) { e.slot = 'e'; e.qtd = null; e.produtoId = null; e.aposUnidade = false; continue; }
    }
    // início do possível produto em digitação (após quantidade/unidade/de/ação/e)
    let j = toks.length;
    while (j > 0) {
      const k = toks[j - 1].k;
      const antes = toks[j - 2]?.k;
      const deInterno = (k === 'de' || k === 'd') && antes && !this.unidadePorPalavra.has(antes) && lerNumeroDigitado(antes) == null && !this.numerais.has(antes) && !this.acaoPorGatilho.has(antes);
      if (!deInterno && (this.acaoPorGatilho.has(k) || lerNumeroDigitado(k) != null || this.numerais.has(k) || this.unidadePorPalavra.has(k) || k === 'de' || k === 'd' || k === 'e' || /^[,;+]$/.test(k))) break;
      j--;
    }
    if (completando && j < toks.length) e.inicioProdutoParcial = toks[j].ini;
    if (!completando && j < toks.length) { e.fraseProduto = toks.slice(j).map((t) => t.k).join(' '); e.inicioFraseProduto = toks[j].ini; } // ex.: "doce de"
    e.qtdPlural = (e.qtd ?? 1) >= 2;
    return e;
  }
  _pesoSlot(estado, tipo) {
    const t = this.dic.regras_previsao?.transicoes?.[estado.slot === 'de' ? 'de' : estado.slot] ?? [];
    const v = t.find(([s]) => s === tipo)?.[1];
    if (estado.inicioProdutoParcial != null && tipo === 'produto') return 1;
    return v ?? 0.3;
  }
  _pesoMemoria(id) {
    const m = this.memoria.produtos[id];
    let s = 0;
    if (m) { s += Math.min(0.5, Math.log1p(m.n) / 8); const dias = (Date.now() - (m.ultimo ?? 0)) / 864e5; s += dias < 1 ? 0.2 : dias < 31 ? 0.1 : 0; }
    const p = this.produtos.get(id);
    if (p?.origem === 'catalogo') s += 0.05;
    if (this.produtorAtual && p?.produtores?.has(this.produtorAtual)) s += 0.4;
    return s;
  }
  _pesoPagamento(id) { return Math.min(0.3, Math.log1p(this.memoria.pagamentos[id] ?? 0) / 10); }
  _pagamentosOrdenados() { return ['pix', 'dinheiro', 'cartao', 'credito', 'debito'].sort((a, b) => (this.memoria.pagamentos[b] ?? 0) - (this.memoria.pagamentos[a] ?? 0)); }

  // -------------------------------------------------------------- aprendizado
  /** Chame SOMENTE depois que o produtor confirmar o lançamento. */
  aprender(resultado, { textoDigitado } = {}) {
    const m = this.memoria;
    for (const it of resultado.itens ?? []) {
      if (!it.produtoId) continue;
      const e = (m.produtos[it.produtoId] ??= { n: 0 });
      e.n++; e.ultimo = Date.now();
      if (it.precoUnitario != null) e.ultimoPreco = it.precoUnitario;
      if (it.unidade) e.unidade = it.unidade;
    }
    if (resultado.pagamento) m.pagamentos[resultado.pagamento] = (m.pagamentos[resultado.pagamento] ?? 0) + 1;
    // aprende grafias pessoais: palavra digitada que foi corrigida e CONFIRMADA vira apelido do produtor
    for (const c of resultado.correcoes ?? []) if (c.tipo === 'aproximada' || c.tipo === 'fonetica') m.grafias[semAcento(c.de)] = c.para;
    if (textoDigitado) m.ultimas = [textoDigitado, ...(m.ultimas ?? [])].slice(0, 50);
    this._aplicarGrafias(); this._salvarMemoria();
  }
  /** Ensina explicitamente: "pdq" = pão de queijo para este produtor. */
  ensinarApelido(apelido, produtoId) {
    const p = this.produtos.get(produtoId); if (!p) return false;
    (p.apelidos ??= []).push(apelido); this._indexarProduto(p);
    this.memoria.apelidos[semAcento(apelido)] = produtoId; this._salvarMemoria(); return true;
  }
  _aplicarGrafias() {
    for (const [k, forma] of Object.entries(this.memoria.grafias ?? {})) this.vocab.set(k, { forma, peso: 2.8, tipo: 'erro' });
    for (const [ap, id] of Object.entries(this.memoria.apelidos ?? {})) { const p = this.produtos.get(id); if (p && !(p.apelidos ?? []).includes(ap)) { (p.apelidos ??= []).push(ap); this._indexarProduto(p); } }
    this.cacheCorrecao.clear();
  }
  _lerMemoria() {
    let m = null;
    try { const raw = this.armazenamento.get(this.chaveMemoria); m = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { m = null; }
    m = { versao: 1, produtos: {}, pagamentos: {}, grafias: {}, apelidos: {}, ultimas: [], ...(m ?? {}) };
    queueMicrotask?.(() => this._aplicarGrafias());
    return m;
  }
  _salvarMemoria() { try { this.armazenamento.set(this.chaveMemoria, JSON.stringify(this.memoria)); } catch { /* armazenamento indisponível: segue em memória */ } }
  exportarMemoria() { return JSON.parse(JSON.stringify(this.memoria)); }
  importarMemoria(obj) { this.memoria = { versao: 1, produtos: {}, pagamentos: {}, grafias: {}, apelidos: {}, ultimas: [], ...obj }; this._aplicarGrafias(); this._salvarMemoria(); }
  limparMemoria() { this.memoria = { versao: 1, produtos: {}, pagamentos: {}, grafias: {}, apelidos: {}, ultimas: [] }; this._salvarMemoria(); }

  // -------------------------------------------------------------- voz
  /**
   * Lista de palavras-chave para o reconhecimento de voz (OpenAI `transcription.keywords`,
   * Google `adaptation.phraseSets`, Azure PhraseList, Deepgram `keyterm`).
   * Prioriza os produtos do produtor logado e os mais vendidos. NÃO mande os 2 mil: excesso faz o
   * reconhecedor "ouvir" palavras que não foram ditas.
   */
  gerarKeywordsVoz({ limite = 60 } = {}) {
    const lista = [...this.produtos.values()]
      .map((p) => ({ p, s: this._pesoMemoria(p.id) + (this.produtorAtual && p.produtores?.has(this.produtorAtual) ? 1 : 0) }))
      .sort((a, b) => b.s - a.s)
      .filter(({ s }, i) => s > 0 || i < limite)
      .slice(0, Math.max(0, limite - 4))
      .map(({ p }) => p.nome.replace(/[<>\r\n]/g, ''));
    return [...new Set(['Pix', 'débito', 'crédito', 'dúzia', ...lista])].slice(0, limite);
  }
  /** Prompt de contexto para modelos de transcrição (OpenAI `prompt`, Google custom prompt). */
  gerarPromptVoz() {
    return 'Produtor rural da Zona da Mata Mineira registrando vendas na Feira do Inventário Rural, em Carangola (MG). '
      + 'Fala com sotaque mineiro e frases curtas como "vendi três cafés especiais a vinte e cinco no Pix", '
      + '"sobrou meia dúzia de ovo caipira", "dois queijo meia cura por sessenta em dinheiro". Escreva números com algarismos.';
  }
}

// ============================================================================
// 5. Auxiliares
// ============================================================================
const round2 = (n) => Math.round(n * 100) / 100;
const escaparRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function dedupe(l) { const vis = new Set(); return l.filter((s) => { const k = semAcento(s.texto); if (vis.has(k)) return false; vis.add(k); return true; }); }
function armazenamentoPadrao() {
  const mem = new Map();
  return {
    get(k) { try { return globalThis.localStorage?.getItem(k) ?? mem.get(k) ?? null; } catch { return mem.get(k) ?? null; } },
    set(k, v) { mem.set(k, v); try { globalThis.localStorage?.setItem(k, v); } catch { /* WebView sem storage */ } },
  };
}

/** Atalho: cria o motor já com o dicionário. */
export function criarMotor(dicionario, opcoes) { return new MotorLinguagem(dicionario, opcoes); }
export default MotorLinguagem;
