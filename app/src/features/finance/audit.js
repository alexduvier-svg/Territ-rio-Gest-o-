// Conferência dos números: o auditor que roda dentro do app. Faz as conferências que um escritório de
// contabilidade faria e diz, em frases simples, o que está certo e o que precisa de atenção.
// Função pura (testada em tests/finance.test.mjs). Valores em centavos.
//
//   1. Cada venda: pagamentos somam o total.            7. Custos com data no futuro.
//   2. Cada venda: itens − desconto = total; custo.     8. Custos possivelmente lançados duas vezes.
//   3. Estoque bate com as movimentações.               9. Dias de feira sem custos lançados.
//   4. Nenhum estoque negativo.                        10. Vendas com data no futuro (relógio errado).
//   5. Produtos vendidos têm custo.                     11. O demonstrativo fecha (prova real).
//   6. Nenhum produto vendido abaixo do custo.         12. Cópia de segurança recente.

const brl = cents => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const plural = (n, one, many) => `${n.toLocaleString('pt-BR')} ${n === 1 ? one : many}`;

function check(id, ok, fields) {
  return { id, ok, ...fields, level: ok ? 'ok' : fields.level || 'aviso' };
}

export function runAudit({ sales = [], products = [], movements = [], expenses = [], missingDays = [], statementOk = true, today, now = Date.now(), backupAt = null }) {
  const done = sales.filter(s => s.status === 'completed' || s.status === 'returned');
  const out = [];

  const badPay = done.filter(s => Math.abs((s.payments || []).reduce((n, p) => n + p.amount, 0) - s.total) > 1);
  out.push(check('pagamentos', !badPay.length, {
    level: 'erro', title: 'Pagamentos conferem com as vendas',
    problem: `${plural(badPay.length, 'venda tem', 'vendas têm')} pagamentos que não somam o total.`,
    help: 'Abra a venda no histórico e confira as formas de pagamento.',
  }));

  const badItems = done.filter(s => {
    const items = s.items || [];
    if (!items.length) return false;
    const sum = items.reduce((n, i) => n + (i.total || 0), 0);
    const cost = items.reduce((n, i) => n + (i.costTotal || 0), 0);
    return Math.abs(sum - (s.discount || 0) - s.total) > 1 || (s.cost != null && Math.abs(cost - s.cost) > 1);
  });
  out.push(check('itens', !badItems.length, {
    level: 'erro', title: 'Itens, descontos e custos das vendas fecham',
    problem: `${plural(badItems.length, 'venda não fecha', 'vendas não fecham')}: itens menos desconto diferente do total.`,
    help: 'Pode ser uma venda antiga editada fora do app. Exporte a planilha e confira.',
  }));

  const lastAfter = new Map();
  for (const m of movements) {
    if (m.after == null || !m.productId) continue;
    const prev = lastAfter.get(m.productId);
    if (!prev || String(m.date) > String(prev.date)) lastAfter.set(m.productId, m);
  }
  const drift = products.filter(p => { const m = lastAfter.get(p.id); return m && Math.abs(m.after - p.stock) > 0.0005; });
  out.push(check('estoque', !drift.length, {
    title: 'Estoque bate com as entradas, vendas e perdas',
    problem: `${plural(drift.length, 'produto tem', 'produtos têm')} estoque diferente da última movimentação (${drift.slice(0, 2).map(p => p.name).join(', ')}).`,
    help: 'Faça uma correção de estoque com a contagem real.', action: 'nav', data: { page: 'Estoque' },
  }));

  const negative = products.filter(p => p.stock < 0);
  out.push(check('negativo', !negative.length, {
    level: 'erro', title: 'Nenhum estoque negativo',
    problem: `${plural(negative.length, 'produto está', 'produtos estão')} com estoque abaixo de zero.`,
    help: 'Registre a entrada que faltou ou corrija o estoque.', action: 'nav', data: { page: 'Estoque' },
  }));

  const soldIds = new Set(done.flatMap(s => (s.items || []).map(i => i.productId)));
  const noCost = products.filter(p => soldIds.has(p.id) && p.price > 0 && !(p.cost > 0));
  out.push(check('custo', !noCost.length, {
    title: 'Produtos vendidos têm custo cadastrado',
    problem: `${plural(noCost.length, 'produto vendido está', 'produtos vendidos estão')} sem custo: o lucro aparece maior do que é.`,
    help: 'Informe quanto custa produzir cada um.', action: 'fin-nocost',
  }));

  const below = products.filter(p => p.cost > 0 && p.price > 0 && p.price <= p.cost && soldIds.has(p.id));
  out.push(check('abaixo', !below.length, {
    title: 'Nenhum produto vendido abaixo do custo',
    problem: `${below.slice(0, 2).map(p => p.name).join(', ')}${below.length > 2 ? '…' : ''}: preço menor ou igual ao custo.`,
    help: 'Reveja o preço ou o custo desse produto.', action: 'nav', data: { page: 'Estoque' },
  }));

  const future = expenses.filter(x => String(x.date).slice(0, 10) > today);
  out.push(check('futuro', !future.length, {
    level: 'erro', title: 'Nenhum custo com data no futuro',
    problem: `${plural(future.length, 'custo está', 'custos estão')} com data depois de hoje.`,
    help: 'Exclua e lance de novo com a data certa.', action: 'mg-detail', data: { key: 'custos' },
  }));

  const seen = new Map();
  let dup = 0;
  for (const x of expenses) {
    const key = [String(x.title).trim().toLowerCase(), x.amount, String(x.date).slice(0, 10), x.scope || 'loja'].join('|');
    if (seen.has(key)) dup++; else seen.set(key, true);
  }
  out.push(check('duplicado', !dup, {
    title: 'Nenhum custo lançado duas vezes',
    problem: `${plural(dup, 'custo parece repetido', 'custos parecem repetidos')} (mesma descrição, valor, dia e local).`,
    help: 'Confira em Custos e exclua o que estiver em dobro.', action: 'mg-detail', data: { key: 'custos' },
  }));

  out.push(check('feiras', !missingDays.length, {
    title: 'Feiras com custos lançados',
    problem: `${plural(missingDays.length, 'dia de feira está', 'dias de feira estão')} sem custos (barraca, transporte): o lucro dessas feiras está maior.`,
    help: 'Lance os custos, mesmo que seja depois.', action: 'mg-detail', data: { key: 'custos' },
  }));

  const ahead = done.filter(s => Date.parse(s.date) > now + 5 * 60 * 1000);
  out.push(check('relogio', !ahead.length, {
    level: 'erro', title: 'Datas das vendas corretas',
    problem: `${plural(ahead.length, 'venda está', 'vendas estão')} com data no futuro: confira a data e a hora do celular.`,
    help: 'Ajuste o relógio do celular para automático.',
  }));

  out.push(check('prova', !!statementOk, {
    level: 'erro', title: 'O demonstrativo fecha (prova real)',
    problem: 'A soma das linhas não bateu com o resultado.',
    help: 'Feche e abra o app. Se continuar, exporte a planilha geral e envie para o suporte.',
  }));

  const days = backupAt ? (now - Date.parse(backupAt)) / 864e5 : null;
  out.push(check('copia', days != null && days <= 7, {
    title: 'Cópia de segurança recente',
    problem: days == null ? 'Ainda não há cópia de segurança dos seus dados.' : `A última cópia foi há ${Math.floor(days)} dias.`,
    help: 'Faça uma cópia em Ajustes → Backup e dados.', action: 'settings',
  }));

  const ok = out.filter(c => c.ok).length;
  return { checks: out, ok, total: out.length, errors: out.filter(c => c.level === 'erro').length, warnings: out.filter(c => c.level === 'aviso').length };
}

export const auditMoney = brl;
