// Venda de vários produtos de uma vez: tocar duas vezes num cartão em Vender entra no modo de
// seleção (segurar o cartão serve para mudá-lo de lugar); toque em até mais 2 produtos e em "Vender N produtos".
// Os escolhidos entram juntos na tela de venda, cada um com sua apresentação e quantidade.
// Funciona nos dois estilos (Feira e Território).

const HOLD_MS = 600;
const MAX = 3;
const CARD = '[data-action="sell-product"]';

let selected = [];
let timer = null;
let pressed = null;
let start = null;
let holding = null; // cartão do toque longo, enquanto o dedo não sai
let swallow = null; // { id, until }: clique de soltar o dedo a ignorar
let bar = null;
let toastTimer;
let lastToggle=null;

const shell = () => window.TerritorioShell;
const onVender = () => shell()?.page?.() === 'Vender';
// O cartão inteiro conta: no estilo Clássico o preço fica fora do botão do cartão.
const cardFrom = target =>
  target.closest?.(CARD) || target.closest?.('.selling-card, .product-card, .feira-card')?.querySelector(CARD) || null;

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
    bar.innerHTML = '<button type="button" class="multi-cancel">Cancelar seleção</button><button type="button" class="multi-go"></button>';
    bar.querySelector('.multi-cancel').addEventListener('click', cancel);
    bar.querySelector('.multi-go').addEventListener('click', sell);
    document.body.appendChild(bar);
  }
  bar.querySelector('.multi-go').textContent = 'Continuar';
  bar.querySelector('.multi-go').setAttribute('aria-description', `${selected.length} de 3 produtos selecionados`);
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
    const card = cardFrom(event.target);
    // Segurar o cartão agora o levanta para mudar de lugar (reorder.js); a seleção abre com 2 toques.
    if (window.TerritorioReorder || !card || card.disabled || card.getAttribute('aria-disabled')==='true' || !onVender() || selected.length) return;
    window.TerritorioProductGestures?.suspend();
    pressed = card;
    start = { x: event.clientX, y: event.clientY };
    card.classList.add('multi-pressing');
    timer = setTimeout(() => {
      const id = pressed?.dataset.id;
      clearTimer();
      if (!id) return;
      window.TerritorioProductGestures?.cancelPending();
      holding = id; // o dedo ainda está no cartão que abriu a seleção
      selected = [id];
      tick();
      paint();
    }, HOLD_MS);
  });
  document.addEventListener('pointermove', event => {
    if (timer && start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) clearTimer(); // rolando a tela
  });
  for (const type of ['pointerup', 'pointercancel']) document.addEventListener(type, () => {
    if (timer) clearTimer();
    // Alguns aparelhos geram um "clique" ao soltar o dedo depois do toque longo; outros (Android) não.
    // Ignora só esse clique, no mesmo cartão e logo em seguida — nunca o próximo toque da pessoa.
    if (holding) { swallow = { id: holding, until: Date.now() + 450 }; holding = null; }
  });

  // Antes do app: no modo de seleção, tocar no cartão marca/desmarca em vez de abrir a venda.
  document.addEventListener('click', event => {
    const card = cardFrom(event.target);
    if (swallow && Date.now() <= swallow.until && card && card.dataset.id === swallow.id) {
      swallow = null;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    swallow = null;
    if (!card || !selected.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!card.disabled && card.getAttribute('aria-disabled')!=='true') {const now=Date.now();if(lastToggle?.id===card.dataset.id&&now-lastToggle.at<320)return;lastToggle={id:card.dataset.id,at:now};toggle(card.dataset.id);}
  }, true);
  document.addEventListener('contextmenu', event => { if (cardFrom(event.target)) event.preventDefault(); });

  // A tela se redesenha (busca, categoria): reaplica as marcas; saiu de Vender: cancela.
  new MutationObserver(() => { if (!onVender()) cancel(); else if (selected.length) paint(); })
    .observe(document.getElementById('app'), { childList: true });

  // Dois toques num cartão (workflows) abrem a seleção com ele já marcado.
  const startSelection = id => {
    if (!onVender() || !id) return;
    selected = [id];
    lastToggle = { id, at: Date.now() };
    tick();
    paint();
  };
  window.TerritorioSelection = { cancel, start: startSelection, active: () => selected.length > 0 };
}
