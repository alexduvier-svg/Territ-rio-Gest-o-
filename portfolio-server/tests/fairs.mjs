// Feiras oficiais e "Enviar relatório" contra um worker em execução (BASE=… para o publicado).
// KEY = chave do organizador (não fica no repositório).
import assert from 'node:assert/strict';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
const KEY = process.env.KEY || '';
const ORIGIN = { origin: 'https://localhost', 'content-type': 'application/json' };
let passed = 0;
async function step(name, fn) { await fn(); passed++; console.log('✓', name); }

const report = id => ({
  reportId: id, app: 'AGRO Gestão 0.9.4', consent: { at: new Date().toISOString(), text: 'Concordo' },
  producer: { name: 'Jacks Givisiez', business: 'Laticínios Givisiez', community: 'São Manoel do Carangola', city: 'Carangola', uf: 'MG' },
  event: { name: 'Feira do Inventário Rural e Cultural', start: '2026-03-14', end: '2026-03-14', from: '09:00', until: '14:00' },
  totals: { took: 40, sold: 38, left: 2, revenue: 102500, sales: 31, ticket: 3306 },
  answers: { maisVendido: 'Queijo minas', menosVendido: 'Linguiça artesanal', tempoEsgotar: '3h02', metodoPagamento: 'Pix (58%)' },
  payments: { Pix: 59450, Dinheiro: 30750, Crédito: 12300 },
  hourly: { 9: 21000, 10: 34000, 11: 28500, 12: 15000, 13: 4000 },
  products: [{ name: 'Queijo minas', description: 'Unidade', unit: 'Unidade', took: 15, sold: 15, left: 0, revenue: 52500, price: 3500, soldOutAt: '12:02', timeToSellOut: '3h02' }],
});

await step('lista pública das feiras sem a chave', async () => {
  const res = await fetch(`${BASE}/api/fairs`, { headers: ORIGIN });
  assert.equal(res.status, 200);
  const { fairs } = await res.json();
  const f = fairs.find(x => x.id === 'feira-inventario');
  assert.ok(f && f.name === 'Feira do Inventário Rural e Cultural');
  assert.equal(f.keyHash, undefined);
});

const id = 'teste-' + Date.now().toString(36);
await step('recebe o relatório com concordância', async () => {
  const res = await fetch(`${BASE}/api/fairs/feira-inventario/reports`, { method: 'POST', headers: ORIGIN, body: JSON.stringify(report(id)) });
  assert.equal(res.status, 200, await res.clone().text());
});

await step('recusa relatório sem concordância ou de feira inexistente', async () => {
  const bad = report(id + 'x'); delete bad.consent;
  assert.equal((await fetch(`${BASE}/api/fairs/feira-inventario/reports`, { method: 'POST', headers: ORIGIN, body: JSON.stringify(bad) })).status, 400);
  assert.equal((await fetch(`${BASE}/api/fairs/nao-existe/reports`, { method: 'POST', headers: ORIGIN, body: JSON.stringify(report(id)) })).status, 404);
});

await step('página e planilhas só com a chave do organizador', async () => {
  assert.equal((await fetch(`${BASE}/fairs/feira-inventario?key=ERRADA`)).status, 401);
  assert.equal((await fetch(`${BASE}/fairs/feira-inventario/resumo.csv`)).status, 401);
  if (!KEY) { console.log('  (sem KEY: download com chave não testado)'); return; }
  const page = await fetch(`${BASE}/fairs/feira-inventario?key=${encodeURIComponent(KEY)}`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Jacks Givisiez/);
  const resumo = await (await fetch(`${BASE}/fairs/feira-inventario/resumo.csv?key=${encodeURIComponent(KEY)}`)).text();
  assert.match(resumo, /Jacks Givisiez/);
  assert.match(resumo, /1\.025,00/);
  const produtos = await (await fetch(`${BASE}/fairs/feira-inventario/produtos.csv?key=${encodeURIComponent(KEY)}`)).text();
  assert.match(produtos, /Queijo minas;Unidade;Unidade;35,00;15;15;0/);
  const all = await (await fetch(`${BASE}/fairs/feira-inventario/relatorios.json?key=${encodeURIComponent(KEY)}`)).json();
  assert.ok(all.reports.some(r => r.reportId === id));
});

await step('reenviar o mesmo relatório substitui, não duplica', async () => {
  const again = report(id); again.totals.revenue = 110000;
  assert.equal((await fetch(`${BASE}/api/fairs/feira-inventario/reports`, { method: 'POST', headers: ORIGIN, body: JSON.stringify(again) })).status, 200);
  if (!KEY) return;
  const all = await (await fetch(`${BASE}/fairs/feira-inventario/relatorios.json?key=${encodeURIComponent(KEY)}`)).json();
  assert.equal(all.reports.filter(r => r.reportId === id).length, 1);
  assert.equal(all.reports.find(r => r.reportId === id).totals.revenue, 110000);
});

console.log(`\n${passed} verificações de feiras passaram.`);
