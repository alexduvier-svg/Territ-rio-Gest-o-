import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStreetView, streetViewLink, isShortMapsLink } from '../src/features/place/street-view.js';

// Link enviado pelo Alex: Street View em Conceição (Carangola/MG), olhando para a estrada.
const conceicao = 'https://www.google.com.br/maps/@-20.7028804,-42.0622218,568a,75y,343.47h,93.95t/data=!3m7!1e1!3m5!1sEXuRq1xqiSCEYpmQ2GBCvA!2e0!6shttps:%2F%2Fstreetviewpixels-pa.clients6.google.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D-3.9510658419434463%26panoid%3DEXuRq1xqiSCEYpmQ2GBCvA%26yaw%3D343.46661021238333!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MTAyMC4wIKXMDSoASAFQAw%3D%3D';

test('lê o link do Street View de Conceição: panorama, ponto e direção', () => {
  const view = parseStreetView(conceicao);
  assert.equal(view.pano, 'EXuRq1xqiSCEYpmQ2GBCvA');
  assert.equal(view.lat, -20.7028804);
  assert.equal(view.lng, -42.0622218);
  assert.equal(view.heading, 343.47);
  assert.equal(view.pitch, -4);
  const link = streetViewLink(view);
  assert.match(link, /^https:\/\/www\.google\.com\/maps\/@\?api=1&map_action=pano&pano=EXuRq1xqiSCEYpmQ2GBCvA/);
  assert.match(link, /viewpoint=-20\.7028804%2C-42\.0622218/);
  assert.match(link, /heading=343/);
});

test('aceita o formato de links da API e o antigo cbll; recusa mapa comum e outros sites', () => {
  const api = parseStreetView('https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=-20.7,-42.06&heading=90&pitch=5');
  assert.deepEqual([api.lat, api.lng, api.heading, api.pitch, api.pano], [-20.7, -42.06, 90, 5, null]);
  const old = parseStreetView('https://maps.google.com/maps?layer=c&cbll=-20.7,-42.06');
  assert.deepEqual([old.lat, old.lng], [-20.7, -42.06]);
  assert.equal(parseStreetView('https://www.google.com/maps/@-20.7,-42.06,15z'), null);
  assert.equal(parseStreetView('https://exemplo.com/maps/@-20.7,-42.06,3a,75y,90h,90t'), null);
  assert.equal(parseStreetView('não é link'), null);
});

test('reconhece link curto do app do Maps', () => {
  assert.equal(isShortMapsLink('https://maps.app.goo.gl/AbCdEf123'), true);
  assert.equal(isShortMapsLink(conceicao), false);
});

test('links truncados, domínios falsos e pontos inválidos são recusados sem lançar exceção', () => {
  const links=[
    'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=,',
    'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=999,999',
    'https://www.google.com/maps/@?api=1&map_action=pano',
    'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=-20.7,-42.06&heading=%',
    'https://example.invalid/google.com/maps/@?map_action=pano&viewpoint=-20.7,-42.06',
    'https://www.google.com.evil.example/maps/@?map_action=pano&viewpoint=-20.7,-42.06',
    'https://www.google.com/maps/@?map_action=pano&viewpoint=-20.7,-42.06&pitch=91',
  ];
  for(const link of links){assert.doesNotThrow(()=>parseStreetView(link));assert.equal(parseStreetView(link),null,link);}
});
test('zero é coordenada válida; orientação ausente não é forçada a zero', () => {
  const view=parseStreetView('https://www.google.com/maps/@?map_action=pano&viewpoint=0,0');
  assert.deepEqual(view,{pano:null,lat:0,lng:0,heading:null,pitch:null});
  assert.doesNotMatch(streetViewLink(view),/heading=|pitch=/);
});
test('link curto exige domínio real HTTPS e caminhos reconhecidos', () => {
  for(const link of ['http://maps.app.goo.gl/abc','https://maps.app.goo.gl.evil.example/abc','https://goo.gl/other/abc','https://maps.app.goo.gl/'])assert.equal(isShortMapsLink(link),false);
});
