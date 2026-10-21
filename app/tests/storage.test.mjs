import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createSaveQueue } from '../src/native/save-queue.js';

const source = fs.readFileSync(new URL('../src/native/storage.js', import.meta.url), 'utf8')
  .replace(/^import .*;\r?\n/gm, '')
  .replace(/^export /gm, '');
const now = '2026-10-15T18:00:00.000Z';
const model = version => JSON.stringify({
  schema: 1, products: [], sales: [], clients: [], events: [], movements: [], expenses: [],
  productMemory: { version: 1, entries: { taioba: { uses: version, unit: 'Maço', name: 'Taioba' } } },
  catalogKnowledge: { revision: 'provided-catalog-1', accepted: true },
  productLibrary: { entries: [{ name: 'Taioba', category: 'Hortifruti-Granjeiro', defaults: { unit: 'Maço' } }], dimensions: {} },
  dataContext: { type: 'real' },
});
const oldSlot = (seq, json) => JSON.stringify({ seq, savedAt: now, length: json.length }) + '\n' + json;

function runtime({ files = new Map(), legacy = null, damageWrite = false, damageRecoveryWrite = false, native = true } = {}) {
  const events = [], writes = [], timers = [];
  class FixedDate extends Date { constructor(value) { super(value === undefined ? now : value); } }
  const ctx = {
    createSaveQueue: options => createSaveQueue({ ...options, setTimer: fn => { timers.push(fn); return timers.length; } }),
    Date: FixedDate, Intl, JSON, Math, Number, Array, Promise, TextEncoder,
    console: { warn() {}, error() {} },
    Event: class { constructor(type) { this.type = type; } },
    CustomEvent: class { constructor(type) { this.type = type; } },
    Capacitor: { isNativePlatform: () => native }, Directory: { Data: 'DATA' }, Encoding: { UTF8: 'utf8' },
    localStorage: { getItem: () => legacy },
    Filesystem: {
      async readFile({ path }) { if (!files.has(path)) throw new Error('ENOENT'); return { data: files.get(path) }; },
      async writeFile({ path, data }) {
        writes.push(path);
        files.set(path, ((damageWrite && /data-[ab]\.json$/.test(path)) || (damageRecoveryWrite && /recovery-[ab]\.json$/.test(path))) ? data.slice(0, -3) : data);
      },
      async readdir({ path }) { return { files: [...files.keys()].filter(key => key.startsWith(path + '/')).map(key => ({ name: key.slice(path.length + 1) })) }; },
      async deleteFile({ path }) { files.delete(path); },
    },
  };
  ctx.window = { dispatchEvent: event => events.push(event.type) };
  vm.createContext(ctx);
  vm.runInContext(source + '\nglobalThis.storageAPI = { initStorage, settle, readSlot, dayKey };', ctx);
  return { files, events, writes, timers, init: ctx.storageAPI.initStorage, api: ctx.storageAPI, native: () => ctx.window.TerritorioNative };
}

test('slots nativos conservam a memória completa após reiniciar e alternam sem perder o anterior', async () => {
  const r = runtime(); await r.init();
  r.native().save(model(1)); assert.equal(await r.native().durable(), true);
  r.native().save(model(2)); assert.equal(await r.native().durable(), true);
  assert.equal(r.files.size, 3, 'duas cópias A/B e a cópia diária');
  const restart = runtime({ files: r.files }); await restart.init();
  assert.equal(restart.native().initialJSON, model(2));
  assert.equal(JSON.parse(restart.native().initialJSON).productMemory.entries.taioba.uses, 2);
  assert.equal(JSON.parse(restart.native().initialJSON).dataContext.type, 'real');
  assert.ok(JSON.parse(r.files.get('territorio/data-a.json').split('\n')[0]).checksum);
});

test('corrupção do mesmo tamanho ou truncamento recupera o outro slot intacto', async () => {
  for (const damage of ['same-length', 'truncate']) {
    const r = runtime(); await r.init();
    r.native().save(model(1)); await r.native().durable();
    r.native().save(model(2)); await r.native().durable();
    const path = 'territorio/data-a.json', bytes = r.files.get(path);
    r.files.set(path, damage === 'truncate' ? bytes.slice(0, -3) : bytes.replace('"uses":2', '"uses":9'));
    const restart = runtime({ files: r.files }); await restart.init();
    assert.equal(restart.native().initialJSON, model(1), damage);
  }
});

test('formatos antigos sem checksum permanecem legíveis, sem alteração dos dados', async () => {
  const json = model(7), r = runtime({ files: new Map([['territorio/data-a.json', oldSlot(12, json)]]) });
  await r.init(); assert.equal(r.native().initialJSON, json);
  r.native().save(model(8)); assert.equal(await r.native().durable(), true);
  assert.equal(JSON.parse(r.files.get('territorio/data-b.json').split('\n')[0]).seq, 13);
});

