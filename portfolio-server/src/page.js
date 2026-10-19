// Server-rendered portfolio page. No JavaScript: it opens instantly on any phone that scans the QR.

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function longDate(iso) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

function whatsappLink(doc) {
  const digits = doc.contact.whatsapp;
  if (!digits) return '';
  const number = digits.length <= 11 ? '55' + digits : digits;
  const text = `Olá! Vi o portfólio da ${doc.business.name} e quero saber mais.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

const ICONS = {
  chat: '<path d="M4 5h16v11H8l-4 4z"/>',
  download: '<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14"/>',
  contact: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M19 8v6m-3-3h6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

const STYLE = `
:root{--bg:#f5f5f7;--card:#fff;--text:#1d1d1f;--secondary:#6e6e73;--line:rgba(0,0,0,.08);--accent:#1f7a4c;--on-accent:#fff;--tint:#e6f2ea;--warn:#a34d00}
@media (prefers-color-scheme:dark){:root{--bg:#000;--card:#1c1c1e;--text:#f5f5f7;--secondary:#a1a1a6;--line:rgba(255,255,255,.12);--accent:#3cc37f;--on-accent:#03140a;--tint:#14271c;--warn:#ffb15c}}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--text);font:17px/1.47 -apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
main{max-width:680px;margin:0 auto;padding:max(32px,env(safe-area-inset-top)) 20px max(40px,env(safe-area-inset-bottom))}
.hero{text-align:center}
.portrait,.monogram{width:108px;height:108px;border-radius:50%;margin:0 auto 18px;display:block;box-shadow:0 0 0 4px var(--card),0 10px 30px rgba(0,0,0,.14)}
.portrait{object-fit:cover}
.monogram{display:grid;place-items:center;background:var(--accent);color:var(--on-accent);font-size:38px;font-weight:700;letter-spacing:-.02em}
.eyebrow{margin:0;font-size:13px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:var(--accent)}
h1{font-size:34px;line-height:1.08;letter-spacing:-.025em;margin:6px 0 6px;font-weight:700}
.byline{margin:0;color:var(--secondary)}
.actions{display:grid;gap:10px;margin:28px 0 0}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 16px;border-radius:14px;font-size:17px;font-weight:600;text-decoration:none;text-align:center}
.primary{background:var(--accent);color:var(--on-accent)}
.secondary{background:var(--card);color:var(--accent);box-shadow:inset 0 0 0 1px var(--line)}
section{margin-top:40px}
h2{font-size:22px;line-height:1.2;letter-spacing:-.015em;margin:0 0 12px}
.card{background:var(--card);border-radius:20px;padding:20px}
.story{margin:0;white-space:pre-line}
.events{padding:4px 20px}
.event{display:flex;gap:16px;align-items:center;padding:14px 0}
.event+.event{border-top:1px solid var(--line)}
.date{flex:none;width:52px;text-align:center;border-radius:12px;background:var(--tint);color:var(--accent);padding:6px 0}
.date b{display:block;font-size:22px;line-height:1.1}
.date span{font-size:12px;font-weight:600;text-transform:uppercase}
.event strong{display:block}
.event small{color:var(--secondary);font-size:14px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@media (min-width:560px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.product{background:var(--card);border-radius:18px;overflow:hidden}
.product img,.placeholder{width:100%;aspect-ratio:1;display:block}
.product img{object-fit:cover;background:var(--line)}
.placeholder{display:grid;place-items:center;background:var(--tint);color:var(--accent);font-size:36px;font-weight:700}
.product-body{padding:12px 14px 14px}
.product h3{font-size:16px;line-height:1.25;margin:0 0 6px}
.variant{display:flex;justify-content:space-between;gap:8px;font-size:14px;color:var(--secondary)}
.variant b{color:var(--text);font-weight:600;font-variant-numeric:tabular-nums;white-space:nowrap}
.unavailable{display:block;margin-top:8px;font-size:12px;font-weight:600;color:var(--warn)}
.note{font-size:13px;color:var(--secondary);margin:12px 4px 0}
footer{margin-top:48px;text-align:center;color:var(--secondary);font-size:13px}
footer nav{display:flex;justify-content:center;gap:20px;margin-bottom:12px}
footer a{color:var(--accent);font-weight:600;text-decoration:none;font-size:15px}
`;

function layout({ title, description = '', image = '', url = '', body }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#f5f5f7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<title>${escape(title)}</title>
${description ? `<meta name="description" content="${escape(description)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(title)}">
${description ? `<meta property="og:description" content="${escape(description)}">` : ''}
${image ? `<meta property="og:image" content="${escape(image)}">` : ''}
${url ? `<meta property="og:url" content="${escape(url)}">` : ''}
<style>${STYLE}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>`;
}

export function renderMessage(title, text) {
  return layout({ title, body: `<div class="hero" style="padding-top:18vh"><div class="monogram">${escape(initials(title) || 'T')}</div><h1>${escape(title)}</h1><p class="byline">${escape(text)}</p></div>` });
}

export function renderPortfolio(doc, { base }) {
  const b = doc.business;
  const place = [b.city, b.uf].filter(Boolean).join(', ');
  const whatsapp = whatsappLink(doc);
  const hasContact = doc.contact.whatsapp || doc.contact.email;
  const now = today();
  const events = doc.events.filter(e => (e.end || e.start) >= now).sort((x, y) => x.start.localeCompare(y.start)).slice(0, 4);
  const firstImage = doc.photo || doc.groups.find(g => g.image)?.image;

  const hero = `<header class="hero">
  ${doc.photo ? `<img class="portrait" src="${base}/i/${doc.photo}" alt="${escape(b.producer || b.name)}">` : `<div class="monogram" aria-hidden="true">${escape(initials(b.name))}</div>`}
  ${place ? `<p class="eyebrow">${escape(b.tagline || 'Produtor rural')} · ${escape(place)}</p>` : ''}
  <h1>${escape(b.name)}</h1>
  ${b.producer ? `<p class="byline">por ${escape(b.producer)}</p>` : ''}
</header>`;

  const secondary = [
    doc.shopURL ? `<a class="button primary" href="${escape(doc.shopURL)}">Ver produtos e fazer pedido</a>` : '',
    doc.hasPdf ? `<a class="button secondary" href="${base}/portfolio.pdf">${icon('download')}Baixar PDF</a>` : '',
    hasContact ? `<a class="button secondary" href="${base}/contato.vcf">${icon('contact')}Salvar contato</a>` : '',
  ].filter(Boolean);
  const actions = whatsapp || secondary.length ? `<div class="actions">
  ${whatsapp ? `<a class="button primary" href="${escape(whatsapp)}">${icon('chat')}Conversar no WhatsApp</a>` : ''}
  ${secondary.length === 2 ? `<div class="pair">${secondary.join('')}</div>` : secondary.join('')}
</div>` : '';

  const story = b.story ? `<section><h2>Nossa história</h2><div class="card"><p class="story">${escape(b.story)}</p></div></section>` : '';

  const agenda = events.length ? `<section><h2>Onde nos encontrar</h2><div class="card events">${events.map(e => {
    const [, month, day] = e.start.split('-');
    const until = e.end && e.end !== e.start ? `até ${e.end.slice(8)}/${e.end.slice(5, 7)}` : '';
    const hours = e.from && e.until ? `${e.from} às ${e.until}` : '';
    return `<div class="event"><div class="date"><b>${Number(day)}</b><span>${MONTHS[Number(month) - 1]}</span></div><div><strong>${escape(e.name)}</strong><small>${escape([e.place, until, hours].filter(Boolean).join(' · '))}</small></div></div>`;
  }).join('')}</div></section>` : '';

  const products = doc.groups.length ? `<section><h2>Produtos</h2><div class="grid">${doc.groups.map(g => `<article class="product">
  ${g.image ? `<img src="${base}/i/${g.image}" alt="${escape(g.name)}" loading="lazy">` : `<div class="placeholder" aria-hidden="true">${escape(initials(g.name))}</div>`}
  <div class="product-body"><h3>${escape(g.name)}</h3>${g.variants.map(v => `<div class="variant"><span>${escape(v.label)}</span>${doc.showPrices && v.price !== null ? `<b>${money(v.price)}</b>` : ''}</div>`).join('')}${g.unavailable ? '<span class="unavailable">Indisponível no momento</span>' : ''}</div>
</article>`).join('')}</div>${doc.showPrices ? `<p class="note">Preços de referência, atualizados em ${longDate(doc.updatedAt)}. Confirme na banca.</p>` : ''}</section>` : '';

  const links = [
    doc.contact.instagram ? `<a href="${escape(doc.contact.instagram)}">Instagram</a>` : '',
    doc.contact.website ? `<a href="${escape(doc.contact.website)}">Site</a>` : '',
  ].filter(Boolean).join('');
  const footer = `<footer>${links ? `<nav>${links}</nav>` : ''}Página criada com Território</footer>`;

  const description = (b.story || `Produtos de ${place || b.name}`).replace(/\s+/g, ' ').slice(0, 160);
  return layout({
    title: b.name,
    description,
    image: firstImage ? `${base}/i/${firstImage}` : '',
    url: base,
    body: hero + actions + story + agenda + products + footer,
  });
}

const vcardText = value => String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');

export function vcard(doc, url) {
  const b = doc.business;
  const digits = doc.contact.whatsapp;
  const phone = digits ? '+' + (digits.length <= 11 ? '55' + digits : digits) : '';
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${vcardText(b.producer || b.name)};;;;`,
    `FN:${vcardText(b.producer ? `${b.producer} (${b.name})` : b.name)}`,
    `ORG:${vcardText(b.name)}`,
    phone ? `TEL;TYPE=CELL:${phone}` : '',
    doc.contact.email ? `EMAIL:${vcardText(doc.contact.email)}` : '',
    `URL:${url}`,
    b.city ? `ADR;TYPE=WORK:;;;${vcardText(b.city)};${vcardText(b.uf)};;Brasil` : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n') + '\r\n';
}
