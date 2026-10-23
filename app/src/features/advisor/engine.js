// Motor de orientação. Recebe os números reais do período (montados em src/legacy, advisorInput) e
// devolve orientação em três níveis:
//   1. situation + actions: o que aconteceu, em uma frase, e até três coisas para fazer agora;
//   2. cada item: por que importa e como fazer na banca (temas de knowledge.js);
//   3. numbers: os valores e as fórmulas, para quem quiser conferir.
// Toda a complexidade fica aqui; o produtor só lê frases curtas. Valores em centavos.
import { TOPICS } from './knowledge.js';
import { forecastNextEvent, runOut } from './forecast.js';
import { FINANCE_RULES } from './finance-rules.js';
import { evidenceQuality } from './quality.js';
import { explainMethod } from './method.js';
import { WEATHER_RULES } from './weather-rules.js';

// The best seller of a family goes first (motor de decisões). input.productFamilies is the sale grid
// order: [{ id, name, family }]. Families never change places; only the order inside one family.
export function bestFirst(input) {
  const families = input.productFamilies || [];
  const sold = new Map((input.current?.rank || []).filter(r => r.qty > 0).map(r => [r.id, r.qty]));
  if (sold.size < 2 || families.length < 2) return [];
  const groups = new Map();
  for (const p of families) { if (!groups.has(p.family)) groups.set(p.family, []); groups.get(p.family).push(p); }
  const tips = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const first = list[0], best = list.reduce((a, b) => (sold.get(b.id) || 0) > (sold.get(a.id) || 0) ? b : a);
    const qb = sold.get(best.id) || 0, qf = sold.get(first.id) || 0;
    if (best === first || qb < 5 || qb < qf * 1.5) continue;
    tips.push({ best, first, qb, qf });
  }
  if (!tips.length) return [];
  tips.sort((a, b) => b.qb - a.qb);
  const t = tips[0], n = v => v.toLocaleString('pt-BR');
  return [item('ordem-mais-vendidos:' + t.best.id, 'oportunidade', {
    title: 'Coloque o mais vendido em primeiro',
    happened: `${t.best.name} vendeu ${n(t.qb)} no período; ${t.first.name}, que aparece antes na família, vendeu ${n(t.qf)}.`,
    todo: `Coloque ${t.best.name} em primeiro na família, para achar mais rápido na hora da venda.`,
    why: 'O que mais sai fica no primeiro lugar da família e o toque fica mais curto. A ordem entre as famílias não muda; você pode mudar depois segurando e arrastando.',
    numbers: tips.slice(0, 3).map(x => ({ label: x.best.name, value: n(x.qb) + ' vendidos', detail: 'primeiro hoje: ' + x.first.name + ' (' + n(x.qf) + ')' })),
    impact: t.qb,
    cta: { label: 'Colocar em primeiro', action: 'order-best-first', data: { id: t.best.id } },
  })];
}

const LEVELS = ['urgente', 'atencao', 'oportunidade', 'bom'];
const TARGET_MARGIN = 0.4;
const LOW_MARGIN = 0.3;

const currencyFormat = new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'});
export const brl = cents => currencyFormat.format(cents / 100);
const pct = ratio => Math.round(ratio * 100) + '%';
const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;
const list = names => names.length <= 1 ? names.join('') : names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1];

