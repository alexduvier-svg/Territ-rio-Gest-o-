// Comportamentos de interface que não dependem do celular: animação na troca de tela, tipo dos
// avisos e, no estilo Feira, o cadastro em "lista que expande" (uma configuração aberta por vez,
// com o valor escolhido à direita; ao escolher, abre a próxima).

const app = () => document.getElementById('app');
const isFeira = () => document.documentElement.dataset.layout === 'feira';
const shell = () => window.TerritorioShell;

// ---------------------------------------------------------------- troca de tela
let lastPage = null;
let enterTimer;
function markPageChange() {
  const page = shell()?.page?.();
  if (!page || page === lastPage) return;
  lastPage = page;
  const el = app();
  el.classList.remove('page-enter');
  void el.offsetWidth; // reinicia a animação
  el.classList.add('page-enter');
  clearTimeout(enterTimer);
  enterTimer = setTimeout(() => el.classList.remove('page-enter'), 450);
}

// ---------------------------------------------------------------- avisos
const WARN = /^(Não |Estoque não|Nenhum|Informe|Use |Sem |Falta)/;
const SUCCESS = /^(Venda Finalizada|Estoque renovado|QR lido|Página publicada|Backup|Dados de teste zerados|Produto salvo|Cliente salvo)/;
function classifyToast(toast) {
  if (toast.hidden) return;
  const text = toast.textContent || '';
  const kind = WARN.test(text) ? 'toast-warn' : SUCCESS.test(text) ? 'toast-success' : '';
  toast.classList.remove('toast-warn', 'toast-success');
  void toast.offsetWidth; // a mesma mensagem duas vezes também anima
  if (kind) toast.classList.add(kind);
}

// ---------------------------------------------------------------- cadastro em lista que expande
let openIndex = null; // null = decidir pela primeira configuração ainda sem escolha
let advanceFrom = null; // índice da configuração que acabou de ser escolhida
let formKey = '';
function decorateDimensions() {
  const pills = [...app().querySelectorAll('.registration-dimensions .dimension-pill')];
  if (!pills.length || !isFeira()) {
    pills.forEach(p => p.classList.remove('acc', 'open'));
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

document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.matches?.('.dimension-pill.acc .dimension-heading')) {
    event.preventDefault();
    event.target.click();
  }
});

// ---------------------------------------------------------------- observadores
export function installInterface() {
  const root = app();
  new MutationObserver(() => {
    markPageChange();
    decorateDimensions();
  }).observe(root, { childList: true, subtree: true });
  new MutationObserver(() => decorateDimensions()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-layout'] });
  const toast = document.getElementById('toast');
  if (toast) new MutationObserver(() => classifyToast(toast)).observe(toast, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
  markPageChange();
  decorateDimensions();
}
