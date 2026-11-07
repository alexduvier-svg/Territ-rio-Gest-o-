// Leitura para decidir: explica cada função da Gestão em texto simples, a partir dos mesmos números das telas.
// Seis agentes locais conversam, sem internet e sem inteligência artificial online:
//   Dados: 1 Apuração (reúne os fatos), 2 Ação (escolhe as decisões pelos fatos), 3 Auditoria (confere as contas).
//   Texto: 4 Redação (escreve só com os fatos), 5 Revisão (limita o tamanho), 6 Liberação (confere cada número).
// Antes de tudo vem a Conferência: origem dos dados e as 12 verificações da Auditoria do app (finance/audit.js).
// Sem conferência informada, ou com erro nela, nada é liberado.
// Regra: nenhum texto sai com número que não seja um fato conferido. Na dúvida, a leitura é bloqueada e diz por quê.
// Certeza vale para o que os registros mostram. Causa e resultado futuro nunca são afirmados como fato.

export const DECISION_ITEMS = Object.freeze({
  operacao: [['vendas', 'Vendas'], ['resultado', 'Resultado'], ['caixa', 'Caixa'], ['custos', 'Custos']],
  analise: [['produtos', 'Produtos'], ['estoque', 'Estoque'], ['clientes', 'Clientes'], ['fornecedores', 'Fornecedores'], ['indicadores', 'Indicadores'], ['comparacao', 'Comparação']],
});
// Qual agente do Conselho responde por cada item. Só muda quem interpreta; os números são os mesmos das telas.
export const ITEM_LENS = Object.freeze({ vendas: 'rotina', resultado: 'rotina', comparacao: 'rotina', indicadores: 'rotina', custos: 'caixa', caixa: 'caixa', produtos: 'ganho', estoque: 'ganho', clientes: 'cliente', fornecedores: 'compra' });
export const MAX_LINES = 10, LINE_CHARS = 28; // medido em tela de 320 px: cerca de 28 letras por linha, contando as quebras
export const estimateLines = paragraphs => paragraphs.reduce((n, t) => n + Math.ceil(String(t).length / LINE_CHARS), 0);

const finite = value => Number.isFinite(value);
// Ordem do Conselho quando decisões competem: integridade, caixa, rotina e metas, ganho e estoque, clientes, compras.
export const PRECEDENCE = Object.freeze({ caixa: 1, resultado: 2, vendas: 2, custos: 2, comparacao: 2, indicadores: 2, produtos: 3, estoque: 3, clientes: 4, fornecedores: 5 });
// Portão da Conferência: devolve o motivo do bloqueio, ou lista vazia.
export function conferenceGate(conference) {
  if (!conference) return ['A Conferência dos números não pôde ser feita agora.'];
  if (conference.origin === 'unconfirmed') return ['Confirme se estes dados são reais, de demonstração ou simulação.'];
  const out = [...(conference.blocked || [])];
  for (const c of conference.errors || []) out.push(c.title + (c.problem ? ': ' + c.problem : ''));
  return [...new Set(out)];
}

// 3 · Auditoria de dados: refaz as contas por conta própria. Devolve o que não fechou.
export function auditFacts(input) {
  const st = input.st || {}, problems = [];
  const need = ['grossSales', 'returned', 'revenue', 'cmv', 'fees', 'taxes', 'contribution', 'operating', 'losses', 'fixed', 'draw', 'result', 'cash', 'cashForecast'];
  for (const key of need) if (!finite(st[key])) problems.push('valor ausente: ' + key);
  if (problems.length) return problems;
  if (st.grossSales - st.returned !== st.revenue) problems.push('Receita não fecha com vendas e devoluções.');
  if (st.revenue - st.cmv - st.fees - st.taxes !== st.contribution) problems.push('Margem de contribuição não fecha.');
  if (st.contribution - st.operating - st.losses - st.fixed - st.draw !== st.result) problems.push('Resultado não fecha com a composição.');
  const days = input.sales?.daily;
  if (Array.isArray(days) && days.reduce((n, d) => n + d.amount, 0) !== st.revenue) problems.push('Receita por dia não soma a receita do período.');
  const margins = input.products?.rows;
  if (Array.isArray(margins) && margins.length) {
    const sum = margins.reduce((n, p) => n + (p.revenue || 0), 0);
    if (Math.abs(sum - st.revenue) > margins.length) problems.push('Receita por produto não soma a receita do período.');
  }
  return problems;
}

