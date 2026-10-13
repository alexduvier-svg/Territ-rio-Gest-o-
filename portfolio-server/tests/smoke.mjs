// End-to-end check against a running `npm run dev` (or BASE=https://… for a deployed worker).
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
// 1×1 PNGs in two colours, and the smallest valid PDF header.
const pngA = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
const pngB = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

let passed = 0;
async function step(name, fn) {
  await fn();
  passed++;
  console.log('✓', name);
}

function doc(overrides = {}) {
  return {
    business: { name: 'Produtos Martins', producer: 'Luiz Claudio', city: 'Carangola', uf: 'MG', story: 'Café de altitude <script>alert(1)</script>\nDesde 1987.' },
    contact: { whatsapp: '(32) 99999-1234', instagram: 'https://www.instagram.com/exemplo/', website: 'javascript:alert(1)' },
    photo: sha(pngA),
    groups: [{ name: 'Café Especial', category: 'Cafés', image: sha(pngB), variants: [{ label: '250 g', price: 2500 }, { label: '500 g', price: 4500 }] }],
    events: [{ name: 'Feira de Sábado', place: 'Praça Coronel Maximiano', start: '2099-01-10', end: '2099-01-10', from: '07:00', until: '12:00' }],
    ...overrides,
  };
}

function form(document, images, withPdf = true) {
  const body = new FormData();
  body.set('portfolio', JSON.stringify(document));
  for (const bytes of images) body.set('img_' + sha(bytes), new Blob([bytes], { type: 'image/png' }), 'foto.png');
  if (withPdf) body.set('pdf', new Blob([pdf], { type: 'application/pdf' }), 'portfolio.pdf');
  return body;
}

let slug, token, auth;

await step('cria portfólio', async () => {
  const res = await fetch(BASE + '/api/portfolios', { method: 'POST', body: JSON.stringify({ name: 'Produtos Martins' }) });
  assert.equal(res.status, 201);
  ({ slug, token } = await res.json());
  assert.match(slug, /^produtos-martins-[a-z0-9]{4}$/);
  auth = { authorization: 'Bearer ' + token };
});

await step('recusa publicação sem token', async () => {
  const res = await fetch(`${BASE}/api/portfolios/${slug}`, { method: 'PUT', body: form(doc(), [pngA, pngB]) });
  assert.equal(res.status, 401);
});

await step('informa imagens que faltam', async () => {
  const res = await fetch(`${BASE}/api/portfolios/${slug}/missing`, { method: 'POST', headers: auth, body: JSON.stringify({ images: [sha(pngA), sha(pngB)] }) });
  assert.deepEqual((await res.json()).missing.sort(), [sha(pngA), sha(pngB)].sort());
});

await step('recusa imagem adulterada', async () => {
  const body = form(doc(), []);
  body.set('img_' + sha(pngA), new Blob([pngB], { type: 'image/png' }), 'x.png');
  const res = await fetch(`${BASE}/api/portfolios/${slug}`, { method: 'PUT', headers: auth, body });
  assert.equal(res.status, 400);
});

await step('publica', async () => {
  const res = await fetch(`${BASE}/api/portfolios/${slug}`, { method: 'PUT', headers: auth, body: form(doc(), [pngA, pngB]) });
  assert.equal(res.status, 200, await res.clone().text());
  assert.equal((await res.json()).url, `${BASE}/p/${slug}`);
});

await step('não pede de novo imagens já enviadas', async () => {
  const res = await fetch(`${BASE}/api/portfolios/${slug}/missing`, { method: 'POST', headers: auth, body: JSON.stringify({ images: [sha(pngA), sha(pngB)] }) });
  assert.deepEqual((await res.json()).missing, []);
});

