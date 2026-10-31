// The model explains an already calculated answer. It has no tools or business write access.
export const LOCAL_MODEL = Object.freeze({
  id: 'Qwen3-1.7B',
  bytes: 977184032,
  sha256: '2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8',
  delivery: 'play-install-time',
  assetPath: 'qwen/model.litertlm',
});
export function explanationRequest(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw Error('Use uma consulta menor para a explicação local.');
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
  try { selection = typeof text === 'string' && text.length <= 1000 ? JSON.parse(text).trechos : null; } catch {}
  if (!Array.isArray(selection) || !selection.length || selection.length > 6 || selection.some(i => !Number.isInteger(i) || i < 0 || i >= passages.length) || new Set(selection).size !== selection.length) throw Error('O resumo não passou na conferência. A resposta calculada pelo app permanece acima.');
  // Retain context, every monetary statement and all caveats. Selection can
  // shorten other observations, but cannot hide costs/limits or rename values.
  const required = passages.flatMap((line, i) => i === 0 || /R\$|custo|parcial|incomplet|insuficient|não |nao |ausen|limita|hipótes|antes de|sem /i.test(line) ? [i] : []);
  return [...new Set([...selection, ...required])].sort((a,b) => a-b).map(i => passages[i]).join('\n\n');
}
export function createLocalIntelligence(provider) {
  let epoch = 0;
  return {
    status: () => provider.status({}),
    installModel: () => provider.installModel({}),
    removeModel: () => provider.removeModel({}),
    setEnabled: enabled => provider.setEnabled({ enabled }),
    cancel: () => { epoch++; return provider.cancel({}).catch(() => {}); },
    async explain(text) {
      const request = explanationRequest(text), token = ++epoch;
      const result = await provider.explain(request);
      if (token !== epoch) throw Error('Consulta cancelada.');
      return validateExplanation(result.text, text);
    },
  };
}
