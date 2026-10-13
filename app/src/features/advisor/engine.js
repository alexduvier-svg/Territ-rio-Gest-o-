// Motor de orientação. Recebe os números reais do período (montados em src/legacy, advisorInput) e
// devolve orientação em três níveis:
//   1. situation + actions: o que aconteceu, em uma frase, e até três coisas para fazer agora;
//   2. cada item: por que importa e como fazer na banca (temas de knowledge.js);
//   3. numbers: os valores e as fórmulas, para quem quiser conferir.
// Toda a complexidade fica aqui; o produtor só lê frases curtas. Valores em centavos.
import { TOPICS } from './knowledge.js';
import { forecastNextEvent, runOut } from './forecast.js';

const LEVELS = ['urgente', 'atencao', 'oportunidade', 'bom'];
const TARGET_MARGIN = 0.4;
const LOW_MARGIN = 0.3;

export const brl = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = ratio => Math.round(ratio * 100) + '%';
const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;
const list = names => names.length <= 1 ? names.join('') : names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1];

// Menor preço terminado em 90 centavos que alcança a margem pedida (ex.: 24,90).
export function priceFor(cost, margin = TARGET_MARGIN) {
  const target = cost / (1 - margin);
  return Math.ceil((target + 10) / 100) * 100 - 10;
}

function item(id, level, fields) {
  return { id, level, impact: 0, steps: [], topics: [], numbers: [], ...fields };
}

function productIndex(input) {
  return new Map((input.products || []).map(p => [p.id, p]));
}

// ------------------------------------------------------------------------------------- regras

function noSales(input) {
  if (input.current.salesCount > 0) return [];
  return [item('sem-vendas', 'atencao', {
    title: 'Ainda sem vendas neste período',
    happened: `Não há vendas registradas em ${input.periodLabel}.`,
    todo: 'Registre cada venda no app: é com elas que a orientação fica precisa.',
    why: 'Sem as vendas registradas, o app não consegue mostrar o que vende, o que encalha e onde está o lucro.',
    impact: 1,
  })];
}

function lossPeriod(input) {
  const c = input.current;
  if (!c.salesCount || c.revenue <= 0 || c.result >= 0 || !input.hasCost) return [];
  const profitPerSale = (c.revenue - c.cost) / c.salesCount;
  const deficit = -c.result;
  const needed = profitPerSale > 0 ? Math.ceil(deficit / profitPerSale) : null;
  return [item('prejuizo', 'urgente', {
    title: 'O período fechou no prejuízo',
    happened: `Você vendeu ${brl(c.revenue)}, mas produtos e despesas custaram ${brl(c.cost + c.expense)}. Faltaram ${brl(deficit)}.`,
    todo: needed ? `Faltaram cerca de ${plural(needed, 'venda', 'vendas')} para empatar: corte o encalhe e as despesas antes de gastar com divulgação.` : 'Seus preços não cobrem o custo dos produtos: revise os preços antes da próxima feira.',
    why: 'Prejuízo quase sempre vem de três lugares: produto vendido com pouco lucro, produto que voltou para casa e despesa alta para o tamanho das vendas.',
    steps: ['Veja abaixo quais produtos têm pouco lucro e quais encalharam.', 'Leve para a feira só o que costuma vender.', 'Adie despesas que não trazem venda.'],
    topics: ['equilibrio', 'margemliquida', 'giro'],
    numbers: [
      { label: 'Receita', value: brl(c.revenue) },
      { label: 'Custo dos produtos vendidos', value: brl(c.cost) },
      { label: 'Despesas', value: brl(c.expense) },
      { label: 'Resultado', value: brl(c.result) },
      { label: 'Lucro médio por venda', value: brl(Math.round(profitPerSale)), detail: '(receita − custo dos produtos) ÷ vendas' },
      ...(needed ? [{ label: 'Vendas a mais para empatar', value: String(needed), detail: 'falta ÷ lucro médio por venda' }] : []),
    ],
    impact: deficit * 3,
  })];
}

