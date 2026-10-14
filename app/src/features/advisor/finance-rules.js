// Agente financeiro: regras que leem as finanças do período (input.finance, montado em src/legacy a
// partir de src/features/finance/finance.js) e devolvem decisões no mesmo formato da Orientação.
// Método: margem de contribuição, custos da feira, custos fixos, ponto de equilíbrio, retirada e taxas.

const brl = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = ratio => Math.round(ratio * 100) + '%';
const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;
const LOW_PRODUCT_MARGIN = 0.25;
const TARGET = 0.4;
const priceFor = (unitCost, margin = TARGET) => Math.ceil((unitCost / (1 - margin) + 10) / 100) * 100 - 10;

function item(id, level, fields) {
  return { id, level, impact: 0, steps: [], topics: [], numbers: [], ...fields };
}

// Feira que não pagou os próprios custos.
function placeLoss({ finance: f }) {
  if (!f) return [];
  return f.places.filter(p => p.costs > 0 && p.profit < 0).map(p => item('fin-feira-prejuizo', 'urgente', {
    title: `${p.name} não pagou seus custos`,
    happened: `Vendeu ${brl(p.revenue)}, mas produtos, taxas e custos da feira somaram ${brl(p.revenue - p.profit)}. Faltaram ${brl(-p.profit)}.`,
    todo: `Antes de voltar à ${p.name}, negocie a barraca ou o transporte, e leve mais dos produtos de maior margem.`,
    why: 'Uma feira vale pelo que sobra depois dos custos dela, não pelo quanto vende. Feira que não se paga tira dinheiro das outras.',
    steps: ['Compare com as outras feiras em Finanças → Lucro por local.', 'Se o movimento é bom mas o lucro não, o problema é custo ou preço; se o movimento é fraco, avalie trocar de feira.'],
    topics: ['custofeira', 'contribuicao'],
    numbers: [
      { label: 'Vendeu', value: brl(p.revenue) },
      { label: 'Custo dos produtos', value: brl(p.cmv) },
      { label: 'Custos da feira', value: brl(p.costs) },
      { label: 'Resultado da feira', value: brl(p.profit), detail: 'vendas − produtos − taxas − custos da feira' },
    ],
    impact: -p.profit * 3,
  }));
}

// Dias de feira com venda e sem custo lançado: o lucro mostrado está maior que o real.
function missingCosts({ finance: f }) {
  if (!f || !f.missingDays?.length) return [];
  const days = f.missingDays;
  return [item('fin-custos-faltando', 'atencao', {
    title: 'Faltam os custos de algumas feiras',
    happened: `${plural(days.length, 'dia de feira', 'dias de feira')} com vendas e sem custo lançado (${days.slice(0, 2).map(d => d.name).join(', ')}${days.length > 2 ? '…' : ''}).`,
    todo: 'Lance barraca, transporte e ajudante em Gestão → Custos (pode ser de dias passados).',
    why: 'Sem esses custos, o lucro parece maior do que é e fica difícil saber qual feira compensa.',
    topics: ['custofeira'],
    cta: { label: 'Lançar custos', action: 'mg-detail', data: { key: 'custos' } },
    impact: days.length * 1000,
  })];
}

// Ponto de equilíbrio do mês: quanto falta vender para pagar fixos e retirada.
function breakEven({ finance: f }) {
  if (!f || f.mode !== 'mes' || !f.general || !f.breakEven) return [];
  if (f.revenue >= f.breakEven) {
    return [item('fin-equilibrio-ok', 'bom', {
      title: 'O mês já pagou as contas fixas',
      happened: `Você vendeu ${brl(f.revenue)}, acima dos ${brl(f.breakEven)} necessários para pagar fixos${f.drawOn ? ' e sua retirada' : ''}.`,
      todo: 'Daqui para frente, cada venda vira lucro: guarde parte como reserva do negócio.',
      why: 'Depois do ponto de equilíbrio, a margem de cada venda vai inteira para o resultado.',
      topics: ['equilibrio', 'contribuicao'],
    })];
  }
  const gap = f.breakEven - f.revenue;
  return [item('fin-equilibrio', 'atencao', {
    title: `Faltam ${brl(gap)} em vendas para empatar o mês`,
    happened: `Para pagar ${brl(f.monthlyFixed)} de custos fixos${f.drawOn ? ' e retirada' : ''} com margem de ${pct(f.contributionRate)}, o mês precisa vender ${brl(f.breakEven)}.`,
    todo: `Foque nas próximas feiras e nos produtos de maior margem: faltam ${brl(gap)} em vendas.`,
    why: 'Abaixo do ponto de equilíbrio o mês fecha no prejuízo, mesmo que cada venda pareça lucrativa.',
    topics: ['equilibrio', 'contribuicao', 'custosfixos'],
    numbers: [
      { label: 'Custos fixos + retirada', value: brl(f.monthlyFixed) },
      { label: 'Margem de contribuição', value: pct(f.contributionRate) },
      { label: 'Ponto de equilíbrio', value: brl(f.breakEven), detail: 'fixos ÷ margem' },
      { label: 'Vendido até agora', value: brl(f.revenue) },
    ],
    impact: gap,
  })];
}

