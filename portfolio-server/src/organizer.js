// Painel do organizador e QR da feira.
//   GET  /org/:org?key=…                     → suas feiras (quem entrou, quem finalizou)
//   GET  /org/:org/nova?key=…                → formulário de nova feira
//   POST /org/:org/nova                      → cria a feira (a chave vai no formulário) e abre a página dela
//   GET  /org/:org/f/:feira?key=…            → QR da feira, código, link, quem entrou e os relatórios
//   GET  /org/:org/f/:feira/cartaz?key=…     → cartaz A4 para imprimir (QR grande e o passo a passo)
//   GET  /f/:feira                           → página pública do QR: "Entrar com o AGRO Gestão"
//   GET  /api/fair-code/:CODIGO              → o app acha a feira pelo código de 6 letras
// As feiras ficam no KV (BACKUPS): "fairdef:<id>" e "faircode:<CÓDIGO>" → id.

import { ORGS, organizerOk, getFair, allFairs, publicFair, listReports, listJoins } from './fairs.js';
import { qrSVG } from './qr.js';

export const ORG_ROUTE = /^\/org\/([a-z0-9-]{3,48})(?:\/(nova|f\/([a-z0-9-]{3,64})(\/cartaz)?))?$/;
export const PUBLIC_FAIR = /^\/f\/([a-z0-9-]{3,64})$/;
export const FAIR_CODE = /^\/api\/fair-code\/([A-Za-z0-9]{6})$/;

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const text = (v, max = 120) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^\d{2}:\d{2}$/;
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const HEADERS = { 'cache-control': 'no-store', 'x-robots-tag': 'noindex', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' };
const html = (body, status = 200) => new Response(body, { status, headers: { ...HEADERS, 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'" } });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const dateBR = d => (DAY.test(d || '') ? d.split('-').reverse().join('/') : '');
const weekdayOf = d => new Date(d + 'T12:00:00Z').getUTCDay();
const todayBR = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

// Próxima data da feira (a própria data, ou a próxima no mesmo dia da semana se for semanal).
export function nextDate(fair, today = todayBR()) {
  if (!DAY.test(fair.start || '')) return '';
  if (!fair.weekly || fair.start >= today) return fair.start;
  const t = new Date(today + 'T12:00:00Z');
  const diff = (fair.weekday - t.getUTCDay() + 7) % 7;
  return new Date(t.getTime() + diff * 864e5).toISOString().slice(0, 10);
}
const scheduleText = f => (f.weekly ? `${f.weekday === 0 || f.weekday === 6 ? 'Todo' : 'Toda'} ${WEEKDAYS[f.weekday]}` : dateBR(f.start)) + (f.from && f.until ? ` · ${f.from} às ${f.until}` : '');

const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 44);
const randomId = n => [...crypto.getRandomValues(new Uint8Array(n))].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('');
const randomCode = () => [...crypto.getRandomValues(new Uint8Array(6))].map(b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');

const page = (title, body) => `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title>
<style>
:root{--bg:#f2f2f6;--panel:#fff;--text:#16181b;--muted:#6b6b73;--line:#e3e3e8;--accent:#7fa653;--accent-ink:#4f7a2a;--on-accent:#14210d;--glass:rgba(22,24,27,.05);--lift:inset 0 1px 0 #fff,0 3px 0 rgba(37,52,66,.1),0 10px 22px rgba(37,52,66,.08)}
@media (prefers-color-scheme:dark){:root{--bg:#000;--panel:#1c1c1e;--text:#f2f2f2;--muted:#a1a1a8;--line:#2c2c2e;--accent-ink:#a7c97f;--glass:rgba(255,255,255,.06);--lift:inset 0 1px 0 rgba(255,255,255,.07),0 3px 0 rgba(0,0,0,.55),0 10px 22px rgba(0,0,0,.35)}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:620px;margin:auto;padding:22px 16px 40px}
h1{font-size:26px;line-height:1.2;margin:0 0 4px}h2{font-size:13px;letter-spacing:.04em;text-transform:uppercase;color:var(--accent-ink);margin:0 0 12px}
p{margin:6px 0}.muted{color:var(--muted)}.small{font-size:13px}
.card{background:linear-gradient(180deg,var(--glass),transparent 70%),var(--panel);border-radius:22px;padding:18px 16px;margin:16px 0;box-shadow:var(--lift)}
.row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line);color:inherit;text-decoration:none}
.row:first-of-type{border-top:0}.row strong{display:block}.row small{color:var(--muted)}.row .n{flex:none;text-align:right;font-variant-numeric:tabular-nums;color:var(--muted);font-size:14px}
.btn{display:block;width:100%;margin:10px 0 0;padding:14px 16px;border:0;border-radius:16px;font-family:inherit;font-size:16px;font-weight:700;line-height:1.2;text-align:center;text-decoration:none;cursor:pointer;background:var(--accent);color:var(--on-accent)}
.btn.soft{background:var(--glass);color:var(--text);font-weight:600}
label{display:block;margin:12px 0 4px;font-size:14px;color:var(--muted)}
input{width:100%;padding:12px 14px;border:0;border-radius:14px;font-family:inherit;font-size:16px;color:var(--text);background:var(--glass);box-shadow:inset 0 2px 3px rgba(0,0,0,.12)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.check{display:flex;gap:10px;align-items:center;margin-top:14px;color:var(--text)}.check input{width:22px;height:22px}
.qr{display:grid;place-items:center;padding:14px;margin:6px auto 10px;width:max-content;background:#fff;border-radius:18px}
.code{font:800 30px/1 ui-monospace,Consolas,monospace;letter-spacing:.18em;text-align:center;margin:6px 0}
.link{word-break:break-all;font-size:14px;color:var(--accent-ink)}
.back{display:inline-block;margin-bottom:10px;color:var(--accent-ink);text-decoration:none;font-weight:600}
.error{background:rgba(255,69,58,.12);color:#d70015;border-radius:12px;padding:10px 12px;margin-top:10px}
@media (prefers-color-scheme:dark){.error{color:#ff6961}}
</style><main>${body}</main></html>`;

const unauthorized = () => new Response('Acesso não autorizado.', { status: 401, headers: { ...HEADERS, 'content-type': 'text/plain; charset=utf-8' } });
const orgFairs = async (env, org) => (await allFairs(env)).filter(f => f.orgId === org.id);

export async function serveOrganizer(request, env, orgId, sub, fairId, poster) {
  const org = ORGS.find(o => o.id === orgId);
  const url = new URL(request.url);
  let key = url.searchParams.get('key') || '';
  let form = null;
  if (request.method === 'POST') { form = await request.formData(); key = String(form.get('key') || ''); }
  if (!(await organizerOk(org, key))) return unauthorized();
  const k = encodeURIComponent(key);
  const base = `/org/${org.id}`;

  if (sub === 'nova') {
    if (request.method === 'POST') {
      const v = name => text(form.get(name));
      const fair = { name: v('name'), place: v('place'), city: v('city') || org.city, uf: (v('uf') || org.uf).toUpperCase().slice(0, 2), start: v('start'), from: v('from'), until: v('until'), weekly: form.get('weekly') === 'on' };
      const problem = !fair.name ? 'Informe o nome da feira.' : !DAY.test(fair.start) ? 'Informe a data.' : !HM.test(fair.from) || !HM.test(fair.until) || fair.from >= fair.until ? 'Informe o horário (o fim depois do início).' : '';
      if (problem) return html(page('Nova feira', newFairForm(org, key, fair, problem)), 400);
      fair.id = `${slug(fair.name) || 'feira'}-${randomId(4)}`;
      fair.short = fair.name; fair.aliases = []; fair.orgId = org.id; fair.weekday = weekdayOf(fair.start);
      fair.code = randomCode(); fair.createdAt = new Date().toISOString();
      await env.BACKUPS.put(`fairdef:${fair.id}`, JSON.stringify(fair));
      await env.BACKUPS.put(`faircode:${fair.code}`, fair.id);
      return Response.redirect(`${url.origin}${base}/f/${fair.id}?key=${k}`, 303);
    }
    return html(page('Nova feira', newFairForm(org, key, { city: org.city, uf: org.uf, from: '08:00', until: '13:00' }, '')));
  }

  if (fairId) {
    const fair = await getFair(env, fairId);
    if (!fair || fair.orgId !== org.id) return html(page('Feira não encontrada', `<a class="back" href="${base}?key=${k}">‹ Suas feiras</a><h1>Feira não encontrada</h1>`), 404);
    const link = `${url.origin}/f/${fair.id}`;
    if (poster) return html(posterPage(fair, link));
    const [joins, reports] = await Promise.all([listJoins(env, fair.id), listReports(env, fair.id)]);
    const done = new Set(reports.filter(r => r.status === 'finalizado').map(r => r.contrato?.produtor?.id));
    return html(page(fair.name, `<a class="back" href="${base}?key=${k}">‹ Suas feiras</a>
<h1>${esc(fair.name)}</h1><p class="muted">${esc(scheduleText(fair))}${fair.place ? ' · ' + esc(fair.place) : ''}</p>
<section class="card"><h2>QR da feira</h2><div class="qr">${qrSVG(link, 220)}</div>
${fair.code ? `<p class="muted small" style="text-align:center">Código para digitar no app</p><p class="code">${esc(fair.code)}</p>` : ''}
<p class="link" style="text-align:center">${esc(link)}</p>
<a class="btn" href="${base}/f/${fair.id}/cartaz?key=${k}">Abrir cartaz para imprimir</a>
<p class="muted small">Envie o link no grupo dos produtores ou imprima o cartaz. O produtor aponta a câmera, toca em "Entrar com o AGRO Gestão" e a feira aparece pronta no app.</p></section>
<section class="card"><h2>Produtores · ${joins.length} ${joins.length === 1 ? 'entrou' : 'entraram'}</h2>
${joins.length ? joins.map(j => `<div class="row"><span><strong>${esc(j.name)}</strong><small>${esc(j.community || '')}</small></span><span class="n">${done.has(j.producerId) ? 'finalizou ✓' : 'na feira'}</span></div>`).join('') : '<p class="muted">Ninguém entrou ainda. Quando um produtor escanear o QR e concordar, ele aparece aqui.</p>'}</section>
<section class="card"><h2>Dados e relatórios</h2><p class="muted">${reports.length} ${reports.length === 1 ? 'relatório recebido' : 'relatórios recebidos'}.</p>
<a class="btn soft" href="/fairs/${fair.id}?key=${k}">Abrir relatórios e planilhas</a></section>`));
  }

  const fairs = await orgFairs(env, org);
  const counts = await Promise.all(fairs.map(async f => (await listJoins(env, f.id)).length));
  return html(page('Suas feiras', `<p class="muted small">${esc(org.name)}</p><h1>Suas feiras</h1>
<section class="card">${fairs.length ? fairs.map((f, i) => `<a class="row" href="${base}/f/${f.id}?key=${k}"><span><strong>${esc(f.name)}</strong><small>${esc(f.start || f.weekly ? scheduleText(f) : 'Feira oficial')}</small></span><span class="n">${counts[i]} ${counts[i] === 1 ? 'produtor' : 'produtores'} ›</span></a>`).join('') : '<p class="muted">Nenhuma feira ainda.</p>'}</section>
<a class="btn" href="${base}/nova?key=${k}">+ Nova feira</a>`));
}

function newFairForm(org, key, f, problem) {
  return `<a class="back" href="/org/${org.id}?key=${encodeURIComponent(key)}">‹ Suas feiras</a><h1>Nova feira</h1>
<form method="post" class="card"><input type="hidden" name="key" value="${esc(key)}">
<label for="name">Nome da feira</label><input id="name" name="name" required maxlength="80" value="${esc(f.name || '')}" placeholder="Feira da Agricultura Familiar">
<label for="place">Local</label><input id="place" name="place" maxlength="80" value="${esc(f.place || '')}" placeholder="Praça da Matriz">
<div class="two"><div><label for="city">Município</label><input id="city" name="city" maxlength="60" value="${esc(f.city || '')}"></div><div><label for="uf">UF</label><input id="uf" name="uf" maxlength="2" value="${esc(f.uf || '')}"></div></div>
<label for="start">Data</label><input id="start" name="start" type="date" required value="${esc(f.start || '')}">
<div class="two"><div><label for="from">Início</label><input id="from" name="from" type="time" required value="${esc(f.from || '')}"></div><div><label for="until">Fim</label><input id="until" name="until" type="time" required value="${esc(f.until || '')}"></div></div>
<label class="check"><input type="checkbox" name="weekly"${f.weekly ? ' checked' : ''}> Repete toda semana, no mesmo dia</label>
${problem ? `<p class="error" role="alert">${esc(problem)}</p>` : ''}
<button class="btn" type="submit">Criar feira e gerar o QR</button></form>`;
}

function posterPage(fair, link) {
  return `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cartaz · ${esc(fair.name)}</title>
<style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{margin:0;background:#fff;color:#111;font:18px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
.p{max-width:180mm;margin:auto;padding:24px 8px;text-align:center}h1{font-size:40px;line-height:1.1;margin:0 0 8px}.sub{font-size:20px;color:#555;margin:0 0 22px}
.qr{display:inline-block;padding:16px;border:3px solid #7fa653;border-radius:22px}.code{font:800 34px/1 ui-monospace,Consolas,monospace;letter-spacing:.2em;margin:14px 0 4px}
ol{text-align:left;max-width:140mm;margin:24px auto 0;padding-left:28px;font-size:20px}li{margin:8px 0}.foot{margin-top:26px;font-size:14px;color:#666}
.hint{font-size:13px;color:#888;margin-top:18px}@media print{.hint{display:none}}</style>
<div class="p"><h1>${esc(fair.name)}</h1><p class="sub">${esc(scheduleText(fair))}${fair.place ? ' · ' + esc(fair.place) : ''}</p>
<div class="qr">${qrSVG(link, 400)}</div>${fair.code ? `<p class="code">${esc(fair.code)}</p>` : ''}
<ol><li>Aponte a câmera do celular para o QR.</li><li>Toque no link e em <strong>Entrar com o AGRO Gestão</strong>.</li><li>Confira os dados e toque em <strong>Concordo e entrar</strong>. Pronto: suas vendas desta feira vão para a organização.</li></ol>
<p class="foot">Sem câmera? No app, vá em Eventos → Entrar numa feira e digite o código.</p>
<p class="hint">Para imprimir: menu do navegador → Imprimir (ou Compartilhar → Imprimir no celular).</p></div></html>`;
}

// Página pública do QR (sem chave): mostra a feira e abre o app.
export async function servePublicFair(request, env, fairId) {
  const fair = await getFair(env, fairId);
  const url = new URL(request.url);
  if (!fair) return html(page('Feira não encontrada', '<h1>Feira não encontrada</h1><p class="muted">Confira o QR ou peça um novo à organização.</p>'), 404);
  const open = `agrogestao://feira/${encodeURIComponent(fair.id)}?s=${encodeURIComponent(url.origin)}`;
  const when = fair.start || fair.weekly ? scheduleText({ ...fair, start: nextDate(fair) }) : '';
  return html(page(fair.name, `<p class="muted small">${esc(fair.organizer)}</p><h1>${esc(fair.name)}</h1>
<p class="muted">${esc(when)}${fair.place ? ' · ' + esc(fair.place) : ''}</p>
<section class="card"><h2>Produtor da feira</h2><p>Toque abaixo para entrar nesta feira com o app. Suas vendas da feira vão para a organização, com o seu nome. Custos, clientes e outras vendas não vão.</p>
<a class="btn" href="${esc(open)}">Entrar com o AGRO Gestão</a>
${fair.code ? `<p class="muted small" style="margin-top:12px">Ou, no app, vá em Eventos → Entrar numa feira e digite o código <strong>${esc(fair.code)}</strong>.</p>` : ''}</section>
<section class="card"><h2>Ainda não tem o app?</h2><p class="muted">O AGRO Gestão é gratuito para os produtores da feira. Peça o link de instalação à organização.</p></section>`));
}

// O app acha a feira pelo código digitado.
export async function serveFairCode(request, env, code) {
  const id = await env.BACKUPS.get(`faircode:${code.toUpperCase()}`);
  const fair = id && await getFair(env, id);
  if (!fair) return json({ error: 'Código não encontrado. Confira as 6 letras.' }, 404);
  return json({ fair: publicFair(fair) });
}
