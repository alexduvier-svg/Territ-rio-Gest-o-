import {evidenceQuality} from './advisor/quality.js';

// Presentation/audit boundary: canonical Finance owns every monetary calculation.
// A report request is read-only. It cannot create a sale, alter stock or call a provider.
export const REPORT_VERSION=1;
export const REPORT_CHAPTERS=Object.freeze([
  {key:'financas',number:'01',icon:'chart',title:'Resultado e Caixa',question:'O que as vendas deixaram?',meaning:'Resultado desconta os custos e despesas registrados. Caixa acompanha recebimentos e saídas; Fiado ainda não pago não é dinheiro disponível.',action:'Confira custos, taxas e recebimentos antes de decidir sobre preço ou retirada.',limit:'Gastos não registrados tornam a leitura parcial. Taxas configuradas são estimativas, não comprovantes de liquidação.'},
  {key:'produtos',number:'02',icon:'box',title:'Produtos e Margens',question:'O que sai e o que contribui?',meaning:'Quantidade mostra saída na unidade de cada produto. Receita mostra valor vendido. Lucro bruto usa o custo guardado na venda, antes das demais despesas.',action:'Compare apresentações equivalentes e confira o custo antes de ampliar a reposição.',limit:'Quilos, pacotes e dúzias não formam um único ranking de quantidade. Receita maior não comprova lucro maior.'},
  {key:'clientes',number:'03',icon:'users',title:'Clientes e Relacionamento',question:'Quem compra e volta?',meaning:'Compras identificadas permitem acompanhar recorrência. Compras sem cliente continuam nas vendas, mas não comprovam fidelização.',action:'Identifique o cliente quando fizer sentido e peça autorização antes de enviar mensagens.',limit:'Ausência de nome não significa cliente novo. Uma compra isolada não demonstra fidelidade nem retorno de campanha.'},
  {key:'onde',number:'04',icon:'store',title:'Locais e Canais',question:'Onde o valor foi vendido?',meaning:'Agrupa as vendas pelo local registrado. Use Finanças para avaliar custos e resultado de cada local.',action:'Compare feiras com duração e condições semelhantes antes de mudar seu planejamento.',limit:'Diferença de receita sozinha não prova que um local é melhor. Clima previsto não comprova a causa das vendas.'},
  {key:'pagamentos',number:'05',icon:'wallet',title:'Formas de Pagamento',question:'Como as vendas foram combinadas?',meaning:'As formas registradas mostram a composição das vendas. Recebimentos e Fiado são conferidos em Resultado e Caixa.',action:'Confira valores com a gaveta, extratos e recebimentos confirmados.',limit:'Venda no crédito não comprova depósito. O vencimento do Fiado não dá baixa sozinho.'},
  {key:'horarios',number:'06',icon:'clock',title:'Datas e Horários Registrados',question:'Quando os registros se concentraram?',meaning:'A distribuição usa a data e a hora salvas no app. Se você anota depois, o horário indica o registro, não necessariamente o atendimento.',action:'Registre próximo da venda e compare mais de um período antes de ajustar o horário da banca.',limit:'Concentração de registros não comprova procura, fluxo de pessoas ou melhor horário para vender.'},
  {key:'estoque',number:'07',icon:'box',title:'Estoque e Sobras',question:'Qual saldo está registrado?',meaning:'Estoque atual é consultado agora. Sobras de feira dependem da carga, reposições, vendas e perdas registradas.',action:'Conte o saldo físico e registre os acertos antes de planejar a próxima feira.',limit:'Saldo atual não é fotografia de um fechamento anterior. Potencial de venda não é receita recebida.'}
]);
const KEYS=new Set(['relatorios','arquivos',...REPORT_CHAPTERS.map(c=>c.key)]);
const SOURCES=Object.freeze({real:'Operação Real',demo:'Demonstração · Dados Fictícios',simulation:'Simulação',unconfirmed:'Origem Não Confirmada'});

export function prepareManagementReport({key,input,request,records=[],now=Date.now()}){
  if(!KEYS.has(key)||!request||typeof request.period!=='string'||!request.period.trim()||typeof request.scope!=='string')throw Error('Escolha um relatório e um período válidos.');
  const quality=evidenceQuality(input),finance=input.finance||{},reasons=[];
  if(quality.context==='unconfirmed')reasons.push('Confirme se estes dados são reais, demonstração ou simulação.');
  if(quality.errors)reasons.push('A auditoria encontrou divergências. Confira os registros antes de interpretar os totais.');
  if(finance.checks!==true||!['revenue','result','cmv','cash'].every(k=>Number.isFinite(finance[k])))reasons.push('O demonstrativo não pôde ser conferido. Não há total validado para apresentar.');
  const seen=new Set();
  for(const r of records){
    // A returned sale may appear once as a sale and once as a reversal; kinds are distinct.
    const id=r.kind+':'+r.id;
    if(!r.id||seen.has(id)||r.eligible===false||!Number.isFinite(Date.parse(r.date))||Date.parse(r.date)>now+300000){reasons.push('Há registro repetido, de outra origem ou com data inválida neste recorte.');break;}
    seen.add(id);
  }
  const sales=Number(input.current?.salesCount)||0,empty=sales===0&&!finance.returned;
  quality.resultIsPartial=quality.resultIsPartial||sales>0&&finance.costsLogged!==true;
  return {version:REPORT_VERSION,key,request:{period:request.period,scope:request.scope},generatedAt:now,
    origin:SOURCES[quality.context],quality,blocked:reasons.length>0,reasons:[...new Set(reasons)],empty,
    status:reasons.length?'Conferir Registros':empty?'Sem Vendas no Recorte':quality.resultIsPartial?'Leitura Parcial':'Registros Conferidos',
    // Pass-through only: no independent recomputation, fabricated trend or online text.
    finance,chapters:REPORT_CHAPTERS,chapter:REPORT_CHAPTERS.find(c=>c.key===key)||null,
    method:'Pedido → recorte e origem → cálculos locais → auditoria → leitura e ação proposta. Nenhum registro é alterado por esta consulta.'};
}
