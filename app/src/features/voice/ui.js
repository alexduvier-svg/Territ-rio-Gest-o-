// Vender por voz na aba Produtos: o microfone fica à esquerda das categorias. Discreto (linhas
// cinza) em repouso; azul nos dois temas, com ondas no estilo Shazam, enquanto ouve. A frase final
// vira uma proposta: abre a venda do produto com a quantidade preenchida, para o produtor conferir
// e confirmar pelos botões de sempre. Nada é registrado pela voz.

import { createVoiceController } from './engine.js';
import { interpretBest, voiceVocabulary } from './interpreter.js';
import { language } from './language.js';

const MIC = '<svg class="voice-mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11.5" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.5 21h7"/></svg>';

let ctx = null;
let controller = null;
let phase = 'idle';        // idle | starting | listening | processing
let caption = null;        // { text, tone, actions }
let typing = false;
let captionTimer = 0;
let wanted = false;        // o produtor tocou no microfone; preparação em segundo plano não acende nada

const listeningPhases = new Set(['starting', 'listening', 'speaking', 'preparing']);
const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function micHTML() {
  const active = listeningPhases.has(phase);
  const busy = phase === 'processing';
  const label = active ? 'Parar de ouvir' : 'Vender por voz';
  return `<button type="button" class="voice-mic${active ? ' is-listening' : ''}${busy ? ' is-busy' : ''}" data-voice-mic aria-pressed="${active}" aria-label="${label}">`
    + '<span class="voice-ring" aria-hidden="true"></span><span class="voice-ring" aria-hidden="true"></span><span class="voice-ring" aria-hidden="true"></span>'
    + MIC + '</button>';
}

function captionHTML() {
  if (!caption) return '<div class="voice-caption" id="voice-caption" aria-live="polite" hidden></div>';
  const actions = (caption.actions || []).map(a => `<button type="button" class="voice-caption-action" data-voice-do="${a.id}">${escape(a.label)}</button>`).join('');
  return `<div class="voice-caption is-${caption.tone || 'info'}" id="voice-caption" aria-live="polite"><p>${escape(caption.text)}</p>${actions ? `<div class="voice-caption-actions">${actions}</div>` : ''}</div>`;
}

/** Linha da aba Produtos: microfone + categorias; a busca por texto aparece ao pedir "Digitar". */
function row(chipsHTML, searchHTML, query) {
  const chips = chipsHTML || '<div class="feira-chips voice-chips-empty"></div>';
  return `<div class="voice-row">${micHTML()}${chips}</div>${captionHTML()}${typing || query ? searchHTML : ''}`;
}

function paintMic() {
  const old = document.querySelector('[data-voice-mic]');
  if (old) old.outerHTML = micHTML();
}
function paintCaption() {
  const old = document.getElementById('voice-caption');
  if (old) old.outerHTML = captionHTML();
}
function say(text, tone = 'info', actions = [], keepMs = 0) {
  clearTimeout(captionTimer);
  caption = text ? { text, tone, actions } : null;
  paintCaption();
  if (keepMs) captionTimer = setTimeout(() => { caption = null; paintCaption(); }, keepMs);
}
function setPhase(next) {
  phase = next;
  paintMic();
}

const fallbackActions = [{ id: 'retry', label: 'Falar de novo' }, { id: 'type', label: 'Digitar' }];

function products() {
  const model = ctx.getModel();
  return (model?.data?.products || []).filter(p => !p.archived);
}

function label(product, quantity) {
  const unit = ctx.unitLabel ? ctx.unitLabel(product.unit, quantity) : product.unit;
  const size = product.weight ? (product.weight >= 1000 ? `${String(product.weight / 1000).replace('.', ',')} kg` : `${product.weight} g`) : product.volume ? (product.volume >= 1000 ? `${String(product.volume / 1000).replace('.', ',')} L` : `${product.volume} ml`) : '';
  return `${ctx.quantity ? ctx.quantity(quantity) : quantity} ${unit ? unit + ' de ' : ''}${ctx.titleName ? ctx.titleName(product.name) : product.name}${size ? ' ' + size : ''}`;
}

/** Vai direto para "Finalizar Venda" com o item, a quantidade e o pagamento ditos. Ali o produtor
 *  corrige (toca no item, troca o pagamento, apaga) e finaliza; a voz não registra sozinha. */
function propose(productId, quantity, heard = '', payment = null) {
  const product = products().find(p => p.id === productId);
  if (!product) return say('Não achei esse produto no cadastro.', 'warn', fallbackActions);
  if (!(product.stock > 0)) return say(`${ctx.titleName ? ctx.titleName(product.name) : product.name} está sem estoque. Nada foi registrado.`, 'warn', fallbackActions);
  if (quantity > product.stock) say(`Só há ${ctx.quantity ? ctx.quantity(product.stock) : product.stock} em estoque. Confira a quantidade.`, 'warn');
  caption = null;
  ctx.openSale(productId, quantity, payment);
  ctx.openCart?.();
  ctx.toast(`${heard ? `Ouvi “${heard}”. ` : ''}Entendi ${label(product, quantity)}. Confira e finalize.`);
}

