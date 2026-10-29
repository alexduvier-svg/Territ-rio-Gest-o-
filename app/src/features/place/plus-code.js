// Plus Code (Open Location Code, padrão aberto do Google): o endereço de um ponto a partir da
// latitude e longitude, calculado no próprio celular, sem internet. Dez dígitos ≈ 14 m × 14 m,
// uma célula do mapa, não uma garantia da precisão do GPS. O Google Maps entende o código na busca.

const ALPHABET = '23456789CFGHJMPQRVWX';
const PRECISION = 8000; // 10 dígitos: 1/8000 de grau por lado

/** Código completo de 10 dígitos, válido no mundo todo: "58GR8C2X+XX". */
export function encodePlusCode(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Coordenadas inválidas');
  const lat = Math.min(Math.max(latitude, -90), 90);
  let lng = ((longitude + 180) % 360 + 360) % 360 - 180;
  // Inteiros evitam erro de arredondamento do ponto flutuante nos últimos dígitos.
  let latInt = Math.floor(Math.round((lat + 90) * PRECISION * 1e6) / 1e6);
  let lngInt = Math.floor(Math.round((lng + 180) * PRECISION * 1e6) / 1e6);
  latInt = Math.min(latInt, 180 * PRECISION - 1);
  lngInt = Math.min(lngInt, 360 * PRECISION - 1);
  let code = '';
  for (let i = 0; i < 5; i++) {
    code = ALPHABET[latInt % 20] + ALPHABET[lngInt % 20] + code;
    latInt = Math.floor(latInt / 20);
    lngInt = Math.floor(lngInt / 20);
  }
  return code.slice(0, 8) + '+' + code.slice(8);
}

/** Forma abreviada mantida para compatibilidade; o app mostra e compartilha o código completo. */
export const shortPlusCode = code => String(code || '').slice(4);

/** Código completo também no texto: a localização não depende de resolver um município. */
export function plusCodeLabel(code, city = '', uf = '') {
  const place = [String(city || '').trim(), String(uf || '').trim()].filter(Boolean).join(', ');
  return place ? `${code} · ${place}` : code;
}

/** Aceita códigos globais completos de 10 a 15 dígitos; não adivinha a área de um código curto. */
export function normalizePlusCode(value) {
  let text = String(value ?? '').trim();
  if (/^https:\/\//i.test(text)) {
    try { const url = new URL(text); if (!['plus.codes', 'www.plus.codes'].includes(url.hostname) || url.username || url.password || url.port) return null; text = decodeURIComponent(url.pathname.slice(1)); } catch { return null; }
  }
  const code = text.toUpperCase();
  if (!/^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,7}$/.test(code)) return null;
  if (ALPHABET.indexOf(code[0]) >= 9 || ALPHABET.indexOf(code[1]) >= 18) return null;
  return code;
}

/** Centro e limites da célula do código informado; isso não é uma leitura de GPS. */
export function decodePlusCode(value) {
  const code = normalizePlusCode(value);
  if (!code) return null;
  const digits = code.replace('+', '');
  let south = -90, west = -180, latitudeSize = 20, longitudeSize = 20;
  for (let i = 0; i < 10; i += 2) {
    if (i) latitudeSize = longitudeSize = latitudeSize / 20;
    south += ALPHABET.indexOf(digits[i]) * latitudeSize;
    west += ALPHABET.indexOf(digits[i + 1]) * longitudeSize;
  }
  for (let i = 10; i < digits.length; i++) {
    latitudeSize /= 5; longitudeSize /= 4;
    const digit = ALPHABET.indexOf(digits[i]);
    south += Math.floor(digit / 4) * latitudeSize;
    west += (digit % 4) * longitudeSize;
  }
  return { code, latitude: south + latitudeSize / 2, longitude: west + longitudeSize / 2, south, west, latitudeSize, longitudeSize };
}

/** Link que abre o Google Maps no ponto (app do Maps, se houver; senão o navegador). */
export const mapsLink = code => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(code)}`;

const point = (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw Error('Localização inválida');
  return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
};

/** Google Maps já em navegação até o ponto (Maps URLs, sem chave): a pessoa toca e o Maps começa a guiar. */
export const navigateLink = (latitude, longitude) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point(latitude, longitude))}&travelmode=driving&dir_action=navigate`;

/** Coordenadas de seu lugar para copiar em outros aplicativos de mapa. */
export const coordinatesText = (latitude, longitude) => point(latitude, longitude).replace(',', ', ');

/** Waze já navegando até o ponto (link universal do Waze, gratuito). */
export const wazeLink = (latitude, longitude) => `https://waze.com/ul?ll=${point(latitude, longitude)}&navigate=yes&zoom=17`;
