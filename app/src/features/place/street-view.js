// Links indicados pelo produtor: validação local, sem afirmar cobertura ou disponibilidade online.
const number = value => value == null || String(value).trim() === '' ? null : Number.isFinite(Number(value)) ? Number(value) : null;
const validPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
const validPano = value => value == null || /^[A-Za-z0-9_-]{8,256}$/.test(value);
const googleHost = host => /^(?:(?:www|maps)\.)?google\.(?:com|com\.[a-z]{2}|co\.[a-z]{2}|[a-z]{2})$/i.test(host);
function readURL(input) {
  try { const url = new URL(String(input ?? '').trim()); return url.protocol === 'https:' && !url.username && !url.password && !url.port ? url : null; } catch { return null; }
}
function view(pano, lat, lng, heading, pitch) {
  if (!validPano(pano) || (!pano && !validPoint(lat, lng))) return null;
  if ((lat !== null || lng !== null) && !validPoint(lat, lng)) return null;
  if (heading !== null && (!Number.isFinite(heading) || heading < 0 || heading > 360)) return null;
  if (pitch !== null && (!Number.isFinite(pitch) || Math.abs(pitch) > 90)) return null;
  return { pano, lat, lng, heading, pitch };
}
export function parseStreetView(input) {
  const url = readURL(input);
  if (!url || !googleHost(url.hostname) || (!/^\/maps(?:\/|$)/.test(url.pathname) && !url.hostname.startsWith('maps.google.'))) return null;
  let decoded;
  try { decoded = decodeURIComponent(url.pathname + url.search); } catch { return null; }
  const p = url.searchParams;
  if (p.get('map_action') === 'pano') {
    let lat = null, lng = null;
    if (p.has('viewpoint')) {
      const pair = p.get('viewpoint').split(',');
      if (pair.length !== 2 || !validPoint(number(pair[0]), number(pair[1]))) return null;
      [lat, lng] = pair.map(number);
    }
    for (const key of ['heading', 'pitch']) if (p.has(key) && number(p.get(key)) === null) return null;
    return view(p.get('pano') || null, lat, lng, number(p.get('heading')), number(p.get('pitch')));
  }
  const at = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)((?:,[-\d.]+[a-z])*)/i);
  const pano = decoded.match(/!1s([A-Za-z0-9_-]{8,256})!2e/)?.[1] || p.get('panoid') || null;
  const parts = at?.[3] || '';
  if (!pano && p.get('layer') !== 'c' && !/,3a(?:,|$)/.test(parts)) return null;
  let lat = at ? number(at[1]) : null, lng = at ? number(at[2]) : null;
  if (p.has('cbll')) {
    const pair = p.get('cbll').split(',');
    if (pair.length !== 2 || !validPoint(number(pair[0]), number(pair[1]))) return null;
    [lat, lng] = pair.map(number);
  }
  const heading = number(parts.match(/,([-\d.]+)h/)?.[1]);
  const tilt = number(parts.match(/,([-\d.]+)t/)?.[1]);
  if (tilt !== null && (tilt < 0 || tilt > 180)) return null;
  return view(pano, lat, lng, heading, tilt === null ? null : Math.round((90 - tilt) * 10) / 10);
}
export function isShortMapsLink(input) {
  const url = readURL(input);
  return !!url && ((url.hostname === 'maps.app.goo.gl' && url.pathname.length > 1) || (url.hostname === 'goo.gl' && /^\/maps\/.+/.test(url.pathname)));
}
export function streetViewLink(input) {
  if (!input) return '';
  const value = view(input.pano ?? null, input.lat ?? null, input.lng ?? null, input.heading ?? null, input.pitch ?? null);
  if (!value) return '';
  const query = new URLSearchParams({ api: '1', map_action: 'pano' });
  if (value.pano) query.set('pano', value.pano);
  if (validPoint(value.lat, value.lng)) query.set('viewpoint', `${value.lat},${value.lng}`);
  if (value.heading !== null) query.set('heading', String(Math.round(value.heading)));
  if (value.pitch !== null) query.set('pitch', String(Math.round(value.pitch)));
  return `https://www.google.com/maps/@?${query.toString()}`;
}
