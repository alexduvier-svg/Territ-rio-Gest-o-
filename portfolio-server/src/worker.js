import interFont from './fonts/inter-latin.woff2';
import interTightFont from './fonts/inter-tight-latin.woff2';
import { weatherRoute } from './weather.js';
// Território — public producer portfolios.
//
// Public pages (no JavaScript, opened from the QR code shown after a sale):
//   GET  /p/:slug                 portfolio page (?r=<ref> records a QR read for the sale that showed it)
//   GET  /p/:slug/i/:hash         image (content-addressed, cached forever)
//   GET  /p/:slug/portfolio.pdf   PDF made by the app
//   GET  /p/:slug/contato.vcf     "Salvar contato"
//
// Publishing API (used by the app; each portfolio has its own secret token):
//   POST   /api/portfolios                 {name} → {slug, token, url}
//   POST   /api/portfolios/:slug/missing   {images:[hash]} → {missing:[hash]}
//   PUT    /api/portfolios/:slug           multipart: portfolio (JSON), img_<hash> files, pdf
//   DELETE /api/portfolios/:slug
//   GET    /api/portfolios/:slug/reads        {reads:{ref:at}}  (list; may lag ~1 min)
//   GET    /api/portfolios/:slug/reads/:ref   {readAt}          (single read, used while the QR is on screen)
//
// Encrypted automatic backups: see backups.js (/api/backups/:id).
//
// KV layout: meta:<slug> {tokenHash,createdAt,images} · doc:<slug> · pdf:<slug> · img:<slug>:<sha256>
import { LIMITS, ValidationError, validatePortfolio, referencedImages, isHash, imageType, isPDF } from './schema.js';
import { renderPortfolio, renderMessage, vcard } from './page.js';
import { BACKUP_ROUTE, handleBackup } from './backups.js';
import { FAIR_API, FAIR_EXPORT, FAIR_PAGE, handleFairsApi, serveFairExport, serveFairPage } from './fairs.js';
import { ORG_ROUTE, PUBLIC_FAIR, FAIR_CODE, serveOrganizer, servePublicFair, serveFairCode } from './organizer.js';
import { routeShop } from './shop.js';
import { renderShop } from './shop-page.js';
export { ProducerShop } from './shop.js';

const PAGE_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'content-security-policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
};

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });
}

function corsHeaders(request, env) {
  const origin = request.headers.get('origin');
  const allowed = String(env.APP_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-expose-headers': 'x-saved-at, x-sha256',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async data => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : data));

function randomToken(bytes = 32) {
  const raw = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...raw)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomSuffix(length = 4) {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  return [...crypto.getRandomValues(new Uint8Array(length))].map(n => alphabet[n % alphabet.length]).join('');
}

function slugify(name) {
  return String(name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
}

async function readJSON(request, maxBytes) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxBytes) throw new ValidationError('Pedido grande demais.');
  const body = await request.text();
  if (body.length > maxBytes) throw new ValidationError('Pedido grande demais.');
  try {
    return JSON.parse(body);
  } catch {
    throw new ValidationError('JSON inválido.');
  }
}

async function authorize(request, env, slug) {
  const meta = await env.PORTFOLIOS.get('meta:' + slug, 'json');
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!meta || !token || (await sha256(token)) !== meta.tokenHash) return null;
  return meta;
}

// The image hashes a portfolio owns are tracked in its meta record, not with KV list():
// list() can lag up to a minute behind writes, while a key read sees this location's latest write.
const ownedImages = meta => (Array.isArray(meta.images) ? meta.images.filter(isHash) : []);

async function createPortfolio(request, env, origin) {
  const body = await readJSON(request, 2_000);
  const base = slugify(body?.name) || 'produtor';
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = base + '-' + randomSuffix();
    if (await env.PORTFOLIOS.get('meta:' + slug)) continue;
    const token = randomToken();
    await env.PORTFOLIOS.put('meta:' + slug, JSON.stringify({ tokenHash: await sha256(token), createdAt: new Date().toISOString() }));
    return json({ slug, token, url: `${origin}/p/${slug}` }, 201);
  }
  return json({ error: 'Tente novamente.' }, 503);
}

