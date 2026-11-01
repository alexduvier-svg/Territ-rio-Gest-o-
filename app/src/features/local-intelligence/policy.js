// Executable limits shared by the UI and provider boundary. No ERP writes.
export const LOCAL_AI_POLICY = Object.freeze({
  version: 1, maxFactsChars: 4000, maxResponseChars: 1000,
  maxSelections: 6, maxConcurrentProviders: 1,
  failureCooldownMs: 120000,
  providers: Object.freeze({qwen: 'integrated_optional', qwen06:'benchmark_only',geminiOnline:'authorized_interpretation', geminiNano: 'experimental_interpretation'}),
});
export const LOCAL_AI_GUIDANCE = Object.freeze([
  'Primeiro, considerar o contexto e as referências válidas. Hipótese, previsão e fato registrado são diferentes. Perguntar somente quando restar ambiguidade; uma simulação nunca altera cadastros por si só.',
  'Respostas genéricas são proibidas. Se a intenção, o registro ou o período não estiverem claros, o Gerente deve perguntar antes de concluir. Se faltarem dados, deve informar o que falta.',
  'A IA interpreta linguagem e propõe um plano de leitura. O aplicativo valida o plano, consulta os registros e faz os cálculos pelos motores existentes. O modelo não cria valores nem executa operações.',
  'Um intérprete por consulta. Recursos do aparelho condicionam a execução local; o Gemini online exige autorização e internet, sem depender da disponibilidade do Nano ou de carregar pesos na memória.',
  'As consultas essenciais continuam disponíveis sem modelo, sem internet ou quando o aparelho precisa de menos carga.',
  'Dados fictícios são identificados como demonstração. Após zerar os registros, o assistente informa a ausência de dados e orienta novos cadastros.',
  'Mudança de produtor, origem ou registros invalida a resposta anterior. Não há reaproveitamento de resultados de demonstração no negócio real.',
  'Nomes, quantidades, unidades, datas, valores e limitações vêm da resposta calculada. O modelo não pode omitir os trechos restantes.',
  'Qwen é opcional e depende do modelo verificado no aparelho. Qwen 0.6B permanece restrito aos testes nesta versão. O Gemini online pode interpretar as perguntas do Gerente com autorização adicional à dos testes fictícios. Somente planos validados chegam aos motores do negócio.',
]);
export function assertLocalConditions({foreground = true, profile} = {}) {
  if (!foreground) throw Error('Volte ao aplicativo para consultar.');
  if (profile === 'essential') throw Error('O aparelho está no perfil Essencial. A resposta calculada continua disponível.');
}
