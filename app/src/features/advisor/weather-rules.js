// Regras de tempo do motor de decisões (docs/motor). Entram na mesma lista de regras da Orientação
// (engine.js), no mesmo formato de item, com o contrato de conselho em `decision`.
// Limites (diretrizes do motor e da integração Codex):
//   • a fonte (MET Norway) dá quantidade de chuva em mm, não chance em %: nenhuma porcentagem é
//     inventada; o texto fala em milímetros e em palavras;
//   • nada de certeza além de 3 dias: feiras mais distantes não geram conselho de tempo;
//   • segurança (geada, trovoada) fura a fila (nível urgente);
//   • previsão antiga suspende os conselhos que dependem de atualidade e pede atualização;
//   • geada: a folha esfria ~4 °C abaixo do abrigo em noite limpa e calma (parâmetro calibrável);
//     sem erro histórico calibrado da fonte, o risco é qualitativo ("fique atento"), nunca um %.
import { leafTemperature } from '../decision/math.js';

const RULE_VERSION = 1;
const STALE_MS = 6 * 3600000;
const FROST_SHELTER_MIN = 3;   // °C no abrigo → até −1 °C na folha (c = 4 °C)
const RAIN_MIN_MM = 1;         // chuva mensurável no horário da feira
const HEAT_MAX = 30;           // °C: perecíveis e pessoas pedem sombra e água
const clock = t => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(t));
const mm = v => (v < 10 ? v.toFixed(1).replace('.', ',') : String(Math.round(v))) + ' mm';
const when = d => d <= 0 ? 'hoje' : d === 1 ? 'amanhã' : `em ${d} dias`;

function item(id, level, fields, decision) {
  return { id, level, impact: 0, steps: [], topics: [], numbers: [], ...fields,
    decision: { rule_id: id.split(':')[0], rule_version: RULE_VERSION, module: 'clima', requires_user_action: true, ...decision } };
}
const source = w => ({ source: 'MET Norway (yr.no), centro do município (IBGE)', issued_at: w.fetchedAt ? new Date(w.fetchedAt).toISOString() : null });
const confidenceFor = days => days <= 1 ? 'media' : 'baixa';
const fresh = w => w && w.fetchedAt && Date.now() - w.fetchedAt < STALE_MS && !w.stale;

function weatherStale({ weather: w }) {
  if (!w || fresh(w) || !(w.events || []).some(e => e.daysUntil >= 0 && e.daysUntil <= 2)) return [];
  return [item('tempo-desatualizado', 'atencao', {
    title: 'Atualize a previsão antes da feira',
    happened: w.fetchedAt ? `A última previsão é das ${clock(w.fetchedAt)}${w.stale ? ', sem conexão desde então' : ''}.` : 'Ainda não há previsão guardada.',
    todo: 'Abra o app com internet para atualizar o tempo da feira.',
    why: 'Conselhos sobre chuva e calor dependem de uma previsão recente; sem ela, o app prefere não aconselhar.',
    impact: 1,
  }, { confidence: 'nula', ...source(w), data_gaps: ['previsão recente'] })];
}

function weatherFrost({ weather: w }) {
  if (!fresh(w)) return [];
  const night = (w.nights || []).filter(n => Number.isFinite(n.min) && n.min <= FROST_SHELTER_MIN).sort((a, b) => a.min - b.min)[0];
  if (!night) return [];
  const leaf = Math.round(leafTemperature(night.min));
  return [item('tempo-geada:' + night.date, 'urgente', {
    title: 'Risco de geada nas baixadas',
    happened: `A mínima prevista é de ${Math.round(night.min)}° ${night.label}. Em noite limpa e sem vento, a folha pode chegar perto de ${leaf}°.`,
    todo: 'Fique atento: proteja mudas e o que estiver nas partes baixas antes de anoitecer.',
    why: 'Nas baixadas o ar frio se acumula e a geada costuma aparecer primeiro. A previsão é da cidade, não da sua propriedade.',
    numbers: [{ label: 'Mínima prevista (abrigo)', value: Math.round(night.min) + '°', detail: 'MET Norway' }, { label: 'Estimativa na folha', value: leaf + '°', detail: 'mínima − 4 °C em noite limpa' }],
    impact: 1e9,
  }, { confidence: 'baixa', valid_until: night.date + 'T09:00:00-03:00', ...source(w) })];
}

function weatherFair({ weather: w }) {
  if (!fresh(w)) return [];
  const out = [];
  for (const e of (w.events || []).filter(e => e.daysUntil >= 0 && e.daysUntil <= 3 && e.window)) {
    const x = e.window, thunder = /thunder/.test(x.symbol || ''), rain = x.rain >= RAIN_MIN_MM;
    const base = { confidence: confidenceFor(e.daysUntil), valid_until: e.date + 'T' + (e.until || '13:00') + ':00-03:00', ...source(w), event_id: e.id };
    if (thunder) out.push(item('tempo-trovoada:' + e.id, 'urgente', {
      title: `Trovoada prevista na ${e.name}`,
      happened: `${when(e.daysUntil)[0].toUpperCase() + when(e.daysUntil).slice(1)}, entre ${e.from} e ${e.until}, a previsão indica trovoadas${rain ? ' e ' + mm(x.rain) + ' de chuva' : ''}.`,
      todo: 'Em caso de raios, recolha a banca e procure abrigo; deixe a lona presa.',
      why: 'Tenda e estrutura metálica em área aberta ficam expostas a raios e rajadas.',
      numbers: [{ label: 'Chuva no horário', value: mm(x.rain), detail: 'MET Norway' }],
      impact: 1e8,
    }, base));
    else if (rain) out.push(item('tempo-chuva:' + e.id, 'atencao', {
      title: `Chuva prevista na ${e.name}`,
      happened: `${when(e.daysUntil)[0].toUpperCase() + when(e.daysUntil).slice(1)}, entre ${e.from} e ${e.until}: ${mm(x.rain)} de chuva previstos, ${x.min}–${x.max}°.`,
      todo: 'Leve lona e cobertura, proteja os perecíveis e confira a previsão de novo na véspera.',
      why: 'Chuva no horário costuma reduzir o movimento e molhar a mercadoria. O efeito nas suas vendas ainda não foi medido pelo app.',
      steps: ['Lona ou toldo e plástico para cobrir caixas.', 'Perecíveis em caixa térmica, fora da chuva.', 'Avise os clientes no WhatsApp se mudar o horário.'],
      numbers: [{ label: 'Chuva no horário', value: mm(x.rain), detail: 'MET Norway, quantidade (não é chance)' }, { label: 'Temperatura', value: `${x.min}–${x.max}°`, detail: 'horário da feira' }],
      impact: 5e7,
    }, base));
    if (x.max >= HEAT_MAX) out.push(item('tempo-calor:' + e.id, 'atencao', {
      title: `Calor forte na ${e.name}`,
      happened: `A máxima prevista no horário da feira é de ${x.max}°.`,
      todo: 'Leve sombra, gelo e água; deixe laticínios e frios na caixa térmica.',
      why: 'Calor acelera a perda de perecíveis e cansa quem atende a banca.',
      numbers: [{ label: 'Máxima no horário', value: x.max + '°', detail: 'MET Norway' }],
      impact: 4e7,
    }, base));
  }
  return out;
}

export const WEATHER_RULES = [weatherStale, weatherFrost, weatherFair];
