import test from 'node:test';
import assert from 'node:assert/strict';
import { encodePlusCode, shortPlusCode, plusCodeLabel, mapsLink } from '../src/features/place/plus-code.js';

test('Plus Code segue os exemplos oficiais do Open Location Code', () => {
  assert.equal(encodePlusCode(20.3700625, 2.7821875), '7FG49QCJ+2V');
  assert.equal(encodePlusCode(47.36559, 8.524997), '8FVC9G8F+6X');
  assert.equal(encodePlusCode(-41.2730625, 174.7859375), '4VCPPQGP+Q9');
});

test('Zona da Mata mineira: código válido e estável para o mesmo ponto', () => {
  const code = encodePlusCode(-20.7333, -42.0297); // região de Carangola
  assert.match(code, /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}$/);
  assert.equal(code, encodePlusCode(-20.7333, -42.0297));
  assert.equal(code.slice(0, 2), '58');
  // Pontos a poucos metros (dentro de ~14 m) caem no mesmo código ou no vizinho, nunca longe.
  assert.equal(encodePlusCode(-20.73330, -42.02970).slice(0, 8), encodePlusCode(-20.73331, -42.02971).slice(0, 8));
});

test('rótulo curto com o município e link do Google Maps', () => {
  assert.equal(shortPlusCode('58GR8C2X+XX'), '8C2X+XX');
  assert.equal(plusCodeLabel('58GR8C2X+XX', 'Carangola', 'MG'), '58GR8C2X+XX · Carangola, MG');
  assert.equal(plusCodeLabel('58GR8C2X+XX'), '58GR8C2X+XX');
  assert.equal(mapsLink('58GR8C2X+XX'), 'https://www.google.com/maps/search/?api=1&query=58GR8C2X%2BXX');
});
