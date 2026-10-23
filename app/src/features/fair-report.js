// Feiras oficiais e "Enviar relatório": correção do nome do evento e o relatório da feira montado sozinho
// a partir das vendas (as mesmas perguntas do formulário da Feira do Inventário, sem o produtor responder).
// Funções puras, testadas em tests/fair-report.test.mjs. Valores em centavos.

export const OFFICIAL_FAIRS = [
  { id: 'feira-inventario', name: 'Feira do Inventário Rural e Cultural', short: 'Feira do Inventário', aliases: ['feira do inventario', 'feira do inventario rural', 'feira inventario', 'inventario rural', 'feira do inventario rural e cultural'], city: 'Carangola', uf: 'MG' },
];

const plain = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Palavras de nomes de eventos rurais, com a grafia correta. A chave é sem acento e minúscula.
const WORDS = Object.fromEntries([
  'Feira', 'Feiras', 'Inventário', 'Rural', 'Rurais', 'Cultural', 'Cultura', 'Festa', 'Festival', 'Café', 'Cafés', 'Exposição', 'Expo', 'Agropecuária',
  'Agricultura', 'Familiar', 'Orgânicos', 'Orgânica', 'Orgânico', 'Produtor', 'Produtores', 'Produtora', 'Mercado', 'Municipal', 'Praça', 'Matriz',
  'Sábado', 'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Idade', 'Natal', 'Páscoa', 'Junina', 'Julina', 'Leite', 'Queijo', 'Queijos',
  'Mel', 'Artesanato', 'Gastronomia', 'Sabores', 'Colheita', 'Roça', 'Campo', 'Agro', 'São', 'João', 'José', 'Santo', 'Santa', 'Nossa', 'Senhora',
  'Carangola', 'Encontro', 'Mostra', 'Semana', 'Dia', 'Noite', 'Verão', 'Inverno', 'Primavera', 'Outono', 'Comunidade', 'Associação', 'Cooperativa',
  'Banana', 'Flores', 'Plantas', 'Doces', 'Vinho', 'Cachaça', 'Bairro', 'Centro', 'Estação', 'Parque', 'Exposições', 'Shopping', 'Avenida', 'Rua',
].map(w => [plain(w), w]));
const CONNECTORS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos', 'a', 'o', 'ao', 'para', 'com']);

function distance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function fixWord(k) {
  if (WORDS[k]) return [WORDS[k]];
  if (CONNECTORS.has(k)) return [k];
  // Palavras grudadas: "feirado" → "feira do".
  for (let i = 2; i <= k.length - 1; i++) {
    const a = k.slice(0, i), b = k.slice(i);
    if ((WORDS[a] || CONNECTORS.has(a)) && (WORDS[b] || CONNECTORS.has(b)) && (WORDS[a] || WORDS[b])) return [WORDS[a] || a, WORDS[b] || b];
  }
  // Erro de digitação: "invertario" → "Inventário" (até 1 letra em palavras curtas, 2 nas longas).
  if (k.length >= 4) {
    const limit = k.length >= 7 ? 2 : 1;
    let best = null;
    for (const key of Object.keys(WORDS)) { const n = distance(k, key); if (n <= limit && (!best || n < best.n)) best = { n, key }; }
    if (best) return [WORDS[best.key]];
  }
  return null;
}

