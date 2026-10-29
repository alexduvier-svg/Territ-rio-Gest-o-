// Seu lugar: confirmação explícita, gravação conferida e links externos abertos somente ao toque.
import { Capacitor, CapacitorHttp, registerPlugin } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { plusCodeLabel, mapsLink, navigateLink } from './plus-code.js';
import { parseStreetView, streetViewLink, isShortMapsLink } from './street-view.js';
import { shareMessage, placeReferences, MAX_REFERENCES } from './share-message.js';
import { gpsCandidate, existingCandidate, persistPlace } from './model.js';

const Native = Capacitor.isNativePlatform() ? registerPlugin('AgroPlace') : null;
const bridge = () => window.TerritorioWorkflowBridge;
const settings = () => bridge()?.data()?.settings || {};
const esc = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const date = new Intl.DateTimeFormat('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' });
const when = iso => { try { return date.format(new Date(iso)); } catch { return ''; } };
const PIN = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
let marking = false, readingLink = false, saving = false, candidate = null, generation = 0, watcher = null;
let feedback = '', importCode = '', importOrigin = 'existing-code', pendingSave = Promise.resolve();
const busy = () => marking || readingLink || saving;
const button = (action, text, cls = '') => `<button type="button" class="profile-photo-btn ${cls}" data-place="${action}"${busy() && action !== 'cancel' ? ' disabled' : ''}>${text}</button>`;
const visible = owner => bridge()?.data() === owner && document.getElementById('dialog')?.open && document.getElementById('dialog')?.dataset.kind === 'business' && !!document.getElementById('place-group');

function referencesField(place) {
  const refs = placeReferences(place), shown = Math.min(MAX_REFERENCES, refs.length + 1);
  return '<div class="form-field place-refs" id="place-refs"><label for="place-ref-0">Como chegar (até 5 referências, em ordem)</label>'
    + Array.from({ length:shown }, (_, i) => refInput(i, refs[i] || '')).join('') + '</div>';
}
const refInput = (index, value) => `<input id="place-ref-${index}" class="place-ref" type="text" maxlength="90" autocomplete="off" placeholder="${index === 0 ? '1. Ex.: saindo de Carangola, sentido Conceição' : `${index + 1}.`}" value="${esc(value)}">`;

