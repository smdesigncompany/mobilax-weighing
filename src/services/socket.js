// Singleton WebSocket service. Lives outside the React tree so reconnections
// don't trigger renders, and pushes updates to the store directly.
import { useMeasureStore } from '../store/measureStore';
import { getApiBase, getWsUrl } from './config';

let ws = null;
let reconnectTimer = null;
let started = false;

function connect() {
  const { setConnection, setMeasure, setError } = useMeasureStore.getState();
  setConnection('connecting');
  ws = new WebSocket(getWsUrl());

  ws.onopen = () => setConnection('connected');
  ws.onclose = () => {
    setConnection('disconnected');
    schedule();
  };
  ws.onerror = () => {
    setError('socket error');
  };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'measure') setMeasure(msg.data);
    } catch {
      // ignore malformed
    }
  };
}

function schedule() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 1500);
}

export function startSocket() {
  if (started) return;
  started = true;
  connect();
}

export function stopSocket() {
  started = false;
  if (ws) ws.close();
  if (reconnectTimer) clearTimeout(reconnectTimer);
}

export function apiFetch(path, options = {}) {
  return fetch(`${getApiBase()}${path}`, options);
}
