// Inteligência local como um agente: entende o assunto da pergunta e responde primeiro sobre ele,
// em frases curtas, com o "porquê" e os números depois. Sem internet; só os dados reais do app.
import { buildGuidance, brl } from './engine.js';
import { forecastNextEvent, runOut, bestMoments } from './forecast.js';
import { financeLines } from './finance-rules.js';
import { catalogVocabularyAnswer } from './catalog-vocabulary.js';

const INTENTS = [
  ['previsao', /levar|feira|prev|próxim|proxim|amanh|quanto vou vender|expectativa|semana que vem/i],
  ['estoque', /estoque|acab|repor|reposi|falt|durar|sobr|encalh/i],
  ['preco', /lucro|preç|preco|margem|caro|barat|ganh|prejuí|prejui|custo/i],
  ['clientes', /client|volt|fiel|fideli|divulga/i],
  ['financas', /financ|despesa|gast|empat|equil|meta|compens|vale a pena|taxa|cart|maquin|pix|retirad|pr[oó]-?labore|sal[aá]rio|conta|fixo|caixa|resultado/i],
  ['momento', /horár|horar|hora|melhor dia|dia da semana|movimento|pico/i],
];

const qty = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

function forecastSection(input) {
  const f = forecastNextEvent(input);
  const where = input.upcoming ? `a ${input.upcoming.name}` : 'a próxima feira';
  if (!f.lines.length) return [`Ainda não há vendas suficientes para prever ${where}. Registre as vendas de algumas feiras e eu passo a calcular o que levar.`];
  const out = [`Para ${where}, a previsão é vender ${f.low != null ? 'entre ' + brl(f.low) + ' e ' + brl(f.high) : brl(f.revenue)} (base: ${f.sampleLabel || 'histórico disponível'}; faixa histórica, sem garantia).`];
  if(f.limited) out.push('Histórico limitado: faça um teste pequeno, conferindo validade, caixa e prazo de reposição.');
  out.push('Quantidades de referência:');
  for (const l of f.lines.slice(0, 8)) out.push(`• ${l.name}: ${qty(l.take)} ${l.unit}${l.missing ? ` — você tem ${qty(l.stock)}, faltam ${qty(l.missing)}` : ''}.`);
  const missing = f.lines.filter(l => l.missing);
  if (missing.length) out.push(`Antes de sair, reponha ${missing.slice(0, 3).map(l => l.name).join(', ')}.`);
  return out;
}

function stockSection(input) {
  const list = runOut(input).filter(r => r.days <= 14).slice(0, 6);
  if (!input.history?.daily?.length) return ['Ainda não há histórico diário suficiente para estimar a duração do estoque.'];
  if (!list.length) return ['Nos registros disponíveis, nenhum saldo positivo tem projeção de acabar nos próximos 14 dias. Estoque zerado e dados ausentes precisam ser conferidos separadamente.'];
  return ['Pelo ritmo das últimas semanas:', ...list.map(r => `• ${r.name} acaba em ${r.days < 1 ? 'menos de 1 dia' : '~' + Math.round(r.days) + (Math.round(r.days) === 1 ? ' dia' : ' dias')} (vende ${qty(r.perDay)} ${r.unitLabel} por dia; tem ${qty(r.stock)}).`)];
}

function momentSection(input) {
  const m = bestMoments(input.history?.daily);
  if (!m) return ['Ainda não há vendas suficientes para saber seu melhor dia e horário.'];
  const parts = [];
  if(m.limited) parts.push(m.tied ? 'Há empate ou amostra pequena; não há um melhor dia/horário comprovado.' : 'Amostra limitada para recomendar horário: registre mais dias e os horários de funcionamento.');
  parts.push(m.basis);
  if (m.day) parts.push(`Dia com maior receita registrada: ${m.day}.`);
  if (m.hour !== null && m.hour !== undefined) parts.push(`Faixa com maior receita registrada: das ${m.hour}h às ${m.hour + 1}h: deixe a banca completa e a degustação pronta antes disso.`);
  return parts;
}

