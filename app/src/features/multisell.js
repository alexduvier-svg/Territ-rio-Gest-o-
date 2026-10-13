// Venda de vários produtos de uma vez: segurar um cartão em Vender (0,6 s, o toque longo padrão da
// Apple e do Android) entra no modo de seleção; toque em até mais 2 produtos e em "Vender N produtos".
// Os escolhidos entram juntos na tela de venda, cada um com sua apresentação e quantidade.
// Funciona nos dois estilos (Feira e Território).

const HOLD_MS = 600;
const MAX = 3;
const CARD = '[data-action="sell-product"]';

let selected = [];
let timer = null;
let pressed = null;
let start = null;
let swallowClick = false;
let bar = null;
let toastTimer;

const shell = () => window.TerritorioShell;
const onVender = () => shell()?.page?.() === 'Vender';

function tick() {
  if (window.TerritorioHaptics) window.TerritorioHaptics.tick();
  else if (navigator.vibrate) navigator.vibrate(12);
}

function notice(text) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

function paint() {
  const active = selected.length > 0;
  document.documentElement.classList.toggle('multi-select', active);
  document.querySelectorAll(CARD).forEach(card => {
    const on = selected.includes(card.dataset.id);
    card.classList.toggle('multi-selected', on);
    card.setAttribute('aria-pressed', active ? String(on) : 'false');
  });
  if (!active) {
    bar?.remove();
    bar = null;
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'multi-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Produtos escolhidos');
    bar.innerHTML = '<button type="button" class="multi-cancel">Cancelar</button><button type="button" class="multi-go"></button>';
    bar.querySelector('.multi-cancel').addEventListener('click', cancel);
    bar.querySelector('.multi-go').addEventListener('click', sell);
    document.body.appendChild(bar);
  }
  bar.querySelector('.multi-go').textContent = `Vender ${selected.length} ${selected.length === 1 ? 'produto' : 'produtos'}`;
}

function cancel() {
  if (!selected.length) return false;
  selected = [];
  paint();
  return true;
}

function sell() {
  const ids = selected.slice();
  selected = [];
  paint();
  const b = document.createElement('button');
  b.dataset.action = 'sell-multiple';
  b.dataset.ids = ids.join(',');
  document.body.appendChild(b);
  b.click();
  b.remove();
}

function toggle(id) {
  if (selected.includes(id)) selected = selected.filter(x => x !== id);
  else if (selected.length >= MAX) {
    notice(`Máximo de ${MAX} produtos por vez.`);
    return;
  } else {
    selected.push(id);
    tick();
  }
  paint();
}

function clearTimer() {
  clearTimeout(timer);
  timer = null;
  pressed?.classList.remove('multi-pressing');
  pressed = null;
}

export function installMultiSell() {
  document.addEventListener('pointerdown', event => {
    const card = event.target.closest?.(CARD);
    if (!card || card.disabled || !onVender() || selected.length) return;
    pressed = card;
    start = { x: event.clientX, y: event.clientY };
    card.classList.add('multi-pressing');
    timer = setTimeout(() => {
      const id = pressed?.dataset.id;
      clearTimer();
      if (!id) return;
      swallowClick = true; // o "clique" que vem ao soltar o dedo não deve abrir a venda
      selected = [id];
      tick();
      paint();
    }, HOLD_MS);
  });
  document.addEventListener('pointermove', event => {
    if (timer && start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) clearTimer(); // rolando a tela
  });
  for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, () => { if (timer) clearTimer(); });

  // Antes do app: no modo de seleção, tocar no cartão marca/desmarca em vez de abrir a venda.
  document.addEventListener('click', event => {
    const card = event.target.closest?.(CARD);
    if (swallowClick) {
      swallowClick = false;
      if (card) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    }
    if (!card || !selected.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!card.disabled) toggle(card.dataset.id);
  }, true);
  document.addEventListener('contextmenu', event => { if (event.target.closest?.(CARD)) event.preventDefault(); });

  // A tela se redesenha (busca, categoria): reaplica as marcas; saiu de Vender: cancela.
  new MutationObserver(() => { if (!onVender()) cancel(); else if (selected.length) paint(); })
    .observe(document.getElementById('app'), { childList: true });

  window.TerritorioSelection = { cancel, active: () => selected.length > 0 };
}
