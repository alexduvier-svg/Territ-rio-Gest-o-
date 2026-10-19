// Testes do motor de linguagem — node testes.mjs
import fs from 'node:fs';
import { criarMotor, pluralizarExpressao, numeroPorExtenso, limparEntrada } from './motor-linguagem.js';

const dic = JSON.parse(fs.readFileSync(new URL('./dicionario_agro_ptbr.json', import.meta.url), 'utf8'));
const motor = criarMotor(dic);
let ok = 0, falha = 0;
const t = (nome, cond, info) => { if (cond) ok++; else { falha++; console.log('✗', nome, info !== undefined ? JSON.stringify(info, null, 0) : ''); } };

const casos = [
  ['vendi tres cafe especial', 'Vendi 3 cafés especiais.'],
  ['vendi tres cafe especial a 25 no pics', 'Vendi 3 cafés especiais a R$ 25,00 cada, no Pix.'],
  ['vemdi 2 quejo meia cura por 60 em dinhero', 'Vendi 2 queijos meia cura por R$ 60,00, em dinheiro.'],
  ['sobrou meia duzia de ovo caipira', 'Sobrou meia dúzia de ovos caipiras.'],
  ['vendi 2 pao de queijos e 1 doce de leite no cartao', 'Vendi 2 pães de queijo e 1 doce de leite, no cartão.'],
  ['vendi 3 kg de linguisa a 32 o kg no pix', 'Vendi 3 kg de linguiça a R$ 32,00 o kg, no Pix.'],
  ['vendi uma duzia e meia de banana 15 reais no dinheiro', 'Vendi 1,5 dúzia de bananas por R$ 15,00, em dinheiro.'],
  ['vendi vinte e cinco biscoito de povilho', 'Vendi 25 biscoitos de polvilho.'],
  ['VENDI ３ CAFÉ ESPECIAL，NO PIX', 'Vendi 3 cafés especiais, no Pix.'],
  ['vendi 2 goiabada cascao a 12 cada no credito', 'Vendi 2 goiabadas cascão a R$ 12,00 cada, no cartão de crédito.'],
  ['dois mexirica 5 conto pix', 'Vendi 2 mexericas por R$ 5,00, no Pix.'],
  ['perdi 4 iorgute', 'Perdi 4 iogurtes.'],
  ['vendi 1 rapadura fiado', 'Vendi 1 rapadura, fiado.'],
  ['3 xuxu 2 jilo no pix', null],
  ['vendi 2 cafe moido 1 mel e 3 pe de moleque tudo 80 no pix', null],
  ['levei 30 pacote de cafe especial', 'Levei 30 pacotes de café especial.'],
  ['vendi 2 batata doce', 'Vendi 2 batatas-doces.'],
  ['vendi 2 cheiro verde a 3 cada', 'Vendi 2 cheiros-verdes a R$ 3,00 cada, no Pix.'],
  ['cancela', 'Cancelar o último lançamento.'],
  ['vendi 2 ovos caipira dz pix', null],
  ['vendi 2 cerveja artezanal 30 cada no debito', 'Vendi 2 cervejas artesanais a R$ 30,00 cada, no cartão de débito.'],
  ['vendi 1,5 kg de queijo frescal 45 reais pix', 'Vendi 1,5 kg de queijo minas frescal por R$ 45,00, no Pix.'],
  ['vendi 2 quejo e 3 doce de leite por 70 total no pix', 'Vendi 2 queijos e 3 doces de leite, total de R$ 70,00, no Pix.'],
  ['vendi 4 cafe gurme a 30 cada 2 no credito e 2 no pix', 'Vendi 4 cafés gourmet a R$ 30,00 cada, sendo 2 no cartão de crédito e 2 no Pix.'],
  ['sobro 5 pacote de bicoito de povilho', 'Sobraram 5 pacotes de biscoito de polvilho.'],
  ['vendi meio quilo de queijo canastra 40 no pix', 'Vendi meio quilo de queijo canastra por R$ 40,00, no Pix.'],
  ['vende 2 bolo de fuba e 1 de cenoura no pix', 'Vendi 2 bolos de fubá e 1 bolo de cenoura, no Pix.'],
  ['vendi queijo 45 no pix', 'Vendi 1 queijo por R$ 45,00, no Pix.'],
  ['vendi pdq 3 no pix', 'Vendi 3 pães de queijo, no Pix.'],
  ['vendi 2 cafe moido 1 mel e 3 pe de moleque tudo 80 no pix', 'Vendi 2 cafés moídos, 1 mel e 3 pés de moleque, total de R$ 80,00, no Pix.'],
  ['vendi um doce de abobra e duas cocada 20 reais e cinquenta centavos dinheiro', 'Vendi 1 doce de abóbora e 2 cocadas por R$ 20,50, em dinheiro.'],
];
for (const [entrada, esperado] of casos) {
  const r = motor.interpretar(entrada);
  if (esperado) {
    const esp = esperado.includes('cheiros-verdes') ? 'Vendi 2 cheiros-verdes a R$ 3,00 cada.' : esperado;
    t(entrada, r.textoCorrigido === esp, { obtido: r.textoCorrigido, esperado: esp, itens: r.itens.map((i) => [i.produtoId, i.quantidade, i.unidade, i.precoUnitario, i.precoTotal, i.precoTipo]), pend: r.pendencias });
  } else console.log('·', entrada, '→', r.textoCorrigido, '| total', r.total, '| conf', r.confianca, '| pend', r.pendencias);
}

