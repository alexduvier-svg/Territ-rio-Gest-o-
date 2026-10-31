// Shared normalization; display names and producer records stay intact.
export const normalizePortuguese=value=>String(value??'').normalize('NFKC').replace(/[\u200b-\u200f\u2060\ufeff]/g,'').normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('pt-BR').replace(/\s+/g,' ').trim();
