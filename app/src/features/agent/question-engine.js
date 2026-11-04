import {recordDay,recordClock} from '../record-date.js';
// "Pergunte sobre seu negócio": perguntas em português comum, respondidas só com os registros do app,
// sem internet e sem inventar. Entende o período ("hoje", "semana passada", "em outubro", "últimos 7
// dias", "sempre"), o produto ou a categoria ("peixes", "café especial 250 g") e o que se quer saber:
// mais e menos vendidos, quanto vendeu, quanto há em estoque, o que está acabando, faturamento, vendas,
// ticket médio, lucro bruto (dizendo quando falta custo), clientes, CNPJ, formas de pagamento, melhor
// dia e horário e preços. Sem registro, diz que não há registro. Pergunta que não entende devolve
// understood:false e o app segue para o caminho anterior. Pedido de venda ("vendi 3 taiobas") não é
// pergunta e nunca é tratado aqui.

const norm = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}\s,.%/-]/gu, ' ').replace(/\s+/g, ' ').trim();
const TZ = 'America/Sao_Paulo';
const dayFormat=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'});
const dayKey=d=>{const parts=dayFormat.formatToParts(new Date(d));return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');};
const money = cents => 'R$ ' + (Math.round(cents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = n => (Math.round(n * 1000) / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 3 });
const MONTHS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const UNIT = { Pacote: ['pacote', 'pacotes'], Unidade: ['unidade', 'unidades'], kg: ['kg', 'kg'], Litro: ['litro', 'litros'], Dúzia: ['dúzia', 'dúzias'], Saca: ['saca', 'sacas'], Pote: ['pote', 'potes'], Vidro: ['vidro', 'vidros'], Caixa: ['caixa', 'caixas'], Maço: ['maço', 'maços'], Bandeja: ['bandeja', 'bandejas'], Garrafa: ['garrafa', 'garrafas'], Sacola: ['sacola', 'sacolas'] };
const unitLabel = (u, n) => (UNIT[u] || [String(u || 'unidade').toLowerCase(), String(u || 'unidades').toLowerCase()])[n === 1 ? 0 : 1];
const amount = (n, u) => qty(n) + ' ' + unitLabel(u, n);

// Começa como pergunta? Pedido de venda ("vendi 3...", "vender 2...") não entra.
const QUESTION = /^(o que|oque|qual|quais|quanto|quantos|quantas|quando|quem|como|onde|que dia|que hora|que horas|me (diz|diga|mostra|mostre)|mostra|mostre|lista|liste|tenho|tem |ja vendi|vendi para|vendi pra|vendi a quantos|vendi quantos|vendi quantas|vendi quanto|vendi mais|vendi menos|melhor|pior|produto|produtos|estoque|faturamento|lucro|ticket|preco|valor)/;

function periodOf(q, now) {
  const today = dayKey(now), d = new Date(today + 'T12:00:00Z'), shift = n => { const x = new Date(d); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  const y = d.getUTCFullYear(), m = d.getUTCMonth(), monthStart = (yy, mm) => new Date(Date.UTC(yy, mm, 1)).toISOString().slice(0, 10), monthEnd = (yy, mm) => new Date(Date.UTC(yy, mm + 1, 0)).toISOString().slice(0, 10);
  const wd = (d.getUTCDay() + 6) % 7; // segunda = 0
  let r;
  if (/\bhoje\b/.test(q)) r = { from: today, to: today, label: 'hoje' };
  else if (/\bontem\b/.test(q)) r = { from: shift(-1), to: shift(-1), label: 'ontem' };
  else if (/semana passada|ultima semana/.test(q)) r = { from: shift(-wd - 7), to: shift(-wd - 1), label: 'na semana passada' };
  else if (/(esta|nesta|essa|nessa) semana|(?<!dia )da semana|na semana/.test(q)) r = { from: shift(-wd), to: today, label: 'nesta semana' };
  else if (/mes passado|ultimo mes/.test(q)) r = { from: monthStart(y, m - 1), to: monthEnd(y, m - 1), label: 'no mês passado' };
  else if (/(este|neste|esse|nesse) ano|no ano|do ano/.test(q)) r = { from: y + '-01-01', to: today, label: 'neste ano' };
  else if (/ano passado/.test(q)) r = { from: (y - 1) + '-01-01', to: (y - 1) + '-12-31', label: 'no ano passado' };
  else {
    const last = q.match(/ultimos? (\d{1,3}) dias?/);
    const named = MONTHS.findIndex(name => new RegExp('\\b' + name + '\\b').test(q));
    if (last) { const n = Math.max(1, Number(last[1])); r = { from: shift(-(n - 1)), to: today, label: 'nos últimos ' + n + ' dias' }; }
    else if (named >= 0) { const yy = Number(q.match(/\b(19\d{2}|20\d{2})\b/)?.[1]) || (named > m ? y - 1 : y); r = { from: monthStart(yy, named), to: named === m && yy === y ? today : monthEnd(yy, named), label: 'em ' + MONTHS[named].replace('marco', 'março') + (yy !== y ? ' de ' + yy : '') }; }
    else if (/\b(19\d{2}|20\d{2})\b/.test(q)) {const yy=Number(q.match(/\b(19\d{2}|20\d{2})\b/)[1]);r={from:yy+'-01-01',to:yy+'-12-31',label:'em '+yy};}
    else if (/sempre|desde o inicio|de todos os tempos|no total|ate hoje|historico/.test(q)) r = { from: '0000-01-01', to: today, label: 'em todo o histórico' };
  }
  return r ? { ...r, explicit: true } : { from: monthStart(y, m), to: today, label: 'neste mês', explicit: false };
}

const CATEGORY_WORDS = [[/\bpeix/, 'Piscicultura'], [/\bcafe/, 'Cafés'], [/\b(verdura|legume|fruta|hortali|hortifruti)/, 'Hortifruti-Granjeiro'], [/\b(queijo|leite|iogurte|requeij|laticin)/, 'Laticínios'], [/\bdoce/, 'Doces'], [/\bbolo/, 'Bolos'], [/\b(pao|paes|bisco|rosca)/, 'Panificação'], [/\b(mel|apicol)/, 'Mel e apícolas'], [/\b(salame|linguica|charcut)/, 'Charcutaria'], [/\b(feijao|arroz|milho|grao|graos)/, 'Grãos'], [/\bartesan/, 'Artesanato'], [/\b(bebida|suco|cachaca)/, 'Bebidas']];
const STOP = new Set('o a os as um uma de do da dos das no na nos nas em e eu meu minha meus minhas que qual quais quanto quantos quantas quanta tenho tem estoque saldo vendi vendeu vende vendido vendidos vender mais menos foi foram hoje ontem semana mes ano passado passada esta este essa esse nesta neste nessa nesse ultimos ultimo dias dia ate sempre total pra para por com sem produto produtos me diz mostra quero saber ja ainda agora atual atualmente quanto custa preco valor do de faturei faturamento lucro todos todas tudo sobrou sobra sobrar resta restou restam disponivel acabou acabaram acabando saiu sairam vendo vende entrou recebi ganhei fiz cobro preciso repor comprou compraram pagaram mostra mostre lista liste'.split(' '));
STOP.add('estao');STOP.add('campeao');
const SUBJECT_STOP=new Set('grama gramas quilo quilos kg g litro litros ml vendas venda fiz fizemos melhor pior horario horarios hora horas dia dias semana mes ano ticket media medio receita pagamento pagamentos forma formas usada usadas ganho margem desta desse deste dessa quantos quantas qual quais clientes cliente comprador compradores empresa empresas cnpj cpf pessoas fisicas fisica juridicas juridica'.split(' '));
const stem = w => w.replace(/(oes|aes)$/, 'ao').replace(/(ais)$/, 'al').replace(/(eis)$/, 'el').replace(/(res|zes)$/, w.endsWith('res') ? 'r' : 'z').replace(/s$/, '');
function productText(p) { return norm([p.name, p.baseName, p.category, p.type, p.format, p.flavor, p.variety, p.unit, p.weight ? (p.weight >= 1000 ? p.weight / 1000 + ' kg' : p.weight + ' g') : '', p.volume ? p.volume + ' ml' : ''].filter(Boolean).join(' ')); }
function matchProducts(products, q) {
  const active = products;
  const terms = q.split(' ').filter(w => w.length > 1 && !STOP.has(w) && !/^\d+$/.test(w) && !MONTHS.includes(w)&&!SUBJECT_STOP.has(w)).map(stem);
  const weight = q.match(/(\d+(?:[.,]\d+)?)\s*(g|gramas?|kg|quilos?)\b/);
  const grams = weight ? Number(weight[1].replace(',', '.')) * (/k|q/.test(weight[2]) ? 1000 : 1) : null;
  const category = CATEGORY_WORDS.find(([re]) => re.test(q))?.[1] || '';
  let list = terms.length ? active.filter(p => { const t = productText(p).split(' ').map(stem).join(' '); return terms.every(w => t.includes(w)); }) : [];
  if (!list.length && category && terms.every(w=>CATEGORY_WORDS.find(([re,c])=>c===category&&re.test(w))||['em','no','mes','me'].includes(w))) list = active.filter(p => p.category === category);
  if (!list.length && terms.length) {const meaningful=terms.filter(w=>active.some(p=>productText(p).split(' ').map(stem).join(' ').includes(w)));if(meaningful.length===terms.length)list=active.filter(p=>{const t=productText(p).split(' ').map(stem).join(' ');return meaningful.every(w=>t.includes(w));});}
  if (grams) list = list.filter(p => Number(p.weight) === grams);
  return { list, category, asked: terms.length > 0 || !!category };
}
const ROAST = { Clara: 'TC', 'Média': 'TM', Media: 'TM', Escura: 'TE' };
function displayName(p) { const code = ROAST[p.coffeeRoast] || '', base = code && !String(p.name).includes(code) ? p.name + ' ' + code : p.name; return withSize({ ...p, name: base }); }
function withSize(p) { const extra = [p.weight ? (p.weight >= 1000 ? qty(p.weight / 1000) + ' kg' : p.weight + ' g') : '', p.volume ? (p.volume >= 1000 ? qty(p.volume / 1000) + ' L' : p.volume + ' ml') : ''].filter(Boolean).join(' '); return String(p.name || '') + (extra && !String(p.name).includes(extra) ? ' ' + extra : ''); }

function salesIn(data,period,now,scopeId){return (data.sales||[]).filter(s=>s.status==='completed'&&Number.isFinite(Date.parse(s.date))&&Date.parse(s.date)<=now&&(scopeId==='all'||(s.scope||'loja')===scopeId)&&recordDay(s)>=period.from&&recordDay(s)<=period.to);}
const lines=s=>{const items=s.items||[],exact=items.every(i=>Number.isSafeInteger(i.netTotal)&&i.netTotal>=0)&&items.reduce((n,i)=>n+i.netTotal,0)===s.total;let left=s.total||0;return items.map((i,k)=>{const net=exact?i.netTotal:k===items.length-1?left:Math.min(left,Math.round((i.total||0)*(s.subtotal?s.total/s.subtotal:0)));left-=net;return {...i,net};});};
function productTotals(data, sales) {
  const by = new Map();
  for (const s of sales) for (const i of lines(s)) { const p = (data.products || []).find(x => x.id === i.productId); const key=JSON.stringify([i.productId,i.unit||p?.unit]);const r = by.get(key) || { id: i.productId, name: p ? displayName(p) : i.name || 'Produto', unit: i.unit || p?.unit || 'Unidade', qty: 0, value: 0 }; r.qty += Number(i.qty) || 0; r.value += i.net || 0; by.set(key, r); }
  return [...by.values()];
}

/** Responde uma pergunta. Retorna { understood, text, period } — understood:false quando não reconhece. */
export function answerQuestion(data, question, { now = Date.now(), scopeId='all' } = {}) {
  const q = norm(question);
  if (!q || !(QUESTION.test(q) || question.trim().endsWith('?'))) return { understood: false };
  if (/^(eu )?(vendi|vende|vender)\s+(\d|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez|meio)/.test(q)) return { understood: false };
  const period = periodOf(q, now), sales = salesIn(data,period,now,scopeId), when = period.label;
  const out = (text, extra = {}) => ({ understood: true, text: text + '\n\nFonte: registros do app (' + (extra.stock ? 'estoque de agora; saldo físico, sem descontar reservas ou bloqueios de validade' : 'vendas concluídas ' + when + '; devoluções não entram') + (scopeId==='all'?'; todos os locais':'; local selecionado') + ').', period, ...extra });
  const none = () => out('Não há vendas registradas ' + when + '.');
  const { list: matched, category, asked } = matchProducts(data.products || [], q);
  const scopeLabel = matched.length === 1 ? displayName(matched[0]) : category && (!matched.length || matched.every(p => p.category === category)) ? category.toLowerCase() : '';

  // CNPJ, pessoa física e clientes
  if (/cnpj|pessoas? juridicas?|empresas?/.test(q) || /\bcpf\b|pessoas? fisicas?/.test(q)) {
    if (!sales.length) return none();
    const pj=/cnpj|juridica|empresa/.test(q),type=s=>{const c=(data.clients||[]).find(c=>c.id===s.customerId);return s.customerType||c?.customerType||'';};
    const chosen = sales.filter(s => type(s) === (pj ? 'PJ' : 'PF')), ids = new Set(chosen.map(s => s.customerId || String(s.customerName||s.clientName||'').trim() || null).filter(Boolean));
    return out((pj ? 'Para CNPJ' : 'Para pessoa física') + ' ' + when + ': ' + ids.size + (ids.size === 1 ? ' comprador' : ' compradores') + ', ' + chosen.length + (chosen.length === 1 ? ' venda' : ' vendas') + ', ' + money(chosen.reduce((n, s) => n + (s.total || 0), 0)) + '.' + (pj && !chosen.length ? '\nNenhuma venda marcada como CNPJ no período.' : ''));
  }
  if (/quem (mais )?compr|melhor cliente|cliente que mais|maiores clientes|clientes que mais|clientes? (que )?compr\w* mais/.test(q)) {
    if (!sales.length) return none();
    const by = new Map(); for (const s of sales) { const c = (data.clients || []).find(c => c.id === s.customerId), name = c?.name || String(s.customerName||s.clientName||'').trim(); if (!name) continue; const key=s.customerId||name;const r = by.get(key) || { name, n: 0, v: 0 }; r.n++; r.v += s.total || 0; by.set(key, r); }
    const top = [...by.values()].sort((a, b) => b.v - a.v).slice(0, 3);
    return out(top.length ? 'Clientes que mais compraram ' + when + ':\n' + top.map((r, i) => (i + 1) + 'º ' + r.name + ': ' + money(r.v) + ' em ' + r.n + (r.n === 1 ? ' compra' : ' compras')).join('\n') : 'Nenhuma venda ' + when + ' teve cliente identificado.');
  }
  if (/quant[oa]s (eu )?clientes|clientes (novos|diferentes)|numero de clientes/.test(q)) {
    if (!sales.length) return none();
    const ids = new Set(sales.map(s => s.customerId || String(s.customerName||s.clientName||'').trim()).filter(Boolean));
    return out(ids.size + (ids.size === 1 ? ' cliente identificado comprou ' : ' clientes identificados compraram ') + when + '. ' + sales.filter(s => !s.customerId && !String(s.customerName||s.clientName||'').trim()).length + ' vendas ficaram sem cliente identificado.');
  }

  // O que está acabando ou acabou
  if (/acaband|esgot|acabou|acabaram|sem estoque|faltando|falta|preciso repor|repor|estoque baixo/.test(q)) {
    if(asked&&!matched.length)return out('Não encontrei esse produto cadastrado.',{stock:true});
    const pool = (asked?matched:(data.products||[])).filter(p=>p.active!==false&&!p.archived);
    const out0 = pool.filter(p => Number(p.stock) <= 0), low = pool.filter(p => Number(p.stock) > 0 && Number(p.min) > 0 && Number(p.stock) <= Number(p.min));
    return out((out0.length ? 'Sem estoque: ' + out0.slice(0, 8).map(displayName).join(', ') + (out0.length > 8 ? ' e mais ' + (out0.length - 8) : '') + '.' : 'Nenhum produto zerado.') + '\n' + (low.length ? 'No mínimo ou abaixo: ' + low.slice(0, 8).map(p => displayName(p) + ' (' + amount(p.stock, p.unit) + ')').join(', ') + '.' : 'Nenhum produto no mínimo.'), { stock: true });
  }

  // Melhor dia e horário
  if (/melhor dia|dia (que|em que) mais|que dia|dia da semana|horario|que hora|que horas|hora que mais|horas que mais/.test(q)) {
    if (!sales.length) return none();
    if (/hora/.test(q)) { const by = new Map(); for (const s of sales.filter(s=>recordClock(s))) { const h = Number(new Date(s.date).toLocaleString('en-GB', { timeZone: TZ, hour: '2-digit', hour12: false })) % 24; const r = by.get(h) || { h, n: 0, v: 0 }; r.n++; r.v += s.total || 0; by.set(h, r); } if(!by.size)return out('As vendas deste recorte não têm horário conhecido. Consulte os totais por dia.');const top = [...by.values()].sort((a, b) => b.v - a.v).slice(0, 3); return out('Horários que mais venderam ' + when + ':\n' + top.map((r, i) => (i + 1) + 'º ' + String(r.h).padStart(2, '0') + 'h às ' + String((r.h + 1) % 24).padStart(2, '0') + 'h: ' + money(r.v) + ' em ' + r.n + (r.n === 1 ? ' venda' : ' vendas')).join('\n') + '\nHorário de Brasília.'); }
    const by = new Map(); for (const s of sales) { const k = recordDay(s); const r = by.get(k) || { k, n: 0, v: 0 }; r.n++; r.v += s.total || 0; by.set(k, r); }
    const top = [...by.values()].sort((a, b) => b.v - a.v).slice(0, 3);
    return out('Dias que mais venderam ' + when + ':\n' + top.map((r, i) => (i + 1) + 'º ' + r.k.split('-').reverse().join('/') + ' (' + WEEKDAYS[new Date(r.k + 'T12:00:00Z').getUTCDay()] + '): ' + money(r.v) + ' em ' + r.n + (r.n === 1 ? ' venda' : ' vendas')).join('\n'));
  }

  // Ranking: mais e menos vendidos
  if (/(mais|menos) vend|vend\w* (mais|menos)|mais saiu|menos saiu|(saiu|sairam) (mais|menos)|campea|campeao|mais procurad|melhor produto|pior produto|\btop\b/.test(q)) {
    if(asked&&!matched.length)return out('Não encontrei esse produto cadastrado.');
    const less = /menos|pior/.test(q), totals = productTotals(data, sales).filter(r => !asked || !matched.length || matched.some(p => p.id === r.id));
    if (!totals.length) return none();
    const sorted = totals.sort((a, b) => less ? a.qty - b.qty || a.value - b.value : b.qty - a.qty || b.value - a.value).slice(0, 3);
    const unsold = less ? (asked && matched.length ? matched : (data.products || []).filter(p => p.active !== false && !p.archived && Number(p.stock) > 0)).filter(p => !totals.some(t => t.id === p.id)) : [];
    return out((less ? 'Menos vendidos ' : 'Mais vendidos ') + when + (scopeLabel ? ' (' + scopeLabel + ')' : '') + ':\n' + sorted.map((r, i) => (i + 1) + 'º ' + r.name + ': ' + amount(r.qty, r.unit) + ' · ' + money(r.value)).join('\n') + (unsold.length ? '\nSem nenhuma venda ' + when + ': ' + unsold.slice(0, 6).map(displayName).join(', ') + (unsold.length > 6 ? ' e mais ' + (unsold.length - 6) : '') + '.' : '') + '\nOrdem pela quantidade; unidades diferentes (pacote, kg) não se somam.');
  }

  // Estoque de um produto, categoria ou geral
  if (/estoque|tenho|\btem\b|sobrou|resta|saldo|disponivel/.test(q) && !/vend/.test(q)) {
    const pool=(asked?matched:(data.products||[])).filter(p=>p.active!==false&&!p.archived);
    if (asked && !pool.length) return out('Não encontrei produto com esse nome no estoque. Confira como ele foi cadastrado.', { stock: true });
    const byUnit = new Map(); for (const p of pool) byUnit.set(p.unit, (byUnit.get(p.unit) || 0) + Math.max(0, Number(p.stock) || 0));
    const total = [...byUnit].filter(([, n]) => n > 0).map(([u, n]) => amount(n, u)).join(' · ') || 'nada em estoque';
    const rows = pool.slice().sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0)).slice(0, 10).map(p => '• ' + displayName(p) + ': ' + amount(Math.max(0, Number(p.stock) || 0), p.unit));
    return out((scopeLabel ? 'Em estoque de ' + scopeLabel : 'Em estoque') + ' agora: ' + total + '.\n' + rows.join('\n') + (pool.length > 10 ? '\n…e mais ' + (pool.length - 10) + ' produtos.' : ''), { stock: true });
  }

  // Preço
  if (/preco|quanto custa|valor d[oa]|quanto (eu )?cobro/.test(q) && asked) {
    if (!matched.length) return out('Não encontrei produto com esse nome. Confira como ele foi cadastrado.', { stock: true });
    return out(matched.slice(0, 8).map(p => '• ' + displayName(p) + ': ' + (Number(p.price) > 0 ? money(p.price) + ' por ' + unitLabel(p.unit, 1) : 'sem preço cadastrado')).join('\n'), { stock: true });
  }

  // Quanto vendeu de um produto
  if(asked&&!matched.length&&/vend(?:i|eu|ido)\s+(?:de|do|da)\b/.test(q))return out('Não encontrei esse produto cadastrado.');
  if (asked && matched.length && /vend|saiu|sairam/.test(q)) {
    if (!sales.length) return none();
    const totals = productTotals(data, sales).filter(r => matched.some(p => p.id === r.id));
    if (!totals.length) return out('Nenhuma venda de ' + (scopeLabel || 'esse produto') + ' ' + when + '.');
    const byUnit = new Map(); for (const r of totals) byUnit.set(r.unit, (byUnit.get(r.unit) || 0) + r.qty);
    return out('Vendido ' + when + (scopeLabel ? ' de ' + scopeLabel : '') + ': ' + [...byUnit].map(([u, n]) => amount(n, u)).join(' · ') + ', ' + money(totals.reduce((n, r) => n + r.value, 0)) + '.\n' + totals.sort((a, b) => b.qty - a.qty).slice(0, 8).map(r => '• ' + r.name + ': ' + amount(r.qty, r.unit) + ' · ' + money(r.value)).join('\n'));
  }

  // Formas de pagamento
  if (/\bpix\b|dinheiro|cartao|credito|debito|forma(s)? de pagamento|pagamento mais|como (me )?pagaram/.test(q)) {
    if (!sales.length) return none();
    const by=new Map(),counts=new Map();for(const s of sales){for(const method of new Set((s.payments||[]).filter(p=>p.amount>0).map(p=>p.method)))counts.set(method,(counts.get(method)||0)+1);for(const p of s.payments||[])if(p.amount>0)by.set(p.method,(by.get(p.method)||0)+p.amount);}
    const rows = [...by].sort((a, b) => b[1] - a[1]);
    return out('Vendas por forma de pagamento ' + when + ':\n' + rows.map(([m, v]) => '• ' + m + ': ' + money(v)).join('\n') + (rows.length ? '\nMais usada: ' + [...counts].sort((a,b)=>b[1]-a[1])[0][0] + '. Valores das vendas; Fiado pode estar pendente. Não comprova recebimento bancário.' : ''));
  }

  // Lucro, ticket, número de vendas e faturamento
  if (/lucro|margem|ganhei|sobrou de dinheiro/.test(q)) {
    if(asked&&!matched.length)return out('Não encontrei esse produto cadastrado.');
    if (!sales.length) return none();
    const all=sales.flatMap(lines).filter(i=>!asked||!matched.length||matched.some(p=>p.id===i.productId)), revenue = all.reduce((n, i) => n + i.net, 0), known = all.filter(i => i.costKnown!==false&&Number.isFinite(i.costTotal)&&i.costTotal>=0&&(i.costKnown===true||i.costTotal>0)), cost = known.reduce((n, i) => n + i.costTotal, 0), kRev = known.reduce((n, i) => n + i.net, 0);
    if (!known.length) return out('Não dá para calcular o lucro ' + when + ': nenhum produto vendido tem custo informado.');
    return out('Lucro bruto ' + when + ' (vendas menos o custo dos produtos): ' + money(kRev - cost) + ', margem de ' + (kRev>0?qty((kRev-cost)/kRev*100)+'%.':'sem base para calcular com receita zero.') + (known.length < all.length ? '\nConta parcial: ' + qty(revenue>0?kRev/revenue*100:0) + '% do vendido tem custo informado.' : '') + '\nTaxas, custos extras e contas fixas ficam em Gestão › Finanças.');
  }
  if (/ticket|media por venda|gasto medio|valor medio/.test(q)) {
    if (!sales.length) return none();
    const total = sales.reduce((n, s) => n + (s.total || 0), 0);
    return out('Ticket médio ' + when + ': ' + money(total / sales.length) + ' (' + money(total) + ' em ' + sales.length + (sales.length === 1 ? ' venda' : ' vendas') + ').');
  }
  if (/quantas (eu )?vendas|numero de vendas|quantas vezes (eu )?vendi/.test(q)) return sales.length ? out(sales.length + (sales.length === 1 ? ' venda concluída ' : ' vendas concluídas ') + when + '.') : none();
  if (/quanto (eu )?vend|faturei|faturamento|fatura|receita|total vendido|quanto entrou|vendas? d[eo] (hoje|ontem|mes|semana|ano)/.test(q)) {
    if (!sales.length) return none();
    const total = sales.reduce((n, s) => n + (s.total || 0), 0);
    return out('Vendido ' + when + ': ' + money(total) + ' em ' + sales.length + (sales.length === 1 ? ' venda' : ' vendas') + ' (ticket médio ' + money(total / sales.length) + ').');
  }
  return { understood: false };
}
