import test from 'node:test';
import assert from 'node:assert/strict';
import { gpsCandidate, existingCandidate, persistPlace } from '../src/features/place/model.js';
import { encodePlusCode, decodePlusCode, normalizePlusCode } from '../src/features/place/plus-code.js';

const now = Date.parse('2026-10-29T12:00:00Z');
const gps = { latitude:-20.7028804, longitude:-42.0622218, accuracyMeters:5, capturedAt:now };
const previous = () => ({ code:'58FV7WWQ+R4', latitude:-20.70288, longitude:-42.06222, note:'Referência antiga' });

test('GPS fraco ou inválido nunca vira candidato nem altera seu lugar anterior', () => {
  const old = Object.freeze(previous());
  assert.deepEqual(gpsCandidate({ ...gps, accuracyMeters:1200 }, old), { status:'weak', accuracy:1200 });
  for (const patch of [{ accuracyMeters:NaN }, { accuracyMeters:0 }, { accuracyMeters:null }, { latitude:91 }, { longitude:-181 }]) assert.equal(gpsCandidate({ ...gps, ...patch }, old).status, 'invalid');
  assert.equal(old.note, 'Referência antiga');
});
test('GPS aceitável gera somente uma proposta com código completo e referências preservadas', () => {
  const old = previous(), snapshot = structuredClone(old), result = gpsCandidate({ ...gps, accuracyMeters:30 }, old, now);
  assert.equal(result.status, 'candidate'); assert.equal(result.place.code, encodePlusCode(gps.latitude, gps.longitude));
  assert.equal(result.place.origin, 'gps'); assert.deepEqual(result.place.references, ['Referência antiga']);
  assert.deepEqual(old, snapshot); assert.equal(result.place.confirmedAt, undefined);
});
test('código ERD existente preserva o código informado sem alegar validação oficial ou precisão GPS', () => {
  const result = existingCandidate('58fv7wwq+r4', 'erd-mg', previous(), now);
  assert.equal(result.code, '58FV7WWQ+R4'); assert.equal(result.origin, 'erd-mg-informed'); assert.equal(result.accuracy, null);
  assert.equal(encodePlusCode(result.latitude, result.longitude), result.code);
  assert.equal(existingCandidate('7WWQ+R4 Carangola', 'erd-mg', null), null);
});
test('normalização aceita apenas códigos globais completos e URLs próprias de Plus Codes', () => {
  assert.equal(normalizePlusCode('https://plus.codes/58FV7WWQ%2BR4'), '58FV7WWQ+R4');
  for (const code of ['WWWWWWWW+WW', '58FV7WWQ+R', '58FV7WWQ+R0', '7WWQ+R4', 'https://example.org/58FV7WWQ+R4', 'https://plus.codes.evil.example/58FV7WWQ+R4']) assert.equal(normalizePlusCode(code), null);
});
test('decodificação respeita células globais e refinamentos de 11 a 15 dígitos', () => {
  for (const [lat, lng] of [[20.3700625,2.7821875],[-41.2730625,174.7859375],[47.36559,8.524997],[-89.9999375,-179.9999375],[-20.7028804,-42.0622218]]) {
    const code = encodePlusCode(lat,lng), decoded = decodePlusCode(code);
    assert.equal(encodePlusCode(decoded.latitude,decoded.longitude), code);
    assert(lat >= decoded.south - 1e-10 && lat <= decoded.south + decoded.latitudeSize + 1e-10);
    assert(lng >= decoded.west - 1e-10 && lng <= decoded.west + decoded.longitudeSize + 1e-10);
    for (let n=1;n<=5;n++) { const fine=decodePlusCode(code+'X'.repeat(n)); assert.equal(fine.code,code+'X'.repeat(n));assert(fine.latitudeSize<decoded.latitudeSize);assert(fine.longitudeSize<decoded.longitudeSize);assert.equal(encodePlusCode(fine.latitude,fine.longitude),code); }
  }
});
function fixture() { const owner={ settings:{ location:previous() }, dataContext:{ id:'synthetic' }, products:[{ id:'qa-product',stock:20 }] }; return { owner, current:() => owner }; }
test('gravação síncrona recusada restaura exatamente a localização anterior', async () => {
  const f=fixture(), original=f.owner.settings.location; let calls=0;
  assert.equal(await persistPlace({ ...f,persist:()=>{calls++;return false;} }, { code:'new' }), 'failed');
  assert.equal(f.owner.settings.location,original);assert.equal(calls,2);assert.equal(f.owner.products[0].stock,20);
});
test('falha no disco enfileira o rollback e não anuncia uma gravação concluída', async () => {
  const f=fixture(), original=f.owner.settings.location, writes=[]; let confirmations=0;
  const result=await persistPlace({ ...f,persist:()=>{writes.push(structuredClone(f.owner.settings.location));return true;},durable:async()=>++confirmations>1 },{code:'new'});
  assert.equal(result,'failed');assert.equal(f.owner.settings.location,original);assert.equal(writes[0].code,'new');assert.deepEqual(writes.at(-1),original);
});
test('sucesso depende da confirmação durável; antes dela a operação continua pendente', async () => {
  const f=fixture();let finish,done=false;
  const job=persistPlace({ ...f,persist:()=>true,durable:()=>new Promise(resolve=>{finish=resolve;}) },{code:'new'}).then(result=>{done=true;return result;});
  await Promise.resolve();assert.equal(done,false);finish(true);assert.equal(await job,'saved');
});
test('exceção ao persistir também restaura um campo que antes não existia', async () => {
  const f=fixture();delete f.owner.settings.location;
  assert.equal(await persistPlace({ ...f,persist:()=>{throw Error('quota');} },{code:'new'}),'failed');
  assert.equal(Object.hasOwn(f.owner.settings,'location'),false);
});
test('troca de contexto antes da escrita não toca em nenhum modelo', async () => {
  const f=fixture(), original=structuredClone(f.owner);let writes=0;
  assert.equal(await persistPlace({ ...f,current:()=>({}),persist:()=>{writes++;return true;} },{code:'new'}),'cancelled');
  assert.equal(writes,0);assert.deepEqual(f.owner,original);
});
test('troca de contexto durante a confirmação não salva no produtor novo nem mantém mutação antiga', async () => {
  const f=fixture(), original=f.owner.settings.location, other={ settings:{ location:{code:'other'} } };let current=f.owner,finish;
  const job=persistPlace({ ...f,current:()=>current,persist:()=>true,durable:()=>new Promise(resolve=>{finish=resolve;}) },{code:'new'});
  current=other;finish(true);assert.equal(await job,'cancelled');assert.equal(other.settings.location.code,'other');assert.equal(f.owner.settings.location,original);
});
