// Comportamentos de interface que não dependem do celular: animação na troca de tela, tipo dos
// avisos e, no estilo Feira, o cadastro em "lista que expande" (uma configuração aberta por vez,
// com o valor escolhido à direita; ao escolher, abre a próxima).

import { animatePageChange, animateToast } from './motion/index.js';

const app = () => document.getElementById('app');
const isFeira = () => document.documentElement.dataset.layout === 'feira';
const shell = () => window.TerritorioShell;

// ---------------------------------------------------------------- troca de tela
let lastPage = null;
function markPageChange() {
  const page = shell()?.page?.();
  if (!page || page === lastPage) return;
  lastPage = page;
  animatePageChange(app());
}

// ---------------------------------------------------------------- avisos
const WARN = /^(Não |Estoque não|Nenhum|Informe|Use |Sem |Falta|Máximo)/;
const SUCCESS = /^(Venda Finalizada|Estoque renovado|QR lido|Página publicada|Backup|Dados de teste zerados|Produto salvo|Cliente salvo)/;
function classifyToast(toast) {
  if (toast.hidden) { animateToast(toast); return; }
  const text = toast.textContent || '';
  const kind = WARN.test(text) ? 'toast-warn' : SUCCESS.test(text) ? 'toast-success' : '';
  toast.classList.remove('toast-warn', 'toast-success');
  if (kind) toast.classList.add(kind);
  animateToast(toast);
}

// ---------------------------------------------------------------- cadastro em lista que expande
let openIndex = null; // null = decidir pela primeira configuração ainda sem escolha
let advanceFrom = null; // índice da configuração que acabou de ser escolhida
let formKey = '';
function decorateDimensions() {
  const pills = [...app().querySelectorAll('.registration-dimensions .dimension-pill')];
  if (!pills.length || !isFeira()) {
    pills.forEach(p => p.classList.remove('acc', 'open'));
    if (!pills.length) { openIndex = null; advanceFrom = null; formKey = ''; }
    return;
  }
  const key = pills.map(p => p.querySelector('h3')?.textContent).join('|');
  if (key !== formKey) {
    formKey = key;
    openIndex = null;
  }
  if (advanceFrom !== null) {
    // Depois de escolher: abre a próxima configuração ainda sem escolha (ou fecha todas).
    openIndex = pills.findIndex((p, i) => i > advanceFrom && !p.querySelector('.choice.selected'));
    advanceFrom = null;
  }
  if (openIndex === null) {
    const firstEmpty = pills.findIndex(p => !p.querySelector('.choice.selected'));
    openIndex = firstEmpty;
  }
  pills.forEach((pill, i) => {
    pill.classList.add('acc');
    pill.classList.toggle('open', i === openIndex);
    pill.dataset.accIndex = String(i);
    const heading = pill.querySelector('.dimension-heading');
    if (!heading) return;
    let value = heading.querySelector('.dim-value');
    if (!value) {
      value = document.createElement('span');
      value.className = 'dim-value';
      heading.querySelector('h3')?.after(value);
    }
    const chosen = pill.querySelector('.choice.selected');
    const text = chosen ? chosen.textContent.trim().replace(/^./, c => c.toUpperCase()) : 'Escolher';
    if (value.textContent !== text) value.textContent = text; // reescrever igual dispararia o observador de novo
    value.classList.toggle('empty', !chosen);
    heading.setAttribute('role', 'button');
    heading.setAttribute('aria-expanded', String(i === openIndex));
    heading.tabIndex = 0;
  });
}

document.addEventListener('click', event => {
  if (!isFeira()) return;
  const heading = event.target.closest('.dimension-pill.acc .dimension-heading');
  if (heading && !event.target.closest('.dimension-add')) {
    const i = Number(heading.closest('.dimension-pill').dataset.accIndex);
    openIndex = openIndex === i ? -1 : i;
    decorateDimensions();
    return;
  }
  const choice = event.target.closest('.dimension-pill.acc .choice');
  if (choice) {
    // Escolheu: a próxima configuração sem escolha abre sozinha depois que a tela se redesenha.
    advanceFrom = Number(choice.closest('.dimension-pill').dataset.accIndex);
  }
}, true);

// The same selection can come from the inline choices or from the + dialog.
// A semantic event survives the legacy redraw and also covers a custom weight.
document.addEventListener('territorio:product-presentation-selected', event => {
  const { index, field } = event.detail || {};
  const pills = [...(app()?.querySelectorAll('.registration-dimensions .dimension-pill') || [])];
  const chosenIndex = pills.findIndex(p => p.dataset.dimensionField === field && Number(p.dataset.dimensionVariant) === index);
  if (chosenIndex < 0) return;
  advanceFrom = chosenIndex;
  decorateDimensions();
});

document.addEventListener('territorio:collapse-configurations',()=>{openIndex=-1;advanceFrom=null;decorateDimensions();});

// Venda com vários produtos: tocar em qualquer parte do produto (inclusive no preço, à direita,
// onde alcança o polegar de quem é destro) o ativa para digitar a quantidade.
document.addEventListener('click', event => {
  const group = event.target.closest?.('.sale-product-group');
  if (!group || event.target.closest('button, input, select, textarea, a')) return;
  const inHeading = event.target.closest('.sale-product-heading');
  if (!inHeading && group.classList.contains('active')) return; // dentro do produto ativo, só o cabeçalho
  group.querySelector('[data-action="active-item"]')?.click();
});