// estrutura
const r1 = motor.interpretar('vendi tres cafe especial a 25 no pics');
t('total 75', r1.total === 75, r1.total);
t('pix', r1.pagamento === 'pix', r1.pagamento);
t('quantidadeBase dúzia', motor.interpretar('vendi 2 duzia de ovo').itens[0].quantidadeBase === 24, motor.interpretar('vendi 2 duzia de ovo').itens);
const r2 = motor.interpretar('vendi 3 queijo 60 reais pix');
t('pendência total ambíguo', r2.pendencias.some((p) => p.includes('TOTAL')), r2.pendencias);
t('caiu no pix não é perda', motor.interpretar('vendi 2 rapadura caiu no pix').acao === 'venda');

// flexão
t('plural café especial', pluralizarExpressao('café especial') === 'cafés especiais');
t('plural pão de queijo', pluralizarExpressao('pão de queijo') === 'pães de queijo');
t('plural requeijão cremoso', pluralizarExpressao('requeijão cremoso') === 'requeijões cremosos', pluralizarExpressao('requeijão cremoso'));
t('plural mel', pluralizarExpressao('mel') === 'méis');
t('plural licor', pluralizarExpressao('licor') === 'licores');
t('plural pastel', pluralizarExpressao('pastel de queijo') === 'pastéis de queijo', pluralizarExpressao('pastel de queijo'));
t('extenso 2 f', numeroPorExtenso(2, 'f') === 'duas');
t('extenso 125', numeroPorExtenso(125) === 'cento e vinte e cinco', numeroPorExtenso(125));
t('extenso 1500', numeroPorExtenso(1500) === 'mil e quinhentos', numeroPorExtenso(1500));
t('limpar fullwidth', limparEntrada('３ｋｇ，ＰＩＸ') === '3kg,PIX', limparEntrada('３ｋｇ，ＰＩＸ'));

// correção de texto livre
const c = motor.corrigirTexto('concerteza agente volta, a geléia e o quejo sairam bem');
console.log('· corrigirTexto →', c.texto);
t('corrigirTexto', c.texto.includes('Com certeza') && c.texto.includes('geleia') && c.texto.includes('queijo'), c);

