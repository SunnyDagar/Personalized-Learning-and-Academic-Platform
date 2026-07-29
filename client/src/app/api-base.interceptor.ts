import { HttpInterceptorFn, HttpRequest, HttpResponse, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * SaaS transport interceptor. Two modes, chosen by window.__API_BASE__:
 *
 *  1. Direct mode  (__API_BASE__ = '' or 'https://host')  — normal REST to /api/...
 *     Used on our own domain and for local dev.
 *
 *  2. Gateway mode (__API_BASE__ = 'gw.php' or ends in '/gw.php') — OPAQUE transport.
 *     Every /api/... call is rewritten to a single POST gw.php with an op-code and a
 *     payload. The client never sends a real endpoint name. Op-codes are opaque
 *     12-char tokens (the hashing salt lives only on the owner's server, never here).
 *     This is what ships to clients.
 */

// route (method + path prefix) -> opaque op-code. Order matters: first match wins.
const OPS: Array<[string, RegExp, string]> = [
  ['POST', /^\/api\/auth\/login\b/,           '1afb1d0716e4'],
  ['POST', /^\/api\/auth\/register\b/,         '74cdda188daa'],
  ['GET',  /^\/api\/auth\/me\b/,               '20660c6ed1bd'],
  ['GET',  /^\/api\/courses\/by-professor\b/,  '8c68422a3542'],
  ['GET',  /^\/api\/courses\b/,                '59c3e4262f51'],
  ['POST', /^\/api\/documents\/upload\b/,      '873be3c5772d'],
  ['GET',  /^\/api\/documents\b/,              'c2707a4308ae'],
  ['GET',  /^\/api\/chat\/history\b/,          '3212171548af'],
  ['POST', /^\/api\/chat\b/,                   '34ca3eb8cfc7'],
  ['GET',  /^\/api\/public\/brand\b/,          '935a92b96c1a'],
];

function resolveOp(method: string, url: string): string | null {
  const path = url.split('?')[0];
  for (const [m, re, code] of OPS) if (m === method && re.test(path)) return code;
  return null;
}

function queryToObj(url: string): Record<string, string> {
  const q = url.split('?')[1];
  const out: Record<string, string> = {};
  if (q) new URLSearchParams(q).forEach((v, k) => (out[k] = v));
  return out;
}

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = ((window as any).__API_BASE__ || '').replace(/\/$/, '');
  const gatewayMode = /(^|\/)gw\.php$/.test(base);

  // --- Gateway (opaque) mode ---
  if (gatewayMode && req.url.startsWith('/api')) {
    const op = resolveOp(req.method, req.url);
    if (op) {
      const auth = req.headers.get('Authorization') || '';
      const token = auth.replace(/^Bearer\s+/i, '');

      // File uploads stay multipart; pass the op as a query param on gw.php.
      if (req.body instanceof FormData) {
        const url = base + '?o=' + op + (token ? '&t=' + encodeURIComponent(token) : '');
        return next(req.clone({ url, method: 'POST' }));
      }

      const payload = { o: op, query: queryToObj(req.url), token, body: req.body ?? {} };
      const gwReq = new HttpRequest('POST', base, payload, { responseType: 'json' as const });
      return next(gwReq) as Observable<HttpEvent<any>>;
    }
    // no op mapping (e.g. Slice-2 endpoints not yet on the server) → let it 404 quietly
  }

  // --- Direct mode ---
  if (base && !gatewayMode && req.url.startsWith('/api')) {
    return next(req.clone({ url: base + req.url }));
  }
  return next(req);
};
