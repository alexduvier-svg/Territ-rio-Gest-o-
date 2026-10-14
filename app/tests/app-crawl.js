// Varredura do app: entra em todas as abas, abre cada botão seguro (janelas e subtelas) e recolhe
// textos visíveis, textos cortados e medidas de layout. Rode no navegador (npm run dev):
//   await window.crawlApp()  →  { texts: [...], overflow: [...], screens: n }
// Não aciona ações que apagam, enviam, baixam, publicam ou abrem outros apps.
window.crawlApp = async function crawlApp() {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const UNSAFE = /delete|remove|reset|finish|save|confirm|refund|return|apply|clear|cancel|toggle|set-|export|download|share|whatsapp|email|publish|backup|restore|import|qr-read|sale-company|move|snooze|pdf|csv|logout|digit|erase|key|close|back|nav|sell-|open-cart|finalize|payment|choose|brain-config|ai-analyze|reminder-dismiss|day-close|studio-prepare|upload|photo|zoom|mg-period|fin-cost-kind|preset|dimension|choice|weight|variant|scope|filter|chip|layout|theme|appearance|notify|calendar|month|week|restock-digit|restock-pick|restock-next|restock-finish|number|calc|discount|split|origin|recipient|active-item|story/i;
  const texts = new Set();
  const overflow = [];
  let screens = 0;
  const visibleText = root => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.replace(/\s+/g, ' ').trim();
      const el = n.parentElement;
      if (!t || t.length < 2 || !el || el.closest('script,style,svg,.sr-only') || !el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
      texts.add(t);
    }
    root.querySelectorAll('button,a,label,strong,small,span,p,h1,h2,h3,input,textarea').forEach(el => {
      if (el.closest('.sr-only,.feira-chips,.mg-scopes') || !el.offsetParent) return;
      const cs = getComputedStyle(el);
      if (el.scrollWidth > el.clientWidth + 1 && cs.overflow !== 'visible' && cs.overflowX !== 'auto' && cs.overflowX !== 'scroll' && el.clientWidth > 0)
        overflow.push({ where: document.title + ' / ' + (window.TerritorioShell?.page?.() || ''), text: (el.textContent || el.value || '').trim().slice(0, 60), px: el.scrollWidth - el.clientWidth });
    });
    screens++;
  };
  const shell = window.TerritorioShell;
  const closeAll = async () => { for (let i = 0; i < 4 && document.querySelector('dialog[open]'); i++) { document.querySelector('dialog[open]').close(); await wait(120); } };
  const pages = ['Vender', 'Estoque', 'Clientes', 'Eventos', 'Gestão'];
  for (const page of pages) {
    await closeAll();
    document.querySelector(`#nav button[data-page="${page}"]`)?.click();
    await wait(350);
    visibleText(document.getElementById('app'));
    const actions = [...new Set([...document.querySelectorAll('#app [data-action]')].map(b => JSON.stringify({ a: b.dataset.action, d: { ...b.dataset } })))].map(s => JSON.parse(s));
    for (const { a, d } of actions) {
      if (UNSAFE.test(a)) continue;
      await closeAll();
      document.querySelector(`#nav button[data-page="${page}"]`)?.click();
      await wait(200);
      const b = document.createElement('button');
      Object.assign(b.dataset, d);
      document.body.appendChild(b);
      try { b.click(); } catch (e) { overflow.push({ where: page + ' → ' + a, text: 'ERRO: ' + e.message, px: 0 }); }
      b.remove();
      await wait(350);
      const dlg = document.querySelector('dialog[open]');
      if (dlg) visibleText(dlg);
      else if (shell?.page?.() !== page) visibleText(document.getElementById('app'));
      // Um nível abaixo: botões seguros dentro da janela aberta.
      if (dlg) {
        const inner = [...new Set([...dlg.querySelectorAll('[data-action]')].map(x => JSON.stringify({ a: x.dataset.action, d: { ...x.dataset } })))].map(s => JSON.parse(s)).filter(x => !UNSAFE.test(x.a)).slice(0, 8);
        for (const { a: a2, d: d2 } of inner) {
          const b2 = document.createElement('button');
          Object.assign(b2.dataset, d2);
          document.body.appendChild(b2);
          try { b2.click(); } catch (e) { overflow.push({ where: page + ' → ' + a + ' → ' + a2, text: 'ERRO: ' + e.message, px: 0 }); }
          b2.remove();
          await wait(300);
          const d3 = document.querySelector('dialog[open]');
          if (d3) visibleText(d3); else visibleText(document.getElementById('app'));
        }
      }
      if (shell?.page?.() !== page) { shell?.back?.(); await wait(200); }
    }
  }
  await closeAll();
  document.querySelector('#nav button[data-page="Vender"]')?.click();
  return { texts: [...texts].sort((a, b) => a.localeCompare(b, 'pt-BR')), overflow, screens };
};
