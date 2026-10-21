// Durable storage for the business data on Android.
//
// The WebView's localStorage can be wiped by the system and caps out around 5 MB, so on a device the
// data lives in the app's private files directory instead (also covered by Android Auto Backup):
//
//   territorio/data-a.json, data-b.json   two alternating slots; a crash mid-write only ever damages
//                                         the slot being written, never the last good copy
//   territorio/backups/AAAA-MM-DD.json    first save of each day, last 14 days kept
//
// Each slot is a one-line header followed by the JSON the app produced:
//   {"seq":42,"savedAt":"2026-10-13T12:00:00.000Z","length":12345,"checksum":"..."}\n{...}
// Length detects truncation; the checksum also detects same-length damage. Older headers without
// a checksum remain readable. A write is confirmed only after reading the slot back intact.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { createSaveQueue } from './save-queue.js';

const DIR = 'territorio';
const SLOTS = ['data-a.json', 'data-b.json'];
const BACKUP_DIR = DIR + '/backups';
const BACKUPS_KEPT = 14;
const LEGACY_KEY = 'territorio-gestao-prototipo-v1';

const isNative = Capacitor.isNativePlatform();
let seq = 0;
let lastBackupDay = '';

const fileOptions = path => ({ path, directory: Directory.Data, encoding: Encoding.UTF8 });
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });

function checksum(json) {
  // FNV-1a over JS code units: corruption detection, independent of platform encodings.
  let value = 2166136261;
  for (let i = 0; i < json.length; i++) value = Math.imul(value ^ json.charCodeAt(i), 16777619);
  return (value >>> 0).toString(16).padStart(8, '0');
}

function validData(json) {
  try {
    const data = JSON.parse(json);
    return data?.schema === 1 && ['products', 'sales', 'clients', 'events', 'movements', 'expenses'].every(key => Array.isArray(data[key]));
  } catch { return false; }
}

async function readSlot(name) {
  try {
    const { data } = await Filesystem.readFile(fileOptions(DIR + '/' + name));
    const newline = data.indexOf('\n');
    if (newline < 0) return null;
    const header = JSON.parse(data.slice(0, newline));
    const json = data.slice(newline + 1);
    if (!Number.isSafeInteger(header.seq) || header.seq < 0 || json.length !== header.length) return null;
    if (header.checksum != null && header.checksum !== checksum(json)) return null;
    if (!validData(json)) return null;
    return { seq: header.seq, json };
  } catch {
    return null;
  }
}

async function readNewestBackup() {
  try {
    const { files } = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Data });
    const names = files.map(f => f.name).filter(n => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().reverse();
    for (const name of names) {
      try {
        const { data } = await Filesystem.readFile(fileOptions(BACKUP_DIR + '/' + name));
        if (validData(data)) return data;
      } catch { /* try the previous day */ }
    }
  } catch { /* no backups yet */ }
  return null;
}

function dayKey(date) {
  const parts = dayFormatter.formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type).value).join('-');
}

async function writeDailyBackup(json, now) {
  const day = dayKey(now);
  if (day === lastBackupDay) return;
  const path = BACKUP_DIR + '/' + day + '.json';
  let exists = false;
  try {
    const current = await Filesystem.readFile(fileOptions(path));
    exists = validData(current.data);
  } catch { /* first save today, or an interrupted backup */ }
  // Preserve the first valid snapshot of the day even after an app restart/update.
  if (!exists) {
    await Filesystem.writeFile({ ...fileOptions(path), data: json, recursive: true });
    const verified = await Filesystem.readFile(fileOptions(path));
    if (verified.data !== json) throw new Error('A cópia diária não conferiu.');
  }
  lastBackupDay = day;
  const { files } = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Data });
  const old = files.map(f => f.name).filter(n => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().slice(0, -BACKUPS_KEPT);
  await Promise.all(old.map(name => Filesystem.deleteFile({ path: BACKUP_DIR + '/' + name, directory: Directory.Data })));
}