function section(st = settings()) {
  const place = st.location, label = place?.code ? plusCodeLabel(place.code, st.city, st.uf) : '';
  let html = '<section class="profile-group place-group" id="place-group" aria-labelledby="pg-place"><h3 id="pg-place">Seu lugar</h3>';
  if (place?.code) {
    const origin = place.origin === 'erd-mg-informed' ? 'ERD-MG informado por você' : place.origin === 'existing-code' ? 'Código informado por você' : 'Plus Code';
    html += `<button type="button" class="place-code" data-place="open" aria-label="Abrir seu lugar no Google Maps">${PIN}<span><strong>${esc(label)}</strong><small>${origin}${Number.isFinite(place.accuracy) ? ` · erro estimado do GPS: ${esc(place.accuracy)} m` : ''}${place.at ? ` · ${esc(when(place.at))}` : ''}</small></span></button>`
      + `<div class="place-actions">${button('navigate', 'Traçar rota')}${button('share', 'Compartilhar')}${button('mark', marking ? 'Buscando GPS…' : 'Remarcar pelo GPS')}</div>`
      + referencesField(place)
      + `<div class="form-field"><label for="place-street">Seu lugar no Street View (opcional)</label><input id="place-street" type="url" inputmode="url" maxlength="8192" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Cole o link do Street View de seu lugar" value="${esc(place.streetView?.source || '')}"${busy() ? ' disabled' : ''}></div>`
      + (streetViewLink(place.streetView) ? `<div class="place-actions">${button('street', 'Ver seu lugar no Street View')}</div>` : '');
  } else {
    html += '<p class="place-hint">Vá até seu lugar, junto do acesso usado por quem chega, e marque pelo GPS. Confira o ponto antes de confirmar.</p>'
      + `<div class="place-actions">${button('mark', marking ? 'Buscando GPS…' : PIN + '<span>Marcar pelo GPS</span>')}</div>`;
  }
  if (marking || readingLink) html += `<p class="place-hint">${marking ? 'Procurando uma posição precisa…' : 'Lendo o link do Maps…'}</p><div class="place-actions">${button('cancel', 'Cancelar')}</div>`;
  html += `<details class="place-import"${importCode ? ' open' : ''}><summary>Já tenho um Plus Code ou ERD</summary><div class="form-field"><label for="place-code-input">Código completo de seu lugar</label><input id="place-code-input" type="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="100" placeholder="Ex.: 58FV7WWQ+R4" value="${esc(importCode)}"${busy() ? ' disabled' : ''}></div><div class="form-field"><label for="place-origin">Origem do código</label><select id="place-origin"${busy() ? ' disabled' : ''}><option value="existing-code"${importOrigin !== 'erd-mg' ? ' selected' : ''}>Plus Code que já uso</option><option value="erd-mg"${importOrigin === 'erd-mg' ? ' selected' : ''}>ERD-MG que já tenho</option></select></div><p class="place-hint">Use o código completo, com 8 caracteres antes do +. O código informado não é consultado nem validado automaticamente no ERD-MG.</p><div class="place-actions">${button('import', 'Conferir código')}</div></details>`;
  if (candidate) {
    html += `<div class="place-preview" role="group" aria-label="Confirme seu lugar"><strong>Confira seu lugar</strong><p class="place-hint">${esc(candidate.place.code)}${candidate.place.accuracy ? ` · erro estimado: ${candidate.place.accuracy} m` : ' · ponto do código informado'}</p><p class="place-hint">Confira no Maps se este é seu lugar e se o acesso está correto. Somente a confirmação substitui o lugar salvo.</p><div class="place-actions">${button('preview', 'Conferir no Maps')}${button('confirm', saving ? 'Salvando…' : 'Confirmar meu lugar', 'place-confirm')}${button('discard', 'Descartar')}</div></div>`;
  }
  return html + `<p id="place-feedback" class="place-feedback" role="status" aria-live="polite">${esc(feedback)}</p><p class="place-hint">Seu lugar não é publicado automaticamente. Ele pode integrar seus backups. Compartilhe apenas quando desejar.</p></section>`;
}
function repaint() { const el = document.getElementById('place-group'); if (el) el.outerHTML = section(); }
function say(text) { feedback = text; const el = document.getElementById('place-feedback'); if (el) el.textContent = text; }
function invalidate() {
  generation++; if (marking) Native?.cancel().catch(() => {});
  marking = readingLink = false; candidate = null; importCode = ''; feedback = '';
  watcher?.disconnect(); watcher = null;
}
function watch(owner) {
  watcher?.disconnect();
  const dialog = document.getElementById('dialog');
  if (!dialog) return;
  watcher = new MutationObserver(() => { if (!visible(owner)) { invalidate(); if (document.getElementById('dialog')?.dataset.kind === 'business') repaint(); } });
  watcher.observe(dialog, { childList:true, subtree:true, attributes:true, attributeFilter:['open','data-kind'] });
}
function durable() {
  if (window.TerritorioWorkspace?.active) return window.TerritorioWorkspace.durable();
  return window.TerritorioNative?.durable ? window.TerritorioNative.durable() : Promise.resolve(true);
}
function saveChange(owner, makeNext) {
  const job = pendingSave.then(() => persistPlace({ owner, current:() => bridge()?.data(), persist:() => bridge().persist(), durable }, makeNext()));
  pendingSave = job.catch(() => 'failed');
  return pendingSave;
}
const saveFailure = 'Gravação não confirmada. A alteração não foi aplicada; tente novamente.';

