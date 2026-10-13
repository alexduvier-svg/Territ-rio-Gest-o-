// Validation of the portfolio document sent by the app. Everything that reaches a page goes through here.

export const LIMITS = {
  requestBytes: 24_000_000,
  docBytes: 300_000,
  imageBytes: 1_500_000,
  pdfBytes: 15_000_000,
  images: 150,
  groups: 120,
  variants: 20,
  events: 8,
};

const HASH = /^[0-9a-f]{64}$/;

export class ValidationError extends Error {}

function text(value, max) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '';
}

function httpsURL(value) {
  try {
    const url = new URL(text(value, 500));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

function hash(value) {
  return typeof value === 'string' && HASH.test(value) ? value : null;
}

function day(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : '';
}

function time(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : '';
}

export function validatePortfolio(input) {
  if (!input || typeof input !== 'object') throw new ValidationError('Documento inválido.');
  const business = input.business || {};
  const name = text(business.name, 80);
  if (!name) throw new ValidationError('Informe o nome do negócio.');

  const groups = Array.isArray(input.groups) ? input.groups.slice(0, LIMITS.groups) : [];
  const events = Array.isArray(input.events) ? input.events.slice(0, LIMITS.events) : [];
  const phone = text(input.contact?.whatsapp, 20).replace(/\D/g, '');

  return {
    version: 1,
    business: {
      name,
      producer: text(business.producer, 80),
      city: text(business.city, 60),
      uf: /^[A-Z]{2}$/.test(business.uf || '') ? business.uf : '',
      tagline: text(business.tagline, 120),
      story: text(business.story, 2000),
    },
    contact: {
      whatsapp: phone.length >= 10 && phone.length <= 13 ? phone : '',
      email: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(text(input.contact?.email, 120)) ? text(input.contact.email, 120) : '',
      instagram: httpsURL(input.contact?.instagram),
      website: httpsURL(input.contact?.website),
    },
    photo: hash(input.photo),
    showPrices: input.showPrices !== false,
    groups: groups
      .map(g => ({
        name: text(g?.name, 80),
        category: text(g?.category, 40),
        image: hash(g?.image),
        unavailable: g?.unavailable === true,
        variants: (Array.isArray(g?.variants) ? g.variants.slice(0, LIMITS.variants) : [])
          .map(v => ({
            label: text(v?.label, 80),
            price: Number.isInteger(v?.price) && v.price >= 0 && v.price <= 100_000_000 ? v.price : null,
          }))
          .filter(v => v.label || v.price !== null),
      }))
      .filter(g => g.name),
    events: events
      .map(e => ({
        name: text(e?.name, 80),
        place: text(e?.place, 120),
        start: day(e?.start),
        end: day(e?.end) || day(e?.start),
        from: time(e?.from),
        until: time(e?.until),
      }))
      .filter(e => e.name && e.start),
  };
}

// Hashes the document references; each must be uploaded or already stored.
export function referencedImages(doc) {
  const refs = new Set();
  if (doc.photo) refs.add(doc.photo);
  for (const g of doc.groups) if (g.image) refs.add(g.image);
  return refs;
}

export function isHash(value) {
  return HASH.test(value);
}

// Accept only real JPEG / PNG / WebP payloads, whatever the client claims.
export function imageType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function isPDF(bytes) {
  return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
}
