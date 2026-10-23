// Automatic encrypted backup + weekly reminder. The UI lives in src/legacy (Dados → Backup).
//
// Automatic: every 30 s the app compares a hash of the business data with the last copy sent. After a
// change settles (1 min) it encrypts on the phone and uploads, at most every 10 min — or right away
// when the app goes to the background or the producer taps "Enviar agora". The server answers with the
// SHA-256 of what it stored; the copy only counts as verified when that matches what was sent. Once a
// day the app re-checks that the copy is still there.
//
// Reminder: if no backup (file or automatic) in 7 days, ask once a day, never during a sale.
import { API, AuthError, NetworkError, request as api } from './server.js';
import { newRecoveryCode, formatRecoveryCode, deriveBackupKeys, encryptBackup, decryptBackup, sha256Hex } from './backup-crypto.js';

const SETTLE = 60 * 1000;
const MIN_INTERVAL = 10 * 60 * 1000;
const CHECK_EVERY = 24 * 3600 * 1000;
const REMIND_AFTER = 7 * 24 * 3600 * 1000;
const REMIND_AGAIN = 24 * 3600 * 1000;

const shell = () => window.TerritorioShell;
let busy = false;
let pending = { hash: null, since: 0 };
let lastUpload = 0;
let lastCheck = 0;

async function upload(state, json, hash) {
  const keys = await deriveBackupKeys(state.secret);
  const sealed = await encryptBackup(json, keys);
  const local = await sha256Hex(sealed);
  const saved = await api(`/api/backups/${keys.id}`, { method: 'PUT', token: keys.token, body: sealed });
  if (saved.sha256 !== local) throw new Error('A cópia enviada não conferiu. Vamos tentar de novo.');
  lastUpload = Date.now();
  lastCheck = Date.now();
  shell().setBackupState({ savedAt: saved.savedAt, verifiedAt: saved.savedAt, sha256: saved.sha256, size: saved.size, sourceHash: hash, error: '', waiting: false });
}

// Confirms once a day that the last copy is still on the server, byte for byte.
async function verify(state) {
  if (!state.sha256 || Date.now() - lastCheck < CHECK_EVERY) return;
  lastCheck = Date.now();
  const keys = await deriveBackupKeys(state.secret);
  try {
    const status = await api(`/api/backups/${keys.id}/status`, { method: 'GET', token: keys.token });
    if (status.sha256 === state.sha256) shell().setBackupState({ verifiedAt: new Date().toISOString() });
    else shell().setBackupState({ sourceHash: '' });
  } catch (error) {
    if (error.status === 404) shell().setBackupState({ sourceHash: '' });
    else lastCheck = 0;
  }
}

async function sync({ force = false, urgent = false } = {}) {
  const state = shell()?.backupState?.();
  if (!API || !state?.enabled || !state.secret || busy) return;
  const json = shell().backupSource();
  const hash = await sha256Hex(json);
  if (hash === state.sourceHash && !force) {
    pending = { hash: null, since: 0 };
    return verify(state).catch(() => {});
  }
  if (!force && !urgent) {
    if (pending.hash !== hash) {
      pending = { hash, since: Date.now() };
      shell().refreshBackup();
      return;
    }
    if (Date.now() - pending.since < SETTLE || Date.now() - lastUpload < MIN_INTERVAL) return;
  }
  if (navigator.onLine === false) {
    if (!state.waiting) shell().setBackupState({ waiting: true });
    return;
  }
  busy = true;
  shell().refreshBackup();
  try {
    await upload(state, json, hash);
    pending = { hash: null, since: 0 };
  } catch (error) {
    shell().setBackupState(error instanceof NetworkError ? { waiting: true } : { error: error.message, waiting: false });
  } finally {
    busy = false;
    shell().refreshBackup();
  }
}

async function fetchRestore(code) {
  const formatted = formatRecoveryCode(code);
  const keys = await deriveBackupKeys(formatted);
  let response;
  try {
    response = await api(`/api/backups/${keys.id}`, { method: 'GET', token: keys.token, raw: true });
  } catch (error) {
    if (error.status === 404 || error instanceof AuthError) throw new Error('Nenhum backup encontrado para este código.');
    throw error;
  }
  const sealed = new Uint8Array(await response.arrayBuffer());
  const json = await decryptBackup(sealed, keys);
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('A cópia está danificada.');
  }
  return { data, code: formatted, savedAt: response.headers.get('x-saved-at') || '', sha256: response.headers.get('x-sha256') || '' };
}

async function deleteRemote(code) {
  const keys = await deriveBackupKeys(code);
  await api(`/api/backups/${keys.id}`, { method: 'DELETE', token: keys.token }).catch(error => {
    if (error.status !== 404) throw error;
  });
}

function remind() {
  const s = shell();
  if (!s?.backupReminder || document.hidden) return;
  const r = s.backupReminder();
  if (!r.enabled) return;
  // Offer protection after onboarding, without enabling uploads or changing Google's device setting.
  if(r.ready && !r.lastBackupAt && !r.askedAt && s.idle())return s.askBackup('');
  // Never backed up: count from the first day the app was used.
  const last = r.lastBackupAt ? Date.parse(r.lastBackupAt) : Date.parse(r.firstUseAt) || Date.now();
  if (Date.now() - last < REMIND_AFTER || Date.now() - (Date.parse(r.askedAt) || 0) < REMIND_AGAIN) return;
  if (s.idle()) s.askBackup(r.lastBackupAt);
}

setInterval(() => {sync();remind();}, 30 * 1000);
setInterval(remind, 15 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) return;
  sync();
  setTimeout(remind, 2000);
});
// The phone may kill the app in the background: send pending changes right away.
window.addEventListener('territorio:pause', () => sync({ urgent: true }));
window.addEventListener('online', () => sync({ urgent: true }));
setTimeout(() => sync(), 4000);
setTimeout(remind, 8000);

window.TerritorioBackup = {
  available: !!API,
  busy: () => busy,
  pendingChanges: () => !!pending.hash,
  newCode: newRecoveryCode,
  syncNow: () => sync({ force: true }),
  fetchRestore,
  deleteRemote,
};
