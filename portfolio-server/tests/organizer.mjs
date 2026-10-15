// Painel do organizador, QR e entrada na feira, contra um worker em execução (BASE=…). KEY = código de acesso.
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const KEY = process.env.KEY || '';
let passed = 0;
async function step(name, fn) { await fn(); passed++; console.log('✓', name); }
let cookie = '';
const get = (path, opts = {}) => fetch(BASE + path, { redirect: 'manual', ...opts, headers: { ...(cookie ? { cookie } : {}), ...(opts.headers || {}) } });
const post = (path, fields) => get(path, { method: 'POST', body: new URLSearchParams(fields) });

await step('sem acesso, o painel pede o código (não abre)', async () => {
  const res = await get('/org/carangola');
  assert.equal(res.status, 401);
  assert.match(await res.text(), /Código de acesso/);
  assert.equal((await get('/org/nao-existe')).status, 401);
});

await step('código errado é recusado; o certo entra e guarda o acesso', async () => {
  if (!KEY) return console.log('  (sem KEY)');
  assert.equal((await post('/org/carangola/entrar', { code: 'ERRADO' })).status, 401);
  const ok = await post('/org/carangola/entrar', { code: KEY });
  assert.equal(ok.status, 303);
  cookie = ok.headers.get('set-cookie').split(';')[0];
  assert.match(cookie, /^agk=/);
  const panel = await get('/org/carangola');
  assert.equal(panel.status, 200);
  assert.match(await panel.text(), /Suas feiras/);
});

await step('link antigo com ?key= entra, guarda o acesso e limpa o endereço', async () => {
  if (!KEY) return;
  const saved = cookie; cookie = '';
  const res = await get(`/org/carangola?key=${KEY}`);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/org/carangola');
  assert.match(res.headers.get('set-cookie'), /^agk=/);
  cookie = saved;
});

let fairId = '', code = '';
await step('cria a feira e abre a página dela com o QR', async () => {
  if (!KEY) return;
  const res = await post('/org/carangola/nova', { name: 'Feira de Teste Ação', place: 'Praça', start: '2026-12-12', from: '08:00', until: '13:00' });
  assert.equal(res.status, 303);
  fairId = res.headers.get('location').split('/').pop();
  const page = await (await get(`/org/carangola/f/${fairId}`)).text();
  assert.match(page, /<svg/);
  assert.match(page, /Feira de Teste Ação/);
  code = page.match(/class="code">([A-Z0-9]{6})</)[1];
  assert.equal((await get(`/org/carangola/f/${fairId}/cartaz`)).status, 200);
  assert.equal((await get(`/fairs/${fairId}`)).status, 200, 'relatórios abrem com o acesso guardado');
});

await step('formulário recusa feira com horário invertido', async () => {
  if (!KEY) return;
  assert.equal((await post('/org/carangola/nova', { name: 'X', start: '2026-12-12', from: '13:00', until: '08:00' })).status, 400);
});

await step('página pública abre o app e o app acha a feira pelo id e pelo código', async () => {
  if (!KEY) return;
  const pub = await (await fetch(`${BASE}/f/${fairId}`)).text();
  assert.ok(pub.includes(`agrogestao://feira/${fairId}?s=`));
  const info = await (await fetch(`${BASE}/api/fairs/${fairId}/info`)).json();
  assert.equal(info.fair.name, 'Feira de Teste Ação');
  assert.equal(info.fair.keyHash, undefined);
  assert.equal((await (await fetch(`${BASE}/api/fair-code/${code.toLowerCase()}`)).json()).fair.id, fairId);
  assert.equal((await (await fetch(`${BASE}/api/fair-code/invent`)).json()).fair.id, 'feira-inventario');
  assert.equal((await fetch(`${BASE}/api/fair-code/ZZZZZZ`)).status, 404);
});

await step('entrar na feira aparece no painel; pedido sem concordância é recusado', async () => {
  if (!KEY) return;
  const join = b => fetch(`${BASE}/api/fairs/${fairId}/join`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  assert.equal((await join({ producerId: 'p-teste1', name: 'Jacks' })).status, 400);
  assert.equal((await join({ producerId: 'p-teste1', name: 'Jacks', community: 'Furriel', consentAt: new Date().toISOString() })).status, 200);
  const page = await (await get(`/org/carangola/f/${fairId}`)).text();
  assert.match(page, /Jacks/);
  assert.match(page, /1 entrou/);
});

await step('desistir tira o produtor da lista do organizador', async () => {
  if (!KEY) return;
  const res = await fetch(`${BASE}/api/fairs/${fairId}/leave`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ producerId: 'p-teste1' }) });
  assert.equal(res.status, 200);
  const page = await (await get(`/org/carangola/f/${fairId}`)).text();
  assert.match(page, /0 entraram/);
});

await step('cancelar exige confirmação; cancelada some do QR e reativar volta', async () => {
  if (!KEY) return;
  await post(`/org/carangola/f/${fairId}/cancelar`, {});
  assert.equal((await (await fetch(`${BASE}/api/fairs/${fairId}/info`)).json()).fair.cancelled, undefined, 'sem confirmar não cancela');
  await post(`/org/carangola/f/${fairId}/cancelar`, { confirm: 'on' });
  assert.equal((await (await fetch(`${BASE}/api/fairs/${fairId}/info`)).json()).fair.cancelled, true);
  assert.match(await (await fetch(`${BASE}/f/${fairId}`)).text(), /foi cancelada/);
  await post(`/org/carangola/f/${fairId}/cancelar`, { undo: '1' });
  assert.equal((await (await fetch(`${BASE}/api/fairs/${fairId}/info`)).json()).fair.cancelled, undefined);
});

await step('sair apaga o acesso', async () => {
  if (!KEY) return;
  const out = await get('/org/carangola/sair');
  assert.match(out.headers.get('set-cookie'), /Max-Age=0/);
});

console.log(`\n${passed} verificações do painel passaram.`);
