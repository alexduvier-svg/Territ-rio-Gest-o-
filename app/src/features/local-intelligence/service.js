import { LOCAL_AI_POLICY, assertLocalConditions } from './policy.js';
// The model explains an already calculated answer. It has no tools or business write access.
export const LOCAL_MODEL = Object.freeze({
  id: 'Qwen3-1.7B',
  bytes: 977184032,
  sha256: '2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8',
  delivery: 'play-install-time',
  assetPath: 'qwen/model.litertlm',
});
export function explanationRequest(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > LOCAL_AI_POLICY.maxFactsChars) throw Error('Use uma consulta menor para a explicação local.');
  return Object.freeze({ facts: text });
}
// The model selects existing passages. Amounts, labels and missing-data notices
// always come from the canonical app answer, never from model-written prose.
export function factPassages(facts) {
  explanationRequest(facts);
  return facts.split(/\n+/).map(s => s.trim()).filter(Boolean);
}
export function validateExplanation(text, facts) {
  const passages = factPassages(facts);
  let selection;
  try { selection = typeof text === 'string' && text.length <= LOCAL_AI_POLICY.maxResponseChars ? JSON.parse(text).trechos : null; } catch {}
  if (!Array.isArray(selection) || !selection.length || selection.length > LOCAL_AI_POLICY.maxSelections || selection.some(i => !Number.isInteger(i) || i < 0 || i >= passages.length) || new Set(selection).size !== selection.length) throw Error('O resumo não passou na conferência. A resposta calculada pelo app permanece acima.');
  // Keep every canonical passage in its original order. Selection is advisory:
  // it cannot hide a compound answer, a quantity, date, unit or limitation.
  return passages.join('\n\n');
}
export function createLocalIntelligence(provider, { now = Date.now } = {}) {
  let epoch = 0, active = false, retryAfter = 0;
  async function exclusive(work) {
    if (active) throw Error('Aguarde o encerramento da operação atual. A resposta calculada continua disponível.');
    active = true;
    try { return await work(); } finally { active = false; }
  }
  return {
    status: () => provider.status({}),
    installModel: () => exclusive(() => provider.installModel({})),
    removeModel: () => exclusive(() => provider.removeModel({})),
    setEnabled: async enabled => { if (!enabled) epoch++; return provider.setEnabled({ enabled }); },
    cancel: () => { epoch++; return provider.cancel({}).catch(() => {}); },
    async explain(text, conditions) {
      assertLocalConditions(conditions);
      const request = explanationRequest(text);
      if (now() < retryAfter) throw Error('O complemento local está em pausa após uma falha. Use a resposta calculada e tente novamente mais tarde.');
      return exclusive(async () => {
        const token = ++epoch;
        try {
          const result = await provider.explain(request);
          if (token !== epoch) throw Error('Consulta cancelada.');
          return validateExplanation(result.text, text);
        } catch (error) {
          if (token === epoch) retryAfter = now() + LOCAL_AI_POLICY.failureCooldownMs;
          throw error;
        }
      });
    },
  };
}