// 1 e 2 · Apuração e Ação: cada item devolve fatos, leitura e decisões. Só afirma o que o fato sustenta.
function buildItem(key, input, f) {
  const st = input.st, facts = {}, fact = (id, value, shown) => { facts[id] = shown ?? value; return id; };
  const money = (id, cents) => fact(id, cents, f.money(cents)), pct = (id, n) => fact(id, n, f.pct(n));
  const count = (id, n) => fact(id, n, String(n));
  const meaning = [], decide = [];
  let side = '', priority = 0, integrity = false;
  if (key === 'vendas') {
    const s = input.sales;
    if (!s.registered && !st.returned) { meaning.push('Não há vendas neste período.'); decide.push('Registre as vendas para ver o movimento e o ticket.'); return { facts, meaning, decide, side, priority }; }
    count('n', s.eligible); money('total', st.grossSales); side = '{total}';
    meaning.push(s.eligible ? (s.eligible === 1 ? 'Foi {n} compra concluída' : 'Foram {n} compras concluídas') + ', de um total vendido de {total}.' : 'As vendas do período, {total}, foram devolvidas.');
    if (finite(s.ticket)) { money('ticket', Math.round(s.ticket)); meaning.push('Cada compra deixou em média {ticket}.'); }
    if (s.bestDay) { fact('dia', 0, s.bestDay.label); money('diaValor', s.bestDay.amount); meaning.push('O dia mais forte foi {dia}, com {diaValor}.'); }
    if (st.returned > 0) { money('devolvido', st.returned); meaning.push('Houve {devolvido} em devoluções.'); if (st.returned / Math.max(1, st.grossSales) > 0.1) { decide.push('Devoluções acima de um décimo das vendas: veja o motivo antes de repor.'); priority = 2; } }
    if (s.topHour && s.eligible >= 5) { fact('hora', 0, s.topHour + 'h'); decide.push('Reforce a banca perto das {hora}, onde houve mais compras.'); }
    if (finite(s.lines) && s.lines < 1.5 && s.eligible >= 5) decide.push('A maioria leva um produto só: ofereça um segundo item para subir o ticket.');
    if (!decide.length) decide.push('Continue registrando cada venda: quanto mais registros, mais clara fica a leitura.');
  }
  if (key === 'resultado') {
    money('resultado', st.result); side = '{resultado}';
    if (input.empty) { meaning.push('Ainda não há registros neste período.'); decide.push('Registre vendas e custos para saber se o período deu lucro.'); return { facts, meaning, decide, side: '', priority }; }
    money('receita', st.revenue);
    meaning.push(input.partial ? 'Com os custos informados até aqui, o resultado parcial é {resultado}, sobre uma receita de {receita}. Ainda não dá para afirmar o lucro.' : st.result > 0 ? 'Depois de descontar tudo o que foi registrado, sobrou {resultado} de uma receita de {receita}.' : st.result < 0 ? 'A receita de {receita} não cobriu os custos registrados: o resultado foi {resultado}.' : 'A receita de {receita} empatou com os custos registrados.');
    if (!input.general) meaning.push('Em um local, fixos, perdas e retirada ficam de fora: eles entram em Todos os locais.');
    if (input.partial) { decide.push('Informe os custos que faltam nas vendas. Até lá, o lucro real pode ser menor.'); priority = 3; integrity = true; }
    const parts = [['custo dos produtos', st.cmv], ['despesas da operação', st.operating], ['retirada', st.draw], ['custos fixos', st.fixed], ['perdas de estoque', st.losses], ['taxas de cartão', st.fees], ['impostos', st.taxes]].filter(p => p[1] > 0).sort((a, b) => b[1] - a[1]);
    if (parts[0]) { fact('pesoNome', 0, parts[0][0]); money('peso', parts[0][1]); meaning.push('O que mais pesou foi {pesoNome}: {peso}.'); }
    if (input.council?.goal) { money('meta', input.council.goal.value); money('falta', input.council.goal.missing); if (input.council.goal.missing > 0) { meaning.splice(1, 0, 'A meta do mês é {meta}: faltam {falta}.'); priority = Math.max(priority, 1); } else meaning.splice(1, 0, 'A meta do mês, {meta}, foi alcançada.'); }
    if (st.result < 0) { decide.push('Olhe primeiro o que mais pesou: é onde um ajuste muda mais o resultado.'); priority = Math.max(priority, 2); }
    else if (st.result > 0 && !input.partial) decide.push('Compare com a reposição e as contas a pagar antes de usar esse valor.');
    if (!st.costsLogged && st.salesCount) decide.push('Não há custo extra lançado. Se houve gasto, lance em Custos.');
  }
  if (key === 'caixa') {
    const c = input.cash; money('caixa', c.recorded); side = '{caixa}';
    if (input.empty && !c.receivable.count && !c.payable.count) { meaning.push('Ainda não há entradas nem saídas neste período.'); decide.push('Registre vendas e pagamentos para acompanhar o dinheiro.'); return { facts, meaning, decide, side: '', priority }; }
    meaning.push('Pelos registros, entradas menos saídas deram {caixa}. Não é o saldo do banco.');
    if (input.general && st.cashForecast) { money('apos', st.cashAfterForecast ?? st.cash - st.cashForecast); meaning.push('Reservando fixos e retirada previstos, fica {apos}.'); }
    if (c.receivable.overdue > 0) { money('vencidoRec', c.receivable.overdue); decide.push('Cobre {vencidoRec} de Fiado vencido.'); priority = 2; }
    else if (c.receivable.open > 0) { money('receber', c.receivable.open); meaning.push('Há {receber} a receber no Fiado.'); }
    if (input.general && c.payable.overdue > 0) { money('vencidoPag', c.payable.overdue); decide.push('Pague ou renegocie {vencidoPag} de compras vencidas.'); priority = 3; }
    else if (input.general && c.payable.open > 0) { money('pagar', c.payable.open); meaning.push('Há {pagar} em compras a pagar.'); }
    if (input.general && c.outlook?.known && c.outlook.net < 0) { money('previsao', c.outlook.net); fact('prazo', 30, '30 dias'); decide.push('Sem novas vendas, os próximos {prazo} ficam em {previsao}: segure compras que podem esperar.'); priority = Math.max(priority, 1); }
    const power = input.general && !input.partial ? input.council?.power : null;
    if (power && st.result !== undefined) { const best = [...power.result].sort((a, b) => b.cents - a.cents)[0], cash = [...power.cash].sort((a, b) => b.cents - a.cents)[0]; if (best?.cents > 0) { fact('alavanca', 0, best.label.toLowerCase()); money('alavancaValor', best.cents); fact('alavancaCaixa', 0, cash.label.toLowerCase()); money('alavancaDin', cash.cents); decide.push('Simulação: {alavanca} somaria {alavancaValor} ao resultado; {alavancaCaixa} liberaria {alavancaDin}.'); } }
    if (!decide.length) decide.push('Confira de vez em quando com o dinheiro real e o extrato.');
  }
  if (key === 'custos') {
    const k = input.costs; money('extras', st.operating); side = '{extras}';
    if (!st.operating && !st.fixed && !st.draw && !st.investments && !st.losses) { meaning.push('Não há custos lançados neste período. Isso não prova que não houve gasto.'); decide.push('Lance barraca, transporte, embalagem e outros gastos para o resultado ficar real.'); return { facts, meaning, decide, side: '', priority: st.salesCount ? 1 : 0 }; }
    meaning.push('Custos extras somaram {extras}. Eles não incluem o custo do produto vendido.');
    if (input.general && (st.fixed || st.draw)) { money('fixos', st.fixed); money('retirada', st.draw); meaning.push('Fixos: {fixos}. Retirada: {retirada}.'); }
    if (st.investments) { money('invest', st.investments); meaning.push('Investimentos de {invest} saem do Caixa, não do Resultado.'); }
    if (k.biggest) { fact('maiorNome', 0, k.biggest.name); money('maior', k.biggest.amount); meaning.push('O maior grupo foi {maiorNome}: {maior}.'); }
    if (k.missingDays > 0) { count('dias', k.missingDays); decide.push(k.missingDays === 1 ? 'Há {dias} dia de feira sem custo lançado: lance para o evento mostrar o valor real.' : 'Há {dias} dias de feira sem custo lançado: lance para os eventos mostrarem o valor real.'); priority = 1; }
    if (st.feesDefault) decide.push('As taxas de cartão são padrão: confirme as suas em Custos.');
    if (st.revenue > 0 && st.operating / st.revenue > 0.3) { pct('peso', st.operating / st.revenue * 100); decide.push('Os custos extras levaram {peso} da receita: veja qual deles dá para reduzir.'); priority = Math.max(priority, 2); }
    if (!decide.length) decide.push('Continue lançando cada custo no dia em que acontece: o que não for lançado fica de fora do resultado.');
  }
  if (key === 'produtos') {
    const p = input.products;
    if (!p.rows.length) { meaning.push('Não há produtos vendidos neste período.'); decide.push('Quando houver vendas, esta leitura mostra quais produtos dão mais lucro.'); return { facts, meaning, decide, side, priority }; }
    if (p.top) { fact('topNome', 0, p.top.name); money('topLucro', p.top.profit); meaning.push('{topNome} deu o maior lucro bruto: {topLucro}.'); side = '{topLucro}'; }
    if (p.classA > 0 && p.rows.length >= 5) { count('a', p.classA); count('t', p.rows.length); meaning.push('{a} de {t} produtos fazem a maior parte do lucro.'); decide.push('Priorize a reposição desses produtos: faltar um deles custa mais.'); }
    if (p.loss.length) { fact('prejuizo', 0, p.loss[0]); meaning.push('{prejuizo} deu prejuízo no período.'); decide.push('Revise preço e custo de {prejuizo} antes de vender mais.'); priority = 2; }
    if (p.missing > 0) { count('sem', p.missing); decide.push(p.missing === 1 ? 'Há {sem} produto vendido sem custo: informe para saber o lucro real.' : 'Há {sem} produtos vendidos sem custo: informe para saber o lucro real.'); priority = Math.max(priority, 2); integrity = true; }
    if (!decide.length) decide.push('Continue acompanhando: com mais produtos e vendas, a comparação fica mais útil.');
  }
  if (key === 'estoque') {
    const s = input.stock;
    if (!s.withStock && !s.out.length) { meaning.push('Não há produtos com saldo no estoque.'); decide.push('Cadastre os produtos e as entradas para saber o que repor.'); return { facts, meaning, decide, side, priority }; }
    money('custo', s.cost); money('potencial', s.retail); side = '{custo}';
    meaning.push('O estoque de hoje vale {custo} ao custo. Se tudo fosse vendido aos preços atuais, daria {potencial}, o que não é dinheiro garantido.');
    if (s.costMissing > 0) { count('semCusto', s.costMissing); meaning.push(s.costMissing === 1 ? '{semCusto} produto está sem custo: o valor é parcial.' : '{semCusto} produtos estão sem custo: o valor é parcial.'); }
    if (s.out.length) { fact('esgotado', 0, s.out[0]); decide.push('{esgotado} está esgotado e vinha vendendo: reponha primeiro.'); priority = 3; }
    if (s.short.length) { fact('curto', 0, s.short[0]); fact('semana', 7, '7 dias'); decide.push('{curto} dura menos de {semana} no ritmo atual.'); priority = Math.max(priority, 2); }
    if (s.still.length) { count('parados', s.still.length); fact('janela', 30, '30 dias'); if (s.stillValue > 0) { money('parado', s.stillValue); decide.push(s.still.length === 1 ? '{parados} produto sem venda em {janela} prende {parado}: pense em promoção antes de comprar mais.' : '{parados} produtos sem venda em {janela} prendem {parado}: pense em promoção antes de comprar mais.'); } else decide.push(s.still.length === 1 ? '{parados} produto não vendeu em {janela}: pense em promoção antes de comprar mais.' : '{parados} produtos não venderam em {janela}: pense em promoção antes de comprar mais.'); }
    if (!decide.length) { fact('janela', 30, '30 dias'); decide.push('Nenhum produto está perto de acabar pelo ritmo dos últimos {janela}.'); }
  }
  if (key === 'clientes') {
    const c = input.clients;
    if (!c.sales) { meaning.push('Não há compras neste período.'); decide.push('Ao vender, escolha o cliente para acompanhar quem volta.'); return { facts, meaning, decide, side, priority }; }
    count('ident', c.identified); count('total', c.sales); count('pessoas', c.clients); count('voltaram', c.repeat); side = '{pessoas}';
    meaning.push(c.identified === 1 ? '{ident} de {total} compras tem cliente identificado.' : '{ident} de {total} compras têm cliente identificado.');
    if (c.clients) meaning.push(c.repeat === 0 ? (c.clients === 1 ? '{pessoas} pessoa comprou, uma vez.' : '{pessoas} pessoas compraram; nenhuma mais de uma vez.') : c.clients === 1 ? '{pessoas} pessoa comprou mais de uma vez.' : c.repeat === 1 ? '{pessoas} pessoas compraram; {voltaram} comprou mais de uma vez.' : '{pessoas} pessoas compraram; {voltaram} compraram mais de uma vez.');
    if (c.anonymous / c.sales > 0.5) decide.push('Mais da metade das compras está sem nome: identifique o cliente para poder avisar, com autorização.');
    else if (c.repeat === 0 && c.clients) decide.push('Ninguém voltou neste período: combine um retorno com quem comprou, se ele autorizar.');
    else decide.push('Cuide de quem volta: veja o histórico em Clientes antes de oferecer algo.');
    const council = input.council;
    if (council?.concentration?.concentrated) { pct('concentra', council.concentration.share * 100); decide.unshift('Os maiores clientes somam {concentra} da receita identificada: cuide deles e amplie a base.'); priority = Math.max(priority, 1); }
    if (council?.rfm?.available && council.rfm.fading > 0) { count('sumindo', council.rfm.fading); decide.unshift(council.rfm.fading === 1 ? '{sumindo} cliente valioso está sumindo: fale com ele, se ele autorizar.' : '{sumindo} clientes valiosos estão sumindo: fale com eles, se autorizarem.'); priority = Math.max(priority, 1); }
    meaning.push('Recompra observada não garante compra futura.');
  }
  if (key === 'fornecedores') {
    const s = input.suppliers;
    money('compras', s.total); count('qtd', s.count); if (s.count) side = '{compras}';
    meaning.push(s.count ? 'Foram registradas ' + (s.count === 1 ? '{qtd} compra' : '{qtd} compras') + ', somando {compras}. Vale para todos os locais.' : 'Não há compras registradas neste período.');
    if (s.top) { fact('forn', 0, s.top.name); money('fornValor', s.top.total); meaning.push('O maior fornecedor foi {forn}: {fornValor}.'); }
    if (s.payable.overdue > 0) { money('venc', s.payable.overdue); decide.push('Há {venc} vencidos: pague ou renegocie.'); priority = 3; }
    else if (s.payable.open > 0) { money('aberto', s.payable.open); decide.push('Há {aberto} a pagar: reserve esse valor.'); priority = 1; }
    const matrix = input.council?.matrix;
    if (matrix?.available) { const critical = matrix.rows.find(r => r.quadrant === 'estrategico') || matrix.rows.find(r => r.quadrant === 'gargalo'); const lever = matrix.rows.find(r => r.quadrant === 'alavancagem'); if (critical) { fact('critico', 0, critical.name); decide.unshift('{critico} depende de um só fornecedor: cadastre uma alternativa.'); priority = Math.max(priority, 1); } if (lever) { fact('negocia', 0, lever.name); decide.push('{negocia} pesa no gasto e tem opções: cote antes da próxima compra.'); } }
    if (s.unknown > 0) { count('sit', s.unknown); decide.push(s.unknown === 1 ? 'Informe se {sit} compra foi paga: sem isso ela fica fora do Caixa.' : 'Informe se {sit} compras foram pagas: sem isso elas ficam fora do Caixa.'); }
    if (!decide.length) decide.push(s.count ? 'Antes de comprar de novo, compare o preço em Fornecedores.' : 'Registre as compras para comparar preços e prazos.');
  }
  if (key === 'indicadores') {
    const i = input.indicators, value = id => i.find(k => k.id === id)?.value;
    const gross = value('gross-margin'), contribution = value('contribution-rate'), ticket = value('ticket'), breakEven = value('break-even');
    if (![gross, contribution, ticket, breakEven].some(finite)) { meaning.push('Ainda não há base para calcular os indicadores neste período.'); decide.push('Registre vendas com custo informado para eles aparecerem.'); return { facts, meaning, decide, side, priority }; }
    if (finite(gross)) { pct('bruta', gross); side = '{bruta}'; meaning.push('Margem bruta de {bruta}: é o que sobra da venda depois do custo do produto.'); }
    if (finite(contribution)) { pct('contrib', contribution); meaning.push('Margem de contribuição de {contrib}: é o que sobra para pagar os outros custos.'); }
    if (finite(ticket)) { money('tk', Math.round(ticket)); meaning.push('Ticket médio de {tk} por compra.'); }
    if (finite(breakEven)) {
      money('equilibrio', breakEven);
      if (input.general && input.gap) { money('falta', input.gap.shortfall); meaning.push('Para empatar o mês, a referência é {equilibrio} de receita.'); if (input.gap.shortfall > 0) { decide.push('Faltam {falta} de receita para empatar o mês.'); priority = 1; } else if (st.result < 0) decide.push('A receita passou da referência de empate, mas despesas extras e perdas ainda deixam o resultado negativo: veja em Resultado.');
        else decide.push('A receita do mês já passou da referência de empate.'); }
      else if (input.general) meaning.push('A referência mensal de empate é {equilibrio} de receita.');
      else meaning.push('A referência de empate, {equilibrio}, usa a margem deste local e os custos do negócio inteiro: leia em Todos os locais.');
    }
    if (finite(contribution) && contribution <= 0) { decide.push('A margem de contribuição não está positiva: revise preços, custos e taxas.'); priority = 3; }
    if (!decide.length) decide.push('Acompanhe estes números de um período para o outro.');
  }
  if (key === 'comparacao') {
    const c = input.compare;
    if (!c) { meaning.push('Evento não se compara com um mês.'); decide.push('Para comparar períodos, escolha Todos os locais ou Loja.'); return { facts, meaning, decide, side, priority }; }
    if (!c.hasPrior) { meaning.push('Não há registros no período anterior, então não dá para dizer se subiu ou caiu.'); decide.push('Continue registrando: a comparação aparece no próximo período.'); return { facts, meaning, decide, side, priority }; }
    if(c.partial){meaning.push('Faltam custos históricos em pelo menos um dos períodos. O resultado comparado é parcial.');decide.push('Complete os custos das vendas antes de concluir sobre aumento ou queda do lucro.');return {facts,meaning,decide,side,priority};}
    money('rAtual', c.current.revenue); money('rAntes', c.previous.revenue); money('resAtual', c.current.result); money('resAntes', c.previous.result);
    const moved = c.current.revenue - c.previous.revenue;
    meaning.push('A receita foi de {rAntes} para {rAtual}. O resultado foi de {resAntes} para {resAtual}.');
    if (c.open) meaning.push('O período está em andamento: comparamos o trecho equivalente do período anterior.');
    meaning.push('A comparação mostra o que mudou, não o motivo.');
    if (c.current.result < c.previous.result) { decide.push(moved >= 0 ? 'A receita não caiu, mas o resultado caiu: confira os custos em Resultado.' : 'Receita e resultado caíram: veja em Vendas e Produtos o que mudou.'); priority = 1; }
    else decide.push('O resultado não caiu: veja em Produtos o que está ajudando.');
  }
  return { facts, meaning, decide, side, priority, integrity };
}

