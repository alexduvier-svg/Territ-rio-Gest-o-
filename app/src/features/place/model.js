import { encodePlusCode, decodePlusCode } from './plus-code.js';
import { placeReferences } from './share-message.js';

// A célula do código não corrige o erro do GPS. Leituras piores nunca substituem um lugar salvo.
export const MAX_GPS_ERROR_METERS = 30;
export function gpsCandidate(result, previous, now = Date.now()) {
  const lat = result?.latitude, lng = result?.longitude, accuracy = result?.accuracyMeters;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !Number.isFinite(accuracy) || accuracy <= 0) return { status: 'invalid' };
  if (accuracy > MAX_GPS_ERROR_METERS) return { status: 'weak', accuracy: Math.round(accuracy) };
  const captured = Number.isFinite(result.capturedAt) && result.capturedAt > 0 ? result.capturedAt : now;
  return { status: 'candidate', place: { code: encodePlusCode(lat, lng), latitude: lat, longitude: lng, accuracy: Math.ceil(accuracy), at: new Date(captured).toISOString(), origin: 'gps', references: placeReferences(previous), streetView: previous?.streetView || null } };
}

export function existingCandidate(input, origin, previous, now = Date.now()) {
  const decoded = decodePlusCode(input);
  if (!decoded) return null;
  return { code: decoded.code, latitude: decoded.latitude, longitude: decoded.longitude, accuracy: null, at: new Date(now).toISOString(), origin: origin === 'erd-mg' ? 'erd-mg-informed' : 'existing-code', references: placeReferences(previous), streetView: previous?.streetView || null };
}

/** Uma alteração pequena de settings, com rollback e identidade do modelo preservados. */
export async function persistPlace({ owner, current, persist, durable = async () => true }, next) {
  const settings = owner?.settings;
  const context = owner?.dataContext?.id;
  const same = () => current() === owner && owner.settings === settings && owner?.dataContext?.id === context;
  if (!settings || !same()) return 'cancelled';
  const hadPrevious = Object.hasOwn(settings, 'location'), previous = settings.location;
  settings.location = next;
  const restore = () => { if (settings.location === next) { if (hadPrevious) settings.location = previous; else delete settings.location; } };
  try {
    if (persist() !== true) throw Error('Gravação recusada');
    if (!same()) { restore(); return 'cancelled'; }
    if (await durable() !== true) throw Error('Gravação não confirmada');
    if (!same()) { restore(); return 'cancelled'; }
    return 'saved';
  } catch {
    restore();
    if (!same()) return 'cancelled';
    // Uma escrita nativa pode ter começado antes de falhar. Recoloca também o valor anterior na fila.
    try { if (persist() === true) await durable(); } catch { /* o chamador não anuncia sucesso */ }
    return 'failed';
  }
}