// Cada gravação vai para o slot seguinte (A/B alternados) e, uma vez por dia, para o backup diário.
async function writeData(json) {
  if (!validData(json)) throw new Error('Dados inválidos para gravação. A cópia anterior foi preservada.');
  const now = new Date();
  const next = seq + 1;
  const name = SLOTS[next % 2];
  const header = JSON.stringify({ seq: next, savedAt: now.toISOString(), length: json.length, checksum: checksum(json) });
  await Filesystem.writeFile({ ...fileOptions(DIR + '/' + name), data: header + '\n' + json, recursive: true });
  const verified = await readSlot(name);
  if (verified?.seq !== next || verified.json !== json) throw new Error('A gravação no aparelho não conferiu. Vamos tentar novamente.');
  seq = next;
  await writeDailyBackup(json, now).catch(error => console.warn('Backup diário não gravado', error));
}

const queue = createSaveQueue({
  write: writeData,
  onSaved: () => window.dispatchEvent(new Event('territorio:saved')),
  onError: error => { console.error('Falha ao gravar dados', error); window.dispatchEvent(new CustomEvent('territorio:storage-error')); },
  onRecovered: () => window.dispatchEvent(new Event('territorio:storage-ok')),
});
const save = json => queue.save(json);


// A small command journal shares this adapter, not the authoritative business snapshot.
// A stale journal is reconciled by operationId against the durable sales before any UI restoration.
const RECOVERY_SLOTS=['recovery-a.json','recovery-b.json'];let recoverySeq=0;
async function readRecoverySlot(name){try{const {data}=await Filesystem.readFile(fileOptions(DIR+'/'+name)),at=data.indexOf('\n');if(at<0)return null;const h=JSON.parse(data.slice(0,at)),json=data.slice(at+1),record=JSON.parse(json);if(!Number.isSafeInteger(h.seq)||h.seq<0||h.length!==json.length||h.checksum!==checksum(json)||record.version!==1)return null;return{seq:h.seq,json,record};}catch{return null;}}
async function loadRecovery(){const rows=(await Promise.all(RECOVERY_SLOTS.map(readRecoverySlot))).filter(Boolean).sort((a,b)=>b.seq-a.seq);if(rows[0]){recoverySeq=rows[0].seq;return rows[0].record;}return null;}
async function writeRecovery(json){const record=JSON.parse(json);if(record.version!==1||new TextEncoder().encode(json).length>128*1024)throw Error('Rascunho inválido.');const next=recoverySeq+1,name=RECOVERY_SLOTS[next%2],header=JSON.stringify({seq:next,length:json.length,checksum:checksum(json)});await Filesystem.writeFile({...fileOptions(DIR+'/'+name),data:header+'\n'+json,recursive:true});const verified=await readRecoverySlot(name);if(verified?.seq!==next||verified.json!==json)throw Error('O rascunho não conferiu.');recoverySeq=next;}
const recoveryQueue=createSaveQueue({write:writeRecovery,onError:()=>window.dispatchEvent(new Event('territorio:recovery-error'))});

// Resolves once every queued save has reached the disk (used when the app goes to background).
export const settle = async () => { const results=await Promise.all([queue.settle(),recoveryQueue.settle()]);return results.every(Boolean); };

// Must finish before the UI script runs: it reads `initialJSON` synchronously on start-up.
export async function initStorage() {
  if (!isNative) {
    window.TerritorioNative = { isNative: false };
    return;
  }
  const slots = (await Promise.all(SLOTS.map(readSlot))).filter(Boolean);
  const newest = slots.sort((a, b) => b.seq - a.seq)[0];
  let initialJSON = null;
  if (newest) {
    seq = newest.seq;
    initialJSON = newest.json;
  } else {
    // Both slots unreadable: fall back to the newest daily backup, then to data from a
    // build that still used localStorage. Only start from the demo data if nothing exists.
    initialJSON = await readNewestBackup();
    if (!initialJSON) {
      try { const legacy = localStorage.getItem(LEGACY_KEY); if (validData(legacy)) initialJSON = legacy; }
      catch { /* WebView storage unavailable: do not copy invalid data into the native files. */ }
    }
    if (initialJSON) save(initialJSON);
  }
  const initialRecord=await loadRecovery();
  window.TerritorioNative = { isNative: true, initialJSON, save, durable: () => queue.durable(), status: () => queue.status(), recovery:{initialRecord,save:json=>recoveryQueue.save(json),durable:()=>recoveryQueue.durable(),status:()=>recoveryQueue.status()} };
}