// Corrige o português do nome digitado: acentos, maiúsculas, conectivos minúsculos, palavras grudadas.
export function correctEventName(raw) {
  const tokens = String(raw || '').trim().split(/\s+/).filter(Boolean);
  const out = [];
  for (const t of tokens) {
    const k = plain(t).replace(/[^a-z0-9ºª]/g, '');
    if (/^\d+(a|ª)$/.test(k)) { out.push(k.replace(/a$/, 'ª')); continue; }
    if (/^\d+(o|º)$/.test(k)) { out.push(k.replace(/o$/, 'º')); continue; }
    const fixed = k ? fixWord(k) : null;
    if (fixed) out.push(...fixed);
    else out.push(t.charAt(0).toLocaleUpperCase('pt-BR') + t.slice(1));
  }
  return out.map((w, i) => (i > 0 && CONNECTORS.has(plain(w)) ? plain(w) : i === 0 && CONNECTORS.has(plain(w)) ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(' ');
}

// Feira oficial parecida com o nome digitado (ou já corrigido). Devolve a feira ou null.
const GENERIC = new Set(['feira', 'feiras', 'festa', 'festival', 'rural', 'rurais', 'cultural', 'cultura', 'expo', 'exposicao', 'encontro', 'mostra', 'mercado', 'municipal', 'produtor', 'produtores']);
const distinctive = s => plain(s).split(/\s+/).filter(w => w.length > 2 && !CONNECTORS.has(w) && !GENERIC.has(w));
export function matchOfficialFair(name, fairs = OFFICIAL_FAIRS) {
  const k = plain(correctEventName(name));
  if (k.length < 5) return null;
  const typedWords = distinctive(k);
  let best = null;
  for (const f of fairs) {
    // Precisa ter a palavra que identifica a feira ("inventário"), não só "feira" ou "festa".
    const own = distinctive(f.name);
    if (!own.some(w => typedWords.some(t => distance(t, w) <= (w.length >= 7 ? 2 : 1)))) continue;
    for (const option of [f.name, f.short, ...(f.aliases || [])].map(plain)) {
      const score = option === k ? 1 : option.startsWith(k) || k.startsWith(option) ? 0.92 : 1 - distance(k, option) / Math.max(k.length, option.length);
      if (!best || score > best.score) best = { fair: f, score };
    }
  }
  return best && best.score >= 0.72 ? best.fair : null;
}

// ------------------------------------------------------------------ relatório da feira
const hm = minutes => `${Math.floor(minutes / 60)}h${String(Math.round(minutes % 60)).padStart(2, '0')}`;
const brTime = iso => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false });
const brHour = iso => Number(new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }).slice(0, 2));
const minutesSince = (iso, day, from) => (Date.parse(iso) - Date.parse(`${day}T${from || '00:00'}:00-03:00`)) / 60000;
const itens = n => `${n} ${n === 1 ? 'item' : 'itens'}`;
const rating = r => (r >= 0.9 ? 'EXCELENTE SAÍDA' : r >= 0.6 ? 'BOA SAÍDA' : r > 0 ? 'POUCA SAÍDA' : 'NENHUMA SAÍDA');

// A conferência é um retrato do fechamento, não uma projeção da sobra atual.
// Copiar somente o contrato público também evita enviar campos locais de medição.
const nonnegative = value => { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : 0; };
const quantityValue = value => Number(nonnegative(value).toFixed(3));
const checkText = value => typeof value === 'string' ? value : '';
function reportCheck(check) {
  return {
    conferido: check?.conferido === true,
    corrigido: check?.corrigido === true,
    vendasNaoRegistradas: { qtd: quantityValue(check?.vendasNaoRegistradas?.qtd), valor: Math.round(nonnegative(check?.vendasNaoRegistradas?.valor)) },
    perdas: { qtd: quantityValue(check?.perdas?.qtd) },
    itens: (Array.isArray(check?.itens) ? check.itens : []).filter(i => i && typeof i === 'object').map(i => ({
      produto: checkText(i.produto), unidade: checkText(i.unidade),
      calculado: quantityValue(i.calculado), real: quantityValue(i.real), motivo: checkText(i.motivo),
    })),
  };
}

// event: {name,start,end,from,until}; load: {items:[{productId,name,description,unit,qty}], updatedAt}
// sales: vendas concluídas do evento (com items[].productId, qty, netTotal/total, costTotal; payments; date)
// load.items[].qty já inclui reposições; restocks é apenas o histórico.
// losses: movimentos de perda do evento, com productId, unit, qty, kind e eventId.
// Derived from confirmed load entries only: one confirmation may carry several products.
// No counter is written, so reloads, report requests and retries cannot increment it.
export function fairRestockSummary(load) {
  const batches=new Set(),products=new Map();let complete=true;
  for(const item of load?.items||[]){
    if(item.restocks==null)continue;
    if(!Array.isArray(item.restocks)){complete=false;continue;}
    const key=JSON.stringify([item.productId,item.unit||'']);
    for(const entry of item.restocks){
      const qty=Number(entry?.qty),at=Date.parse(entry?.at),operation=entry?.operationId||entry?.fairActivityId||entry?.movementId;
      if(!Number.isFinite(qty)||qty<=0||!item.productId||(!operation&&!Number.isFinite(at))){complete=false;continue;}
      const batch=operation?'operation:'+operation:'time:'+at;
      batches.add(batch);if(!products.has(key))products.set(key,{productId:item.productId,unit:item.unit||'',batches:new Set()});products.get(key).batches.add(batch);
    }
  }
  const rows=[...products.values()].map(({productId,unit,batches})=>({productId,unit,count:batches.size}));
  return{count:batches.size,productEntries:rows.reduce((n,r)=>n+r.count,0),complete,products:rows};
}