const fill = (text, facts) => text.replace(/\{(\w+)\}/g, (all, id) => (id in facts ? facts[id] : all));

// 6 · Liberação: tirando os fatos conferidos, não pode sobrar nenhum número nem marcador no texto.
export function releaseCheck(text, facts) {
  let rest = String(text);
  for (const shown of Object.values(facts).map(String).sort((a, b) => b.length - a.length)) if (shown) rest = rest.split(shown).join(' ');
  if (/\{\w+\}/.test(rest)) return { ok: false, reason: 'marcador sem fato' };
  const loose = rest.match(/\d[\d.,]*/);
  return loose ? { ok: false, reason: 'número sem fato: ' + loose[0] } : { ok: true };
}

// 4 e 5 · Redação e Revisão: decisões primeiro na conta do tamanho; corta a leitura secundária, nunca inventa.
function write(item) {
  const meaning = item.meaning.slice(), decide = item.decide.slice(0, 3);
  const size = () => estimateLines([...meaning, ...decide].map(t => fill(t, item.facts)));
  while (size() > MAX_LINES && meaning.length > 2) meaning.pop();
  while (size() > MAX_LINES && decide.length > 1) decide.pop();
  while (size() > MAX_LINES && meaning.length > 1) meaning.pop();
  return { meaning: meaning.map(t => fill(t, item.facts)), decide: decide.map(t => fill(t, item.facts)) };
}

