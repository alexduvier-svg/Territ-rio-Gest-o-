// Feiras oficiais e relatórios dos produtores ("Enviar relatório").
//   GET  /api/fairs                         → lista pública das feiras oficiais (nome e apelidos)
//   POST /api/fairs/:id/reports             → o app envia o relatório de vendas do produtor naquela feira
//   GET  /fairs/:id?key=…                   → página do organizador (protegida pela chave)
//   GET  /fairs/:id/resumo.csv?key=…        → uma linha por produtor (as perguntas do formulário)
//   GET  /fairs/:id/produtos.csv?key=…      → uma linha por produto de cada produtor
//   GET  /fairs/:id/relatorios.json?key=…   → tudo, como o app enviou
//   GET  /api/eventos/feira-AAAA-MM-DD/export.json?token=…  → um dia de feira no formato da skill de relatórios
//        (evento, produtores, estoque com reposições, vendas, fechamento, feedback); token = chave do organizador
// Os relatórios ficam no KV da própria conta (BACKUPS, prefixo "fairrep:") e somem sozinhos em 180 dias.
// A chave do organizador nunca fica no código: só o SHA-256 dela.

// Organizações (quem organiza feiras). A chave de cada uma fica só como SHA-256.
export const ORGS = [
  { id: 'carangola', name: 'Secretaria de Cultura, Turismo e Patrimônio Histórico de Carangola', city: 'Carangola', uf: 'MG', keyHash: 'efe57bb5b23949569a0a8277977b313c783930651aea814b6395a389a1363d36' },
];
// Feiras fixas no código (as criadas no painel do organizador ficam no KV, prefixo "fairdef:").
const FAIRS = [
  {
    id: 'feira-inventario',
    orgId: 'carangola',
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
const MAX_BYTES = 384 * 1024;
const REPORT_ID = /^[a-z0-9-]{8,80}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export const FAIR_API = /^\/api\/fairs(?:\/([a-z0-9-]{3,48})\/(reports|join|info))?$/;
export const FAIR_EXPORT = /^\/api\/eventos\/(?:([a-z0-9-]{3,48}?)-)?(\d{4}-\d{2}-\d{2})\/export\.json$/;
export const FAIR_PAGE = /^\/fairs\/([a-z0-9-]{3,48})(\/(?:resumo\.csv|produtos\.csv|relatorios\.json))?$/;

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const text = (v, max = 160) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const num = v => (Number.isFinite(Number(v)) ? Number(v) : 0);

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function organizerOk(fair, key) {
  if (!fair || !key) return false;
  const a = await sha256(key.trim().toUpperCase());
  let diff = a.length ^ fair.keyHash.length;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ fair.keyHash.charCodeAt(i);
  return diff === 0;
}

// Feira pelo id: as fixas do código ou as criadas no painel (KV). Junta os dados da organização.
const withOrg = f => { const org = ORGS.find(o => o.id === f.orgId) || ORGS[0]; return { ...f, organizer: org.name, keyHash: org.keyHash, orgId: org.id }; };
export async function getFair(env, id) {
  const fixed = FAIRS.find(f => f.id === id);
  if (fixed) return withOrg(fixed);
  const saved = env.BACKUPS && await env.BACKUPS.get(`fairdef:${id}`, 'json');
  return saved ? withOrg(saved) : null;
}
export async function allFairs(env) {
  const out = FAIRS.map(withOrg);
  let cursor;
  do {
    const page = await env.BACKUPS.list({ prefix: 'fairdef:', cursor });
    for (const k of page.keys) { const f = await env.BACKUPS.get(k.name, 'json'); if (f) out.push(withOrg(f)); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out;
}
// Dados públicos de uma feira (sem chave nem organização interna), para o app e a página do QR.
export const publicFair = ({ keyHash, ...f }) => f;

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
    status: body.status === 'finalizado' ? 'finalizado' : 'preliminar',
    finalizedAt: text(body.finalizedAt, 40),
    contrato: cleanContract(body.contrato),
  };
}

// Dados no formato da skill (um produtor). Só os campos conhecidos, com tamanho limitado.
const PAY = new Set(['PIX', 'DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'OUTRO']);
const HM = /^\d{2}:\d{2}$/;
function cleanContract(c) {
  if (!c || typeof c !== 'object') return null;
  const p = c.produtor || {};
  const pid = text(p.id, 40);
  if (!pid) return null;
  const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
  return {
    produtor: { id: pid, nome: text(p.nome), nome_curto: text(p.nome_curto, 60), comunidade: text(p.comunidade), tenda: p.tenda == null ? null : text(p.tenda, 20) },
    evento: { data: DAY.test(String(c.evento?.data || '')) ? c.evento.data : '', local: text(c.evento?.local), inicio: text(c.evento?.inicio, 5), fim: text(c.evento?.fim, 5) },
    estoque: list(c.estoque, 200).map(e => ({
      produtor_id: pid, produto_id: text(e.produto_id, 60), produto: text(e.produto), categoria: text(e.categoria, 60), unidade: text(e.unidade, 40),
      preco: num(e.preco), qtd_inicial: num(e.qtd_inicial), reposicoes: list(e.reposicoes, 50).filter(r => HM.test(String(r.hora))).map(r => ({ hora: r.hora, qtd: num(r.qtd) })),
    })),
    vendas: list(c.vendas, 2000).map(v => {
      const out = {
        id: text(v.id, 60), produtor_id: pid, hora: text(v.hora, 40),
        itens: list(v.itens, 50).map(i => ({ produto_id: text(i.produto_id, 60), qtd: num(i.qtd), preco_unit: num(i.preco_unit) })),
        total: num(v.total), pagamento: PAY.has(v.pagamento) ? v.pagamento : 'OUTRO', cancelada: v.cancelada === true,
      };
      if (Array.isArray(v.pagamentos)) out.pagamentos = list(v.pagamentos, 6).map(x => ({ forma: PAY.has(x.forma) ? x.forma : 'OUTRO', valor: num(x.valor) }));
      if (['JOVEM', 'ADULTO', 'IDOSO'].includes(v.publico)) out.publico = v.publico;
      if (v.lancada_depois === true) { out.lancada_depois = true; out.registrada_em = text(v.registrada_em, 40); }
      return out;
    }),
    fechamento: list(c.fechamento, 200).map(x => ({ produtor_id: pid, produto_id: text(x.produto_id, 60), contado: num(x.contado) })),
    feedback: list(c.feedback, 3).map(x => ({ produtor_id: pid, observacao: text(x.observacao, 600), citacao_autorizada: x.citacao_autorizada === true })),
  };
}

// Junta os relatórios de um dia de feira no contrato da skill. Quem só mandou a prévia fica em "preliminares".
export function buildExport(fair, reports, day) {
  const list = reports.filter(r => r.event.start === day && r.contrato);
  const most = values => Object.entries(values.filter(Boolean).reduce((m, v) => ((m[v] = (m[v] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const pre = list.filter(r => r.status !== 'finalizado');
  return {
    evento: { id: `feira-${day}`, edicao: null, data: day, nome: fair.name, local: most(list.map(r => r.contrato.evento.local)), cidade: `${fair.city}/${fair.uf}`, inicio: most(list.map(r => r.contrato.evento.inicio || r.event.from)), fim: most(list.map(r => r.contrato.evento.fim || r.event.until)) },
    produtores: list.map(r => r.contrato.produtor),
    estoque: list.flatMap(r => r.contrato.estoque),
    vendas: list.flatMap(r => r.contrato.vendas.map(v => ({ ...v, sincronizada_em: r.receivedAt }))),
    fechamento: list.flatMap(r => r.contrato.fechamento),
    feedback: list.flatMap(r => r.contrato.feedback),
    situacao: { relatorio_preliminar: pre.length > 0, finalizados: list.length - pre.length, preliminares: pre.map(r => r.contrato.produtor.nome_curto || r.producer.name), gerado_em: new Date().toISOString() },
  };
}

export async function listReports(env, fairId) {
  const out = [];
  let cursor;
  do {
    const page = await env.BACKUPS.list({ prefix: `fairrep:${fairId}:`, cursor });
    for (const k of page.keys) { const r = await env.BACKUPS.get(k.name, 'json'); if (r) out.push(r); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out.sort((a, b) => a.event.start.localeCompare(b.event.start) || a.producer.name.localeCompare(b.producer.name, 'pt-BR'));
}

export async function handleFairsApi(request, env, fairId, action = 'reports') {
  if (!fairId) {
    if (request.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);
    return json({ fairs: (await allFairs(env)).map(publicFair) });
  }
  const fair = await getFair(env, fairId);
  if (!fair) return json({ error: 'Feira não encontrada.' }, 404);
  // Dados da feira para o app (ao entrar pelo QR).
  if (action === 'info') {
    if (request.method !== 'GET') return json({ error: 'Método não permitido.' }, 405);
    return json({ fair: publicFair(fair) });
  }
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  // Entrou na feira pelo QR: o organizador vê quem entrou (só nome e comunidade, com a concordância).
  if (action === 'join') {
    let body;
    try { body = JSON.parse((await request.text()).slice(0, 4096)); } catch { return json({ error: 'Pedido inválido.' }, 400); }
    const producerId = text(body.producerId, 40);
    if (!/^p-[a-z0-9]{3,30}$/.test(producerId) || !text(body.name) || !body.consentAt) return json({ error: 'Faltam nome, identificação ou concordância.' }, 400);
    const record = { producerId, name: text(body.name), community: text(body.community), eventStart: DAY.test(String(body.eventStart || '')) ? body.eventStart : '', consentAt: text(body.consentAt, 40), joinedAt: new Date().toISOString() };
    await env.BACKUPS.put(`fairjoin:${fair.id}:${producerId}`, JSON.stringify(record), { expirationTtl: TTL * 2 });
    return json({ ok: true });
  }
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
<ul>${editions.map(e => `<li>${esc(e.split('-').reverse().join('/'))}: ${reports.filter(r => r.event.start === e).map(r => esc(r.producer.name) + (r.status === 'finalizado' ? ' ✓' : ' (prévia)')).join(', ')} · <a href="/api/eventos/feira-${e}/export.json?token=${k}" style="color:#a7c97f">dados do dia</a></li>`).join('')}</ul><p>✓ = finalizou a feira no app. Prévia = enviado sozinho ao fim da feira, ainda sem finalizar.</p></section>
<a class="b" href="/fairs/${fair.id}/resumo.csv?key=${k}">Baixar resumo (uma linha por produtor)</a>
<a class="b s" href="/fairs/${fair.id}/produtos.csv?key=${k}">Baixar produtos (uma linha por produto)</a>
<a class="b s" href="/fairs/${fair.id}/relatorios.json?key=${k}">Baixar tudo para o Claude (JSON)</a>
<p>Os relatórios são apagados sozinhos 180 dias depois do envio.</p></main></html>`;
}

export async function serveFairExport(request, env, fairId, day) {
  const fair = await getFair(env, fairId && fairId !== 'feira' ? fairId : FAIRS[0].id);
  const token = new URL(request.url).searchParams.get('token') || '';
  if (!(await organizerOk(fair, token))) return json({ error: 'Acesso não autorizado.' }, 401);
  return json(buildExport(fair, await listReports(env, fair.id), day));
}

export async function serveFairPage(request, env, fairId, file) {
  const fair = await getFair(env, fairId);
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

// Quem entrou na feira pelo QR (para o painel do organizador).
export async function listJoins(env, fairId) {
  const out = [];
  let cursor;
  do {
    const page = await env.BACKUPS.list({ prefix: `fairjoin:${fairId}:`, cursor });
    for (const k of page.keys) { const r = await env.BACKUPS.get(k.name, 'json'); if (r) out.push(r); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