// Menor preço terminado em 90 centavos que alcança a margem pedida (ex.: 24,90).
export function priceFor(cost, margin = TARGET_MARGIN) {
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(margin) || margin < 0 || margin >= 1) throw new RangeError('Custo e margem inválidos');
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
  const c = input.current, f = input.finance;
  if (!c.salesCount || c.revenue <= 0 || c.result >= 0 || !input.quality.completeCosts) return [];
  const contribution = f?.contribution ?? c.revenue - c.cost;
  const perSale = contribution / c.salesCount;
  const needed = perSale > 0 ? Math.ceil(-c.result / perSale) : null;
  return [item('prejuizo', 'urgente', {
    title: 'Resultado negativo nos registros',
    happened: 'O resultado do período é ' + brl(c.result) + (input.quality.resultIsPartial ? ', ainda parcial por falta de despesas.' : ', após os gastos informados.'),
    todo: needed ? 'No mesmo mix e margem, seriam cerca de ' + plural(needed, 'venda', 'vendas') + ' para empatar. Revise custos, taxas e preços antes de decidir.' : 'A contribuição não cobre os gastos variáveis. Confira custos, descontos e preços.',
    why: 'Esta simulação mantém a contribuição média por venda. Mudanças de volume, preço, taxas ou mix alteram o resultado; não é uma meta garantida.',
    topics: ['equilibrio', 'contribuicao'],
    numbers: [{label:'Vendas líquidas',value:brl(c.revenue)},{label:'Contribuição por venda',value:brl(Math.round(perSale)),detail:'contribuição após taxas e tributos configurados ÷ vendas válidas'},{label:'Resultado informado',value:brl(c.result)}],
    impact: -c.result * 3,
  })];
}

function missingCost(input) {
  const q = input.quality;
  if (!q.missingProducts) return [];
  return [item('sem-custo', 'atencao', {
    title: 'Complete os custos antes de avaliar lucro',
    happened: q.knownProducts + ' de ' + q.products + ' produtos vendidos têm custo histórico informado; cobertura de ' + pct(q.costCoverage || 0) + ' da receita analisada.',
    todo: 'Confira o custo de ' + list((input.finance?.margins || input.current.rank).filter(r => input.finance ? !(r.costKnown ?? r.cost > 0) : !((input.products || []).find(p => p.id===r.id)?.cost > 0)).slice(0,3).map(r=>r.name)) + ' no Estoque e revise os registros históricos sem custo.',
    why: 'Editar o cadastro agora não muda o custo gravado em vendas antigas. Custo ausente não significa custo zero; o lucro total permanece parcial.',
    topics: ['margembruta'], cta: {label:'Abrir o Estoque',action:'nav',data:{page:'Estoque'}},
    impact: q.totalRevenue + 1,
    numbers: [{label:'Receita com custo conhecido',value:brl(Math.round(q.coveredRevenue))},{label:'Receita analisada',value:brl(q.totalRevenue)}],
  })];
}

function pricing(input) {
  // Prefer historical item costs and net prices after discounts and returns.
  const rows = input.finance?.margins || input.current.rank.map(r=>{const p=(input.products||[]).find(p=>p.id===r.id);return {...r,revenue:r.amount,cost:(p?.cost||0)*r.qty,costKnown:p?.cost>0};});
  const eligible = rows.filter(r=>(r.costKnown ?? r.cost>0) && r.qty>0 && r.revenue>0);
  const out=[];
  for(const r of eligible) {
    const margin=(r.revenue-r.cost)/r.revenue;
    const share=r.revenue/Math.max(1,input.current.revenue);
    if(margin>=LOW_MARGIN || (margin>=0 && share<0.25))continue;
    const unitCost=r.cost/r.qty, unitPrice=r.revenue/r.qty;
    const suggested=priceFor(unitCost), gain=Math.round((suggested-unitPrice)*r.qty);
    const below=margin<0;
    out.push(item(below?'abaixo-custo-'+r.id:'campeao-margem',below?'urgente':'atencao',{
      title: below?r.name+' foi vendido abaixo do custo':r.name+' vende muito, mas dá pouca margem',
      happened:r.name+' representa '+pct(share)+' da receita. Margem bruta histórica: '+pct(margin)+', após descontos e devoluções.',
      todo: 'Simule '+r.name+' de '+brl(Math.round(unitPrice))+' para '+brl(suggested)+' e valide aceitação e concorrência antes de alterar o preço.',
      why:'A margem de 40% é um cenário de análise, não um padrão obrigatório. Taxas, tributos, perecibilidade, demanda e custos da banca precisam entrar na decisão.',
      steps:['Confira embalagem, insumos e custo histórico por unidade.','Teste origem, história e preço visível na banca sem prometer aumento de vendas.','No mesmo volume, a receita aumentaria '+brl(gain)+'; o volume pode mudar com o preço.'],
      topics:['margembruta','nomepreco','historia'],
      numbers:[{label:'Preço médio vendido',value:brl(Math.round(unitPrice))},{label:'Custo histórico por unidade',value:brl(Math.round(unitCost))},{label:'Margem bruta',value:pct(margin)},{label:'Preço sugerido',value:brl(suggested),detail:'simulação: custo ÷ (1 − 40%); antes de taxas e tributos'}],
      impact: below?r.cost-r.revenue:Math.max(0,gain),
    }));
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
        todo: `Na próxima feira, avalie levar menos ${list(stuck.slice(0, 2).map(i => i.name))}${champion ? ` e ofereça a sobra em combo com ${champion}` : ''}.`,
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
        todo: `Leve mais ${list(soldOut.slice(0, 2).map(i => i.name))} após conferir validade, caixa e demanda. O esgotamento sozinho não prova pedidos perdidos.`,
        why: 'O saldo zerado é um fato registrado. Só pedidos não atendidos permitem medir demanda perdida; testar reposição exige avaliar prazo e validade.',
        topics: ['giro', 'espaco'],
        impact: soldOut.reduce((n, i) => n + Math.round(i.taken * i.price * 0.25), 0),
      }));
    }
  }
  return out;
}

