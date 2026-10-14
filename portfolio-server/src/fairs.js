// Feiras oficiais e relatórios dos produtores ("Enviar relatório").
//   GET  /api/fairs                         → lista pública das feiras oficiais (nome e apelidos)
//   POST /api/fairs/:id/reports             → o app envia o relatório de vendas do produtor naquela feira
//   GET  /fairs/:id?key=…                   → página do organizador (protegida pela chave)
//   GET  /fairs/:id/resumo.csv?key=…        → uma linha por produtor (as perguntas do formulário)
//   GET  /fairs/:id/produtos.csv?key=…      → uma linha por produto de cada produtor
//   GET  /fairs/:id/relatorios.json?key=…   → tudo, para a skill do relatório
// Os relatórios ficam no KV da própria conta (BACKUPS, prefixo "fairrep:") e somem sozinhos em 180 dias.
// A chave do organizador nunca fica no código: só o SHA-256 dela.

const FAIRS = [
  {
    id: 'feira-inventario',
    name: 'Feira do Inventário Rural e Cultural',
    short: 'Feira do Inventário',
    aliases: ['feira do inventario', 'feira do inventario rural', 'feira inventario', 'inventario rural', 'feira do inventario rural e cultural'],
    city: 'Carangola',
    uf: 'MG',
    organizer: 'Secretaria de Cultura, Turismo e Patrimônio Histórico de Carangola',
    keyHash: 'efe57bb5b23949569a0a8277977b313c783930651aea814b6395a389a1363d36',
  },
];
const TTL = 180 * 24 * 60 * 60;
const MAX_BYTES = 96 * 1024;
const REPORT_ID = /^[a-z0-9-]{8,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const FAIR_API = /^\/api\/fairs(?:\/([a-z0-9-]{3,48})\/reports)?$/;
export const FAIR_PAGE = /^\/fairs\/([a-z0-9-]{3,48})(\/(?:resumo\.csv|produtos\.csv|relatorios\.json))?$/;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const text = (v, max = 160) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function organizerOk(fair, key) {
  if (!fair || !key) return false;
  const a = await sha256(key.trim().toUpperCase());
  let diff = a.length ^ fair.keyHash.length;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ fair.keyHash.charCodeAt(i);
  return diff === 0;
}

// O relatório é montado pelo app; aqui só se confere o formato e se corta o que for grande demais.
function cleanReport(body, fair) {
  if (!body || typeof body !== 'object') throw new Error('Relatório inválido.');
  if (!REPORT_ID.test(String(body.reportId || ''))) throw new Error('Identificação do relatório inválida.');
  if (!body.consent || !body.consent.at) throw new Error('Falta a concordância do produtor.');
  const event = body.event || {};
  if (!DAY.test(String(event.start || '')) || !DAY.test(String(event.end || ''))) throw new Error('Datas do evento inválidas.');
  const producer = body.producer || {};
  if (!text(producer.name)) throw new Error('Falta o nome do produtor.');
  const products = (Array.isArray(body.products) ? body.products : []).slice(0, 200).map(p => ({
    name: text(p.name), description: text(p.description), unit: text(p.unit, 40),
    took: num(p.took), sold: num(p.sold), left: num(p.left), revenue: num(p.revenue), price: num(p.price),
    soldOutAt: text(p.soldOutAt, 40), timeToSellOut: text(p.timeToSellOut, 20), restocked: num(p.restocked),
  }));
  return {
    reportId: String(body.reportId), fairId: fair.id, fairName: fair.name, receivedAt: new Date().toISOString(),
    app: text(body.app, 40), consent: { at: text(body.consent.at, 40), text: text(body.consent.text, 600) },
    producer: { name: text(producer.name), business: text(producer.business), community: text(producer.community), city: text(producer.city), uf: text(producer.uf, 2) },
    event: { name: text(event.name), start: event.start, end: event.end, from: text(event.from, 5), until: text(event.until, 5) },
    totals: Object.fromEntries(Object.entries(body.totals || {}).slice(0, 20).map(([k, v]) => [text(k, 30), num(v)])),
    answers: Object.fromEntries(Object.entries(body.answers || {}).slice(0, 40).map(([k, v]) => [text(k, 40), text(v, 400)])),
    payments: Object.fromEntries(Object.entries(body.payments || {}).slice(0, 10).map(([k, v]) => [text(k, 20), num(v)])),
    hourly: Object.fromEntries(Object.entries(body.hourly || {}).slice(0, 24).map(([k, v]) => [text(k, 5), num(v)])),
    products,
  };
}

async function listReports(env, fairId) {
  const out = [];
  let cursor;
  do {
    const page = await env.BACKUPS.list({ prefix: `fairrep:${fairId}:`, cursor });
    for (const k of page.keys) { const r = await env.BACKUPS.get(k.name, 'json'); if (r) out.push(r); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out.sort((a, b) => a.event.start.localeCompare(b.event.start) || a.producer.name.localeCompare(b.producer.name, 'pt-BR'));
}

export async function handleFairsApi(request, env, fairId) {
  if (!fairId) {
    if (request.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);
    return json({ fairs: FAIRS.map(({ keyHash, organizer, ...f }) => f) });
  }
  const fair = FAIRS.find(f => f.id === fairId);
  if (!fair) return json({ error: 'Feira não encontrada.' }, 404);
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  const raw = await request.text();
  if (raw.length > MAX_BYTES) return json({ error: 'Relatório grande demais.' }, 413);
  let report;
  try { report = cleanReport(JSON.parse(raw), fair); } catch (error) { return json({ error: error.message || 'Relatório inválido.' }, 400); }
  await env.BACKUPS.put(`fairrep:${fair.id}:${report.reportId}`, JSON.stringify(report), { expirationTtl: TTL, metadata: { at: report.receivedAt, producer: report.producer.name } });
  return json({ ok: true, receivedAt: report.receivedAt });
}

const csvCell = v => { const s = String(v ?? ''); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const csv = rows => '﻿' + rows.map(r => r.map(csvCell).join(';')).join('\r\n');
const brl = cents => (num(cents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ANSWER_COLUMNS = [
  ['produtos', 'Tipos de produtos que levou'], ['levou', 'Quantidade levada'], ['vendeu', 'Quantidade vendida'], ['restou', 'Quantidade que restou'],
  ['maisVendido', 'Produto que mais vendeu'], ['menosVendido', 'Produto que menos vendeu'],
  ['saidaCaro', 'Produto mais caro obteve'], ['saidaMedio', 'Produto de valor médio obteve'], ['saidaBarato', 'Produto mais barato obteve'],
  ['tempoEsgotar', 'Em quanto tempo o estoque esgotou'], ['reposicao', 'Reposição'], ['repostos', 'Produtos repostos'],
  ['esgotouPrimeiro', 'Produto que esgotou mais rápido'], ['semVenda', 'Produtos sem nenhuma venda'],
  ['maiorLucro', 'O maior lucro partiu de'], ['metodoPagamento', 'Método de pagamento em que mais vendeu'],
];

function resumoCsv(reports) {
  const head = ['Edição', 'Produtor', 'Negócio', 'Comunidade', 'Cidade', 'Evento', 'Início', 'Fim', 'Horário', 'Faturamento (R$)', 'Vendas', 'Ticket médio (R$)', 'Pix (R$)', 'Dinheiro (R$)', 'Débito (R$)', 'Crédito (R$)', 'Outro (R$)', ...ANSWER_COLUMNS.map(c => c[1]), 'Vendas por hora', 'Enviado em', 'Concordância'];
  const rows = reports.map(r => [
    r.event.start, r.producer.name, r.producer.business, r.producer.community, [r.producer.city, r.producer.uf].filter(Boolean).join('/'), r.event.name, r.event.start, r.event.end, `${r.event.from}–${r.event.until}`,
    brl(r.totals.revenue), r.totals.sales, brl(r.totals.ticket), ...['Pix', 'Dinheiro', 'Débito', 'Crédito', 'Outro'].map(k => brl(r.payments[k] || 0)),
    ...ANSWER_COLUMNS.map(([k]) => r.answers[k] || ''),
    Object.entries(r.hourly).map(([h, v]) => `${h}h: R$ ${brl(v)}`).join(' | '), r.receivedAt, r.consent.at,
  ]);
  return csv([head, ...rows]);
}
function produtosCsv(reports) {
  const head = ['Edição', 'Produtor', 'Comunidade', 'Produto', 'Apresentação', 'Unidade', 'Preço (R$)', 'Levou', 'Vendeu', 'Restou', 'Repôs', 'Faturamento (R$)', 'Esgotou às', 'Tempo para esgotar'];
  const rows = reports.flatMap(r => r.products.map(p => [r.event.start, r.producer.name, r.producer.community, p.name, p.description, p.unit, brl(p.price), p.took, p.sold, p.left, p.restocked, brl(p.revenue), p.soldOutAt, p.timeToSellOut]));
  return csv([head, ...rows]);
}

function organizerPage(fair, reports, key) {
  const editions = [...new Set(reports.map(r => r.event.start))].sort().reverse();
  const k = encodeURIComponent(key);
  const total = reports.reduce((n, r) => n + num(r.totals.revenue), 0);
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(fair.short)} · Relatórios</title>
<style>body{font-family:system-ui,sans-serif;margin:0;background:#0b0b0b;color:#f2f2f2}main{max-width:640px;margin:auto;padding:24px 18px}h1{font-size:24px;margin:0 0 4px}p{color:#a5a5ac}a.b{display:block;margin:10px 0;padding:14px 16px;border-radius:14px;background:#7fa653;color:#14210d;font-weight:700;text-decoration:none;text-align:center}a.s{background:#1c1c1e;color:#a7c97f}section{background:#1c1c1e;border-radius:18px;padding:14px 16px;margin:14px 0}li{margin:6px 0}</style>
<main><h1>${esc(fair.name)}</h1><p>${esc(fair.organizer)}</p>
<section><strong>${reports.length} ${reports.length === 1 ? 'relatório recebido' : 'relatórios recebidos'}</strong><p>Faturamento somado: R$ ${brl(total)}</p>
<ul>${editions.map(e => `<li>${esc(e.split('-').reverse().join('/'))}: ${reports.filter(r => r.event.start === e).map(r => esc(r.producer.name)).join(', ')}</li>`).join('')}</ul></section>
<a class="b" href="/fairs/${fair.id}/resumo.csv?key=${k}">Baixar resumo (uma linha por produtor)</a>
<a class="b s" href="/fairs/${fair.id}/produtos.csv?key=${k}">Baixar produtos (uma linha por produto)</a>
<a class="b s" href="/fairs/${fair.id}/relatorios.json?key=${k}">Baixar tudo para o Claude (JSON)</a>
<p>Os relatórios são apagados sozinhos 180 dias depois do envio.</p></main></html>`;
}

export async function serveFairPage(request, env, fairId, file) {
  const fair = FAIRS.find(f => f.id === fairId);
  const key = new URL(request.url).searchParams.get('key') || '';
  const headers = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' };
  if (!(await organizerOk(fair, key))) return new Response('Acesso não autorizado.', { status: 401, headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' } });
  const reports = await listReports(env, fair.id);
  const day = new Date().toISOString().slice(0, 10);
  if (file === '/resumo.csv') return new Response(resumoCsv(reports), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${fair.id}-resumo-${day}.csv"` } });
  if (file === '/produtos.csv') return new Response(produtosCsv(reports), { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="${fair.id}-produtos-${day}.csv"` } });
  if (file === '/relatorios.json') return new Response(JSON.stringify({ fair: { id: fair.id, name: fair.name, organizer: fair.organizer, city: fair.city, uf: fair.uf }, reports }, null, 2), { headers: { ...headers, 'content-type': 'application/json; charset=utf-8', 'content-disposition': `attachment; filename="${fair.id}-relatorios-${day}.json"` } });
  return new Response(organizerPage(fair, reports, key), { headers: { ...headers, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'" } });
}