function missingCost(input) {
  const index = productIndex(input);
  const sold = input.current.rank.map(r => index.get(r.id)).filter(p => p && p.price > 0 && !(p.cost > 0));
  if (!sold.length) return [];
  const names = [...new Set(sold.map(p => p.name))].slice(0, 4);
  const amount = input.current.rank.filter(r => sold.some(p => p.id === r.id)).reduce((n, r) => n + r.amount, 0);
  return [item('sem-custo', 'atencao', {
    title: 'Falta o custo de alguns produtos',
    happened: `${list(names)} ${names.length === 1 ? 'está' : 'estão'} sem custo cadastrado.`,
    todo: `Cadastre quanto custa produzir ${list(names)}: sem isso o app não sabe se você está lucrando.`,
    why: 'O custo é o que você gasta para produzir ou comprar uma unidade (insumos, embalagem, transporte). Com ele, o app mostra o lucro real de cada produto.',
    steps: ['Abra o Estoque, toque no produto e preencha o custo por unidade.', 'Na dúvida, some insumos e embalagem e divida pela quantidade produzida.'],
    topics: ['margembruta'],
    cta: { label: 'Abrir o Estoque', action: 'nav', data: { page: 'Estoque' } },
    impact: amount,
  })];
}

function pricing(input) {
  const index = productIndex(input);
  const total = input.current.revenue || 0;
  const out = [];
  const belowCost = input.current.rank.map(r => ({ r, p: index.get(r.id) })).filter(({ p }) => p && p.cost > 0 && p.price > 0 && p.price <= p.cost);
  if (belowCost.length) {
    const names = belowCost.map(({ p }) => p.name);
    out.push(item('abaixo-custo', 'urgente', {
      title: 'Produto vendido abaixo do custo',
      happened: `${list(names)} ${names.length === 1 ? 'custa' : 'custam'} mais para produzir do que o preço de venda.`,
      todo: belowCost.map(({ p }) => `Suba ${p.name} para ${brl(priceFor(p.cost))}`).join('; ') + '.',
      why: 'Cada unidade vendida assim tira dinheiro do seu bolso. Quanto mais vende, mais perde.',
      topics: ['margembruta', 'nomepreco'],
      numbers: belowCost.map(({ p }) => ({ label: p.name, value: `preço ${brl(p.price)} · custo ${brl(p.cost)}` })),
      impact: belowCost.reduce((n, { r }) => n + r.amount, 0) * 2,
    }));
  }
  // O campeão de vendas com pouco lucro (o caso clássico do material).
  const top = input.current.rank[0];
  const p = top && index.get(top.id);
  if (p && p.cost > 0 && p.price > p.cost && total > 0) {
    const margin = (p.price - p.cost) / p.price;
    const share = top.amount / total;
    if (margin < LOW_MARGIN && share >= 0.25) {
      const ideal = priceFor(p.cost);
      const step = ideal > p.price * 1.3 ? priceFor(p.cost, Math.min(LOW_MARGIN, margin + 0.1)) : ideal;
      const gain = Math.round((step - p.price) * top.qty);
      out.push(item('campeao-margem', margin < 0.15 ? 'urgente' : 'atencao', {
        title: `${p.name} vende muito, mas dá pouco lucro`,
        happened: `${p.name} é ${pct(share)} da sua receita, mas de cada ${brl(p.price)} sobram só ${brl(p.price - p.cost)}.`,
        todo: step < ideal
          ? `Suba ${p.name} aos poucos: primeiro para ${brl(step)}, depois avalie chegar a ${brl(ideal)}.`
          : `Suba ${p.name} de ${brl(p.price)} para ${brl(ideal)}, ou consiga um custo menor.`,
        why: 'Quando o produto que mais vende tem pouco lucro, você trabalha muito e sobra pouco. Um pequeno ajuste no preço do campeão pesa mais no seu bolso do que qualquer outro.',
        steps: [
          'Valorize antes de subir: história do produto, nome com origem e degustação.',
          'Preço terminado em 90 parece menor.',
          `Com o mesmo volume deste período, o novo preço renderia cerca de ${brl(gain)} a mais.`,
        ],
        topics: ['margembruta', 'nomepreco', 'historia', 'degustacao'],
        numbers: [
          { label: 'Preço atual', value: brl(p.price) },
          { label: 'Custo', value: brl(p.cost) },
          { label: 'Lucro por unidade', value: `${brl(p.price - p.cost)} (${pct(margin)})`, detail: '(preço − custo) ÷ preço' },
          { label: 'Peso na receita', value: pct(share), detail: 'receita do produto ÷ receita total' },
          { label: 'Preço sugerido', value: brl(ideal), detail: `para sobrar ${pct(TARGET_MARGIN)} do preço` },
        ],
        impact: gain * 2,
      }));
    }
  }
  return out;
}

