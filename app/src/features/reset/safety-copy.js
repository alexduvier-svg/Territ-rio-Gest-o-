// Cópia de segurança antes de zerar os dados (Ajustes › Zerar dados). Fica só neste aparelho, na área
// privada do app (no navegador, no armazenamento local), sem envio. Pode-se zerar várias vezes: a
// PRIMEIRA cópia (os dados de antes do primeiro teste) fica guardada para sempre, e das seguintes
// ficam as 3 mais recentes. Dados vazios não geram cópia, para não empurrar as boas para fora.
// Não substitui o backup em arquivo: tudo some se o app for desinstalado.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

const FOLDER = 'copias-antes-de-zerar', KEEP = 3, WEB_KEY = 'territorio-copias-antes-de-zerar';
const ORIGINAL = 'original-', RECENT = 'recente-';
const native = () => Capacitor.isNativePlatform();
const stamp = when => when.toISOString().replace(/[:.]/g, '-');
const whenOf = name => { const m = name.match(/(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/); return m ? new Date(`${m[1]}T${m[2]}:${m[3]}:${m[4]}.${m[5]}Z`) : null; };
const webList = () => { const rows=JSON.parse(localStorage.getItem(WEB_KEY) || '[]'); if(!Array.isArray(rows)||rows.some(r=>!r||typeof r.name!=='string'||typeof r.json!=='string'))throw Error('Índice de cópias inválido');return rows; };

async function names() {
  if (!native()) return webList().map(c => c.name).sort();
  try { return (await Filesystem.readdir({ path: FOLDER, directory: Directory.Data })).files.map(f => f.name).filter(n => n.endsWith('.json')).sort(); }
  catch(e) { if (/ENOENT|does not exist|not found|No such file/i.test(String(e?.message||e)))return [];throw e; }
}
async function read(name) {
  if (!native()) return webList().find(c => c.name === name)?.json ?? null;
  return (await Filesystem.readFile({ path: FOLDER + '/' + name, directory: Directory.Data, encoding: Encoding.UTF8 })).data;
}

/** Sem produtos, vendas, clientes, eventos nem custos: nada a proteger. */
export function isEmptyData(data) {
  if (['products','sales','clients','events','expenses','movements','eventLoads','contacts','stockLots','lotMovements','onlineShopArchives'].some(k=>Array.isArray(data?.[k])&&data[k].length))return false;
  if (['suppliers','comparisons','purchases'].some(k=>data?.supplierBook?.[k]?.length)||data?.onlineShop?.orders?.length||data?.municipalCalendar?.dates?.length)return false;
  if(Object.values(data?.localCommerce?.actors||{}).some(a=>a.orders?.length))return false;
  const s=data?.settings||{};
  return !['businessName','producerName','phone','email','photo','location'].some(k=>s[k])&&!s.finance?.fixedCosts?.length;
}

/**
 * Grava a cópia e confere a gravação. Devolve 'saved', 'skipped' (dados vazios) ou 'failed';
 * em 'failed' nada deve ser apagado.
 */
async function writeCopy(json) {
  let data; try { data = JSON.parse(json); } catch { return 'failed'; }
  if (isEmptyData(data)) return 'skipped';
  try {
    // The queue serializes saves; timestamps must also be strictly ordered. UUIDs alone
    // made same-millisecond backups sort randomly when loading or pruning the latest copy.
    const all = await names(), nextTime = all.reduce((time, n) => Math.max(time, (whenOf(n)?.getTime() || 0) + 1), Date.now());
    const name = (all.some(n => n.startsWith(ORIGINAL)) ? RECENT : ORIGINAL) + 'agro-gestao-' + stamp(new Date(nextTime)) + '-' + crypto.randomUUID() + '.json';
    if (!native()) {
      const list = webList().concat({ name, json });
      const original = list.filter(c => c.name.startsWith(ORIGINAL)), recent = list.filter(c => c.name.startsWith(RECENT)).slice(-KEEP);
      localStorage.setItem(WEB_KEY, JSON.stringify([...original, ...recent]));
      return webList().some(c => c.name === name && c.json === json) ? 'saved' : 'failed';
    }
    await Filesystem.writeFile({ path: FOLDER + '/' + name, directory: Directory.Data, data: json, encoding: Encoding.UTF8, recursive: true });
    if ((await read(name)) !== json) return 'failed';
    const old = (await names()).filter(n => n.startsWith(RECENT)).slice(0, -KEEP);
    for (const n of old) await Filesystem.deleteFile({ path: FOLDER + '/' + n, directory: Directory.Data }).catch(() => {});
    return 'saved';
  } catch { return 'failed'; }
}
let pending=Promise.resolve();
export function save(json){const job=pending.then(()=>writeCopy(json));pending=job.catch(()=>'failed');return job;}

/** Datas das cópias disponíveis: { original: Date|null, latest: Date|null } (latest = recente mais nova). */
export async function dates() {
  const all = await names(), original = all.find(n => n.startsWith(ORIGINAL)), latest = all.filter(n => n.startsWith(RECENT)).at(-1);
  return { original: original ? whenOf(original) : null, latest: latest ? whenOf(latest) : null };
}

/** Lê uma cópia: kind 'original' ou 'latest'. Devolve { when, json } ou null. */
export async function load(kind) {
  if(!['original','latest'].includes(kind))return null;
  try {
    const all = await names(), name = kind === 'original' ? all.find(n => n.startsWith(ORIGINAL)) : all.filter(n => n.startsWith(RECENT)).at(-1);
    if (!name) return null;
    const json = await read(name); return json ? { when: whenOf(name), json } : null;
  } catch { return null; }
}
