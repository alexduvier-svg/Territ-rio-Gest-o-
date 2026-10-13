// Automatic backups. The app encrypts everything on the phone (AES-GCM, key derived from the
// producer's recovery code); this server only ever stores ciphertext it cannot read.
//
//   PUT    /api/backups/:id           body: encrypted bytes → {savedAt, sha256, size}
//   GET    /api/backups/:id           encrypted bytes (?version=previous for yesterday's copy)
//   GET    /api/backups/:id/status    {savedAt, sha256, size}
//   DELETE /api/backups/:id
//
// :id and the bearer token are both derived from the recovery code, so the code alone restores a
// backup on a new phone. The first PUT for an id claims it. One previous copy is kept per day.
// KV: bmeta:<id> {tokenHash, createdAt, day} · bak:<id> (metadata {savedAt, sha256, size}) · bak:<id>:prev

export const BACKUP_MAX_BYTES = 20_000_000;
export const BACKUP_ROUTE = /^\/api\/backups\/([0-9a-f]{32})(\/status)?$/;
const MAGIC = 'TGB1';

const hex = buffer => [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async data => hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? new TextEncoder().encode(data) : data));
const today = () => new Date().toISOString().slice(0, 10);

function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

export async function handleBackup(request, env, id, isStatus) {
  const store = env.BACKUPS;
  const meta = await store.get('bmeta:' + id, 'json');
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const tokenHash = token ? await sha256(token) : '';
  const authorized = meta && tokenHash && meta.tokenHash === tokenHash;

  if (request.method === 'PUT' && !isStatus) {
    if (meta && !authorized) return reply({ error: 'Sem permissão para este backup.' }, 401);
    if (!tokenHash) return reply({ error: 'Sem permissão para este backup.' }, 401);
    if (Number(request.headers.get('content-length') || 0) > BACKUP_MAX_BYTES) return reply({ error: 'Backup grande demais (máx. 20 MB).' }, 413);
    const bytes = new Uint8Array(await request.arrayBuffer());
    if (bytes.length > BACKUP_MAX_BYTES) return reply({ error: 'Backup grande demais (máx. 20 MB).' }, 413);
    if (bytes.length < 32 || String.fromCharCode(...bytes.slice(0, 4)) !== MAGIC) return reply({ error: 'Formato de backup inválido.' }, 400);

    const day = today();
    if (meta && meta.day !== day) {
      // First copy of the day: keep yesterday's as the previous version.
      const current = await store.getWithMetadata('bak:' + id, { type: 'arrayBuffer' });
      if (current.value) await store.put('bak:' + id + ':prev', current.value, { metadata: current.metadata });
    }
    const savedAt = new Date().toISOString();
    const info = { savedAt, sha256: await sha256(bytes), size: bytes.length };
    await store.put('bak:' + id, bytes, { metadata: info });
    if (!meta || meta.day !== day) await store.put('bmeta:' + id, JSON.stringify({ tokenHash, createdAt: meta?.createdAt || savedAt, day }));
    return reply(info);
  }

  if (!authorized) return reply({ error: meta ? 'Sem permissão para este backup.' : 'Backup não encontrado.' }, meta ? 401 : 404);

  if (request.method === 'GET' && isStatus) {
    const { value, metadata } = await store.getWithMetadata('bak:' + id, { type: 'stream' });
    if (!value) return reply({ error: 'Backup não encontrado.' }, 404);
    await value.cancel();
    return reply(metadata);
  }
  if (request.method === 'GET') {
    const previous = new URL(request.url).searchParams.get('version') === 'previous';
    const { value, metadata } = await store.getWithMetadata('bak:' + id + (previous ? ':prev' : ''), { type: 'stream' });
    if (!value) return reply({ error: 'Backup não encontrado.' }, 404);
    return new Response(value, {
      headers: { 'content-type': 'application/octet-stream', 'x-saved-at': metadata?.savedAt || '', 'x-sha256': metadata?.sha256 || '', 'cache-control': 'no-store' },
    });
  }
  if (request.method === 'DELETE' && !isStatus) {
    await Promise.all(['bak:' + id, 'bak:' + id + ':prev', 'bmeta:' + id].map(key => store.delete(key)));
    return new Response(null, { status: 204 });
  }
  return reply({ error: 'Método não permitido.' }, 405);
}