async function readPosition() {
  if (Native) return Native.locate();
  if (!navigator.geolocation) return { status:'unavailable' };
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(
    p => resolve({ status:'ready', latitude:p.coords.latitude, longitude:p.coords.longitude, accuracyMeters:p.coords.accuracy, capturedAt:p.timestamp }),
    e => resolve({ status:e.code === 1 ? 'permission-denied' : e.code === 3 ? 'timeout' : 'unavailable' }),
    { enableHighAccuracy:true, timeout:25000, maximumAge:0 }));
}
const problems = {
  'permission-denied':'Permita a localização para marcar seu lugar.',
  'approximate-only':'Escolha Localização precisa nas permissões do AGRO Gestão Codex.',
  disabled:'Ligue o GPS do celular e tente novamente.',
  timeout:'O GPS não respondeu. Vá para um lugar aberto e tente novamente.',
  unavailable:'Localização indisponível neste aparelho.',
};
async function mark() {
  const owner = bridge()?.data(); if (!visible(owner) || busy()) return;
  const token = ++generation; marking = true; candidate = null; feedback = ''; watch(owner); repaint();
  let result; try { result = await readPosition(); } catch { result = { status:'unavailable' }; }
  if (token !== generation || !visible(owner)) return;
  marking = false;
  const prepared = result?.status === 'ready' ? gpsCandidate(result, owner.settings.location) : null;
  if (result?.status === 'low-accuracy' || prepared?.status === 'weak') {
    feedback = `Sinal fraco (erro estimado: ${Math.round(result.accuracyMeters)} m). ${owner.settings.location ? 'Seu lugar salvo foi mantido.' : 'Nenhum lugar foi salvo.'} Vá para um lugar aberto e tente novamente.`;
  } else if (prepared?.status === 'candidate') {
    candidate = { owner, place:prepared.place }; feedback = 'Ponto encontrado. Confira seu lugar antes de confirmar.';
  } else if (result?.status !== 'cancelled') feedback = problems[result?.status] || problems.unavailable;
  repaint();
}
function prepareExisting() {
  const owner = bridge()?.data(); if (!visible(owner) || busy()) return;
  importCode = document.getElementById('place-code-input')?.value || '';
  importOrigin = document.getElementById('place-origin')?.value || 'existing-code';
  const place = existingCandidate(importCode, importOrigin, owner.settings.location);
  if (!place) { say('Informe um Plus Code completo e válido, com 8 caracteres antes do +. Um código abreviado precisa ser obtido na forma completa.'); return; }
  candidate = { owner, place }; feedback = 'Código lido. Confira se ele abre seu lugar antes de confirmar.'; watch(owner); repaint();
}
async function confirm() {
  const chosen = candidate;
  if (!chosen || !visible(chosen.owner) || busy()) return;
  saving = true; feedback = ''; repaint();
  const status = await saveChange(chosen.owner, () => ({ ...chosen.place, references:placeReferences(chosen.owner.settings.location), confirmedAt:new Date().toISOString(), confirmedBy:'producer' }));
  saving = false;
  if (!visible(chosen.owner)) return;
  if (status === 'saved') { candidate = null; importCode = ''; feedback = 'Seu lugar foi salvo e a gravação foi conferida.'; }
  else if (status === 'failed') feedback = saveFailure;
  else { invalidate(); return; }
  repaint();
}
async function share() {
  const text = shareMessage(settings()); if (!text) return;
  if (Capacitor.isNativePlatform()) { try { await Share.share({ title:'Como chegar', text, dialogTitle:'Compartilhar seu lugar' }); } catch { /* cancelado */ } return; }
  if (navigator.share) { try { await navigator.share({ title:'Como chegar', text }); } catch { /* cancelado */ } return; }
  bridge().external('https://wa.me/?text=' + encodeURIComponent(text));
}
async function expandShortLink(link) {
  try {
    const response = await CapacitorHttp.request({ url:link, method:'GET', responseType:'text', connectTimeout:10000, readTimeout:10000 });
    const direct = parseStreetView(response.url); if (direct) return direct;
    const links = String(response.data || '').match(/https:\/\/(?:www\.|maps\.)?google\.[a-z.]+\/maps\/[^"'\s\\<>]+/g) || [];
    for (const url of links.slice(0, 10)) { const parsed = parseStreetView(url.replaceAll('&amp;', '&')); if (parsed) return parsed; }
  } catch { /* rede indisponível ou link inválido */ }
  return null;
}
async function saveStreetView(value) {
  const owner = bridge()?.data(); if (!owner?.settings.location || !visible(owner) || busy()) return;
  const source = String(value || '').trim(), token = ++generation;
  let view = source ? parseStreetView(source) : null;
  if (source && !view && isShortMapsLink(source)) {
    readingLink = true; feedback = ''; watch(owner); repaint(); view = await expandShortLink(source);
    if (token !== generation || !visible(owner)) return;
    readingLink = false;
  }
  if (source && !view) { feedback = 'Não foi possível ler esse link de Street View. Confira o link; se ele for curto, tente com internet. O link anterior foi mantido.'; repaint(); return; }
  saving = true; repaint();
  const status = await saveChange(owner, () => ({ ...owner.settings.location, streetView:view ? { ...view, source } : null }));
  saving = false; if (!visible(owner)) return;
  feedback = status === 'saved' ? (view ? 'Vista de seu lugar salva. As imagens precisam de internet.' : 'Vista removida.') : status === 'failed' ? saveFailure : '';
  repaint();
}
async function onClick(event) {
  const el = event.target.closest?.('[data-place]'); if (!el?.closest('#dialog')) return;
  const action = el.dataset.place;
  if (action === 'cancel' || action === 'discard') { invalidate(); repaint(); return; }
  await pendingSave;
  if (!visible(bridge()?.data()) || busy()) return;
  if (action === 'mark') mark();
  else if (action === 'import') prepareExisting();
  else if (action === 'confirm') confirm();
  else if (action === 'share') share();
  else if (action === 'preview' && candidate) bridge().external(mapsLink(candidate.place.code));
  else if (action === 'open' && settings().location?.code) bridge().external(mapsLink(settings().location.code));
  else if (action === 'navigate' && settings().location) bridge().external(navigateLink(settings().location.latitude, settings().location.longitude));
  else if (action === 'street') { const link = streetViewLink(settings().location?.streetView); if (link) bridge().external(link); }
}
async function onChange(event) {
  if (!event.target.closest?.('#place-group')) return;
  if (event.target.id === 'place-code-input') { importCode = event.target.value; return; }
  if (event.target.id === 'place-origin') { importOrigin = event.target.value; return; }
  if (event.target.id === 'place-street') { await pendingSave; return saveStreetView(event.target.value); }
  if (!event.target.classList.contains('place-ref')) return;
  const owner = bridge()?.data(); if (!owner?.settings.location || !visible(owner)) return;
  const refs = [...document.querySelectorAll('#place-refs .place-ref')].map(el => el.value.trim().slice(0, 90)).filter(Boolean).slice(0, MAX_REFERENCES);
  const status = await saveChange(owner, () => { const next = { ...owner.settings.location, references:refs }; delete next.note; return next; });
  if (visible(owner) && status === 'failed') { feedback = saveFailure; repaint(); }
}
function onTyping(event) {
  if (event.target.id === 'place-code-input') importCode = event.target.value;
  if (!event.target.classList?.contains('place-ref') || !event.target.closest('#place-refs')) return;
  const inputs = [...document.querySelectorAll('#place-refs .place-ref')];
  if (inputs.length < MAX_REFERENCES && event.target === inputs.at(-1) && event.target.value.trim()) event.target.insertAdjacentHTML('afterend', refInput(inputs.length, ''));
}
let installed = false;
function install() {
  if (installed) return; installed = true;
  document.addEventListener('click', event => { onClick(event).catch(() => say('Não foi possível concluir. Tente novamente.')); });
  document.addEventListener('change', event => { onChange(event).catch(() => say('Gravação não confirmada. Tente novamente.')); });
  document.addEventListener('input', onTyping);
}
window.TerritorioPlace = { section, install };
install();