export function buildDecisions(input, format) {
  const gate = conferenceGate(input.conference);
  if (gate.length) return { blocked: true, problems: gate, gate: true, global: null, operacao: [], analise: [], checked: 0, withheld: 0 };
  const problems = auditFacts(input);
  const blockedAll = problems.length > 0;
  const out = { blocked: blockedAll, problems, global: null, operacao: [], analise: [], checked: 0, withheld: 0 };
  if (blockedAll) return out;
  const f = { money: format.money, pct: format.pct };
  const allActions = [];
  for (const group of ['operacao', 'analise']) {
    for (const [key, title] of DECISION_ITEMS[group]) {
      let entry;
      try {
        const item = buildItem(key, input, f), written = write(item), side = item.side ? fill(item.side, item.facts) : '';
        const verdict = releaseCheck([...written.meaning, ...written.decide, side].join(' '), item.facts);
        if (verdict.ok) {
          out.checked += Object.keys(item.facts).length;
          entry = { key, title, side, ...written, released: true };
          if (written.decide[0] && item.priority > 0) allActions.push({ key, title, priority: item.priority, integrity: !!item.integrity, rank: item.integrity ? 0 : PRECEDENCE[key], text: written.decide[0] });
        } else { out.withheld++; entry = { key, title, side: '', meaning: [], decide: [], released: false, reason: verdict.reason }; }
      } catch (error) { out.withheld++; entry = { key, title, side: '', meaning: [], decide: [], released: false, reason: 'erro ao montar' }; }
      out[group].push(entry);
    }
  }
  // Visão global: fatos principais e as três decisões mais urgentes, na ordem de prioridade.
  const st = input.st, facts = { res: f.money(st.result), cx: f.money(input.cash.recorded), rc: f.money(st.revenue) };
  const summary = input.empty ? 'Ainda não há registros neste período. Comece registrando vendas e custos.' : (input.partial ? fill('A receita foi {rc} e o resultado parcial, {res}: falta informar custos para afirmar o lucro. ', facts) : st.result >= 0 ? fill('A receita foi {rc} e o resultado, {res}. ', facts) : fill('A receita foi {rc} e o resultado ficou negativo, em {res}. ', facts)) + fill('Pelos registros, o caixa do período deu {cx}.', facts);
  // Até três decisões, uma por família, na ordem do Conselho.
  const taken = new Set(), first = allActions.sort((a, b) => a.rank - b.rank || b.priority - a.priority).filter(a => (taken.has(a.rank) ? false : (taken.add(a.rank), true))).slice(0, 3);
  const known = {}; for (const group of ['operacao', 'analise']) for (const e of out[group]) if (e.released) known[e.key] = e;
  const globalText = [summary, ...first.map(a => a.text)].join(' ');
  const allowed = { ...facts };
  for (const [group] of [['operacao'], ['analise']]) for (const [key] of DECISION_ITEMS[group]) { try { Object.assign(allowed, prefix(buildItem(key, input, f).facts, key)); } catch {} }
  const council = input.council || {}, basics = council.basics, weak = Number.isFinite(basics?.score) && basics.score < 0.8 ? basics.parts.filter(p => p.value < 1).map(p => p.label) : [];
  const week = !weak.length && first[0] && council.due ? { text: first[0].text, title: first[0].title, owner: 'você', due: council.due } : null;
  const newMoney = !weak.length && !input.partial && input.sales?.eligible >= 8 && input.council?.rfm?.fading > 0 ? 'Hipótese a testar: há clientes valiosos sumindo. Um contato autorizado pode trazer dinheiro novo.' : '';
  const release = releaseCheck(globalText + ' ' + newMoney, allowed);
  out.global = release.ok ? { summary: weak.length ? 'O básico vem primeiro. Antes de analisar o resultado, complete estes registros.' : summary, first: weak.length ? [] : first, weak, week, newMoney, released: true } : { summary: '', first: [], weak: [], released: false, reason: release.reason };
  if (!release.ok) out.withheld++;
  return out;
}
const prefix = (facts, key) => Object.fromEntries(Object.entries(facts).map(([id, shown]) => [key + '.' + id, shown]));
