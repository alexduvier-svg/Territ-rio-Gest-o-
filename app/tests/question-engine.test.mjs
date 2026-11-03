import test from 'node:test';
import assert from 'node:assert/strict';
import { answerQuestion } from '../src/features/agent/question-engine.js';

// Banco de perguntas da Etapa 5: cada pergunta-base vira várias formas (com e sem acento, com "?",
// maiúsculas, "eu", "pra"/"para") e todas precisam ser entendidas com a mesma resposta.
const NOW = Date.parse('2026-11-03T15:00:00-03:00');
const P = (id, name, category, unit, stock, extra = {}) => ({ id, name, category, unit, stock, min: 2, price: 2500, cost: 1000, costKnown: true, active: true, ...extra });
const products = [
  P('ce250', 'Café Especial', 'Cafés', 'Pacote', 8, { weight: 250 }), P('ce500', 'Café Especial', 'Cafés', 'Pacote', 9, { weight: 500 }),
  P('ct250', 'Café Tradicional', 'Cafés', 'Pacote', 1, { weight: 250 }),
  P('tilapia', 'Tilápia', 'Piscicultura', 'kg', 12), P('betta', 'Betta Koi', 'Piscicultura', 'Unidade', 5), P('carpa', 'Carpa Koi', 'Piscicultura', 'Unidade', 0),
  P('queijo', 'Queijo Minas', 'Laticínios', 'Unidade', 4, { cost: 0, costKnown: false }),
];
const clients = [{ id: 'ana', name: 'Ana', customerType: 'PF' }, { id: 'merc', name: 'Mercado Bom Preço', customerType: 'PJ' }];
const sale = (id, date, items, extra = {}) => ({ id, status: 'completed', date, total: items.reduce((n, [, q, v]) => n + v, 0), subtotal: items.reduce((n, [, q, v]) => n + v, 0), payments: [{ method: extra.method || 'Pix', amount: items.reduce((n, [, q, v]) => n + v, 0) }], items: items.map(([productId, qty, v]) => ({ productId, qty, total: v, netTotal: v, costTotal: productId === 'queijo' ? undefined : qty * 1000, costKnown: productId !== 'queijo', unit: products.find(p => p.id === productId).unit })), ...extra });
const data = {
  products, clients,
  sales: [
    sale('h1', '2026-11-03T09:10:00-03:00', [['ce250', 3, 7500]], { customerId: 'ana' }),
    sale('h2', '2026-11-03T14:20:00-03:00', [['tilapia', 2, 6000], ['betta', 1, 2500]], { customerId: 'merc', customerType: 'PJ', method: 'Dinheiro' }),
    sale('o1', '2026-11-02T10:00:00-03:00', [['ce500', 1, 4500]]),
    sale('m1', '2026-11-01T11:00:00-03:00', [['queijo', 2, 3000]], { method: 'Débito' }),
    sale('out1', '2026-10-15T10:00:00-03:00', [['ce250', 5, 12500], ['ct250', 1, 2000]], { customerId: 'merc', customerType: 'PJ' }),
    { ...sale('dev', '2026-11-03T16:00:00-03:00', [['ce250', 50, 999999]]), status: 'returned' },
  ],
};
const ask = q => answerQuestion(data, q, { now: NOW });
const variants = base => {
  const plain = base.normalize('NFD').replace(/\p{M}/gu, '');
  return [...new Set([base, base + '?', plain, plain + '?', base.toUpperCase(), base.replace(/\bpara\b/g, 'pra'), base.replace(/^(quanto|quantos|quantas|o que)\s+(vendi|tenho|fiz|faturei|ganhei|recebi|preciso|cobro)\b/i, (m, w, v) => w + ' eu ' + v)])];
};
const bank = [
  ['o que vendi mais hoje', [/Mais vendidos hoje/, /Café Especial 250 g: 3 pacotes/]],
  ['qual o produto mais vendido do mês', [/Mais vendidos neste mês/, /1º Café Especial 250 g: 3 pacotes/]],
  ['o que vendi menos neste mês', [/Menos vendidos neste mês/, /Sem nenhuma venda neste mês: .*Café Tradicional/]],
  ['quantos peixes tenho em estoque', [/Em estoque de piscicultura agora: 12 kg · 5 unidades/, /Carpa Koi: 0 unidades/]],
  ['quanto café especial eu tenho', [/Em estoque.*17 pacotes/]],
  ['quanto tenho de café especial 250 g', [/Em estoque de Café Especial 250 g agora: 8 pacotes/]],
  ['vendi para quantos CNPJ este mês', [/Para CNPJ neste mês: 1 comprador, 1 venda, R\$ 85,00/]],
  ['vendi para quantos cnpj em outubro', [/Para CNPJ em outubro: 1 comprador, 1 venda, R\$ 145,00/]],
  ['quanto vendi hoje', [/Vendido hoje: R\$ 160,00 em 2 vendas/]],
  ['quanto vendi ontem', [/Vendido ontem: R\$ 45,00 em 1 venda/]],
  ['qual o faturamento do mês passado', [/Vendido no mês passado: R\$ 145,00 em 1 venda/]],
  ['quantas vendas fiz esta semana', [/3 vendas concluídas nesta semana/]],
  ['qual o meu lucro este mês', [/Lucro bruto neste mês.*R\$ 135,00/, /Conta parcial/]],
  ['qual o ticket médio de hoje', [/Ticket médio hoje: R\$ 80,00/]],
  ['quanto vendi de tilápia hoje', [/Vendido hoje de Tilápia: 2 kg, R\$ 60,00/]],
  ['quantos cafés vendi em outubro', [/Vendido em outubro de cafés: 6 pacotes, R\$ 145,00/]],
  ['o que está acabando', [/Sem estoque: Carpa Koi/, /No mínimo ou abaixo: Café Tradicional 250 g \(1 pacote\)/]],
  ['quais produtos estão sem estoque', [/Sem estoque: Carpa Koi/]],
  ['quem comprou mais este mês', [/1º Mercado Bom Preço: R\$ 85,00/]],
  ['quantos clientes compraram hoje', [/2 clientes identificados compraram hoje/]],
  ['qual a forma de pagamento mais usada este mês', [/Mais usada: Pix/]],
  ['quanto entrou no pix hoje', [/Pix: R\$ 75,00/]],
  ['que horas eu vendo mais', [/Horários que mais venderam neste mês/, /14h às 15h: R\$ 85,00/]],
  ['qual o melhor dia do mês', [/1º 03\/11\/2026 \(terça-feira\): R\$ 160,00/]],
  ['qual o preço do café especial', [/Café Especial 250 g: R\$ 25,00 por pacote/]],
  ['quanto vendi nos últimos 7 dias', [/Vendido nos últimos 7 dias: R\$ 235,00 em 4 vendas/]],
  ['quanto vendi desde o início', [/Vendido em todo o histórico: R\$ 380,00 em 5 vendas/]],
];