// Produtos com margem baixa que pesam nas vendas.
function lowMargins({ finance: f }) {
  if (!f) return [];
  const total = f.revenue || 0;
  const low = (f.margins || []).filter(m => m.margin != null && m.margin < LOW_PRODUCT_MARGIN && m.margin >= 0 && total && m.revenue / total >= 0.1 && m.qty > 0).slice(0, 2);
  return low.map(m => {
    const unitCost = m.cost / m.qty;
    const unitPrice = m.revenue / m.qty;
    const suggested = priceFor(unitCost);
    return item('fin-margem-' + m.id, 'atencao', {
      title: `${m.name} com margem de ${pct(m.margin)}`,
      happened: `De cada ${brl(Math.round(unitPrice))}, sobram ${brl(Math.round(unitPrice - unitCost))} depois do custo do produto.`,
      todo: `Para chegar a ${pct(TARGET)} de margem, o preço seria ${brl(suggested)}. Suba aos poucos ou reduza o custo.`,
      why: 'Produto com margem baixa ocupa espaço na banca e no seu tempo e deixa pouco para pagar a feira e as contas.',
      topics: ['margembruta', 'contribuicao', 'nomepreco'],
      numbers: [
        { label: 'Preço médio vendido', value: brl(Math.round(unitPrice)) },
        { label: 'Custo por unidade', value: brl(Math.round(unitCost)) },
        { label: 'Preço sugerido', value: brl(suggested), detail: `para sobrar ${pct(TARGET)}` },
      ],
      impact: Math.round((suggested - unitPrice) * m.qty),
    });
  });
}

// Taxas de cartão relevantes: vale incentivar o Pix.
function cardFees({ finance: f }) {
  if (!f || !f.fees || f.fees < 2000 || !f.revenue || f.fees / f.revenue < 0.015) return [];
  return [item('fin-taxas', 'oportunidade', {
    title: `${brl(f.fees)} ficaram com a maquininha`,
    happened: `As taxas de cartão levaram ${pct(f.fees / f.revenue)} do que você vendeu neste período.`,
    todo: 'Deixe o QR do Pix bem visível na banca e ofereça "preço no Pix" em compras maiores.',
    why: 'Cada real de taxa sai direto do seu lucro. Trocar parte das vendas para o Pix aumenta a margem sem subir preço.',
    topics: ['taxascartao', 'contribuicao'],
    impact: f.fees,
  })];
}

// Organização: custos fixos e retirada.
function organization({ finance: f }) {
  if (!f || !f.salesCount) return [];
  const out = [];
  if (!f.fixedCount) out.push(item('fin-sem-fixos', 'oportunidade', {
    title: 'Cadastre suas contas fixas',
    happened: 'Ainda não há custos fixos cadastrados (energia, internet, combustível).',
    todo: 'Em Gestão → Custos, adicione as contas do mês uma vez só: o app passa a calcular quanto você precisa vender para empatar.',
    why: 'Sem as contas fixas, o resultado do mês fica maior do que o real.',
    topics: ['custosfixos', 'equilibrio'],
    cta: { label: 'Abrir Custos', action: 'mg-detail', data: { key: 'custos' } },
    impact: 500,
  }));
  if (!f.drawOn && f.mode === 'mes' && f.general && f.result > 0) out.push(item('fin-retirada', 'oportunidade', {
    title: 'Separe sua retirada',
    happened: `O mês está com ${brl(f.result)} de resultado, mas o seu salário ainda não está separado do caixa do negócio.`,
    todo: 'Em Finanças → Taxas, meta e retirada, defina um valor fixo por mês para você.',
    why: 'Misturar o dinheiro da casa com o do negócio esconde se a produção paga o seu trabalho.',
    topics: ['retirada'],
    impact: 400,
  }));
  if (f.goal && f.mode === 'mes' && f.general) {
    out.push(f.result >= f.goal.value
      ? item('fin-meta-ok', 'bom', { title: 'Meta do mês alcançada', happened: `Resultado de ${brl(f.result)} para uma meta de ${brl(f.goal.value)}.`, todo: 'Guarde o excedente como reserva para os meses fracos.', why: 'Reserva evita aperto quando a feira for ruim ou o tempo atrapalhar.', topics: ['retirada'] })
      : item('fin-meta', 'oportunidade', { title: `Faltam ${brl(f.goal.value - Math.max(0, f.result))} para a meta do mês`, happened: `Resultado atual ${brl(f.result)}; meta ${brl(f.goal.value)}${f.goal.auto ? ' (sugerida pela média dos últimos meses)' : ''}.`, todo: 'Priorize os produtos de maior margem nas próximas feiras.', why: 'A meta transforma o mês em passos pequenos: cada feira sabe quanto precisa trazer.', topics: ['contribuicao'], impact: 300 }));
  }
  return out;
}

export const FINANCE_RULES = [placeLoss, missingCosts, breakEven, lowMargins, cardFees, organization];

// Resumo curto das finanças, para o agente responder perguntas de dinheiro.
export function financeLines(f) {
  if (!f) return [];
  const lines = [`Vendeu ${brl(f.revenue)}; depois do custo dos produtos e das taxas sobraram ${brl(f.contribution)} (${pct(f.contributionRate || 0)}).`];
  const costs = f.costs.feira + f.costs.producao + f.costs.marketing;
  lines.push(`Custos lançados: ${brl(costs)}${f.general ? ` · fixos ${brl(f.fixed)}` : ''}${f.draw ? ` · retirada ${brl(f.draw)}` : ''}.`);
  lines.push(`Resultado: ${brl(f.result)}.`);
  if (f.breakEven) lines.push(`Para empatar o mês é preciso vender ${brl(f.breakEven)}.`);
  const best = f.places.slice().sort((a, b) => b.profit - a.profit);
  if (best.length > 1) lines.push(`Feira que mais compensa: ${best[0].name} (${brl(best[0].profit)}). Menos: ${best[best.length - 1].name} (${brl(best[best.length - 1].profit)}).`);
  if (f.missingDays?.length) lines.push(`Atenção: ${plural(f.missingDays.length, 'dia de feira está', 'dias de feira estão')} sem custos lançados, então o resultado pode estar maior que o real.`);
  return lines;
}