function leftovers(input) {
  const out = [];
  const champion = input.current.rank[0]?.name;
  for (const event of input.events || []) {
    const items = event.items.filter(i => i.taken > 0);
    const stuck = items.filter(i => i.left > 0 && (i.taken - i.left) / i.taken < 0.5).sort((a, b) => b.left * b.price - a.left * a.price);
    const soldOut = items.filter(i => i.left <= 0);
    const lost = stuck.reduce((n, i) => n + Math.round(i.left * i.price), 0);
    if (stuck.length) {
      out.push(item('encalhe-' + event.id, 'atencao', {
        title: `Sobrou produto na ${event.name}`,
        happened: `Voltaram para casa: ${list(stuck.slice(0, 3).map(i => `${i.left.toLocaleString('pt-BR')} de ${i.taken.toLocaleString('pt-BR')} ${i.name}`))}. Isso daria ${brl(lost)}.`,
        todo: `Na próxima feira, leve menos ${list(stuck.slice(0, 2).map(i => i.name))}${champion ? ` e ofereça a sobra em combo com ${champion}` : ''}.`,
        why: 'Produto que volta para casa é dinheiro parado e pode estragar. Ajustar a quantidade levada é a forma mais rápida de melhorar o resultado.',
        steps: ['Leve a quantidade que costuma vender, não a que cabe no carro.', 'O que sobrar vira combo ou kit antes de perder a validade.'],
        topics: ['giro', 'perdida', 'combinacoes'],
        numbers: stuck.map(i => ({ label: i.name, value: `vendeu ${pct((i.taken - i.left) / i.taken)}`, detail: `${(i.taken - i.left).toLocaleString('pt-BR')} de ${i.taken.toLocaleString('pt-BR')} · sobra vale ${brl(Math.round(i.left * i.price))}` })),
        impact: lost,
      }));
    }
    if (soldOut.length) {
      out.push(item('esgotou-' + event.id, 'oportunidade', {
        title: `Esgotou na ${event.name}`,
        happened: `${list(soldOut.slice(0, 3).map(i => i.name))} ${soldOut.length === 1 ? 'acabou' : 'acabaram'} durante a feira.`,
        todo: `Leve mais ${list(soldOut.slice(0, 2).map(i => i.name))} na próxima feira: teve cliente que ficou sem.`,
        why: 'Produto que esgota mostra procura maior que a oferta. Levar um pouco mais é venda quase garantida.',
        topics: ['giro', 'espaco'],
        impact: soldOut.reduce((n, i) => n + Math.round(i.taken * i.price * 0.25), 0),
      }));
    }
  }
  return out;
}

