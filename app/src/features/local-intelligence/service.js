// The model explains an already calculated answer. It has no tools or business write access.
export const LOCAL_MODEL = Object.freeze({
  id: 'Qwen3-1.7B',
  bytes: 977184032,
  sha256: '2a72330b504a6596d53a2c00923c57173b10f1b83e6a541213ffec08d1fc5de8',
  url: 'https://huggingface.co/litert-community/Qwen3-1.7B/resolve/d6678881da6181864bbc893c80e10aa1ee0d3731/Qwen3-1.7B_dynamic_wi4b32_afp32.litertlm?download=true',
});
export function explanationRequest(text) {
  if (typeof text !== 'string' || !text.trim() || text.length > 4000) throw Error('Use uma consulta menor para a explicação local.');
  return Object.freeze({ facts: text });
}
const numbers = text => [...text.matchAll(/\d+(?:[.,]\d+)*/g)].map(m => m[0]);
export function validateExplanation(text, facts) {
  if (typeof text !== 'string' || text.trim().length < 8 || text.length > 4000) throw Error('A explicação não ficou disponível. Consulte os registros abaixo.');
  const allowed = new Set(numbers(facts));
  if (numbers(text).some(n => !allowed.has(n))) throw Error('A explicação trouxe números diferentes dos registros e foi descartada.');
  if (/https?:|<\/?[a-z]|<\|/i.test(text)) throw Error('A explicação não passou na conferência. Consulte o cálculo original.');
  return text.trim();
}
export function createLocalIntelligence(provider) {
  let epoch = 0;
  return {
    status: () => provider.status({}),
    importModel: () => provider.importModel({}),
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
