export const TOPIC_IDS = Object.freeze(['ticket','margin','discount','stock','pdv','crm','cash','fair']);
// Only a generic topic leaves the local analysis; no rule, category of outcome, or metric value.
export function educationTopicFor(ruleId) {
  if (/^(origem-dados|fin-conferencia|fin-audit)/.test(ruleId)) return null;
  if(/^guia-pdv:/.test(ruleId))return 'pdv';
  if(/^guia-crm:/.test(ruleId))return 'crm';
  if (/^(papel-produto|prejuizo|abaixo-custo|campeao-margem|fin-margem|fin-feira-prejuizo)/.test(ruleId)) return 'margin';
  if (/^(ticket|dependencia)/.test(ruleId)) return 'ticket';
  if (/^(stock-|repor|acaba-logo|esgotou)/.test(ruleId)) return 'stock';
  if (/^(fair-|encalhe|previsao-feira)/.test(ruleId)) return 'fair';
  if (/^(rebuy|retorno|fieis|identificar|divulgacao)/.test(ruleId)) return 'crm';
  if (/^(fin-)/.test(ruleId)) return 'cash';
  if (/^(preco-90)/.test(ruleId)) return 'discount';
  if (/^(preparar|portfolio|qr)/.test(ruleId)) return 'pdv';
  return null;
}
// Provider-independent boundary. No free-form input or object with business context may pass.
export function educationRequest(topic) {
  if (typeof topic !== 'string' || !TOPIC_IDS.includes(topic)) throw Error('Escolha um conceito disponível.');
  return Object.freeze({ topic });
}
export function createEducationService(provider) {
  let sequence = 0;
  return {
    status: () => provider.status({}),
    setEnabled: enabled => { if (typeof enabled !== 'boolean') throw Error('Preferência inválida.'); return provider.setEnabled({ enabled, consentVersion: 1 }); },
    cancel: () => { sequence++; return provider.cancel({}).catch(() => {}); },
    async explain(topic) {
      const request = educationRequest(topic), id = ++sequence;
      const result = await provider.explain(request);
      if (id !== sequence) throw Error('Consulta cancelada.');
      if (typeof result.text !== 'string' || !result.text.trim() || result.text.length > 5000) throw Error('Resposta indisponível. Use a explicação local.');
      return { text: result.text.trim(), cached: result.cached === true, source: 'Gemini · Explicação Geral', generatedAt: result.generatedAt };
    }
  };
}