function trend(input) {
  const c = input.current, p = input.previous;
  if (!p || !p.revenue || !c.salesCount) return [];
  const change = (c.revenue - p.revenue) / p.revenue;
  const numbers = [
    { label: input.periodLabel, value: brl(c.revenue) },
    { label: input.previousLabel || 'Período anterior', value: brl(p.revenue) },
    { label: 'Variação', value: (change >= 0 ? '+' : '') + pct(change) },
  ];
  if (change <= -0.15) {
    return [item('queda', 'atencao', {
      title: 'As vendas caíram',
      happened: `Você vendeu ${pct(-change)} menos que no período anterior (${brl(c.revenue)} contra ${brl(p.revenue)}).`,
      todo: 'Antes da próxima feira, mande a lista do dia no WhatsApp e capriche na primeira impressão da banca.',
      why: 'Venda que cai costuma ser menos gente parando na banca ou clientes que não lembraram da feira. As duas coisas se resolvem com aviso antes e banca que chama atenção.',
      steps: ['Mande a lista do dia para seus clientes um dia antes.', 'Produto mais bonito na frente, elevado.', 'Preço visível em tudo.'],
      topics: ['encarte', 'impacto', 'precos', 'ancora'],
      numbers,
      cta: { label: 'Preparar aviso no WhatsApp', action: 'broadcast' },
      impact: p.revenue - c.revenue,
    })];
  }
  if (change >= 0.1) {
    return [item('alta', 'bom', {
      title: 'As vendas cresceram',
      happened: `Você vendeu ${pct(change)} mais que no período anterior.`,
      todo: 'Repita o que fez de diferente desta vez.',
      numbers,
      impact: c.revenue - p.revenue,
    })];
  }
  return [];
}

function concentration(input) {
  const c = input.current;
  if (c.rank.length < 3 || !c.revenue) return [];
  const top = c.rank[0];
  const share = top.amount / c.revenue;
  const weak = c.rank.filter(r => r.amount / c.revenue < 0.05).map(r => r.name);
  if (share < 0.6) return [];
  return [item('dependencia', 'oportunidade', {
    title: `Seu negócio depende de ${top.name}`,
    happened: `${top.name} trouxe ${pct(share)} de tudo o que você vendeu.`,
    todo: `Nunca deixe faltar ${top.name} e coloque ao lado dele um produto que combine, para vender mais dos outros.`,
    why: 'Ter um campeão é ótimo, mas se ele faltar a feira inteira cai. Usar o campeão para puxar outros produtos protege as vendas.',
    steps: [
      `Reserve o centro da mesa para ${top.name}.`,
      'Monte um combo com um produto que combine e uma plaquinha "Combinam muito!".',
      ...(weak.length ? [`${list(weak.slice(0, 3))} quase não ${weak.length === 1 ? 'vende' : 'vendem'}: leve menos ou use em combo.`] : []),
    ],
    topics: ['participacao', 'combinacoes', 'espaco'],
    numbers: c.rank.slice(0, 5).map(r => ({ label: r.name, value: pct(r.amount / c.revenue), detail: brl(r.amount) })),
    impact: Math.round(c.revenue * 0.1),
  })];
}

function basket(input) {
  const c = input.current, p = input.previous;
  if (c.salesCount < 5) return [];
  const ticketDrop = p && p.salesCount >= 5 && p.ticket > 0 ? (p.ticket - c.ticket) / p.ticket : 0;
  if (c.productsPerSale >= 1.3 && ticketDrop < 0.15) return [];
  const top = c.rank[0]?.name;
  return [item('ticket', 'oportunidade', {
    title: ticketDrop >= 0.15 ? 'Cada cliente está gastando menos' : 'Quase todo cliente leva um produto só',
    happened: ticketDrop >= 0.15
      ? `A compra média caiu de ${brl(p.ticket)} para ${brl(c.ticket)}.`
      : `Em média, cada venda tem ${c.productsPerSale.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} produto. A compra média é ${brl(c.ticket)}.`,
    todo: `Deixe itens pequenos perto de onde você recebe${top ? ` e ofereça um combo de ${top} com outro produto` : ''}.`,
    why: 'Vender mais um item para quem já está comprando é a venda mais fácil da feira: o cliente já parou e já confia em você.',
    steps: ['Sachê, bala de mel ou minigeleia ao lado do caixa, com preço visível.', 'Ofereça sempre primeiro a versão melhor do produto.', 'Combos e kits presente com plaquinha.'],
    topics: ['fechamento', 'combinacoes', 'ticket'],
    numbers: [
      { label: 'Compra média (ticket)', value: brl(c.ticket), detail: 'receita ÷ vendas' },
      { label: 'Produtos por venda', value: c.productsPerSale.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) },
      ...(p && p.ticket ? [{ label: 'Compra média no período anterior', value: brl(p.ticket) }] : []),
    ],
    impact: Math.round(c.ticket * 0.15 * c.salesCount),
  })];
}

