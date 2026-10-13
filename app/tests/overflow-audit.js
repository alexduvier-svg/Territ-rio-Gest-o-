// Auditoria de texto que vaza ou é cortado. Rode no console do app (npm run dev) ou via ferramenta de
// navegador: percorre telas e modais e devolve cada elemento cujo conteúdo é mais largo que a caixa.
// Uso: await window.auditOverflow()   →  [{ screen, text, overflowPx }]
window.auditOverflow = async function auditOverflow() {
  const act = (action, data = {}) => {
    const b = document.createElement('button');
    b.dataset.action = action;
    Object.assign(b.dataset, data);
    document.body.appendChild(b);
    b.click();
    b.remove();
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const findings = [];
  const scan = screen => {
    const root = document.getElementById('dialog')?.open ? document.getElementById('dialog') : document.getElementById('app');
    const nodes = root.querySelectorAll('button, .choice, .chip, .badge, label, strong, small, span, h1, h2, h3, p, dt, dd');
    for (const el of nodes) {
      if (!el.offsetParent || el.closest('svg') || el.closest('.sr-only')) continue; // rótulos só para leitores de tela
      const cs = getComputedStyle(el);
      if (/(auto|scroll)/.test(cs.overflowX)) continue; // contêineres que rolam de propósito
      const over = el.scrollWidth - el.clientWidth;
      const text = (el.innerText || '').trim().replace(/\s+/g, ' ');
      if (over > 1 && text && el.clientWidth > 0) {
        // Ignora filhos que já foram relatados pelo pai.
        if (findings.some(f => f.el.contains(el) || el.contains(f.el))) continue;
        findings.push({ screen, text: text.slice(0, 60), overflowPx: over, el });
      }
    }
  };
  const pages = ['Vender', 'Estoque', 'Clientes', 'Eventos', 'Gestão'];
  for (const page of pages) { act('nav', { page }); await wait(60); scan(page); }
  act('settings'); await wait(60); scan('Ajustes');
  act('appearance-settings'); await wait(60); scan('Aparência'); act('close-modal');
  act('data-settings'); await wait(60); scan('Dados');
  act('cloud-backup'); await wait(60); scan('Backup automático'); act('close-modal');
  act('catalog'); await wait(60); scan('Catálogo');
  act('nav', { page: 'Gestão' }); await wait(60);
  act('advisor-guide'); await wait(60); scan('Guia da banca'); act('close-modal');
  // Cadastro de produto em cada área, onde ficam as pílulas de opções.
  act('nav', { page: 'Estoque' }); act('new-product'); await wait(60);
  const areas = [...document.querySelectorAll('#product-category-pills [data-action="quick-category"]')].map(b => b.dataset.value);
  for (const value of areas) { act('quick-category', { value }); await wait(40); scan('Cadastro · ' + value); }
  act('cancel-product'); await wait(40);
  // Venda: tela de venda e carrinho.
  act('nav', { page: 'Vender' }); await wait(40);
  document.querySelector('[data-action="sell-product"]')?.click(); await wait(60); scan('Venda');
  [...document.querySelectorAll('[data-action="digit"]')].find(b => b.textContent.trim() === '1')?.click();
  act('open-cart'); await wait(60); scan('Carrinho');
  act('close-modal'); act('back-sale'); await wait(40);
  return findings.map(({ el, ...f }) => f);
};