for (const [base, expected] of bank) for (const q of variants(base)) test('pergunta: ' + q, () => {
  const r = ask(q);
  assert.equal(r.understood, true, 'não entendeu: ' + q);
  for (const re of expected) assert.match(r.text, re, q + '\n---\n' + r.text);
});

test('pedido de venda nunca vira pergunta', () => {
  for (const q of ['vendi 3 taiobas', 'vendi dois cafés especiais', 'Vender 2 tilápia', 'eu vendi um queijo']) assert.equal(ask(q).understood, false, q);
});

test('sem registro, diz que não há; não inventa número', () => {
  const r = answerQuestion({ products, clients, sales: [] }, 'quanto vendi hoje?', { now: NOW });
  assert.equal(r.understood, true); assert.match(r.text, /Não há vendas registradas hoje/); assert.doesNotMatch(r.text, /R\$/);
});

test('produto que não existe não vira outro', () => {
  const r = ask('quanto tenho de abacate?');
  assert.match(r.text, /Não encontrei produto com esse nome/);
});

test('lucro sem nenhum custo informado não é calculado', () => {
  const r = answerQuestion({ products, clients, sales: [data.sales[3]] }, 'qual meu lucro este mês?', { now: NOW });
  assert.match(r.text, /Não dá para calcular o lucro/);
});

// Outras formas de perguntar a mesma coisa (sinônimos e fala do dia a dia).
const synonyms = [
  ['qual foi o meu produto campeão hoje', /Mais vendidos hoje/],
  ['o que saiu mais esta semana', /Mais vendidos nesta semana/],
  ['o que saiu menos no mês', /Menos vendidos neste mês/],
  ['qual o pior produto do mês', /Menos vendidos neste mês/],
  ['me mostra o estoque de peixe', /Em estoque de piscicultura agora/],
  ['tem tilápia no estoque', /Em estoque de Tilápia agora: 12 kg/],
  ['quanto sobrou de café tradicional', /Em estoque de Café Tradicional 250 g agora: 1 pacote/],
  ['estoque de queijo', /Em estoque de Queijo Minas agora: 4 unidades/],
  ['quanto faturei hoje', /Vendido hoje: R\$ 160,00/],
  ['qual o total vendido ontem', /Vendido ontem: R\$ 45,00/],
  ['quanto eu vendi essa semana', /Vendido nesta semana: R\$ 205,00 em 3 vendas/],
  ['quanto entrou no mês de outubro', /Vendido em outubro: R\$ 145,00/],
  ['quanto vendi de café em outubro', /Vendido em outubro de cafés: 6 pacotes/],
  ['quantos betta vendi hoje', /Vendido hoje de Betta Koi: 1 unidade/],
  ['quais clientes compraram mais', /Clientes que mais compraram neste mês/],
  ['quantas empresas compraram de mim este mês', /Para CNPJ neste mês: 1 comprador/],
  ['vendi para quantas pessoas físicas hoje', /Para pessoa física hoje: 1 comprador/],
  ['quanto recebi em dinheiro hoje', /Dinheiro: R\$ 85,00/],
  ['como me pagaram este mês', /Vendas por forma de pagamento neste mês/],
  ['qual dia da semana vendi mais', /Dias que mais venderam neste mês/],
  ['qual horário vende mais', /Horários que mais venderam neste mês/],
  ['quanto ganhei este mês', /Lucro bruto neste mês/],
  ['qual a minha margem hoje', /Lucro bruto hoje/],
  ['qual o valor médio por venda este mês', /Ticket médio neste mês/],
  ['quantas vendas eu fiz hoje', /2 vendas concluídas hoje/],
  ['o que eu preciso repor', /Sem estoque: Carpa Koi/],
  ['quais peixes acabaram', /Sem estoque: Carpa Koi/],
  ['quanto custa a tilápia', /Tilápia: R\$ 25,00 por kg/],
  ['qual o valor do queijo', /Queijo Minas: R\$ 25,00 por unidade/],
  ['quanto vendi nos últimos 30 dias', /Vendido nos últimos 30 dias: R\$ 380,00 em 5 vendas/],
];
for (const [base, re] of synonyms) for (const q of variants(base)) test('sinônimo: ' + q, () => {
  const r = ask(q);
  assert.equal(r.understood, true, 'não entendeu: ' + q);
  assert.match(r.text, re, q + '\n---\n' + r.text);
});
