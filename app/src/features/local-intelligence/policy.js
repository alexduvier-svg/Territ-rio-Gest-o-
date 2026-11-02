// Executable limits shared by the UI and provider boundary. No ERP writes.
// 0.12.148: Qwen removed. Gemini online is the main interpreter, Gemini Nano interprets
// offline where AICore supports it, and the local engines always answer from the records.
export const LOCAL_AI_POLICY = Object.freeze({
  version: 2, maxConcurrentProviders: 1,
  providers: Object.freeze({geminiOnline:'main_interpretation', geminiNano:'offline_interpretation', localEngines:'always_available'}),
});
export function interpreterOrder({online=false,offline=false}={}){
  const order=[];if(online)order.push('gemini-online');if(offline)order.push('gemini-nano');return order;
}
export const LOCAL_AI_GUIDANCE = Object.freeze([
  'Primeiro, considerar o contexto e as referências válidas. Hipótese, previsão e fato registrado são diferentes. Perguntar somente quando restar ambiguidade; uma simulação nunca altera cadastros por si só.',
  'Respostas genéricas são proibidas. Se a intenção, o registro ou o período não estiverem claros, o Gerente deve perguntar antes de concluir. Se faltarem dados, deve informar o que falta.',
  'A IA interpreta a linguagem e propõe um plano de leitura. O aplicativo valida o plano, consulta os registros e faz os cálculos pelos motores existentes. O modelo não cria valores nem executa operações.',
  'Ordem de interpretação: Gemini online, com autorização e internet; Gemini Nano no aparelho, sem internet, onde o Android oferecer suporte; e, sempre, os motores do aplicativo, que respondem diretamente às consultas sem nenhum modelo.',
  'As consultas essenciais continuam disponíveis sem modelo, sem internet ou quando o aparelho precisa de menos carga.',
  'Dados fictícios são identificados como demonstração. Após zerar os registros, o assistente informa a ausência de dados e orienta novos cadastros.',
  'Mudança de produtor, origem ou registros invalida a resposta anterior. Não há reaproveitamento de resultados de demonstração no negócio real.',
  'Nomes, quantidades, unidades, datas, valores e limitações vêm da resposta calculada pelos motores. Nenhum trecho é omitido ou reescrito pela IA.',
  'Nenhum modelo de linguagem é embutido no aplicativo. O Gemini Nano é gerenciado pelo próprio Android (AICore), e o Gemini online exige a autorização do produtor.',
]);
export function assertLocalConditions({foreground = true, profile} = {}) {
  if (!foreground) throw Error('Volte ao aplicativo para consultar.');
  if (profile === 'essential') throw Error('O aparelho está no perfil Essencial. A resposta calculada continua disponível.');
}
