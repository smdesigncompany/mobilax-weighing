// Resolves the API base URL and WebSocket URL.
// Priority:
//   1. localStorage override ("mobilax.apiBase") — set via the app settings UI
//   2. Build-time env: import.meta.env.VITE_API_BASE
//   3. Same origin (works for "all-in-one" deploys where backend serves the UI)
//
// API_BASE example: "https://api.mobilax.app"

const LS_KEY = 'mobilax.apiBase';

export function getApiBase() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
  if (stored) return stripTrailingSlash(stored);
  const fromEnv = import.meta.env.VITE_API_BASE;
  if (fromEnv) return stripTrailingSlash(fromEnv);
  return '';
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
  if (!base) {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    return `${proto}://${location.host}/ws`;
  }
  return base.replace(/^http/, 'ws') + '/ws';
}

function stripTrailingSlash(s) {
  return s.replace(/\/+$/, '');
}
