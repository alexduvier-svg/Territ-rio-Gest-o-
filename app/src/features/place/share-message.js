// Mensagem "Como chegar" que o produtor manda pelo WhatsApp: código, referências em ordem, links que já
// abrem navegando (Google Maps e Waze), a vista da entrada e as dicas para quem nunca usou mapa offline.

import { plusCodeLabel, navigateLink, wazeLink, decodePlusCode, coordinatesText } from './plus-code.js';
import { streetViewLink } from './street-view.js';

export const MAX_REFERENCES = 5;

/** Referências do caminho, em ordem; a antiga referência única vira a primeira. */
export function placeReferences(place) {
  const list = Array.isArray(place?.references) ? place.references : place?.note ? [place.note] : [];
  return list.map(item => String(item || '').trim()).filter(Boolean).slice(0, MAX_REFERENCES);
}

export function shareMessage(settings) {
  const place = settings?.location;
  const decoded = decodePlusCode(place?.code);
  if (!decoded) return '';
  const hasPoint = Number.isFinite(place.latitude) && Number.isFinite(place.longitude) && Math.abs(place.latitude) <= 90 && Math.abs(place.longitude) <= 180;
  const latitude = hasPoint ? place.latitude : decoded.latitude;
  const longitude = hasPoint ? place.longitude : decoded.longitude;
  const name = String(settings.producerName || settings.businessName || 'Produtor').trim();
  const city = [String(settings.city || '').trim(), String(settings.uf || '').trim()].filter(Boolean).join(', ');
  const community = String(settings.community || '').trim();
  const where = [community.toLocaleLowerCase('pt-BR') !== String(settings.city || '').trim().toLocaleLowerCase('pt-BR') ? community : '', city].filter(Boolean).join(' · ');
  const references = placeReferences(place);
  const blocks = [['*Como chegar*', `*${name}*`, where].filter(Boolean), ['*Plus Code*', plusCodeLabel(place.code, settings.city, settings.uf)]];
  if (references.length) blocks.push(['*Caminho*', ...references.map((text, index) => `${index + 1}) ${text}`)]);
  blocks.push(['*Google Maps*', navigateLink(latitude, longitude)], ['*Waze*', wazeLink(latitude, longitude)], ['*Coordenadas para copiar*', coordinatesText(latitude, longitude)]);
  const street = streetViewLink(place.streetView);
  if (street) blocks.push(['*Ver seu lugar (Street View)*', street]);
  blocks.push(['*Para trechos sem sinal*', 'Antes de sair, no Google Maps, abra sua foto de perfil → Mapas off-line → Selecione seu mapa e baixe toda a região do trajeto. Aguarde terminar. Salvar o lugar ou iniciar a rota não baixa o mapa para uso offline. Guarde também esta mensagem e suas referências.']);
  if (street) blocks.push(['As imagens do Street View precisam de internet.']);
  return blocks.map(lines => lines.join('\n')).join('\n\n');
}