function trend(input) {
  const c = input.current, p = input.previous;
  if (input.comparable === false || !p || !p.revenue || !c.salesCount) return [];
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
      why: 'O registro mostra a diferença, mas não a causa. Compare duração, dias e locais semelhantes. Movimento, clima e comportamento precisam de dados próprios.',
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
  const ticketDrop = input.comparable !== false && p && p.salesCount >= 5 && p.ticket > 0 ? (p.ticket - c.ticket) / p.ticket : 0;
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
  const risky = input.current.rank.filter(r=>r.qty>0).slice(0, 6).map(r => index.get(r.id)).filter(p => p && p.stock <= Math.max(p.min || 0, 0));
  if (!risky.length) return [];
  const empty = risky.filter(p => p.stock <= 0);
  return [item('repor', empty.length && soon ? 'urgente' : 'atencao', {
    title: 'Produto que vende bem está acabando',
    happened: risky.map(p => p.stock <= 0 ? `${p.name} acabou` : `${p.name} tem só ${p.stock.toLocaleString('pt-BR')} ${p.unitLabel || ''}`.trim()).join('; ') + '.',
    todo: `Reponha ${list(risky.slice(0, 3).map(p => p.name))}${soon ? ` antes da ${input.upcoming.name}` : ' antes da próxima feira'}.`,
    why: 'Estoque baixo merece atenção. Antes de repor, verifique saldo, prazo de entrega, validade, caixa e o histórico disponível; não há venda perdida comprovada.',
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
        todo: 'Avise seus clientes da próxima feira pelo WhatsApp e teste uma ação de fidelidade cujo custo caiba na margem.',
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
  const c=input.current;
  if(!(c.marketing>0)||!(c.newClients>0))return [];
  const ratio=Math.round(c.marketing/c.newClients);
  return [item('divulgacao-medicao','oportunidade',{
    title:'Meça o retorno da divulgação',
    happened:'Há '+brl(c.marketing)+' em divulgação e '+c.newClients+' clientes novos identificados neste período.',
    todo:'Registre de onde vieram os clientes e compare a contribuição das compras atribuídas à campanha com seu custo.',
    why:'Dividir divulgação por todos os clientes novos dá uma aproximação, não prova aquisição pela campanha. Receita não é lucro e este recorte não mede o valor de vida do cliente (LTV).',
    topics:['cac','ltv','contato'],
    numbers:[{label:'Divulgação por cliente novo identificado',value:brl(ratio),detail:'aproximação sem atribuição de campanha; não é retorno comprovado'}],impact:c.marketing,
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
    why: 'Preço visível, organização e contato podem ajudar o atendimento. Compare os resultados em feiras semelhantes para avaliar o efeito.',
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
    happened: `Projeção histórica para ${u.name}: ${brl(f.revenue)}. ${f.low != null ? "Faixa observada: " + brl(f.low) + " a " + brl(f.high) + ". " : ""}${f.sampleLabel || "Base histórica limitada"}. Não é garantia de receita.`,
    todo: missing.length
      ? `Reponha antes de sair: ${list(missing.slice(0, 3).map(l => `${l.name} (faltam ${fmtQty(l.missing)} ${l.unit})`))}.`
      : `Leve ${list(f.lines.slice(0, 3).map(l => `${fmtQty(l.take)} ${l.unit} de ${l.name}`))}.`,
    why: 'A previsão usa o que você vendeu nas últimas feiras, com mais peso para as mais recentes e ajuste pela duração. Esgotamento não é convertido em demanda fictícia; validade, clima e caixa ainda exigem revisão.',
    steps: f.lines.slice(0, 8).map(l => `${l.name}: levar ${fmtQty(l.take)} ${l.unit}${l.missing ? ` (você tem ${fmtQty(l.stock)})` : ''} · ${l.basis}`),
    topics: ['giro', 'espaco'],
    numbers: [
      { label: 'Projeção histórica', value: brl(f.revenue), detail: 'quantidade histórica projetada × preço atual; não é intervalo de confiança' },
      { label: 'Base de dados', value: f.sampleLabel || 'histórico disponível', detail: f.eventsUsed ? `${f.eventsUsed} ${f.eventsUsed === 1 ? 'feira' : 'feiras'} no histórico` : 'sem feiras no histórico' },
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
    title: 'Projeção de duração do estoque',
    happened: list(soon.slice(0, 3).map(r => `${r.name}: saldo para ~${plural(days(r), 'dia', 'dias')}`)) + '.',
    todo: `Reponha ${list(soon.slice(0, 3).map(r => r.name))} nesta semana.`,
    why: 'O saldo é dividido pelo ritmo observado em dias corridos. É uma projeção, não uma data garantida; sazonalidade, validade e mudanças de demanda podem alterá-la.',
    numbers: soon.map(r => ({ label: r.name, value: `${fmtQty(r.stock)} ${r.unitLabel}`, detail: `vende ${fmtQty(r.perDay)} por dia` })),
    topics: ['giro'],
    cta: { label: 'Repor agora', action: 'restock-ids', data: { ids: soon.map(r => r.id).join(',') } },
    impact: soon.reduce((n, r) => n + Math.round(r.perDay * 7 * (r.price || 0)), 0),
  })];
}

function pendingTests(input) {
  const tests=input.plannedTests||[];
  if(!tests.length)return [];
  return [item('test-pending','oportunidade',{title:'Avalie os testes que já planejou',happened:`Há ${tests.length} ${tests.length===1?'teste planejado':'testes planejados'} aguardando avaliação.`,todo:'Registre o resultado observado e as mudanças do período antes de repetir ou iniciar uma ação semelhante.',why:'Uma diferença no resultado não isola a causa. Compare períodos, condições e a medida definida no planejamento.',cta:{label:'Ver testes',action:'advisor-tests'},impact:1})];
}
// Interpret the canonical historical margins; this rule never recomputes a sale or changes a price.
export function productRoles(input) {
  const rows=(input.finance?.margins||[]).filter(r=>r.revenue>0&&r.qty>0);
  if(rows.length<2||input.audit?.errors?.length)return [];
  const revenue=[...rows].sort((a,b)=>b.revenue-a.revenue||String(a.id).localeCompare(String(b.id)))[0];
  const known=rows.filter(r=>r.costKnown===true&&Number.isFinite(r.cost));
  const profit=[...known].sort((a,b)=>(b.revenue-b.cost)-(a.revenue-a.cost)||String(a.id).localeCompare(String(b.id)))[0];
  const groups=new Map();for(const r of rows){const unit=input.productUnits?.[r.id];if(typeof unit!=='string'||!unit)continue;if(!groups.has(unit))groups.set(unit,[]);groups.get(unit).push(r);}
  const quantity=[...groups].filter(([,items])=>items.length>=2).slice(0,2).map(([unit,items])=>{const r=[...items].sort((a,b)=>b.qty-a.qty||String(a.id).localeCompare(String(b.id)))[0];return `${r.name}: ${fmtQty(r.qty)} ${unit} (comparação na mesma unidade).`;});
  return [item('papel-produto','oportunidade',{
    title:'Quantidade, Receita e Lucro Bruto',
    happened:`${revenue.name} lidera a receita registrada: ${brl(revenue.revenue)}.`+(profit?` ${profit.name} tem o maior resultado bruto entre os produtos com custo histórico conhecido: ${brl(profit.revenue-profit.cost)}.`:''),
    todo:profit&&profit.id!==revenue.id?'Observe os dois papéis antes de testar a exposição na banca: quem traz receita e quem deixa mais resultado bruto.':'Compare saída, receita e custo antes de planejar a reposição ou mudar a exposição.',
    why:'Quantidade mostra saída na unidade indicada; receita já reflete os descontos e devoluções do recorte. Lucro bruto considera o custo histórico do produto, antes de taxas e despesas. '+(known.length<rows.length?'Há custos ausentes: não é possível afirmar qual é o mais lucrativo de todo o estoque.':'Não é lucro líquido nem previsão de procura.'),
    numbers:[...quantity.map(text=>({label:'Quantidade',value:text})),{label:'Receita',value:brl(revenue.revenue),detail:revenue.name},...(profit?[{label:'Resultado bruto conhecido',value:brl(profit.revenue-profit.cost),detail:profit.name}]:[])],
    topics:['espaco','giro'],impact:Math.round(revenue.revenue/10),
  })];
}
// Reference rotation supplies hypotheses, never an invented observation about the producer.
export function practiceCandidates(input){
  if(input.quality?.errors||input.quality?.context==='unconfirmed'||input.quality?.sales<5)return [];
  return Object.entries(TOPICS).filter(([id,t])=>['pdv','crm'].includes(t.area)||['contato','historia'].includes(id)).map(([id,t])=>item('guia-'+(t.area==='pdv'?'pdv:':'crm:')+id,'oportunidade',{
    title:t.title,educational:true,learningArea:t.area==='pdv'?'pdv':'crm',
    happened:'Referência de '+(t.area==='pdv'?'PDV':'Relacionamento')+' para testar; não é uma constatação sobre sua banca ou seus clientes.',
    todo:t.how[0]||'Observe o histórico identificado antes de mudar o relacionamento.',
    why:'Material local versionado. A dica só alterna entre conteúdos elegíveis e não substitui alertas operacionais. Contato exige autorização; benefícios precisam ser medidos, sem promessa de venda.',
    topics:[id],impact:0,
  }));
}
export function calendarPlanning(input){
 if(input.quality?.errors||input.quality?.context==='unconfirmed')return [];
 return (input.calendarDates||[]).filter(d=>d.status!=='cancelled'&&d.start&&d.source).slice(0,1).map(d=>item('preparar-calendario:'+d.id,'oportunidade',{
  title:d.name+' se Aproxima',happened:'Data de planejamento: '+d.start.split('-').reverse().join('/')+' · '+(d.national?'Calendário Federal':d.commercial?'Data Comemorativa Calculada':'Agenda do Município')+'.',
  todo:'Confira a programação local e avalie encomendas, feiras autorizadas ou kits em parceria. Combine com produtos que você já trabalha; confirme contribuição, estoque livre, validade, capacidade e responsáveis antes de oferecer.',
  why:'Fonte: '+d.source+'. A data não comprova público, procura ou aumento de vendas. '+(d.status==='confirmed'?'A programação foi confirmada pelo produtor; pode mudar.':'A realização de festas e pontos de venda ainda precisa ser confirmada.')+' Exemplos como kits para canjica ou paçoca só fazem sentido com ingredientes, parceiros e condições de venda confirmados. Não aplique desconto apenas por haver uma festividade.',
  topics:['parcerias','encarte'],impact:0,
 }));
}
const RULES = [...WEATHER_RULES, bestFirst, noSales, lossPeriod, pricing, missingCost, ...FINANCE_RULES, productRoles, restock, runningOut, leftovers, nextEventPlan, trend, basket, concentration, loyalty, acquisition, upcomingEvent, qrAndPortfolio, roundPrices, pendingTests,calendarPlanning,practiceCandidates];

// ------------------------------------------------------------------------------------- saída

// Contrato do conselho (docs/motor): toda ação diz de qual regra e versão veio, com que confiança e
// sobre que origem de dados. Confiança "alta" exige calibração medida, que o app ainda não tem; com
// registros incompletos ela cai, e com erros nos registros é nula (o conselho não deve ser usado).
function stampDecisions(all, input) {
  const q = input.quality || {};
  const commerce = q.errors ? 'nula' : q.completeCosts && q.sales >= 8 ? 'media' : 'baixa';
  const generated = new Date().toISOString();
  for (const d of all) {
    d.decision = { rule_id: d.id.split(':')[0], rule_version: 1, module: 'vendas', confidence: commerce, requires_user_action: d.level !== 'bom', ...(d.decision || {}),
      advice_id: d.id, generated_at: generated, data_context: q.context || 'unconfirmed' };
  }
}

function situation(input, all) {
  if(input.quality.errors) return 'A conferência encontrou inconsistências. Corrija os registros antes de avaliar resultado, preço ou crescimento.';
  const c = input.current;
  if (!c.salesCount) return input.upcoming ? `Ainda não há vendas em ${input.periodLabel}. A ${input.upcoming.name} está chegando.` : `Ainda não há vendas registradas em ${input.periodLabel}.`;
  let text = `${brl(c.revenue)} em ${plural(c.salesCount, 'venda', 'vendas')}`;
  if (input.quality.completeCosts) text += c.result >= 0 ? `, com ${brl(c.result)} de resultado gerencial informado` : `, com ${brl(-c.result)} de prejuízo`;
  const p = input.previous;
  if (input.comparable !== false && p && p.revenue) {
    const change = (c.revenue - p.revenue) / p.revenue;
    if (Math.abs(change) >= 0.05) text += ` (${pct(Math.abs(change))} ${change > 0 ? 'acima' : 'abaixo'} do período anterior)`;
  }
  text += input.quality.resultIsPartial ? '. Custos ou despesas incompletos: resultado parcial.' : '.';
  const worst = all.find(d => d.level !== 'bom')?.level;
  text += worst === 'urgente' ? ' Há um ponto urgente para resolver.' : worst === 'atencao' ? ' Dá para melhorar com ajustes simples.' : worst === 'oportunidade' ? ' Bom caminho: veja como crescer mais.' : ' Tudo em ordem: siga assim.';
  return text;
}

export function buildGuidance(input) {
  input = { ...input, quality: evidenceQuality(input) };
  if (input.quality.context === 'unconfirmed') {
    const review = item('origem-dados', 'atencao', {title:'Confirme a origem dos registros',happened:'O conjunto ainda não está identificado como real, demonstração ou simulação.',todo:'Revise a origem da base antes de usar os números para decidir.',why:'Exemplos e registros sem origem confirmada não comprovam o desempenho de um produtor.',topics:[]});
    return {periodLabel:input.periodLabel,quality:input.quality,situation:'Origem não confirmada. As conclusões sobre o negócio aguardam revisão dos registros.',actions:[review],all:[review]};
  }
  const candidates = (input.quality.errors ? RULES.filter(rule => rule.name === 'noSales' || rule.name === 'missingCost' || rule.name === 'auditErrors' || rule.name === 'missingCosts' || rule.name === 'weatherFrost' || rule.name === 'weatherFair') : RULES);
  const all = candidates.flatMap(rule => rule(input)).map(explainMethod)
    .sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || b.impact - a.impact);
  for (const d of all) d.topics = d.topics.filter(id => TOPICS[id]);
  stampDecisions(all, input);
  return {
    periodLabel: input.periodLabel,
    quality: input.quality,
    situation: (input.quality.context === 'demo' ? 'Exemplo com dados fictícios. ' : input.quality.context === 'simulation' ? 'Simulação. ' : '') + situation(input, all),
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
