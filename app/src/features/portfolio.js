// Publishes the producer's portfolio page (portfolio-server/) and keeps its link in the app data,
// so the QR shown after each sale opens it. The UI lives in src/legacy (portfolioPanel).
//
// Publishing: create the page once (gets a slug + secret token, saved in the app data and therefore in
// backups), ask which photos the server lacks, then send the document, those photos and the PDF.
// Photos are content-addressed (SHA-256), so unchanged photos are never uploaded twice — this matters
// on weak mobile connections.

import { API, AuthError, request as api } from './server.js';

const PRODUCT_SIZE = 800;
const PORTRAIT_SIZE = 512;

let busy = false;
const actor=()=>window.ERPPreview?.model?.()?.data?.dataContext?.id||window.ERPPreview?.model?.()?.data?.productMemory?.scopeId;
const sameActor=id=>{if(id!==actor())throw Error('O produtor mudou. Reabra o portfólio.');};
const shell = () => window.TerritorioShell;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível abrir uma das fotos.'));
    img.src = src;
  });
}

function toJPEG(draw, size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f5f5f7';
  ctx.fillRect(0, 0, size, size);
  draw(ctx);
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Não foi possível preparar as fotos.'))), 'image/jpeg', 0.85));
}

// Square, centre-cropped, like the product grid on the page.
function squareCrop(img, size) {
  const side = Math.min(img.width, img.height);
  return toJPEG(ctx => ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size), size);
}

// The sample catalog photos are a 3×3 atlas.
function atlasTile(atlas, index, size) {
  const w = atlas.width / 3, h = atlas.height / 3;
  return toJPEG(ctx => ctx.drawImage(atlas, (index % 3) * w, Math.floor(index / 3) * h, w, h, 0, 0, size, size), size);
}

