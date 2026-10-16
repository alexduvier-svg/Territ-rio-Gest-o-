import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSaveQueue } from '../src/native/save-queue.js';

const tick = () => new Promise(r => setTimeout(r, 0));

test('gravação confirmada: durable só responde depois que o disco gravou', async () => {
  const disk = [];
  let release;
  const q = createSaveQueue({ write: json => new Promise(r => { release = () => { disk.push(json); r(); }; }) });
  assert.equal(q.save('venda-1'), true);
  let done = null;
  q.durable().then(ok => { done = ok; });
  await tick();
  assert.equal(done, null, 'ainda não gravou');
  assert.equal(q.status().pending, true);
  release(); await tick(); await tick();
  assert.equal(done, true);
  assert.deepEqual(disk, ['venda-1']);
  assert.equal(q.status().pending, false);
});

test('disco cheio: durable responde false, o dado fica na fila e grava sozinho depois', async () => {
  let full = true; const disk = []; const timers = []; const events = [];
  const q = createSaveQueue({
    write: async json => { if (full) throw new Error('ENOSPC'); disk.push(json); },
    onError: () => events.push('erro'), onRecovered: () => events.push('ok'),
    setTimer: fn => { timers.push(fn); return 1; },
  });
  q.save('venda-1');
  assert.equal(await q.durable(), false);
  assert.deepEqual(q.status(), { pending: true, failed: true });
  assert.deepEqual(disk, []);
  // Enquanto isso, uma nova venda: a fila guarda a versão mais nova.
  q.save('venda-1+2');
  assert.equal(await q.durable(), false);
  full = false;
  const waiting = q.durable();
  timers.shift()();
  assert.equal(await waiting, true);
  assert.deepEqual(disk, ['venda-1+2']);
  assert.deepEqual(q.status(), { pending: false, failed: false });
  assert.deepEqual(events, ['erro', 'erro', 'ok']);
});

test('várias gravações seguidas: grava a última e confirma tudo', async () => {
  const disk = [];
  const q = createSaveQueue({ write: async json => { await tick(); disk.push(json); } });
  q.save('a'); q.save('b'); q.save('c');
  assert.equal(await q.durable(), true);
  assert.equal(disk[disk.length - 1], 'c');
  assert.equal(await q.settle(), true);
});

test('erro síncrono na escrita não prende a fila: nova versão e retry continuam gravando', async () => {
  let fail = true; const disk = [], timers = [];
  const q = createSaveQueue({
    write: json => { if (fail) throw new Error('Filesystem indisponível'); disk.push(json); },
    setTimer: fn => { timers.push(fn); return 0; },
  });
  q.save('antes');
  assert.equal(await q.durable(), false);
  assert.deepEqual(q.status(), { pending: true, failed: true });
  q.save('depois');
  assert.equal(await q.durable(), false);
  assert.equal(timers.length, 1, 'handle zero também representa retry agendado');
  fail = false;
  const confirmed = q.durable();
  timers.shift()();
  assert.equal(await confirmed, true);
  assert.deepEqual(disk, ['depois']);
  assert.deepEqual(q.status(), { pending: false, failed: false });
});