// "Qual produto dá mais lucro?": o que cada produto deixou depois do custo (venda − custo), do maior ao menor.
function profitRanking(input) {
  const list = (input.finance?.margins || []).filter(m => m.margin != null && (m.costKnown ?? m.cost > 0)).map(m => ({ ...m, profit: m.revenue - m.cost })).sort((a, b) => b.profit - a.profit);
  if (!list.length) return [];
  const pct = r => Math.round(r * 100) + '%';
  return ['Maior lucro bruto registrado (vendas − custo histórico do produto, antes dos outros gastos):',
    ...list.slice(0, 3).map((m, i) => `${i + 1}. ${m.name}${m.description ? ` (${m.description})` : ''}: ${brl(m.profit)} de lucro bruto em ${brl(m.revenue)} vendidos (margem ${pct(m.margin)}).`)];
}

function guidanceSection(g, ids) {
  const items = g.all.filter(d => !ids || ids.some(id => d.id.startsWith(id)));
  if (!items.length) return [];
  return items.slice(0, 4).map(d => `• ${d.title}: ${d.todo}`);
}

export function answer(question, input) {
  const vocabulary=catalogVocabularyAnswer(question);
  if(vocabulary)return vocabulary;
  const g = buildGuidance(input);
  if (g.quality.context === 'unconfirmed') return g.situation + '\n\n' + g.actions[0].todo;
  const intents = INTENTS.filter(([, re]) => re.test(question || '')).map(([name]) => name);
  const sections = [];
  if(g.quality.context === 'demo') sections.push('Exemplo com dados fictícios. As sugestões ensinam o uso do app e não retratam um negócio real.');
  if(g.quality.context === 'simulation') sections.push('Simulação: resultados hipotéticos, sem movimentar a operação.');
  if (g.quality.errors) return g.situation + '\n\n' + g.actions.map(d => d.title + ": " + d.todo).join('\n');
  if(g.quality.resultIsPartial) sections.push('Dados parciais: custos ou despesas ausentes impedem concluir o lucro total.');
  const add = (title, lines) => { if (lines.length) sections.push(`${title}\n${lines.join('\n')}`); };

  if (!intents.length) {
    sections.push(`${g.periodLabel}: ${g.situation}`);
    add('Faça agora:', g.actions.map((d, i) => `${i + 1}. ${d.todo}`));
    add('Previsão:', forecastSection(input).slice(0, 4));
    add('Estoque:', stockSection(input).slice(0, 4));
    return sections.join('\n\n');
  }
  for (const intent of intents) {
    if (intent === 'previsao') add('Previsão', forecastSection(input));
    if (intent === 'estoque') add('Estoque', [...stockSection(input), ...guidanceSection(g, ['repor', 'encalhe', 'esgotou'])]);
    if (intent === 'preco') {
      const found = guidanceSection(g, ['prejuizo', 'abaixo-custo', 'campeao-margem', 'sem-custo', 'fin-margem', 'preco-90']);
      add('Preço e lucro', [...profitRanking(input), ...(found.length ? found : [`${g.situation} Confira a cobertura de custos antes de concluir sobre preço ou lucro.`])]);
    }
    if (intent === 'clientes') {
      const found = guidanceSection(g, ['identificar', 'retorno', 'fieis', 'divulgacao', 'qr', 'portfolio']);
      add('Clientes', found.length ? found : ['Os registros não sustentam uma conclusão sobre fidelidade. Identifique clientes com autorização e acompanhe compras ao longo de períodos comparáveis.']);
    }
    if (intent === 'financas') add('Finanças', [...financeLines(input.finance), ...guidanceSection(g, ['fin-'])]);
    if (intent === 'momento') add('Melhor momento', momentSection(input));
  }
  return sections.join('\n\n');
}