export function buildFairReport({ event, load, sales, losses = [], productOf = () => null, producer = {}, now = Date.now() }) {
  const lines = new Map(), restockHistory=fairRestockSummary(load), restockCounts=new Map(restockHistory.products.map(p=>[JSON.stringify([p.productId,p.unit]),p.count]));
  const keyOf = (id, unit) => id + '|' + (unit || '');
  for (const i of load?.items || []) lines.set(keyOf(i.productId, i.unit), { id: i.productId, name: i.name, description: i.description || '', unit: i.unit || '', took: Number(i.qty) || 0, restocked: (i.restocks || []).reduce((n, r) => n + (Number(r.qty) || 0), 0), sold: 0, revenue: 0, cost: 0, price: productOf(i.productId)?.price || 0, soldOutAt: '', soldOutIso: '' });
  const ordered = sales.filter(s => s.status === 'completed').sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const payments = {}, hourly = {};
  let revenue = 0;
  for (const s of ordered) {
    revenue += s.total;
    for (const p of s.payments || []) payments[p.method] = (payments[p.method] || 0) + p.amount;
    const h = brHour(s.date);
    hourly[h] = (hourly[h] || 0) + s.total;
    const factor = s.subtotal > 0 ? s.total / s.subtotal : 1;
    for (const it of s.items || []) {
      const key = keyOf(it.productId, it.unit);
      let line = lines.get(key);
      if (!line) { line = { id: it.productId, name: it.name, description: it.description || '', unit: it.unit || '', took: null, sold: 0, revenue: 0, cost: 0, price: it.price || 0, soldOutAt: '', soldOutIso: '' }; lines.set(key, line); }
      line.sold += Number(it.qty) || 0;
      line.revenue += Math.round(it.netTotal ?? (it.total || 0) * factor);
      line.cost += it.costTotal || 0;
      if (!line.price) line.price = it.price || 0;
      if (line.took != null && !line.soldOutIso && line.sold >= line.took && line.took > 0) { line.soldOutIso = s.date; line.soldOutAt = brTime(s.date); }
    }
  }
  for (const loss of losses) {
    if (loss.kind !== 'loss' || (event.id && loss.eventId !== event.id)) continue;
    const line = lines.get(keyOf(loss.productId, loss.unit));
    if (line) line.lost = quantityValue((line.lost || 0) + nonnegative(loss.qty));
  }
  const tookKnown = !!(load?.items || []).length;
  const products = [...lines.values()].map(l => {
    const took = l.took == null ? l.sold : l.took;
    const left = quantityValue(took - l.sold - (l.lost || 0));
    const day = l.soldOutIso ? new Date(l.soldOutIso).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) : '';
    return { ...l, took, left, oversold: l.took == null ? 0 : Math.max(0, l.sold - l.took), timeToSellOut: l.soldOutIso ? hm(minutesSince(l.soldOutIso, day, event.from)) : '', ratio: took > 0 ? l.sold / took : 0, restocked: l.restocked || 0, restockCount:restockCounts.get(JSON.stringify([l.id,l.unit||'']))||0 };
  });
  const tot = k => quantityValue(products.reduce((n, p) => n + p[k], 0));
  const took = tot('took'), sold = tot('sold'), left = tot('left');
  const byQty = products.slice().sort((a, b) => b.sold - a.sold || b.revenue - a.revenue);
  const label = p => p.name + (p.description && !/^unidade$/i.test(p.description) ? ' (' + p.description + ')' : '');
  // Faixas de preço: do mais caro ao mais barato, em três grupos.
  const byPrice = products.filter(p => p.price > 0).sort((a, b) => b.price - a.price);
  const tier = (from, to) => byPrice.slice(from, to);
  const third = Math.max(1, Math.round(byPrice.length / 3));
  const tiers = byPrice.length >= 3 ? [tier(0, third), tier(third, byPrice.length - third), tier(byPrice.length - third)] : byPrice.length === 2 ? [[byPrice[0]], [], [byPrice[1]]] : [byPrice, [], []];
  const tierRatio = g => { const t = g.reduce((n, p) => n + p.took, 0); return t ? g.reduce((n, p) => n + p.sold, 0) / t : 0; };
  const tierProfit = g => g.reduce((n, p) => n + p.revenue - p.cost, 0);
  const profits = [['PRODUTOS MAIS CAROS', tierProfit(tiers[0])], ['PRODUTOS DE PREÇO MÉDIO', tierProfit(tiers[1])], ['PRODUTOS MAIS BARATOS', tierProfit(tiers[2])]].sort((a, b) => b[1] - a[1]);
  const soldOut = products.filter(p => p.soldOutIso).sort((a, b) => Date.parse(a.soldOutIso) - Date.parse(b.soldOutIso));
  const allOut = tookKnown && products.length && products.every(p => p.took > 0 && p.sold >= p.took);
  const lastOut = allOut ? soldOut[soldOut.length - 1] : null;
  const methods = Object.entries(payments).sort((a, b) => b[1] - a[1]);
  // Reposição = o "o que vou levar" foi atualizado depois da primeira venda (marcar antes de vender, mesmo
  // já na praça, não conta como reposição).
  const firstSale = ordered[0] ? Date.parse(ordered[0].date) : null;
  const restocked = products.some(p => p.restocked > 0) || (tookKnown && firstSale != null && load.updatedAt && load.updatedAt !== load.createdAt && load.surplusAdjustedAt !== load.updatedAt && Date.parse(load.updatedAt) > firstSale && !(load.items || []).some(i => i.restocks));
  const restockSummary={...restockHistory,complete:restockHistory.complete&&(!restocked||products.some(p=>p.restocked>0))};
  const reposicao = restocked ? 'CONSEGUI REPOR' : soldOut.length ? 'FIQUEI SEM REPOSIÇÃO' : 'NÃO PRECISEI REPOR';
  const answers = {
    produtos: products.map(label).join(', '),
    levou: tookKnown ? itens(took) : 'Não informado (o produtor não marcou o que levou)',
    vendeu: itens(sold),
    restou: tookKnown ? itens(left) + (left ? ': ' + products.filter(p => p.left).map(p => `${p.left} ${label(p)}`).join(', ') : '') : 'Não informado',
    maisVendido: byQty[0] ? label(byQty[0]) : '',
    menosVendido: byQty.length > 1 ? label(byQty[byQty.length - 1]) : 'Nenhum',
    saidaCaro: tiers[0].length ? rating(tierRatio(tiers[0])) : '',
    saidaMedio: tiers[1].length ? rating(tierRatio(tiers[1])) : '',
    saidaBarato: tiers[2].length ? rating(tierRatio(tiers[2])) : '',
    tempoEsgotar: lastOut ? lastOut.timeToSellOut : 'NÃO ESGOTOU',
    reposicao,
    reposicoesRegistradas: (restockSummary.count===1?'1 confirmação':restockSummary.count+' confirmações')+(restockSummary.complete?'':' · Histórico parcial'),
    repostos: products.some(p => p.restocked) ? products.filter(p => p.restocked).map(p => `${p.restocked} ${label(p)}`).join(', ') : restocked ? 'Repôs durante a feira (quantidade levada atualizada)' : 'NÃO REPUS',
    vendeuAlemDoLevado: products.filter(p => p.oversold).map(p => `${label(p)}: ${p.oversold} a mais`).join(', '),
    esgotouPrimeiro: soldOut[0] ? `${label(soldOut[0])} (${soldOut[0].timeToSellOut})` : 'Não esgotou nenhum',
    semVenda: products.filter(p => !p.sold).map(label).join(', ') || 'Todos venderam',
    maiorLucro: products.some(p => p.cost) && profits[0][1] > 0 ? profits[0][0] : '',
    metodoPagamento: methods.length ? `${methods[0][0]} (${Math.round(methods[0][1] / Math.max(1, revenue) * 100)}%)` : '',
  };
  const check=reportCheck(event.surplusCheck),activitySales=ordered.filter(s=>s.fairActivityId);
  // Activity corrections were recorded before the final count. Add them once to
  // the closing summary; their sales already belong to revenue and stock above.
  check.vendasNaoRegistradas.qtd=quantityValue(check.vendasNaoRegistradas.qtd+activitySales.flatMap(s=>s.items||[]).reduce((n,i)=>n+i.qty,0));
  check.vendasNaoRegistradas.valor+=activitySales.reduce((n,s)=>n+s.total,0);
  check.corrigido ||= !!event.fairActivities?.length;
  return {
    app: producer.app || '',
    producer: { name: producer.name || '', business: producer.business || '', community: producer.community || '', city: producer.city || '', uf: producer.uf || '' },
    event: { name: event.name, start: event.start, end: event.end, from: event.from || '', until: event.until || '' },
    totals: { took, sold, left, revenue, sales: ordered.length, ticket: ordered.length ? Math.round(revenue / ordered.length) : 0, tookKnown: tookKnown ? 1 : 0, restockCount:restockSummary.count, restockCountKnown:restockSummary.complete?1:0 },
    answers, payments, hourly, restockSummary,
    check,
    products: products.map(({ id, name, description, unit, took, sold, left, revenue, price, soldOutAt, timeToSellOut, restocked, restockCount, oversold }) => ({ id, name, description, unit, took, sold, left, revenue, price, soldOutAt, timeToSellOut, restocked, restockCount, oversold })),
    builtAt: new Date(now).toISOString(),
  };
}