async function missingImages(request, meta) {
  const body = await readJSON(request, 20_000);
  const wanted = (Array.isArray(body?.images) ? body.images : []).filter(isHash).slice(0, LIMITS.images);
  const stored = new Set(ownedImages(meta));
  return json({ missing: wanted.filter(h => !stored.has(h)) });
}

async function publishPortfolio(request, env, slug, meta, origin) {
  if (Number(request.headers.get('content-length') || 0) > LIMITS.requestBytes) throw new ValidationError('Envio grande demais.');
  const form = await request.formData();

  const raw = form.get('portfolio');
  if (typeof raw !== 'string' || raw.length > LIMITS.docBytes) throw new ValidationError('Documento ausente ou grande demais.');
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    throw new ValidationError('Documento inválido.');
  }
  const doc = validatePortfolio(input);

  const uploads = new Map();
  for (const [field, value] of form.entries()) {
    if (!field.startsWith('img_') || typeof value === 'string') continue;
    const declared = field.slice(4);
    if (!isHash(declared)) throw new ValidationError('Imagem com identificador inválido.');
    if (value.size > LIMITS.imageBytes) throw new ValidationError('Imagem grande demais (máx. 1,5 MB).');
    const bytes = new Uint8Array(await value.arrayBuffer());
    const type = imageType(bytes);
    if (!type) throw new ValidationError('Use imagens JPEG, PNG ou WebP.');
    if ((await sha256(bytes)) !== declared) throw new ValidationError('Imagem corrompida no envio. Tente novamente.');
    uploads.set(declared, { bytes, type });
  }
  if (uploads.size > LIMITS.images) throw new ValidationError('Imagens demais.');

  const existing = ownedImages(meta);
  const stored = new Set(existing);
  const refs = referencedImages(doc);
  for (const ref of refs) if (!uploads.has(ref) && !stored.has(ref)) throw new ValidationError('Falta enviar uma imagem. Tente publicar de novo.');

  let pdf = null;
  const pdfFile = form.get('pdf');
  if (pdfFile && typeof pdfFile !== 'string') {
    if (pdfFile.size > LIMITS.pdfBytes) throw new ValidationError('PDF grande demais (máx. 15 MB).');
    pdf = new Uint8Array(await pdfFile.arrayBuffer());
    if (!isPDF(pdf)) throw new ValidationError('Arquivo PDF inválido.');
  }

  for (const [h, image] of uploads) {
    if (refs.has(h)) await env.PORTFOLIOS.put(`img:${slug}:${h}`, image.bytes, { metadata: { type: image.type } });
  }
  if (pdf) await env.PORTFOLIOS.put('pdf:' + slug, pdf);
  else await env.PORTFOLIOS.delete('pdf:' + slug);

  const updatedAt = new Date().toISOString();
  await env.PORTFOLIOS.put('doc:' + slug, JSON.stringify({ ...doc, hasPdf: !!pdf, updatedAt }));
  await env.PORTFOLIOS.put('meta:' + slug, JSON.stringify({ ...meta, images: [...refs], updatedAt }));

  // Photos no longer used by the page are removed.
  await Promise.all(existing.filter(h => !refs.has(h)).map(h => env.PORTFOLIOS.delete(`img:${slug}:${h}`)));
  return json({ url: `${origin}/p/${slug}`, updatedAt });
}

