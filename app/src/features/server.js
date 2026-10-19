// The Território server (../portfolio-server): public portfolios, QR reads and encrypted backups.

export const API = (import.meta.env.VITE_PORTFOLIO_API || (import.meta.env.DEV ? 'http://127.0.0.1:8787' : '')).replace(/\/$/, '');

export class AuthError extends Error {}
export class NetworkError extends Error {}

// JSON in/out by default; `body` sends raw bytes or FormData; `raw` returns the Response itself.
export async function request(path, { token, json, body, method = 'POST', raw = false, timeoutMs = 0 } = {}) {
  const headers = {};
  if (token) headers.authorization = 'Bearer ' + token;
  if (json) headers['content-type'] = 'application/json';
  if (body instanceof Uint8Array) headers['content-type'] = 'application/octet-stream';
  let response;const controller=timeoutMs?new AbortController():null,timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
  try {
    response = await fetch(API + path, { method, headers, body: json ? JSON.stringify(json) : body, cache: 'no-store',...(controller?{signal:controller.signal}:{}) });
  } catch {
    throw new NetworkError('Sem conexão com a internet. Tente de novo quando tiver sinal.');
  } finally {if(timer)clearTimeout(timer);}
  if (response.status === 401) throw new AuthError('Sem permissão.');
  if (!response.ok) {
    let message = '';
    try { message = (await response.json()).error; } catch { /* not JSON */ }
    const error = new Error(message || 'O servidor não respondeu como esperado. Tente novamente.');
    error.status = response.status;
    throw error;
  }
  if (raw) return response;
  return response.status === 204 ? null : response.json();
}