document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.dimension-pill.acc .dimension-heading')) {
    event.preventDefault();
    event.target.click();
  }
});

// ---------------------------------------------------------------- venda com vários produtos
// Bolinha antes do nome: lilás = produto em edição; ✓ verde = já tem quantidade; círculo vazio = falta.
function decorateSaleGroups() {
  const groups = [...app().querySelectorAll('.sale-product-group')];
  const states = groups.length > 1 ? shell()?.draftGroupStates?.() || [] : [];
  groups.forEach((group, i) => {
    const s = states[i];
    const want = !s ? '' : s.active ? 'is-editing' : s.done ? 'is-done' : 'is-pending';
    for (const c of ['is-editing', 'is-done', 'is-pending']) if (c !== want && group.classList.contains(c)) group.classList.remove(c);
    if (want && !group.classList.contains(want)) group.classList.add(want);
  });
}

// ---------------------------------------------------------------- seletores no estilo do app
// O <select> nativo abre a lista do Android ("aparência de Android antigo"). Aqui ele abre uma folha
// no estilo do app; ao escolher, o <select> recebe o valor e avisa o app como antes ("change").
let picker = null;
function openPicker(select) {
  if (!picker) {
    picker = document.createElement('dialog');
    picker.className = 'picker-sheet';
    picker.addEventListener('click', event => {
      if (event.target === picker) return picker.close();
      const option = event.target.closest('[data-picker-index]');
      if (!option) return;
      const target = picker._select;
      target.selectedIndex = Number(option.dataset.pickerIndex);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      picker.close();
    });
    document.body.appendChild(picker);
  }
  picker._select = select;
  const label = select.labels?.[0]?.textContent?.trim() || select.getAttribute('aria-label') || 'Escolher';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  picker.innerHTML = `<div class="picker-grab" aria-hidden="true"></div><h2>${esc(label)}</h2><div class="picker-list" role="listbox">${
    [...select.options].map((o, i) => `<button type="button" role="option" aria-selected="${o.selected}" class="picker-option${o.selected ? ' selected' : ''}" data-picker-index="${i}"${o.disabled ? ' disabled' : ''}><span>${esc(o.textContent)}</span>${o.selected ? '<span class="picker-check" aria-hidden="true">✓</span>' : ''}</button>`).join('')
  }</div>`;
  picker.showModal();
  picker.querySelector('.picker-option.selected')?.scrollIntoView({ block: 'center' });
}
function installPicker() {
  const intercept = event => {
    const select = event.target.closest?.('select');
    if (!select || select.disabled || select.multiple) return;
    event.preventDefault();
    if (event.type !== 'keydown' || event.key === 'Enter' || event.key === ' ') openPicker(select);
  };
  document.addEventListener('mousedown', intercept, true);
  document.addEventListener('touchstart', e => { if (e.target.closest?.('select')) e.preventDefault(); }, { capture: true, passive: false });
  document.addEventListener('touchend', e => { const s = e.target.closest?.('select'); if (s && !s.disabled) { e.preventDefault(); openPicker(s); } }, { capture: true, passive: false });
  document.addEventListener('keydown', e => { if (e.target.matches?.('select') && (e.key === 'Enter' || e.key === ' ')) intercept(e); }, true);
}

// ---------------------------------------------------------------- celulares mais simples
// Poucos núcleos ou pouca memória: sem desfoque de fundo e sombras pesadas, transições mais curtas.
function detectLite() {
  const cores = navigator.hardwareConcurrency || 8;
  const memory = navigator.deviceMemory || 8;
  if (cores <= 4 || memory <= 3) document.documentElement.classList.add('lite');
}

// ---------------------------------------------------------------- foco visível só com teclado
// Janela aberta por notificação recebe foco sem toque prévio e o Android desenha a moldura no "x".
document.addEventListener('keydown', e => {
  if (e.key === 'Tab' || e.key.startsWith('Arrow')) document.documentElement.classList.add('kbd-nav');
}, true);
document.addEventListener('pointerdown', () => document.documentElement.classList.remove('kbd-nav'), true);

// ---------------------------------------------------------------- título do Estoque
// Título e botões dividem a linha enquanto cabem; quando não cabem (tela estreita, texto ampliado),
// os botões sobem para o alto à direita e o título fica inteiro logo abaixo.
function fitStockHeading() {
  const heading = app()?.querySelector('.stock-heading');
  if (!heading) return;
  const title = heading.querySelector('.stock-title h1') || heading.querySelector('.stock-title');
  const tools = heading.querySelector('.stock-top-tools');
  if (!title || !tools) return;
  heading.classList.remove('is-stacked');
  const gap = parseFloat(getComputedStyle(heading).columnGap) || 0;
  if (title.scrollWidth + tools.offsetWidth + gap + 4 > heading.clientWidth) heading.classList.add('is-stacked');
}

// ---------------------------------------------------------------- observadores
export function installInterface() {
  const root = app();
  detectLite();
  installPicker();
  new MutationObserver(() => {
    markPageChange();
    decorateDimensions();
    decorateSaleGroups();
    fitStockHeading();
  }).observe(root, { childList: true, subtree: true });
  window.addEventListener('resize', fitStockHeading, { passive: true });
  new MutationObserver(() => decorateDimensions()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-layout'] });
  const toast = document.getElementById('toast');
  if (toast) new MutationObserver(() => classifyToast(toast)).observe(toast, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
  markPageChange();
  decorateDimensions();
}
