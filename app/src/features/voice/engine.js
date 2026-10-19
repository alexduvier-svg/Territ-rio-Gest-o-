// Controlador de voz: um ponto só para disponibilidade, permissão, estado da escuta e motor.
// No celular usa o plugin nativo "Voice" (reconhecimento local do Android ou Vosk offline, uma
// escuta por vez). No navegador de desenvolvimento usa a Web Speech API quando existir.
// A interface nunca fala com um fornecedor de reconhecimento diretamente.

import { Capacitor, registerPlugin } from '@capacitor/core';

const Native = Capacitor.isNativePlatform() ? registerPlugin('Voice') : null;
const WebRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;

export function createVoiceController(handlers) {
  const emit = (name, ...args) => handlers[name]?.(...args);
  let web = null, listening = false, finished = false;

  if (Native) {
    Native.addListener('voice', event => {
      if (event.type === 'state') {
        if (event.state === 'idle') listening = false;
        emit('onState', event.state, event.engine);
      } else if (event.type === 'partial') emit('onPartial', event.text || '');
      else if (event.type === 'final') { listening = false; emit('onFinal', event.text || '', event.alternatives || [], event.engine); }
      else if (event.type === 'level') emit('onLevel', Number(event.level) || 0);
      else if (event.type === 'error') { listening = false; emit('onError', event.code || 'engine', event.message || 'A voz falhou.'); }
      else if (event.type === 'engine') emit('onEngine', event.engine, event.reason);
    });
  }

  return {
    available: () => !!Native || !!WebRecognition,
    native: !!Native,
    isListening: () => listening,
    async capabilities() {
      if (Native) return Native.getCapabilities();
      return { web: !!WebRecognition };
    },
    /** Prepara o modelo offline em segundo plano (cópia dos assets na primeira abertura). */
    async prepare() {
      if (!Native) return;
      try { await Native.prepareModel(); } catch { /* o motor do Android pode atender; o erro aparece se faltar os dois */ }
    },
    /** vocabulary: palavras possíveis (catálogo, números, medidas) para orientar o motor offline. */
    async start(vocabulary) {
      if (listening) return;
      listening = true; finished = false;
      if (Native) {
        try { await Native.startListening({ engine: 'auto', grammar: vocabulary || [] }); }
        catch (error) {
          listening = false;
          emit('onError', error?.code || 'engine', error?.message || 'A voz não começou.');
        }
        return;
      }
      if (!WebRecognition) { listening = false; emit('onError', 'unsupported', 'Voz indisponível aqui. Digite o produto.'); return; }
      web = new WebRecognition();
      web.lang = 'pt-BR';
      web.interimResults = true;
      web.maxAlternatives = 3;
      web.onstart = () => emit('onState', 'listening', 'web');
      web.onspeechstart = () => emit('onState', 'speaking', 'web');
      web.onresult = event => {
        const result = event.results[event.results.length - 1];
        const text = result[0]?.transcript || '';
        if (result.isFinal) { finished = true; listening = false; emit('onFinal', text, [...result].map(a => a.transcript), 'web'); }
        else emit('onPartial', text);
      };
      web.onerror = event => { listening = false; emit('onError', event.error === 'not-allowed' ? 'permission-denied' : event.error === 'no-speech' ? 'silence' : 'engine', event.error === 'not-allowed' ? 'Permita o microfone para vender por voz.' : 'Não ouvi bem. Tente de novo.'); };
      web.onend = () => { if (listening && !finished) { listening = false; emit('onFinal', '', [], 'web'); } emit('onState', 'idle', 'web'); web = null; };
      web.start();
    },
    async stop() {
      if (Native) await Native.stopListening();
      else web?.stop();
    },
    async cancel() {
      listening = false;
      if (Native) await Native.cancel();
      else { web?.abort(); web = null; }
      emit('onState', 'idle', Native ? 'native' : 'web');
    },
  };
}