function restock(input) {
  const index = productIndex(input);
  const soon = input.upcoming && input.upcoming.daysUntil <= 7;
  const risky = input.current.rank.slice(0, 6).map(r => index.get(r.id)).filter(p => p && p.stock <= Math.max(p.min || 0, 0));
  if (!risky.length) return [];
  const empty = risky.filter(p => p.stock <= 0);
  return [item('repor', empty.length && soon ? 'urgente' : 'atencao', {
    title: 'Produto que vende bem está acabando',
    happened: risky.map(p => p.stock <= 0 ? `${p.name} acabou` : `${p.name} tem só ${p.stock.toLocaleString('pt-BR')} ${p.unitLabel || ''}`.trim()).join('; ') + '.',
    todo: `Reponha ${list(risky.slice(0, 3).map(p => p.name))}${soon ? ` antes da ${input.upcoming.name}` : ' antes da próxima feira'}.`,
    why: 'Faltar o produto que mais vende é a venda perdida mais cara: o cliente veio por ele.',
    topics: ['giro', 'espaco'],
    numbers: risky.map(p => ({ label: p.name, value: `estoque ${p.stock.toLocaleString('pt-BR')}`, detail: `mínimo ${(p.min || 0).toLocaleString('pt-BR')}` })),
    cta: { label: 'Abrir o Estoque', action: 'nav', data: { page: 'Estoque' } },
    impact: input.current.rank.filter(r => risky.some(p => p.id === r.id)).reduce((n, r) => n + r.amount, 0),
  })];
}

function loyalty(input) {
  const c = input.current;
  if (c.salesCount < 5) return [];
  const identifiedRate = c.identified / c.salesCount;
  if (identifiedRate < 0.3) {
    return [item('identificar', 'oportunidade', {
      title: 'Você ainda não sabe quem são seus clientes',
      happened: `Só ${pct(identifiedRate)} das vendas têm o cliente escolhido.`,
      todo: 'Na hora da venda, escolha ou cadastre o cliente: assim o app mostra quem volta e quem sumiu.',
      why: 'O cliente que volta é o mais valioso. Sem saber quem ele é, não dá para avisar da próxima feira nem agradecer.',
      steps: ['Peça só o nome e o WhatsApp.', 'Peça autorização para avisar das próximas feiras.'],
      topics: ['contato', 'ltv'],
      numbers: [{ label: 'Vendas com cliente identificado', value: `${c.identified} de ${c.salesCount}` }],
      impact: Math.round(c.revenue * 0.05),
    })];
  }
  const clients = c.clients || 0;
  if (clients >= 5) {
    const back = c.returning / clients;
    if (back < 0.2) {
      return [item('retorno', 'oportunidade', {
        title: 'Poucos clientes voltaram',
        happened: `Dos ${clients} clientes identificados, ${c.returning} já tinham comprado antes.`,
        todo: 'Avise seus clientes da próxima feira pelo WhatsApp e ofereça "compre 9, ganhe o 10º".',
        why: 'Conquistar um cliente novo custa mais do que manter quem já comprou. Cliente que volta toda feira vale muitas vezes mais.',
        topics: ['contato', 'ltv', 'natureza'],
        numbers: [{ label: 'Clientes que voltaram', value: `${c.returning} de ${clients}`, detail: pct(back) }],
        cta: { label: 'Preparar aviso no WhatsApp', action: 'broadcast' },
        impact: Math.round(c.ticket * clients * 0.3),
      })];
    }
    if (back >= 0.4) {
      return [item('fieis', 'bom', {
        title: 'Seus clientes estão voltando',
        happened: `${pct(back)} dos clientes do período já tinham comprado antes.`,
        todo: 'Continue avisando das feiras e agradecendo a preferência.',
        impact: 1,
      })];
    }
  }
  return [];
}