async function sha256(blob) {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encoded photos, keyed by their source, so "Atualizar página" only re-encodes photos that changed.
const rendered = new Map();

function renderOnce(key, make) {
  if (!rendered.has(key)) {
    const job = make().then(async blob => ({ blob, hash: await sha256(blob) }));
    job.catch(() => rendered.delete(key));
    rendered.set(key, job);
  }
  return rendered.get(key);
}

async function buildDocument(source) {
  let atlas = null;
  const loadAtlas = () => (atlas ||= loadImage(source.atlas));
  const productImage = g => {
    if (g.photo) return renderOnce('photo:' + g.photo, async () => squareCrop(await loadImage(g.photo), PRODUCT_SIZE));
    if (g.atlasIndex !== null && g.atlasIndex !== undefined) return renderOnce('atlas:' + g.atlasIndex, async () => atlasTile(await loadAtlas(), g.atlasIndex, PRODUCT_SIZE));
    return null;
  };

  // Encoding runs off the main thread; doing it in parallel keeps publishing quick.
  const [portrait, ...products] = await Promise.all([
    source.photo ? renderOnce('portrait:' + source.photo, async () => squareCrop(await loadImage(source.photo), PORTRAIT_SIZE)) : null,
    ...source.groups.map(productImage),
  ]);

  const images = new Map();
  for (const r of [portrait, ...products]) if (r) images.set(r.hash, r.blob);
  const groups = source.groups.map((g, i) => ({ name: g.name, category: g.category, unavailable: g.unavailable, variants: g.variants, image: products[i]?.hash || null }));
  const doc = { business: source.business, contact: source.contact, photo: portrait?.hash || null, groups, events: source.events, showPrices: true };
  return { doc, images };
}

async function upload(state, doc, images, pdf) {
  const { missing } = await api(`/api/portfolios/${state.slug}/missing`, { token: state.token, json: { images: [...images.keys()] } });
  const form = new FormData();
  form.set('portfolio', JSON.stringify(doc));
  for (const hash of missing) form.set('img_' + hash, images.get(hash), hash + '.jpg');
  if (pdf) form.set('pdf', pdf, 'portfolio.pdf');
  return api(`/api/portfolios/${state.slug}`, { method: 'PUT', token: state.token, body: form });
}

async function create(name,owner) {
  const created = await api('/api/portfolios', { json: { name } });
  sameActor(owner);
  const state = { slug: created.slug, token: created.token, url: created.url, publishedAt: null };
  // Keep the token right away: if the upload fails, the next attempt reuses this page.
  shell().setPortfolio(state);
  return state;
}

async function publish({listOnly=false,skipPDF=true}={}) {
  const owner=actor();
  if (busy || !API) return;
  busy = true;
  shell().refresh();
  try {
    const source = shell().portfolioSource();
    const light=listOnly?{...source,photo:null,business:{name:source.business.name},contact:{whatsapp:source.contact.whatsapp},events:[],groups:source.groups.map(g=>({...g,photo:null,atlasIndex:null}))}:source;
    const { doc, images } = await buildDocument(light);
    const pdf = listOnly||skipPDF?null:await source.pdf().catch(() => null);sameActor(owner);

    let state = shell().portfolioState();
    if (!state || !state.token) state = await create(doc.business.name,owner);
    let result;
    try {
      result = await upload(state, doc, images, pdf);
    } catch (error) {
      // The page was removed on the server (or the data came from another install): start a new one.
      if (!(error instanceof AuthError)) throw error;
      state = await create(doc.business.name,owner);
      result = await upload(state, doc, images, pdf);
    }
    sameActor(owner);shell().setPortfolio({ ...state, url: result.url, ...(listOnly?{listOnlyPublished:true}:{listOnlyPublished:false}), publishedAt: result.updatedAt,publishedPhone:source.contact.whatsapp,...(!listOnly?{richPublishedAt:result.updatedAt}:{}),productImages:Object.fromEntries(doc.groups.flatMap(g=>g.variants.filter(v=>v.productId).map(v=>[v.productId,g.image]))) });
    return result.url;
  } finally {
    busy = false;
    shell().refresh();
  }
}

async function unpublish() {
  const state = shell().portfolioState();
  if (!state || busy) return;
  busy = true;
  shell().refresh();
  try {
    await api(`/api/portfolios/${state.slug}`, { method: 'DELETE', token: state.token }).catch(error => {
      // Already gone on the server: still clear it here.
      if (!(error instanceof AuthError)) throw error;
    });
    shell().setPortfolio(null);
  } finally {
    busy = false;
    shell().refresh();
  }
}

// --- QR reads -------------------------------------------------------------------------------
// Each QR shown after a sale opens the page with ?r=<ref>; the server records the visit. While the QR
// is on screen the app checks that single reference every few seconds (a cheap key read), so
// "QR code lido ✓" appears as the customer opens the page. Reads that arrive later are collected
// with one list call when the app opens or returns to the foreground.
const WATCH_EVERY = 4000;
const WATCH_FOR = 5 * 60 * 1000;
const SYNC_EVERY = 10 * 60 * 1000;
const watchStarted = new Map();
let watching = false;
let lastSync = 0;

async function watchTick() {
  const state = shell()?.portfolioState?.();
  if (watching || document.hidden || !API || !state?.publishedAt) return;
  const current = shell().qrRefs().watching;
  if (!current) return;
  const since = watchStarted.get(current.ref) ?? watchStarted.set(current.ref, Date.now()).get(current.ref);
  if (Date.now() - since > WATCH_FOR) return;
  watching = true;
  try {
    const { readAt } = await api(`/api/portfolios/${state.slug}/reads/${current.ref}`, { method: 'GET', token: state.token });
    if (readAt) shell().markQrRead({ [current.ref]: readAt });
  } catch { /* offline: the next tick or sync will catch it */ } finally {
    watching = false;
  }
}

async function syncReads(force = false) {
  const state = shell()?.portfolioState?.();
  if (!API || !state?.publishedAt || (!force && Date.now() - lastSync < SYNC_EVERY)) return;
  if (!shell().qrRefs().unread.length) return;
  lastSync = Date.now();
  try {
    const { reads } = await api(`/api/portfolios/${state.slug}/reads`, { method: 'GET', token: state.token });
    if (reads && Object.keys(reads).length) shell().markQrRead(reads);
  } catch {
    lastSync = 0;
  }
}

setInterval(watchTick, WATCH_EVERY);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncReads(); });
setTimeout(() => syncReads(true), 3000);

window.TerritorioPortfolio = { available: !!API, busy: () => busy, publish, ensureList:async()=>{const state=shell().portfolioState();if(state?.publishedAt&&state.publishedPhone===shell().portfolioSource().contact.whatsapp)return state.url;return publish({listOnly:!state?.publishedAt||state.listOnlyPublished===true,skipPDF:true});}, unpublish, syncReads };