/** Falta só escolher a apresentação ou o produto: abre já como "Finalizar Venda", com o que foi
 *  ouvido, a quantidade e o pagamento. Tocar numa opção transforma a tela na finalização normal. */
function choose(result, heard = '', payment = null) {
  const all = products();
  const buttons = result.candidates.map(c => {
    const p = all.find(item => item.id === c.id);
    const price = p && Number(p.price) ? ctx.money(Math.round(p.price * (result.quantity || 1))) : '';
    const out = p && !(p.stock > 0);
    return `<button type="button" class="voice-choice${out ? ' is-out' : ''}" data-voice-pick="${escape(c.id)}" data-voice-qty="${result.quantity ?? ''}" data-voice-pay="${escape(payment || '')}"${out ? ' disabled' : ''}>`
      + `<span>${escape(c.label)}</span><strong>${out ? 'Sem estoque' : escape(price)}</strong></button>`;
  }).join('');
  const amount = result.quantity ? `Quantidade: ${escape(ctx.quantity ? ctx.quantity(result.quantity) : result.quantity)}` : 'Quantidade: informe na próxima tela';
  const body = (heard ? `<p class="voice-heard">Ouvi “${escape(heard)}”</p>` : '')
    + `<p class="voice-sale-question">${escape(result.question || 'Qual produto?')}</p>`
    + `<div class="voice-choices">${buttons}</div>`
    + `<p class="voice-sale-summary">${amount}${payment ? ` · Pagamento: ${escape(payment)}` : ''}</p>`;
  const footer = '<button type="button" class="voice-sale-cancel" data-action="close-modal">Cancelar Venda</button>';
  ctx.openModal('Finalizar Venda', body, 'voice-sale', null, footer);
}

// Diagnóstico (sem áudio): vai para o logcat e para o diário da voz no aparelho.
function note(entry) {
  const line = { version: window.TERRITORIO_VERSION || '', page: ctx.page(), ...entry };
  console.info('[voz]', JSON.stringify(line));
  controller?.diagnostic(line);
}

function handleFinal(heard, alternatives = [], engine = '') {
  setPhase('processing');
  const page = ctx.page();
  const draft = ctx.getDraft();
  const pending = page === 'Venda' && draft?.items?.[draft.active]?.productId;
  // Camada de linguagem (agro-linguagem): corrige a fala, lê pagamento e ação. Cada alternativa entra
  // primeiro como foi ouvida e depois corrigida: a correção só vale quando a original não forma venda
  // (o dicionário não conhece todo o catálogo e pode trocar uma palavra certa, como "azul").
  const catalog = products();
  const heardTexts = [heard, ...alternatives].map(t => String(t || '').trim()).filter(Boolean);
  const understood = heardTexts.map(t => language.understand(t, catalog));
  const best = interpretBest(understood.flatMap((u, i) => [heardTexts[i], u.text]), catalog, { pendingProductId: pending || null });
  const { result } = best;
  const text = best.text || heard;
  const meaning = understood.find(u => u.text === text || u.original === text) || understood[0] || {};
  // Perda, sobra, troca, brinde, reposição…: a voz ainda não lança esses movimentos.
  const otherAction = meaning.action && !['venda', 'fiado', 'cancelar'].includes(meaning.action);
  if (otherAction) {
    note({ engine, heard, alternatives, chosen: text, status: 'acao-' + meaning.action });
    setPhase('idle');
    return say(`Ouvi: “${meaning.original || heard}”. Entendi ${(meaning.actionLabel || meaning.action).toLowerCase()}. Por voz, o app registra só vendas por enquanto.`, 'warn', fallbackActions);
  }
  // Diagnóstico (sem áudio): motor, o que foi ouvido e o que o app entendeu. Aparece no logcat.
  note({ engine, heard, alternatives, chosen: text, status: result.status, productId: result.productId || null, quantity: result.quantity ?? null, payment: meaning.payment || null, corrections: (meaning.corrections || []).map(c => `${c.de}→${c.para}`), candidates: (result.candidates || []).map(c => c.id) });
  setPhase('idle');
  if (result.status === 'ok') return propose(result.productId, result.quantity, meaning.original || heard, meaning.payment);
  if (result.status === 'choose') return choose(result, meaning.original || heard, meaning.payment);
  if (result.status === 'correction') {
    if (pending && ctx.setQuantity(result.quantity)) { ctx.openCart?.(); return ctx.toast(`Quantidade corrigida para ${ctx.quantity ? ctx.quantity(result.quantity) : result.quantity}. Confira e finalize.`); }
    return say('Não há venda aberta para corrigir. Diga o produto e a quantidade.', 'warn', fallbackActions);
  }
  if (result.status === 'ask-quantity' && result.productId) {
    return say(`${result.message} Diga de novo com a quantidade, ou toque no produto.`, 'info', fallbackActions);
  }
  const heardNote = heard ? `Ouvi: “${heard}”. ` : '';
  say(heardNote + (result.message || 'Não entendi.'), result.status === 'cancel' ? 'info' : 'warn', result.status === 'cancel' ? [] : fallbackActions, result.status === 'cancel' ? 3500 : 0);
}

