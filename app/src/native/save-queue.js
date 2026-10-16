// Fila de gravação: a última versão dos dados vai para o disco, uma escrita por vez.
// Separada do Capacitor para poder ser testada (tests/save-queue.test.mjs).
//   save(json)  → coloca na fila e começa a gravar; devolve true (o dado está na fila, ainda não no disco)
//   durable()   → Promise<boolean>: true quando tudo o que estava na fila chegou ao disco; false se falhou
//   settle()    → espera a fila esvaziar (ao ir para segundo plano)
//   status()    → { pending, failed }: há dado ainda não gravado? a última escrita falhou?
// Se a escrita falha, o dado continua na fila e o app tenta de novo sozinho (retryMs).
export function createSaveQueue({ write, onSaved = () => {}, onError = () => {}, onRecovered = () => {}, retryMs = 5000, setTimer = setTimeout }) {
  let pending = null;
  let writing = null;
  let failed = false;
  let retry = null;
  let waiters = [];

  const finish = ok => { const list = waiters; waiters = []; list.forEach(resolve => resolve(ok)); };
  // Start on the next microtask. A synchronous write error must not leave `writing` pointing
  // to an already-finished promise after flush has cleared it in its catch handler.
  const start = () => { writing = Promise.resolve().then(flush); };

  async function flush() {
    while (pending !== null) {
      const json = pending;
      pending = null;
      try {
        await write(json);
        if (failed) { failed = false; onRecovered(); }
      } catch (error) {
        if (pending === null) pending = json;
        failed = true;
        writing = null;
        onError(error);
        finish(false);
        if (retry === null) retry = setTimer(() => { retry = null; if (!writing && pending !== null) start(); }, retryMs);
        return;
      }
    }
    writing = null;
    finish(true);
  }

  return {
    save(json) {
      pending = json;
      if (!writing) start();
      onSaved();
      return true;
    },
    durable() {
      if (!writing && pending === null) return Promise.resolve(!failed);
      return new Promise(resolve => waiters.push(resolve));
    },
    async settle() {
      while (writing) await writing;
      if (pending !== null) { start(); await writing; }
      return !failed && pending === null;
    },
    status: () => ({ pending: pending !== null || !!writing, failed }),
  };
}
