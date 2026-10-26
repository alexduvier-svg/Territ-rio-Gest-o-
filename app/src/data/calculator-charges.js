// Offline reference names, not a tax engine or a table of presumed rates.
// Reviewed 26/10/2026. Only the producer supplies applicable amounts/rates.
export const CALCULATOR_CHARGES=Object.freeze({version:1,reviewedOn:'2026-10-26',automaticRates:false,
 costs:[
  {id:'materials',name:'Matéria-Prima',kind:'variable',help:'Valor gasto para produzir uma unidade.'},
  {id:'packaging',name:'Embalagem',kind:'variable',help:'Custo da embalagem de uma unidade.'},
  {id:'transport',name:'Transporte do Mês',kind:'fixed',help:'Inclua apenas a parcela que deseja ratear nesta produção.'},
  {id:'rent',name:'Aluguel do Mês',kind:'fixed',help:'Valor mensal atribuído à produção que está simulando.'},
  {id:'energy',name:'Energia do Mês',kind:'fixed',help:'Informe o valor atribuído a esta produção, evitando repetir custos.'},
  {id:'draw',name:'Retirada Mensal',kind:'fixed',help:'Use somente se essa retirada ainda não foi incluída nos custos escolhidos.'}
 ],
 taxes:[
  {id:'rural',name:'Contribuição Rural / Funrural',kind:'percentage',help:'Use apenas o percentual aplicável à sua operação, confirmado com seu contador. Não é uma taxa universal.'},
  {id:'simples',name:'Simples Nacional · Alíquota Efetiva',kind:'percentage',help:'Informe a alíquota efetiva aplicável. Não some novamente os tributos já incluídos nela.'},
  {id:'icms',name:'ICMS Informado',kind:'percentage',help:'Aplicação, base e tratamento variam. Use somente o percentual confirmado sobre esta venda.'},
  {id:'iss',name:'ISS Informado',kind:'percentage',help:'Relacionado a serviços, quando aplicável. Não adicione automaticamente às vendas de produtos.'},
  {id:'other',name:'Outro Tributo sobre a Venda',kind:'percentage',help:'Informe nome e percentual que realmente incide sobre o valor desta venda.'},
  {id:'mei',name:'DAS do MEI · Mensal',kind:'fixed',help:'É informado como valor mensal em custos, não como percentual presumido sobre cada venda.'}
 ],
 sources:[
  'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/contribuicoes-previdenciarias-pf',
  'https://www8.receita.fazenda.gov.br/simplesnacional/arquivos/manual/perguntaosn.pdf',
  'https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/servicos-para-mei/pagamento-de-contribuicao-mensal'
 ]});
