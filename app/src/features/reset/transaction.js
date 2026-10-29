// Replacing the producer's model must be durable before the UI announces success.
// The previous object remains recoverable if either persistence layer refuses the write.
export async function replaceData({ get, set, save, durable = async () => true }, expected, next) {
  if (get() !== expected) return false;
  set(next);
  try {
    if (save() !== true || await durable() !== true) throw Error('Gravação não confirmada');
    if (get() !== next) return false;
    return true;
  } catch {
    if (get() === next) {
      set(expected);
      try { if (save() === true) await durable(); } catch { /* callers must not claim success */ }
    }
    return false;
  }
}