const errorText = {
  'permission-denied': 'Permita o uso do microfone nas configurações do Android para vender por voz.',
  'no-engine': 'Este celular não tem um motor de voz pronto. Digite o produto.',
  'model-failed': 'Não foi possível preparar a voz offline (pouco espaço?). Digite o produto.',
  unsupported: 'Voz indisponível aqui. Digite o produto.',
  'model-busy': 'Preparando a voz offline (só na primeira vez). Tente de novo em alguns segundos.',
};

async function toggle() {
  if (!controller) return;
  if (listeningPhases.has(phase)) { await controller.stop(); return; }
  if (phase === 'processing') return;
  typing = false;
  wanted = true;
  setPhase('starting');
  say('Ouvindo… diga o produto e a quantidade.', 'listening');
  ctx.haptic?.();
  await controller.start([...new Set([...voiceVocabulary(products()), ...language.vocabulary()])]);
}

function onClick(event) {
  const mic = event.target.closest?.('[data-voice-mic]');
  if (mic) { event.preventDefault(); toggle(); return; }
  const action = event.target.closest?.('[data-voice-do]');
  if (action) {
    const what = action.dataset.voiceDo;
    if (what === 'retry') { say(null); toggle(); }
    if (what === 'type') { typing = true; say(null); ctx.render(); requestAnimationFrame(() => document.getElementById('feira-search')?.focus()); }
    return;
  }
  const pick = event.target.closest?.('[data-voice-pick]');
  if (pick) {
    const quantity = Number(pick.dataset.voiceQty) || null;
    const payment = pick.dataset.voicePay || null;
    // A mesma janela vira a "Finalizar Venda" normal (sem passar pela tela do produto nem pelo carrinho).
    if (quantity) propose(pick.dataset.voicePick, quantity, '', payment);
    else { ctx.closeModal(); ctx.openSale(pick.dataset.voicePick, null, payment); ctx.toast('Informe a quantidade e finalize.'); }
  }
}

export function installVoice(context) {
  ctx = context;
  controller = createVoiceController({
    onState: state => {
      if (state === 'ready') return;
      if (!wanted) return;
      if (state === 'idle') { if (phase !== 'processing') setPhase('idle'); return; }
      if (state === 'processing') { setPhase('processing'); say('Entendendo…', 'listening'); return; }
      if (state === 'preparing') { setPhase('preparing'); say('Preparando a voz offline… só na primeira vez.', 'listening'); return; }
      if (['starting', 'listening', 'speaking'].includes(state)) setPhase(state);
    },
    onPartial: text => { if (text) say(`“${text}”`, 'listening'); },
    onLevel: db => {
      const level = Math.max(0, Math.min(1, (db + 2) / 12));
      document.querySelector('[data-voice-mic]')?.style.setProperty('--voice-level', level.toFixed(2));
    },
    onFinal: (text, alternatives, engine) => { wanted = false; handleFinal(String(text || '').trim(), alternatives || [], engine || ''); },
    onError: (code, message) => {
      note({ status: 'erro', code, message, wanted });
      if (!wanted) return;
      wanted = false;
      setPhase('idle');
      say(errorText[code] || message, 'warn', code === 'permission-denied' ? [{ id: 'type', label: 'Digitar' }] : fallbackActions);
    },
    onEngine: (engine, reason) => { note({ status: 'motor', engine, reason }); say('Usando a voz offline do app.', 'listening'); },
  });
  document.addEventListener('click', onClick, true);
  // Saiu da aba ou do app: a escuta termina, sem resultado.
  document.addEventListener('visibilitychange', () => { if (document.hidden && listeningPhases.has(phase)) { wanted = false; controller.cancel(); setPhase('idle'); say(null); } });
  // A voz offline é copiada para a pasta do app em segundo plano, logo após abrir.
  setTimeout(() => controller.prepare(), 4000);
}

window.TerritorioVoice = {
  row,
  install: installVoice,
  pageLeft() { if (listeningPhases.has(phase)) controller?.cancel(); typing = false; caption = null; },
  /** Teste no navegador: interpreta um texto como se tivesse sido falado. */
  simulate(text, alternatives = []) { handleFinal(text, alternatives, 'teste'); },
};
