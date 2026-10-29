import test from 'node:test';
import assert from 'node:assert/strict';
import { navigateLink, wazeLink, coordinatesText } from '../src/features/place/plus-code.js';
import { shareMessage, placeReferences } from '../src/features/place/share-message.js';

test('links que já abrem navegando: Google Maps e Waze', () => {
  assert.equal(navigateLink(-20.7029, -42.0622), 'https://www.google.com/maps/dir/?api=1&destination=-20.702900%2C-42.062200&travelmode=driving&dir_action=navigate');
  assert.equal(wazeLink(-20.7029, -42.0622), 'https://waze.com/ul?ll=-20.702900,-42.062200&navigate=yes&zoom=17');
  assert.equal(coordinatesText(-20.7029,-42.0622),'-20.702900, -42.062200');
});

test('mensagem com referências numeradas, os dois mapas, a entrada e as dicas', () => {
  const text = shareMessage({
    businessName: 'Sítio Boa Vista', city: 'Carangola', uf: 'MG',
    location: { code: '58FV7X8C+M4', latitude: -20.7333, longitude: -42.0297,
      references: ['Saindo de Carangola, sentido Conceição', 'Depois da ponte, à direita', '', 'Seu lugar fica à esquerda'],
      streetView: { pano: 'EXuRq1xqiSCEYpmQ2GBCvA', lat: -20.70288, lng: -42.06222, heading: 343, pitch: -4 } },
  });
  assert.match(text, /^\*Como chegar\*\n\*Sítio Boa Vista\*/);
  assert.match(text, /\*Plus Code\*\n58FV7X8C\+M4 · Carangola, MG/);
  assert.match(text, /\n1\) Saindo de Carangola, sentido Conceição\n2\) Depois da ponte, à direita\n3\) Seu lugar fica à esquerda\n/);
  assert.match(text, /\*Google Maps\*\nhttps:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-20\.733300%2C-42\.029700/);
  assert.match(text, /\*Waze\*\nhttps:\/\/waze\.com\/ul\?ll=/);
  assert.match(text, /\*Ver seu lugar \(Street View\)\*\nhttps:\/\/www\.google\.com\/maps\/@\?api=1&map_action=pano&pano=EXuRq1xqiSCEYpmQ2GBCvA/);
  assert.match(text, /baixe toda a região do trajeto/);
  assert.match(text, /Salvar o lugar ou iniciar a rota não baixa o mapa/);
  assert.doesNotMatch(text, /caminho fica guardado/);
});

test('mensagem identifica produtor e comunidade sem repetir o município nem juntar referência numérica',()=>{
  const st={producerName:'Produtor Fictício',businessName:'Negócio Fictício',community:'Conceição',city:'Carangola',uf:'MG',location:{code:'58FV7WWQ+R4',references:['300 metros depois da ponte']}};
  assert.match(shareMessage(st),/\*Produtor Fictício\*\nConceição · Carangola, MG/);
  assert.match(shareMessage(st),/1\) 300 metros/);
  assert.doesNotMatch(shareMessage(st),/Negócio Fictício|NaN/);
  assert.match(shareMessage({...st,community:'Carangola'}),/\*Produtor Fictício\*\nCarangola, MG/);
  assert.doesNotMatch(shareMessage({...st,community:'Carangola'}),/Carangola · Carangola/);
});

test('referência única antiga vira a primeira; no máximo 5', () => {
  assert.deepEqual(placeReferences({ note: 'Seu lugar fica à esquerda' }), ['Seu lugar fica à esquerda']);
  assert.equal(placeReferences({ references: ['1', '2', '3', '4', '5', '6'] }).length, 5);
  assert.equal(shareMessage({ location: null }), '');
});