async function readKeys(env, slug) {
  const keys = [];
  let cursor;
  do {
    const page = await env.PORTFOLIOS.list({ prefix: `read:${slug}:`, cursor });
    keys.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return keys;
}

async function deletePortfolio(env, slug, meta) {
  if(env.SHOPS){const shop=env.SHOPS.get(env.SHOPS.idFromName(slug)),cleared=await shop.fetch(new Request('https://shop.internal/erase',{method:'PUT',headers:{'x-shop-owner':'verified','content-type':'application/json'},body:'{}'}));if(!cleared.ok)return cleared;}
  const images = ownedImages(meta).map(h => `img:${slug}:${h}`);
  const reads = (await readKeys(env, slug)).map(k => k.name);
  await Promise.all([...images, ...reads, 'doc:' + slug, 'pdf:' + slug, 'meta:' + slug, 'shop-config:'+slug].map(key => env.PORTFOLIOS.delete(key)));
  return new Response(null, { status: 204 });
}

// --- QR reads ----------------------------------------------------------------
// The QR shown after a sale carries a random reference (?r=…). Opening the page records only that
// reference and the time — no IP, no device data — and the record expires after 90 days.
const READ_REF = /^[a-z0-9]{6,16}$/;
const READ_TTL = 90 * 24 * 3600;
const LINK_PREVIEW = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|telegram|slack|discord|curl|wget/i;

async function recordRead(env, slug, ref) {
  const key = `read:${slug}:${ref}`;
  if (await env.PORTFOLIOS.get(key)) return;
  const at = new Date().toISOString();
  await env.PORTFOLIOS.put(key, at, { expirationTtl: READ_TTL, metadata: { at } });
}

async function listReads(env, slug) {
  const reads = {};
  for (const key of await readKeys(env, slug)) reads[key.name.split(':')[2]] = key.metadata?.at || null;
  return json({ reads });
}

async function getRead(env, slug, ref) {
  return json({ readAt: (await env.PORTFOLIOS.get(`read:${slug}:${ref}`)) || null });
}

async function servePublic(request, env, ctx, slug, rest, origin) {
  if (rest === '' || rest === '/') {
    const doc = await env.PORTFOLIOS.get('doc:' + slug, 'json');
    if (!doc) return new Response(renderMessage('Página não encontrada', 'Este portfólio não existe ou foi retirado do ar pelo produtor.'), { status: 404, headers: PAGE_HEADERS });
    const shopConfig=await env.PORTFOLIOS.get('shop-config:'+slug,'json');if(shopConfig?.enabled)doc.shopURL=origin+'/s/'+slug;
    const ref = new URL(request.url).searchParams.get('r');
    if (request.method === 'GET' && ref && READ_REF.test(ref) && !LINK_PREVIEW.test(request.headers.get('user-agent') || '')) {
      ctx.waitUntil(recordRead(env, slug, ref).catch(error => console.error('Leitura não registrada', error)));
    }
    return new Response(renderPortfolio(doc, { base: `${origin}/p/${slug}` }), {
      headers: { ...PAGE_HEADERS, 'cache-control': 'public, max-age=60' },
    });
  }
  const image = rest.match(/^\/i\/([0-9a-f]{64})$/);
  if (image) {
    const { value, metadata } = await env.PORTFOLIOS.getWithMetadata(`img:${slug}:${image[1]}`, { type: 'stream' });
    if (!value) return new Response('Not found', { status: 404 });
    return new Response(value, {
      headers: { 'content-type': metadata?.type || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
    });
  }
  if (rest === '/portfolio.pdf') {
    const pdf = await env.PORTFOLIOS.get('pdf:' + slug, { type: 'stream' });
    if (!pdf) return new Response('Not found', { status: 404 });
    return new Response(pdf, {
      headers: { 'content-type': 'application/pdf', 'content-disposition': `attachment; filename="portfolio-${slug}.pdf"`, 'cache-control': 'public, max-age=60' },
    });
  }
  if (rest === '/contato.vcf') {
    const doc = await env.PORTFOLIOS.get('doc:' + slug, 'json');
    if (!doc) return new Response('Not found', { status: 404 });
    return new Response(vcard(doc, `${origin}/p/${slug}`), {
      headers: { 'content-type': 'text/vcard; charset=utf-8', 'content-disposition': `attachment; filename="${slug}.vcf"` },
    });
  }
  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const origin = url.origin;

    const font=pathname==='/assets/agro-inter-v5-latin.woff2'?interFont:pathname==='/assets/agro-inter-tight-v5-latin.woff2'?interTightFont:null;
    if(font&&request.method==='GET')return new Response(font,{headers:{'content-type':'font/woff2','cache-control':'public, max-age=31536000, immutable','x-content-type-options':'nosniff'}});
    if (pathname.startsWith('/api/')) {
      const cors = corsHeaders(request, env);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      try {
        let response;
        if(pathname==='/api/weather'){response=await weatherRoute(request);for(const[k,v]of Object.entries(cors))response.headers.set(k,v);return response;}
        if(pathname==='/api/shops/_capabilities'&&request.method==='GET')return json({version:1,available:!!env.SHOPS},200,cors);
        const shop=pathname.match(/^\/api\/shops\/([a-z0-9-]{3,48})\/(catalog|orders(?:\/[\w-]+)?|track|inventory)$/);
        if(shop){response=await routeShop(request,env,shop[1],shop[2],authorize);for(const[k,v]of Object.entries(cors))response.headers.set(k,v);return response;}
        const backup = pathname.match(BACKUP_ROUTE);
        if (backup) {
          response = await handleBackup(request, env, backup[1], !!backup[2]);
          for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
          return response;
        }
        const fairExport = pathname.match(FAIR_EXPORT);
        if (fairExport && request.method === 'GET') return serveFairExport(request, env, fairExport[1], fairExport[2]);
        const fairCode = pathname.match(FAIR_CODE);
        if (fairCode && request.method === 'GET') {
          response = await serveFairCode(request, env, fairCode[1]);
          for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
          return response;
        }
        const fairApi = pathname.match(FAIR_API);
        if (fairApi) {
          response = await handleFairsApi(request, env, fairApi[1], fairApi[2]);
          for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
          return response;
        }
        const match = pathname.match(/^\/api\/portfolios(?:\/([a-z0-9-]{3,48}))?(?:\/(missing|reads)(?:\/([a-z0-9]{6,16}))?)?$/);
        if (!match) response = json({ error: 'Não encontrado.' }, 404);
        else if (!match[1] && !match[2] && request.method === 'POST') response = await createPortfolio(request, env, origin);
        else if (match[1]) {
          const [, slug, sub, ref] = match;
          const meta = await authorize(request, env, slug);
          if (!meta) response = json({ error: 'Sem permissão para este portfólio.' }, 401);
          else if (sub === 'missing' && !ref && request.method === 'POST') response = await missingImages(request, meta);
          else if (sub === 'reads' && request.method === 'GET') response = ref ? await getRead(env, slug, ref) : await listReads(env, slug);
          else if (!sub && request.method === 'PUT') response = await publishPortfolio(request, env, slug, meta, origin);
          else if (!sub && request.method === 'DELETE') response = await deletePortfolio(env, slug, meta);
        }
        response ||= json({ error: 'Método não permitido.' }, 405);
        for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
        return response;
      } catch (error) {
        if (error instanceof ValidationError) return json({ error: error.message }, 400, cors);
        console.error(error);
        return json({ error: 'Erro no servidor. Tente novamente.' }, 500, cors);
      }
    }

    // Painel do organizador (GET e o POST do formulário de nova feira) e a página pública do QR.
    const orgRoute = pathname.match(ORG_ROUTE);
    if (orgRoute && ['GET', 'POST'].includes(request.method)) return serveOrganizer(request, env, orgRoute[1], orgRoute[3] ? '' : orgRoute[2] || '', orgRoute[3] || '', orgRoute[4] || '');
    const publicFair = pathname.match(PUBLIC_FAIR);
    if (publicFair && request.method === 'GET') return servePublicFair(request, env, publicFair[1]);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    const shopPage=pathname.match(/^\/s\/([a-z0-9-]{3,48})$/);
    if(shopPage){const doc=await env.PORTFOLIOS.get('doc:'+shopPage[1],'json');if(!doc)return new Response(renderMessage('Loja não encontrada','Confira o link enviado pelo produtor.'),{status:404,headers:PAGE_HEADERS});const nonce=randomToken(18);return new Response(renderShop(doc,shopPage[1],nonce,new URL(request.url).origin),{headers:{...PAGE_HEADERS,'cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; script-src 'nonce-"+nonce+"'; font-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});}
    const page = pathname.match(/^\/p\/([a-z0-9-]{3,48})(\/.*)?$/);
    if (page) return servePublic(request, env, ctx, page[1], page[2] || '', origin);
    const fairPage = pathname.match(FAIR_PAGE);
    if (fairPage) return serveFairPage(request, env, fairPage[1], fairPage[2] || '');
    if (pathname === '/') return new Response(renderMessage('Território', 'Portfólios de produtores rurais. Escaneie o QR Code na banca do produtor.'), { headers: PAGE_HEADERS });
    return new Response(renderMessage('Página não encontrada', 'Confira o endereço.'), { status: 404, headers: PAGE_HEADERS });
  },
};
