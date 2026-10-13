// Encryption for automatic backups. Pure Web Crypto + Compression Streams (no DOM), shared by the app
// and by portfolio-server/tests.
//
// Recovery code: 20 random bytes (160 bits) in Crockford base32, shown as 8 groups of 4 characters.
// From it, HKDF-SHA-256 derives three independent values:
//   id     — names the backup on the server
//   token  — proves ownership to the server (only its hash is stored there)
//   key    — AES-256-GCM key; never leaves the phone
// Payload: "TGB1" | 12-byte IV | AES-GCM(gzip(JSON)), with the id as additional authenticated data.

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_BYTES = 20;
const MAGIC = new TextEncoder().encode('TGB1');
const SALT = new TextEncoder().encode('territorio-backup-v1');
const enc = text => new TextEncoder().encode(text);
const hex = bytes => [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export class RecoveryCodeError extends Error {}

function toBase32(bytes) {
  let bits = 0, value = 0, out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function fromBase32(text) {
  let bits = 0, value = 0;
  const out = [];
  for (const char of text) {
    value = (value << 5) | ALPHABET.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function newRecoveryCode() {
  return formatRecoveryCode(toBase32(crypto.getRandomValues(new Uint8Array(CODE_BYTES))));
}

export function formatRecoveryCode(code) {
  return normalizeRecoveryCode(code).match(/.{1,4}/g).join('-');
}

// Forgiving input: case, spaces, dashes, and the letters people confuse with digits.
export function normalizeRecoveryCode(input) {
  const code = String(input || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (code.length !== 32 || [...code].some(c => !ALPHABET.includes(c))) {
    throw new RecoveryCodeError('Código inválido. Confira os 32 caracteres (8 grupos de 4).');
  }
  return code;
}

export async function deriveBackupKeys(code) {
  const raw = fromBase32(normalizeRecoveryCode(code)).slice(0, CODE_BYTES);
  const base = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const params = info => ({ name: 'HKDF', hash: 'SHA-256', salt: SALT, info: enc(info) });
  const [idBits, tokenBits] = await Promise.all([
    crypto.subtle.deriveBits(params('backup-id'), base, 256),
    crypto.subtle.deriveBits(params('backup-auth'), base, 256),
  ]);
  const key = await crypto.subtle.deriveKey(params('backup-encryption'), base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  return { id: hex(idBits).slice(0, 32), token: b64url(tokenBits), key };
}

async function pipe(bytes, transform) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(transform)).arrayBuffer());
}

export async function encryptBackup(json, { id, key }) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const packed = await pipe(enc(json), new CompressionStream('gzip'));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc(id) }, key, packed));
  const out = new Uint8Array(MAGIC.length + iv.length + sealed.length);
  out.set(MAGIC, 0);
  out.set(iv, MAGIC.length);
  out.set(sealed, MAGIC.length + iv.length);
  return out;
}

export async function decryptBackup(bytes, { id, key }) {
  bytes = new Uint8Array(bytes);
  if (MAGIC.some((b, i) => bytes[i] !== b)) throw new Error('Formato de backup desconhecido.');
  const iv = bytes.slice(MAGIC.length, MAGIC.length + 12);
  let packed;
  try {
    packed = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: enc(id) }, key, bytes.slice(MAGIC.length + 12));
  } catch {
    throw new RecoveryCodeError('Não foi possível abrir o backup com este código.');
  }
  return new TextDecoder().decode(await pipe(new Uint8Array(packed), new DecompressionStream('gzip')));
}

export async function sha256Hex(data) {
  return hex(await crypto.subtle.digest('SHA-256', typeof data === 'string' ? enc(data) : data));
}