// catálogo do app (2 mil+)
const catalogo = [
  { id: 'P001', nome: 'Café Especial', produtorId: 'prod7' },
  { id: 'P900', nome: 'Doce de Jaca', produtorId: 'prod7' },
  { id: 'P901', nome: 'Queijo Minas Padrão', produtorId: 'prod3' },
  { id: 'P902', nome: 'Biscoito Fofão', apelidos: 'fofao; fofãozinho', produtorId: 'prod7' },
];
const res = motor.carregarCatalogo(catalogo);
t('catálogo mescla', res.mesclados === 1 && res.adicionados === 3, res);
motor.definirProdutor('prod7');
const r3 = motor.interpretar('vendi 2 doce de jaca e 3 fofaozinho no pix');
t('produto do catálogo', r3.itens[0]?.produtoId === 'P900' && r3.itens[1]?.produtoId === 'P902', r3.itens);
console.log('· catálogo →', r3.textoCorrigido);
t('café especial vira id do app', motor.interpretar('vendi 1 cafe especial').itens[0].produtoId === 'P001');

// previsão
const p1 = motor.prever('vendi 3 cafe es');
console.log('· prever "vendi 3 cafe es" →', p1.sugestoes.map((s) => s.texto));
t('previsão plural', p1.sugestoes[0]?.texto === 'cafés especiais', p1.sugestoes);
const p2 = motor.prever('vendi 2 queijo ');
console.log('· prever "vendi 2 queijo " →', p2.sugestoes.map((s) => s.texto));
const p3 = motor.prever('vendi 2 doce de ');
console.log('· prever "vendi 2 doce de " →', p3.sugestoes.map((s) => s.texto));
const p4 = motor.prever('vendi 1 cafe especial no ');
t('previsão pagamento', p4.sugestoes[0]?.tipo === 'pagamento', p4.sugestoes);
const p5 = motor.prever('vendi 2 duzia de ');
console.log('· prever "vendi 2 duzia de " →', p5.sugestoes.map((s) => s.texto));
const p6 = motor.prever('vendi 2 pao d');
console.log('· prever "vendi 2 pao d" →', p6.sugestoes.map((s) => s.texto));

// aprendizado
motor.aprender(motor.interpretar('vendi 2 cafe especial a 28 no pix'));
const p7 = motor.prever('vendi 1 cafe especial ');
t('sugere último preço', p7.sugestoes[0]?.texto === 'a R$ 28,00 cada', p7.sugestoes);
console.log('· keywords voz →', motor.gerarKeywordsVoz({ limite: 12 }));
console.log('· falar →', motor.fraseParaFalar(motor.interpretar('vendi duas goiabada a 12 cada no pix')));

// desempenho
const t0 = performance.now();
for (let i = 0; i < 300; i++) motor.interpretar('vemdi 2 quejo meia cura por 60 em dinhero e 3 bolu de fuba');
const t1 = performance.now();
console.log(`· desempenho: ${((t1 - t0) / 300).toFixed(2)} ms por frase`);
// catálogo grande sintético
const grande = Array.from({ length: 2000 }, (_, i) => ({ id: 'G' + i, nome: `produto teste ${['alfa', 'beta', 'gama', 'delta'][i % 4]} ${i}` }));
const tc = performance.now(); motor.carregarCatalogo(grande); console.log(`· carregar 2000 itens: ${(performance.now() - tc).toFixed(0)} ms`);
const tp = performance.now(); for (let i = 0; i < 50; i++) motor.prever('vendi 3 cafe es'); console.log(`· prever com 2.180 produtos: ${((performance.now() - tp) / 50).toFixed(2)} ms`);
const tf = performance.now(); motor.cacheCorrecao.clear(); motor.interpretar('vendi 2 xyzqueijo'); console.log(`· pior caso (palavra desconhecida): ${(performance.now() - tf).toFixed(1)} ms`);

console.log(`\n${ok} ok, ${falha} falha(s)`);
process.exit(falha ? 1 : 0);