function acquisition(input) {
  const c = input.current;
  if (!(c.marketing > 0) || !(c.newClients > 0) || !c.ticket) return [];
  const cac = c.marketing / c.newClients;
  const ltv = c.ticket * Math.max(1, c.purchasesPerClient || 1);
  const numbers = [
    { label: 'Gasto com divulgação', value: brl(c.marketing) },
    { label: 'Clientes novos', value: String(c.newClients) },
    { label: 'Custo por cliente novo', value: brl(Math.round(cac)), detail: 'divulgação ÷ clientes novos' },
    { label: 'Valor do cliente até agora', value: brl(Math.round(ltv)), detail: 'compra média × compras por cliente' },
  ];
  if (cac > c.ticket || ltv < 3 * cac) {
    return [item('divulgacao', 'atencao', {
      title: 'A divulgação está cara para o retorno',
      happened: `Cada cliente novo custou ${brl(Math.round(cac))} em divulgação; a compra média é ${brl(c.ticket)}.`,
      todo: 'Antes de gastar mais com divulgação, faça quem já comprou voltar: aviso no WhatsApp e programa de fidelidade.',
      why: 'Divulgação só compensa quando o cliente volta. A regra de ouro: o valor que ele deixa ao longo do tempo deve ser pelo menos três vezes o que custou para conquistá-lo.',
      topics: ['cac', 'ltv', 'contato'],
      numbers,
      impact: c.marketing,
    })];
  }
  return [item('divulgacao-ok', 'bom', {
    title: 'A divulgação está se pagando',
    happened: `Cada cliente novo custou ${brl(Math.round(cac))} e já deixou ${brl(Math.round(ltv))} em compras.`,
    todo: 'Mantenha o investimento e continue trazendo os clientes de volta.',
    numbers,
    impact: 1,
  })];
}

function qrAndPortfolio(input) {
  const c = input.current;
  if (!c.salesCount) return [];
  if (!input.portfolioPublished) {
    return [item('portfolio', 'oportunidade', {
      title: 'Mostre sua história no QR',
      happened: 'Seu portfólio online ainda não está publicado.',
      todo: 'Em Catálogo, toque em Publicar página: o QR mostrado após a venda passa a abrir sua história.',
      why: 'O cliente já está com a câmera aberta para pagar. Ver sua história, seus produtos e seu contato faz ele lembrar de você e voltar.',
      topics: ['historia', 'contato'],
      cta: { label: 'Abrir o Catálogo', action: 'catalog' },
      impact: Math.round(c.revenue * 0.02),
    })];
  }
  if ((c.qrShown || 0) >= 5) {
    const rate = c.qrRead / c.qrShown;
    if (rate < 0.25) {
      return [item('qr', 'oportunidade', {
        title: 'Poucos clientes leem o QR',
        happened: `${c.qrRead} de ${c.qrShown} clientes abriram sua página pelo QR.`,
        todo: 'Ao entregar o produto, vire o celular e diga: "Aponte a câmera e conheça nossa história".',
        why: 'Quem conhece a história do produtor compra de novo e indica. O convite falado faz muita diferença.',
        topics: ['historia', 'contato'],
        numbers: [{ label: 'Leituras do QR', value: `${c.qrRead} de ${c.qrShown}`, detail: pct(rate) }],
        impact: Math.round(c.revenue * 0.02),
      })];
    }
  }
  return [];
}

