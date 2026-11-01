// Executable limits shared by the UI and provider boundary. No ERP writes.
export const LOCAL_AI_POLICY = Object.freeze({
  version: 1, maxFactsChars: 4000, maxResponseChars: 1000,
  maxSelections: 6, maxConcurrentProviders: 1,
  failureCooldownMs: 120000,
  providers: Object.freeze({qwen: 'integrated_optional', geminiNano: 'not_integrated'}),
});
export const LOCAL_AI_GUIDANCE = Object.freeze([
  'Os motores do aplicativo consultam os registros e fazem os cálculos. A IA organiza a apresentação, sem criar valores ou executar operações.',
  'Um modelo por consulta. Memória disponível, aquecimento, economia de energia e disponibilidade determinam se o complemento pode funcionar.',
  'As consultas essenciais continuam disponíveis sem modelo, sem internet ou quando o aparelho precisa de menos carga.',
  'Dados fictícios são identificados como demonstração. Após zerar os registros, o assistente informa a ausência de dados e orienta novos cadastros.',
  'Mudança de produtor, origem ou registros invalida a resposta anterior. Não há reaproveitamento de resultados de demonstração no negócio real.',
  'Nomes, quantidades, unidades, datas, valores e limitações vêm da resposta calculada. O modelo não pode omitir os trechos restantes.',
  'Qwen é opcional e depende do modelo verificado no aparelho. Gemini Nano é uma integração futura, sujeita ao suporte oficial do Android.',
]);
export function assertLocalConditions({foreground = true, profile} = {}) {
  if (!foreground) throw Error('Volte ao aplicativo para consultar.');
  if (profile === 'essential') throw Error('O aparelho está no perfil Essencial. A resposta calculada continua disponível.');
}
