// Resolves the API base URL and WebSocket URL.
// Priority:
//   1. localStorage override ("mobilax.apiBase") — set via the app settings UI
//   2. Build-time env: import.meta.env.VITE_API_BASE
//   3. Hardcoded production default below
//   4. Same origin (works for "all-in-one" deploys where backend serves the UI)

const LS_KEY = 'mobilax.apiBase';
// Cleared during COM-only testing. Restore to enable cloud sync later.
const DEFAULT_API_BASE = '';

export function getApiBase() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
  if (stored) return stripTrailingSlash(stored);
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return DEFAULT_API_BASE;
}

export function setApiBase(url) {
  if (!url) {
    localStorage.removeItem(LS_KEY);
    return;
  }
  localStorage.setItem(LS_KEY, stripTrailingSlash(url));
}

export function getWsUrl() {
  const base = getApiBase();
  if (base) return base.replace(/^http/, 'ws') + '/ws';
  // Same-origin fallback only for HTTP(S) contexts (e.g. served from the
  // backend in production). file:// has no host, so we report "no URL" and
  // the socket service stays disconnected until the user configures one.
  if (location.protocol === 'http:' || location.protocol === 'https:') {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }
  return null;
}

export function hasApiConfigured() {
  return Boolean(getApiBase()) || location.protocol === 'http:' || location.protocol === 'https:';
}

function stripTrailingSlash(s) {
  return s.replace(/\/+$/, '');
}