test('durable recusa confirmação quando o sistema afirma gravar mas o readback está truncado', async () => {
  const json = model(1), files = new Map([['territorio/data-a.json', oldSlot(2, json)]]);
  const r = runtime({ files, damageWrite: true }); await r.init();
  r.native().save(model(2)); assert.equal(await r.native().durable(), false);
  assert.equal(r.native().status().failed, true);
  assert.equal(files.get('territorio/data-a.json'), oldSlot(2, json), 'slot anterior preservado');
  assert.ok(r.events.includes('territorio:storage-error'));
  const restart = runtime({ files }); await restart.init();
  assert.equal(restart.native().initialJSON, json);
});

test('primeiro backup do dia não é sobrescrito ao reiniciar ou atualizar o aplicativo', async () => {
  const r = runtime(); await r.init();
  r.native().save(model(1)); await r.native().durable();
  const restart = runtime({ files: r.files }); await restart.init();
  restart.native().save(model(2)); assert.equal(await restart.native().durable(), true);
  assert.equal(r.files.get('territorio/backups/2026-10-15.json'), model(1));
  assert.equal(restart.writes.includes('territorio/backups/2026-10-15.json'), false);
});

test('ambos slots danificados recuperam backup válido recente e ignoram cópia incompleta mais nova', async () => {
  const files = new Map([
    ['territorio/data-a.json', 'truncated'], ['territorio/data-b.json', 'invalid'],
    ['territorio/backups/2026-10-15.json', '{"schema":1}'],
    ['territorio/backups/2026-10-14.json', model(4)],
  ]);
  const r = runtime({ files, legacy: model(0) }); await r.init();
  assert.equal(r.native().initialJSON, model(4));
  assert.equal(await r.native().durable(), true);
  assert.ok(await r.api.readSlot('data-b.json'));
});

test('migração localStorage só grava modelo completo, sem descartar metadados da memória', async () => {
  const good = runtime({ legacy: model(3) }); await good.init();
  assert.equal(good.native().initialJSON, model(3));
  assert.equal(await good.native().durable(), true);
  const bad = runtime({ legacy: '{"schema":1}' }); await bad.init();
  assert.equal(bad.native().initialJSON, null);
  assert.deepEqual(bad.writes, []);
});

test('save inválido preserva ambos slots; calendário de backup usa a virada de Brasília', async () => {
  const r = runtime(); await r.init(); r.native().save(model(1)); await r.native().durable();
  const before = [...r.files.entries()];
  r.native().save('{"schema":1}'); assert.equal(await r.native().durable(), false);
  assert.deepEqual([...r.files.entries()], before);
  assert.equal(r.api.dayKey(new Date('2027-01-01T02:59:59Z')), '2026-12-31');
  assert.equal(r.api.dayKey(new Date('2027-01-01T03:00:00Z')), '2027-01-01');
});

test('small recovery journal alternates, verifies and survives restart without touching business slots',async()=>{const r=runtime();await r.init();r.native().save(model(9));await r.native().durable();const prior=r.native().initialJSON;for(const quantity of ['1','12']){r.native().recovery.save(JSON.stringify({version:1,entry:{actorId:'a',draft:{operationId:'op',items:[{productId:'p',rawQty:quantity}]}}}));assert.equal(await r.native().recovery.durable(),true);}const restart=runtime({files:r.files});await restart.init();assert.equal(restart.native().initialJSON,model(9));assert.equal(restart.native().recovery.initialRecord.entry.draft.items[0].rawQty,'12');assert(r.files.has('territorio/recovery-a.json'));assert(r.files.has('territorio/recovery-b.json'));});
test('damaged newest recovery slot falls back and a tombstone clears only the pending cart',async()=>{const r=runtime();await r.init();r.native().save(model(3));await r.native().durable();for(const n of [1,2]){r.native().recovery.save(JSON.stringify({version:1,entry:{n}}));assert.equal(await r.native().recovery.durable(),true);}const p='territorio/recovery-a.json';r.files.set(p,r.files.get(p).slice(0,-3));const restart=runtime({files:r.files});await restart.init();assert.equal(restart.native().recovery.initialRecord.entry.n,1);restart.native().recovery.save(JSON.stringify({version:1,entry:null}));assert.equal(await restart.native().recovery.durable(),true);const again=runtime({files:r.files});await again.init();assert.equal(again.native().recovery.initialRecord.entry,null);assert.equal(again.native().initialJSON,model(3));});
test('failed recovery write is not acknowledged as durable',async()=>{const r=runtime({damageRecoveryWrite:true});await r.init();r.native().recovery.save(JSON.stringify({version:1,entry:{id:'op'}}));assert.equal(await r.native().recovery.durable(),false);assert(r.native().recovery.status().failed);assert.equal(r.native().status().failed,false);});