// ------------------------------------------------------------------ avisos para finalizar a feira
// 10 min antes do fim; 20h do mesmo dia; 12h do dia seguinte e depois 12h por dia, até 7 dias.
// Horários humanos: nada de madrugada. Devolve instantes (ms) em ordem.
export function fairNoticeTimes(endAt, days = 7) {
  const first = endAt - 10 * 60000;
  const at = (offset, hhmm) => Date.parse(new Date(endAt + offset * 864e5).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) + 'T' + hhmm + ':00-03:00');
  const times = [first, at(0, '20:00')];
  for (let d = 1; d <= days; d++) times.push(at(d, '12:00'));
  return times.filter((t, i) => i === 0 || t - first >= 60 * 60000).sort((a, b) => a - b);
}

// ------------------------------------------------------------------ dados no formato da skill de relatórios
// (contrato: produtores, estoque com reposições, vendas uma a uma, fechamento e feedback). Valores em reais.
const PAY = { Pix: 'PIX', Dinheiro: 'DINHEIRO', 'Débito': 'CARTAO_DEBITO', 'Crédito': 'CARTAO_CREDITO' };
const reais = c => Math.round(Number(c) || 0) / 100;
const isoBR = ms => new Date(ms - 3 * 3600e3).toISOString().slice(0, 19) + '-03:00';
export function buildFairContract({ event, load, sales, productOf = () => null, producer = {}, counts = {}, note = '' }) {
  const pid = producer.id || 'p1';
  const nome = String(producer.name || '').trim();
  const estoque = (load?.items || []).map(i => {
    const p = productOf(i.productId) || {};
    const restocks = (i.restocks || []).filter(r => Number(r.qty) > 0);
    const extra = restocks.reduce((n, r) => n + Number(r.qty), 0);
    return {
      produtor_id: pid, produto_id: i.productId, produto: i.name + (i.description && !/^unidade$/i.test(i.description) ? ' ' + i.description : ''),
      categoria: p.category || '', unidade: i.unit || '', preco: reais(p.price), qtd_inicial: Math.max(0, (Number(i.qty) || 0) - extra),
      reposicoes: restocks.map(r => ({ hora: brTime(r.at), qtd: Number(r.qty) })),
    };
  });
  const vendas = sales.filter(s => s.status === 'completed' || s.status === 'returned').sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).map(s => {
    const factor = s.subtotal > 0 ? s.total / s.subtotal : 1;
    const main = (s.payments || []).slice().sort((a, b) => b.amount - a.amount)[0];
    const v = {
      id: s.id, produtor_id: pid, hora: isoBR(Date.parse(s.date)),
      itens: (s.items || []).map(it => { const net = it.netTotal ?? (it.total || 0) * factor; return { produto_id: it.productId, qtd: it.qty, preco_unit: Math.round(net / (it.qty || 1)) / 100 }; }),
      total: reais(s.total), pagamento: PAY[main?.method] || 'OUTRO', cancelada: s.status === 'returned',
    };
    if ((s.payments || []).length > 1) v.pagamentos = s.payments.map(p => ({ forma: PAY[p.method] || 'OUTRO', valor: reais(p.amount) }));
    if (s.late) { v.lancada_depois = true; v.registrada_em = s.registeredAt || ''; }
    if (s.unregistered === true) v.unregistered = true;
    return v;
  });
  const fechamento = Object.entries(counts).filter(([, v]) => v !== '' && v != null && Number.isFinite(Number(v))).map(([id, v]) => ({ produtor_id: pid, produto_id: id, contado: Number(v) }));
  const feedback = String(note || '').trim() ? [{ produtor_id: pid, observacao: String(note).trim().slice(0, 600), citacao_autorizada: false }] : [];
  const first = nome.split(/\s+/)[0] || nome;
  return {
    produtor: { id: pid, nome, nome_curto: producer.short || first, comunidade: producer.community || '', tenda: producer.tent ?? null },
    evento: { data: event.start, local: event.place || '', inicio: event.from || '', fim: event.until || '' },
    estoque, vendas, fechamento, feedback,
  };
}
