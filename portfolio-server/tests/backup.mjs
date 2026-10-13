// End-to-end check of encrypted backups against a running worker (BASE=… for a deployed one).
// Uses the app's own crypto module, so what the phone encrypts is exactly what is tested here.
import assert from 'node:assert/strict';
import { newRecoveryCode, formatRecoveryCode, normalizeRecoveryCode, deriveBackupKeys, encryptBackup, decryptBackup, sha256Hex, RecoveryCodeError } from '../../app/src/features/backup-crypto.js';

const BASE = process.env.BASE || 'http://127.0.0.1:8787';
let passed = 0;
async function step(name, fn) {
  await fn();
  passed++;
  console.log('✓', name);
}

const code = newRecoveryCode();
const keys = await deriveBackupKeys(code);
const auth = { authorization: 'Bearer ' + keys.token };
const data = JSON.stringify({ schema: 1, clients: [{ name: 'Ana Oliveira', phone: '32999990000' }], sales: [], note: 'á é í ó ú ç' });
const url = `${BASE}/api/backups/${keys.id}`;

await step('código de recuperação: formato e leitura tolerante', async () => {
  assert.match(code, /^([0-9A-HJKMNP-TV-Z]{4}-){7}[0-9A-HJKMNP-TV-Z]{4}$/);
  const typed = code.toLowerCase().replace(/-/g, ' ').replace(/0/g, 'o').replace(/1/g, 'l');
  assert.equal(formatRecoveryCode(typed), code);
  assert.throws(() => normalizeRecoveryCode('ABCD-1234'), RecoveryCodeError);
  assert.equal((await deriveBackupKeys(typed)).id, keys.id);
});

await step('cifra e decifra no aparelho; servidor não vê texto', async () => {
  const sealed = await encryptBackup(data, keys);
  assert.ok(!new TextDecoder().decode(sealed).includes('Ana Oliveira'));
  assert.equal(await decryptBackup(sealed, keys), data);
  const other = await deriveBackupKeys(newRecoveryCode());
  await assert.rejects(decryptBackup(sealed, { ...other, id: keys.id }), RecoveryCodeError);
});

let first;
await step('envia e o servidor confirma a mesma impressão digital', async () => {
  const sealed = await encryptBackup(data, keys);
  const res = await fetch(url, { method: 'PUT', headers: auth, body: sealed });
  assert.equal(res.status, 200, await res.clone().text());
  first = await res.json();
  assert.equal(first.sha256, await sha256Hex(sealed));
  assert.equal(first.size, sealed.length);
});

await step('status e download com o token certo', async () => {
  const status = await (await fetch(url + '/status', { headers: auth })).json();
  assert.equal(status.sha256, first.sha256);
  const res = await fetch(url, { headers: auth });
  assert.equal(res.headers.get('x-sha256'), first.sha256);
  assert.equal(await decryptBackup(new Uint8Array(await res.arrayBuffer()), keys), data);
});

await step('recusa token errado e conteúdo fora do formato', async () => {
  const wrong = { authorization: 'Bearer outro-token' };
  assert.equal((await fetch(url, { headers: wrong })).status, 401);
  assert.equal((await fetch(url, { method: 'PUT', headers: wrong, body: await encryptBackup(data, keys) })).status, 401);
  assert.equal((await fetch(url, { method: 'PUT', headers: auth, body: new TextEncoder().encode('{"texto":"aberto"}') })).status, 400);
});

await step('nova cópia substitui a anterior', async () => {
  const changed = data.replace('Ana', 'Ana Paula');
  const res = await (await fetch(url, { method: 'PUT', headers: auth, body: await encryptBackup(changed, keys) })).json();
  const back = await fetch(url, { headers: auth });
  assert.equal(back.headers.get('x-sha256'), res.sha256);
  assert.equal(await decryptBackup(new Uint8Array(await back.arrayBuffer()), keys), changed);
});

await step('apaga', async () => {
  assert.equal((await fetch(url, { method: 'DELETE', headers: auth })).status, 204);
  assert.equal((await fetch(url + '/status', { headers: auth })).status, 404);
});

console.log(`\n${passed} verificações de backup passaram.`);
