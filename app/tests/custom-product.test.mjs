import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parseRequest, answerQuery } from '../src/features/agent/core.js';
import { productMargins } from '../src/features/finance/finance.js';

// Produto e serviço cadastrados à mão (fora do catálogo automático) têm de valer em todo o app: cadastro,
// venda, estoque, Finanças e as perguntas da Inteligência (item 23 da sequência de 03/11/2026).
const ctx = { Date, Math, JSON, Intl }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../src/legacy/erp-core.js', import.meta.url), 'utf8'), ctx);
const E = ctx.ERP;

function model() {
  const d = E.seed(); d.products = []; d.sales = []; d.events = []; d.movements = []; d.dataContext = { id: 'produtor', type: 'real' };
  const m = new E.ERPModel(d);
  m.saveProducts({ name: 'Doce de Leite da Vó', category: 'Doces' }, [{ type: 'Artesanal', format: 'Cremoso', unit: 'Pote', weight: 500, volume: 0, priceInput: '18,00', costInput: '7,50', stockInput: '10', minInput: '2' }]);
  m.saveProducts({ name: 'Aula de Crochê', category: 'Outros' }, [{ type: '', format: '', unit: 'Unidade', weight: 0, volume: 0, priceInput: '60,00', costInput: '', stockInput: '5', minInput: '0' }]);
  return m;
}
const byName = (m, re) => m.data.products.find(p => re.test(p.name));

test('produto e serviço manuais são cadastrados com preço, custo e saldo informados', () => {
  const m = model(), doce = byName(m, /doce de leite/i), aula = byName(m, /crochê/i);
  assert.ok(doce && aula);
  assert.equal(doce.price, 1800); assert.equal(doce.cost, 750); assert.equal(doce.stock, 10); assert.equal(doce.unit, 'Pote');
  assert.equal(aula.stock, 5); assert.equal(aula.costKnown, false, 'custo vazio é desconhecido, não zero');
});

test('venda de produto manual baixa o estoque e entra nas margens com o custo histórico', () => {
  const m = model(), doce = byName(m, /doce de leite/i), aula = byName(m, /crochê/i);
  m.complete({ operationId: 'op-1', scope: 'loja', items: [{ productId: doce.id, rawQty: '3' }, { productId: aula.id, rawQty: '1' }], payment: 'Pix', discountMode: 'R$', discountValue: '', clientName: '' });
  assert.equal(m.product(doce.id).stock, 7); assert.equal(m.product(aula.id).stock, 4);
  const margins = productMargins(m.data.sales), d = margins.find(r => r.id === doce.id), a = margins.find(r => r.id === aula.id);
  assert.equal(d.revenue, 5400); assert.equal(d.cost, 2250); assert.equal(d.costKnown, true);
  assert.equal(a.revenue, 6000); assert.equal(a.costKnown, false, 'sem custo não vira margem de 100%');
});

test('pedido por voz ou texto reconhece o produto manual pelo nome', () => {
  const m = model(), doce = byName(m, /doce de leite/i);
  const r = parseRequest('vendi 2 doce de leite da vó', m.data, { scopeId: 'loja', requestId: 'r1', now: Date.now() });
  assert.equal(r.items[0].productId, doce.id); assert.equal(r.items[0].quantity, 2);
});

test('a Inteligência responde quanto há do produto manual em estoque', () => {
  const m = model();
  const req = parseRequest('quanto doce de leite tenho?', m.data, { scopeId: 'loja', requestId: 'r2', now: Date.now() });
  const answer = answerQuery(m.data, req, { now: Date.now(), scopeId: 'loja' });
  assert.match(answer.text, /Doce de Leite/i);
  assert.match(answer.text, /\b10\b/);
});