await step('página pública: conteúdo, escape e links seguros', async () => {
  const res = await fetch(`${BASE}/p/${slug}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-security-policy'), /default-src 'none'/);
  const html = await res.text();
  assert.ok(html.includes('Produtos Martins') && html.includes('por Luiz Claudio'));
  assert.ok(!html.includes('<script>alert(1)'), 'história deve ser escapada');
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('javascript:'), 'link não-HTTPS deve ser descartado');
  assert.ok(html.includes('https://wa.me/5532999991234?text='));
  assert.match(html, /R\$\s25,00/);
  assert.ok(html.includes('Feira de Sábado'));
  assert.ok(html.includes(`/p/${slug}/portfolio.pdf`));
});

await step('imagem, PDF e contato', async () => {
  const image = await fetch(`${BASE}/p/${slug}/i/${sha(pngA)}`);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.match(image.headers.get('cache-control'), /immutable/);
  const file = await fetch(`${BASE}/p/${slug}/portfolio.pdf`);
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  assert.match(file.headers.get('content-disposition'), /attachment/);
  const card = await (await fetch(`${BASE}/p/${slug}/contato.vcf`)).text();
  assert.match(card, /FN:Luiz Claudio \(Produtos Martins\)/);
  assert.match(card, /TEL;TYPE=CELL:\+5532999991234/);
});

await step('registra leitura do QR (e ignora pré-visualização de link)', async () => {
  const before = await (await fetch(`${BASE}/api/portfolios/${slug}/reads/venda01ab`, { headers: auth })).json();
  assert.equal(before.readAt, null);
  await fetch(`${BASE}/p/${slug}?r=venda01ab`, { headers: { 'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' } });
  await fetch(`${BASE}/p/${slug}?r=preview99`, { headers: { 'user-agent': 'WhatsApp/2.24 A' } });
  let read = null;
  for (let i = 0; i < 20 && !read; i++) {
    read = (await (await fetch(`${BASE}/api/portfolios/${slug}/reads/venda01ab`, { headers: auth })).json()).readAt;
    if (!read) await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(read && !Number.isNaN(Date.parse(read)), 'leitura registrada');
  const preview = await (await fetch(`${BASE}/api/portfolios/${slug}/reads/preview99`, { headers: auth })).json();
  assert.equal(preview.readAt, null);
  assert.equal((await fetch(`${BASE}/api/portfolios/${slug}/reads/venda01ab`)).status, 401);
});

await step('lista leituras', async () => {
  let reads = {};
  for (let i = 0; i < 40 && !reads.venda01ab; i++) {
    reads = (await (await fetch(`${BASE}/api/portfolios/${slug}/reads`, { headers: auth })).json()).reads;
    if (!reads.venda01ab) await new Promise(r => setTimeout(r, 2000));
  }
  assert.ok(reads.venda01ab, 'leitura aparece na lista');
  assert.equal(reads.preview99, undefined);
});

await step('remove foto que deixou de ser usada', async () => {
  const res = await fetch(`${BASE}/api/portfolios/${slug}`, { method: 'PUT', headers: auth, body: form(doc({ photo: null }), [], false) });
  assert.equal(res.status, 200, await res.clone().text());
  assert.equal((await fetch(`${BASE}/p/${slug}/i/${sha(pngA)}`)).status, 404);
  assert.equal((await fetch(`${BASE}/p/${slug}/i/${sha(pngB)}`)).status, 200);
  assert.equal((await fetch(`${BASE}/p/${slug}/portfolio.pdf`)).status, 404);
});

await step('CORS só para o app', async () => {
  const ok = await fetch(BASE + '/api/portfolios', { method: 'OPTIONS', headers: { origin: 'https://localhost' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://localhost');
  const other = await fetch(BASE + '/api/portfolios', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);
});

await step('despublica', async () => {
  const res = await fetch(`${BASE}/api/portfolios/${slug}`, { method: 'DELETE', headers: auth });
  assert.equal(res.status, 204);
  assert.equal((await fetch(`${BASE}/p/${slug}`)).status, 404);
  assert.equal((await fetch(`${BASE}/p/${slug}/i/${sha(pngB)}`)).status, 404);
});

console.log(`\n${passed} verificações passaram.`);