function upcomingEvent(input) {
  const u = input.upcoming;
  if (!u || u.daysUntil > 7) return [];
  const when = u.daysUntil <= 0 ? 'hoje' : u.daysUntil === 1 ? 'amanhã' : `em ${u.daysUntil} dias`;
  return [item('preparar', u.daysUntil <= 3 ? 'atencao' : 'oportunidade', {
    title: `Prepare a ${u.name}`,
    happened: `A ${u.name} começa ${when}.`,
    todo: 'Repasse o checklist da banca e mande a lista do dia no WhatsApp.',
    why: 'Banca preparada vende várias vezes mais que banca improvisada, e o cliente avisado já chega decidido.',
    steps: ['Checklist da banca: preço visível, degustação, produtos em degraus, itens pequenos no caixa.', 'Confira o estoque do que mais vende.', 'Mande a lista do dia um dia antes.'],
    topics: ['impacto', 'precos', 'degustacao', 'encarte'],
    cta: { label: 'Abrir checklist da banca', action: 'advisor-checklist', data: { id: 'banca' } },
    impact: Math.round((input.current.revenue || 10000) * 0.2) + 1,
  })];
}

function roundPrices(input) {
  const round = (input.products || []).filter(p => p.price >= 500 && p.price % 100 === 0 && p.stock > 0);
  if (round.length < 3) return [];
  return [item('preco-90', 'oportunidade', {
    title: 'Experimente preços terminados em 90',
    happened: `${plural(round.length, 'produto tem', 'produtos têm')} preço redondo, como ${brl(round[0].price)}.`,
    todo: `Teste ${round[0].name} a ${brl(round[0].price - 10)} na próxima feira e compare as vendas.`,
    why: 'O cliente lê primeiro o número da frente: 19,90 parece bem menor que 20,00, embora a diferença seja de centavos.',
    topics: ['nomepreco'],
    impact: 1,
  })];
}

const fmtQty = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

// Previsão para a próxima feira (agente local: histórico das feiras e ritmo de vendas).
function nextEventPlan(input) {
  const u = input.upcoming;
  if (!u || u.daysUntil > 7 || !input.history) return [];
  const f = forecastNextEvent(input);
  if (!f.lines.length) return [];
  const missing = f.lines.filter(l => l.missing > 0);
  return [item('previsao-feira', missing.length ? 'atencao' : 'oportunidade', {
    title: `Previsão para a ${u.name}`,
    happened: `Pelo seu histórico, a ${u.name} deve render entre ${brl(f.low)} e ${brl(f.high)} (confiança ${f.confidence}).`,
    todo: missing.length
      ? `Reponha antes de sair: ${list(missing.slice(0, 3).map(l => `${l.name} (faltam ${fmtQty(l.missing)} ${l.unit})`))}.`
      : `Leve ${list(f.lines.slice(0, 3).map(l => `${fmtQty(l.take)} ${l.unit} de ${l.name}`))}.`,
    why: 'A previsão usa o que você vendeu nas últimas feiras, com mais peso para as mais recentes. Quando um produto esgotou, a procura foi maior que a venda, então a previsão sobe. Quanto mais feiras registradas, mais precisa ela fica.',
    steps: f.lines.slice(0, 8).map(l => `${l.name}: levar ${fmtQty(l.take)} ${l.unit}${l.missing ? ` (você tem ${fmtQty(l.stock)})` : ''} · ${l.basis}`),
    topics: ['giro', 'espaco'],
    numbers: [
      { label: 'Receita prevista', value: `${brl(f.low)} a ${brl(f.high)}` },
      { label: 'Confiança', value: f.confidence, detail: f.eventsUsed ? `${f.eventsUsed} ${f.eventsUsed === 1 ? 'feira' : 'feiras'} no histórico` : 'sem feiras no histórico' },
    ],
    cta: missing.length ? { label: 'Repor agora', action: 'restock-ids', data: { ids: missing.map(l => l.id).join(',') } } : undefined,
    impact: f.revenue,
  })];
}

