import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { newRecoveryCode, deriveBackupKeys, encryptBackup, decryptBackup } from '../src/features/backup-crypto.js';

const core = fs.readFileSync(new URL('../src/legacy/erp-core.js', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../src/legacy/erp-ui.js', import.meta.url), 'utf8');
const functions = ['backupSource', 'exportBackupFile', 'applyBackupData'].map(name => {
  const match = ui.match(new RegExp('^function ' + name + '\\([^\\n]+', 'm'));
  assert.ok(match, 'backup implementation present: ' + name);
  return match[0];
}).join('\n');
const clone = value => JSON.parse(JSON.stringify(value));

function backupContext(type = 'real') {
  const downloads = [], saved = [];
  const ctx = { console, Date, Math, JSON, Intl, crypto: globalThis.crypto };
  ctx.window = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx); vm.runInContext(core, ctx);
  const fixture = clone(ctx.ERP.seed());
  fixture.dataContext = { type, confirmedAt: '2026-10-15T12:00:00.000Z' };
  fixture.productMemory = { version: 1, scopeId: 'producer-dataset-local', entries: {
    banana: { stockEntries: 3, lastStockAt: '2026-10-15T12:00:00.000Z', confirmedAt: '2026-10-14T12:00:00.000Z' },
  } };
  fixture.catalogKnowledge = { version: '1.0.0', catalogVersion: '1.0.0', type: 'suggestions_only', total: 2479,
    rules: ['Memória confirmada do produtor prevalece sobre sugestão.'], documents: { instructions: 'catalog/instructions.md' }, sources: { catalog: 'test-hash' } };
  fixture.productLibrary = { entries: [{ name: 'Taioba', category: 'Hortifruti-Granjeiro', defaults: { unit: 'Maço' } }], dimensions: { 'Taioba|unit': ['Maço'] } };
  fixture.products[0].catalogProductId = 'banana-prata';
  fixture.products[0].confirmedPresentation = { unit: 'Dúzia', source: 'producer' };
  fixture.cloudBackup = { enabled: true, secret: 'never-export-recovery-secret', sourceHash: 'old' };
  Object.assign(ctx, {
    fixture, downloads, saved,
    download: (name, content, mime) => downloads.push({ name, content, mime }),
    persist: () => saved.push(JSON.stringify(ctx.model.data)),
    render() {}, toast() {}, closeModal() {}, validateEventLoads() {},
  });
  vm.runInContext('var E=ERP,model=new E.ERPModel(fixture),modal=null,page="Vender",dialog={open:false},draft=null,query="",filter="Todos";\n' + functions, ctx);
  return ctx;
}

for (const type of ['real', 'demo']) test('backup manual e automático incluem memória e restauram o contexto ' + type, () => {
  const c = backupContext(type);
  const source = JSON.parse(c.backupSource());
  c.exportBackupFile();
  const manual = JSON.parse(c.downloads[0].content);
  for (const backup of [source, manual]) {
    assert.deepEqual(backup.productMemory, clone(c.model.data.productMemory));
    assert.deepEqual(backup.catalogKnowledge, clone(c.model.data.catalogKnowledge));
    assert.deepEqual(backup.productLibrary, clone(c.model.data.productLibrary));
    assert.deepEqual(backup.products[0].confirmedPresentation, { unit: 'Dúzia', source: 'producer' });
    assert.equal(backup.products[0].catalogProductId, 'banana-prata');
    assert.equal(backup.dataContext.type, type);
    assert.equal('cloudBackup' in backup, false, 'código de recuperação não vai para a cópia manual/fonte');
  }
  const expected = clone(manual);
  c.applyBackupData(manual);
  assert.deepEqual(clone(c.model.data.productMemory), expected.productMemory);
  assert.deepEqual(clone(c.model.data.catalogKnowledge), expected.catalogKnowledge);
  assert.deepEqual(clone(c.model.data.productLibrary), expected.productLibrary);
  assert.equal(c.model.data.dataContext.type, type, 'restaurar não converte demonstração em operação real ou vice-versa');
  assert.ok(c.saved.length, 'restauração segue a persistência local existente');
});

test('backup criptografado faz roundtrip completo da memória, sem rede ou exportação real', async () => {
  const c = backupContext();
  const json = c.backupSource();
  const keys = await deriveBackupKeys(newRecoveryCode());
  const sealed = await encryptBackup(json, keys);
  assert.equal(await decryptBackup(sealed, keys), json);
  const before = c.backupSource();
  c.model.data.productMemory.entries.banana.stockEntries = 4;
  assert.notEqual(c.backupSource(), before, 'novo aprendizado participa da detecção de alteração do backup');
});
