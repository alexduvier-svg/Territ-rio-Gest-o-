// Painel do organizador, QR e entrada na feira, contra um worker em execução (BASE=…). KEY = chave do organizador.
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const KEY = process.env.KEY || '';
let passed = 0;
async function step(name, fn) { await fn(); passed++; console.log('✓', name); }

await step('painel e formulário só com a chave', async () => {
  assert.equal((await fetch(`${BASE}/org/carangola`)).status, 401);
  assert.equal((await fetch(`${BASE}/org/carangola/nova?key=ERRADA`)).status, 401);
  assert.equal((await fetch(`${BASE}/org/nao-existe?key=${KEY}`)).status, 401);
});

let fairId = '', code = '';
await step('cria a feira e abre a página dela com o QR', async () => {
  if (!KEY) return console.log('  (sem KEY)');
  const body = new URLSearchParams({ key: KEY, name: 'Feira de Teste Ação', place: 'Praça', start: '2026-12-12', from: '08:00', until: '13:00' });
  const res = await fetch(`${BASE}/org/carangola/nova`, { method: 'POST', body, redirect: 'manual' });
  assert.equal(res.status, 303);
  fairId = new URL(res.headers.get('location')).pathname.split('/').pop();
  const page = await (await fetch(`${BASE}/org/carangola/f/${fairId}?key=${KEY}`)).text();
  assert.match(page, /<svg/);
  assert.match(page, /Feira de Teste Ação/);
  code = page.match(/class="code">([A-Z0-9]{6})</)[1];
  assert.equal((await fetch(`${BASE}/org/carangola/f/${fairId}/cartaz?key=${KEY}`)).status, 200);
});

await step('formulário recusa feira sem nome ou com horário invertido', async () => {
  if (!KEY) return;
  const bad = new URLSearchParams({ key: KEY, name: 'X', start: '2026-12-12', from: '13:00', until: '08:00' });
  assert.equal((await fetch(`${BASE}/org/carangola/nova`, { method: 'POST', body: bad, redirect: 'manual' })).status, 400);
});

await step('página pública abre o app e o app acha a feira pelo id e pelo código', async () => {
  if (!KEY) return;
  const pub = await (await fetch(`${BASE}/f/${fairId}`)).text();
  assert.ok(pub.includes(`agrogestao://feira/${fairId}?s=`));
  const info = await (await fetch(`${BASE}/api/fairs/${fairId}/info`)).json();
  assert.equal(info.fair.name, 'Feira de Teste Ação');
  assert.equal(info.fair.keyHash, undefined);
  const byCode = await (await fetch(`${BASE}/api/fair-code/${code.toLowerCase()}`)).json();
  assert.equal(byCode.fair.id, fairId);
  assert.equal((await fetch(`${BASE}/api/fair-code/ZZZZZZ`)).status, 404);
});

await step('entrar na feira aparece no painel; pedido sem concordância é recusado', async () => {
  if (!KEY) return;
  const post = b => fetch(`${BASE}/api/fairs/${fairId}/join`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  assert.equal((await post({ producerId: 'p-teste1', name: 'Jacks' })).status, 400);
  assert.equal((await post({ producerId: 'p-teste1', name: 'Jacks', community: 'Furriel', consentAt: new Date().toISOString() })).status, 200);
  const page = await (await fetch(`${BASE}/org/carangola/f/${fairId}?key=${KEY}`)).text();
  assert.match(page, /Jacks/);
  assert.match(page, /1 entrou/);
  const list = await (await fetch(`${BASE}/api/fairs`)).json();
  assert.ok(list.fairs.some(f => f.id === fairId));
});

console.log(`\n${passed} verificações do painel passaram.`);
