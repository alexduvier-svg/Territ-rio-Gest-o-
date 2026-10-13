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
//   {"seq":42,"savedAt":"2026-10-13T12:00:00.000Z","length":12345}\n{...}
// `length` lets a truncated write be detected without trusting the payload.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const DIR = 'territorio';
const SLOTS = ['data-a.json', 'data-b.json'];
const BACKUP_DIR = DIR + '/backups';
const BACKUPS_KEPT = 14;
const LEGACY_KEY = 'territorio-gestao-prototipo-v1';

const isNative = Capacitor.isNativePlatform();
let seq = 0;
let pending = null;
let writing = null;
let lastBackupDay = '';

const fileOptions = path => ({ path, directory: Directory.Data, encoding: Encoding.UTF8 });

async function readSlot(name) {
  try {
    const { data } = await Filesystem.readFile(fileOptions(DIR + '/' + name));
    const newline = data.indexOf('\n');
    const header = JSON.parse(data.slice(0, newline));
    const json = data.slice(newline + 1);
    if (!Number.isInteger(header.seq) || json.length !== header.length) return null;
    const parsed = JSON.parse(json);
    if (!parsed || parsed.schema !== 1) return null;
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
        if (JSON.parse(data)?.schema === 1) return data;
      } catch { /* try the previous day */ }
    }
  } catch { /* no backups yet */ }
  return null;
}

function dayKey(date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date);
}

async function writeDailyBackup(json, now) {
  const day = dayKey(now);
  if (day === lastBackupDay) return;
  await Filesystem.writeFile({ ...fileOptions(BACKUP_DIR + '/' + day + '.json'), data: json, recursive: true });
  lastBackupDay = day;
  const { files } = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Data });
  const old = files.map(f => f.name).filter(n => /^\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort().slice(0, -BACKUPS_KEPT);
  await Promise.all(old.map(name => Filesystem.deleteFile({ path: BACKUP_DIR + '/' + name, directory: Directory.Data })));
}

async function flush() {
  while (pending !== null) {
    const json = pending;
    pending = null;
    const now = new Date();
    const next = seq + 1;
    const header = JSON.stringify({ seq: next, savedAt: now.toISOString(), length: json.length });
    try {
      await Filesystem.writeFile({ ...fileOptions(DIR + '/' + SLOTS[next % 2]), data: header + '\n' + json, recursive: true });
      seq = next;
      await writeDailyBackup(json, now).catch(error => console.warn('Backup diário não gravado', error));
    } catch (error) {
      console.error('Falha ao gravar dados', error);
      // Keep the newest data queued so the next save (or app pause) retries it.
      if (pending === null) pending = json;
      window.dispatchEvent(new CustomEvent('territorio:storage-error'));
      break;
    }
  }
  writing = null;
}

function save(json) {
  pending = json;
  if (!writing) writing = flush();
  return true;
}

// Resolves once every queued save has reached the disk (used when the app goes to background).
export async function settle() {
  while (writing) await writing;
  if (pending !== null) {
    writing = flush();
    await writing;
  }
}

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
    initialJSON = (await readNewestBackup()) || localStorage.getItem(LEGACY_KEY);
    if (initialJSON) save(initialJSON);
  }
  window.TerritorioNative = { isNative: true, initialJSON, save };
}
