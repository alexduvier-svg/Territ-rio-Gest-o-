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
  status: 'finalizado', finalizedAt: new Date().toISOString(),
  contrato: {
    produtor: { id: 'p-' + id, nome: 'Jacks Givisiez', nome_curto: 'Jacks', comunidade: 'São Manoel do Carangola', tenda: null },
    evento: { data: '2026-03-14', local: 'Praça', inicio: '09:00', fim: '14:00' },
    estoque: [{ produtor_id: 'x', produto_id: 'q', produto: 'Queijo minas', categoria: 'Laticínios', unidade: 'Unidade', preco: 35, qtd_inicial: 12, reposicoes: [{ hora: '11:00', qtd: 3 }, { hora: 'tarde', qtd: 9 }] }],
    vendas: [{ id: 'v1', produtor_id: 'x', hora: '2026-03-14T09:40:00-03:00', itens: [{ produto_id: 'q', qtd: 2, preco_unit: 35 }], total: 70, pagamento: 'PIX', cancelada: false },
      { id: 'v2', hora: '2026-03-14T13:59:00-03:00', itens: [{ produto_id: 'q', qtd: 1, preco_unit: 35 }], total: 35, pagamento: 'BITCOIN', cancelada: false, lancada_depois: true, registrada_em: '2026-03-15T10:00:00Z' }],
    fechamento: [{ produto_id: 'q', contado: 0 }],
    feedback: [{ observacao: 'Faltou sombra', citacao_autorizada: false }],
  },
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

await step('exportação no formato da skill, só com a chave', async () => {
  assert.equal((await fetch(`${BASE}/api/eventos/feira-2026-03-14/export.json?token=ERRADA`)).status, 401);
  if (!KEY) return;
  const x = await (await fetch(`${BASE}/api/eventos/feira-2026-03-14/export.json?token=${encodeURIComponent(KEY)}`)).json();
  assert.equal(x.evento.id, 'feira-2026-03-14');
  assert.equal(x.evento.inicio, '09:00');
  const p = x.produtores.find(v => v.id === 'p-' + id);
  assert.ok(p && p.nome_curto === 'Jacks');
  const e = x.estoque.find(v => v.produtor_id === p.id);
  assert.deepEqual(e.reposicoes, [{ hora: '11:00', qtd: 3 }]);
  const vs = x.vendas.filter(v => v.produtor_id === p.id);
  assert.equal(vs.length, 2);
  assert.equal(vs[1].pagamento, 'OUTRO');
  assert.equal(vs[1].lancada_depois, true);
  assert.ok(vs[0].sincronizada_em);
  assert.deepEqual(x.fechamento.find(v => v.produtor_id === p.id), { produtor_id: p.id, produto_id: 'q', contado: 0 });
  assert.equal(x.situacao.relatorio_preliminar, false);
  const alt = await (await fetch(`${BASE}/api/eventos/feira-inventario-2026-03-14/export.json?token=${encodeURIComponent(KEY)}`)).json();
  assert.equal(alt.vendas.length, x.vendas.length);
});

console.log(`\n${passed} verificações de feiras passaram.`);