// Produto que, no ritmo atual, acaba em poucos dias (e ainda não está abaixo do mínimo).
function runningOut(input) {
  if (!input.history) return [];
  const soon = runOut(input).filter(r => r.days <= 5 && r.stock > (r.min || 0));
  if (!soon.length) return [];
  const days = r => Math.max(1, Math.round(r.days));
  return [item('acaba-logo', 'atencao', {
    title: 'Produto vai acabar em poucos dias',
    happened: list(soon.slice(0, 3).map(r => `${r.name} acaba em ~${plural(days(r), 'dia', 'dias')}`)) + '.',
    todo: `Reponha ${list(soon.slice(0, 3).map(r => r.name))} nesta semana.`,
    why: 'O cálculo divide o que você tem pelo quanto vende por dia nas últimas semanas.',
    numbers: soon.map(r => ({ label: r.name, value: `${fmtQty(r.stock)} ${r.unitLabel}`, detail: `vende ${fmtQty(r.perDay)} por dia` })),
    topics: ['giro'],
    cta: { label: 'Repor agora', action: 'restock-ids', data: { ids: soon.map(r => r.id).join(',') } },
    impact: soon.reduce((n, r) => n + Math.round(r.perDay * 7 * (r.price || 0)), 0),
  })];
}

const RULES = [noSales, lossPeriod, pricing, missingCost, restock, runningOut, leftovers, nextEventPlan, trend, basket, concentration, loyalty, acquisition, upcomingEvent, qrAndPortfolio, roundPrices];

// ------------------------------------------------------------------------------------- saída

function situation(input, all) {
  const c = input.current;
  if (!c.salesCount) return input.upcoming ? `Ainda não há vendas em ${input.periodLabel}. A ${input.upcoming.name} está chegando.` : `Ainda não há vendas registradas em ${input.periodLabel}.`;
  let text = `${brl(c.revenue)} em ${plural(c.salesCount, 'venda', 'vendas')}`;
  if (input.hasCost) text += c.result >= 0 ? `, com ${brl(c.result)} de lucro` : `, com ${brl(-c.result)} de prejuízo`;
  const p = input.previous;
  if (p && p.revenue) {
    const change = (c.revenue - p.revenue) / p.revenue;
    if (Math.abs(change) >= 0.05) text += ` (${pct(Math.abs(change))} ${change > 0 ? 'acima' : 'abaixo'} do período anterior)`;
  }
  text += '.';
  const worst = all.find(d => d.level !== 'bom')?.level;
  text += worst === 'urgente' ? ' Há um ponto urgente para resolver.' : worst === 'atencao' ? ' Dá para melhorar com ajustes simples.' : worst === 'oportunidade' ? ' Bom caminho: veja como crescer mais.' : ' Tudo em ordem: siga assim.';
  return text;
}

export function buildGuidance(input) {
  const all = RULES.flatMap(rule => rule(input))
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || b.impact - a.impact);
  for (const d of all) d.topics = d.topics.filter(id => TOPICS[id]);
  return {
    periodLabel: input.periodLabel,
    situation: situation(input, all),
    actions: all.filter(d => d.level !== 'bom').slice(0, 3),
    all,
  };
}

// Texto corrido para a análise local (Inteligência) e para quem prefere ler tudo de uma vez.
export function guidanceText(g) {
  const lines = [`${g.periodLabel}: ${g.situation}`];
  if (g.actions.length) {
    lines.push('Faça agora:');
    g.actions.forEach((d, i) => lines.push(`${i + 1}. ${d.todo}`));
  }
  const rest = g.all.filter(d => !g.actions.includes(d));
  if (rest.length) {
    lines.push('Também vale olhar:');
    rest.forEach(d => lines.push(`• ${d.title}: ${d.todo}`));
  }
  return lines.join('\n\n');
}
