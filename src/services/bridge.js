// Subscribes to MobilaxBridge events forwarded by Electron main.
// Each entry on stdout from the C# helper is parsed once in the main
// process and arrives here as { kind: 'event', payload: { type, ts, ... } }.
// We translate the most useful types into the unified store fields used by
// the rest of the UI (live dims + locked measure when paired with weight).

import { useMeasureStore } from '../store/measureStore';

let unsubscribe = null;

export function startBridgeBridge() {
  if (typeof window === 'undefined' || !window.mobilax?.onBridgeEvent) return;
  if (unsubscribe) return;

  const dispatch = makeDispatcher();

  if (window.mobilax.flushBridge) {
    window.mobilax.flushBridge().then((buffered) => {
      (buffered || []).forEach(dispatch);
    }).catch(() => {});
  }
  unsubscribe = window.mobilax.onBridgeEvent(dispatch);
}

function makeDispatcher() {
  return (evt) => {
    const { pushEvent, setLiveDims } = useMeasureStore.getState();
    if (evt.kind === 'init') {
      pushEvent({ kind: 'bridge.init', text: evt.text || 'init' });
      return;
    }
    if (evt.kind === 'error') {
      pushEvent({ kind: 'bridge.error', text: evt.message || 'error' });
      return;
    }
    if (evt.kind === 'stderr') {
      pushEvent({ kind: 'bridge.stderr', text: evt.line });
      return;
    }
    if (evt.kind === 'exit') {
      pushEvent({ kind: 'bridge.exit', text: `exit code=${evt.code} signal=${evt.signal || '-'}` });
      return;
    }
    if (evt.kind === 'raw') {
      pushEvent({ kind: 'bridge.raw', text: evt.line });
      return;
    }
    if (evt.kind === 'event' && evt.payload) {
      const p = evt.payload;
      switch (p.type) {
        case 'ready':
          pushEvent({ kind: 'bridge.init', text: `ready (mode=${p.mode})` });
          break;
        case 'camera-found':
          pushEvent({ kind: 'bridge.init', text: `camera found: ${p.serial}` });
          break;
        case 'started':
          pushEvent({ kind: 'bridge.init', text: `streaming (mode=${p.mode})` });
          break;
        case 'volume':
          if (typeof setLiveDims === 'function') {
            setLiveDims({ len: p.len, width: p.width, height: p.height, vol: p.vol });
          }
          pushEvent({
            kind: 'bridge.volume',
            text: `vol=${p.vol} mm³ L${p.len}×l${p.width}×h${p.height}`,
          });
          break;
        case 'stopped':
          pushEvent({ kind: 'bridge.init', text: 'stopped' });
          break;
        case 'error':
          pushEvent({ kind: 'bridge.error', text: p.msg || 'error' });
          break;
        case 'info':
          pushEvent({ kind: 'bridge.init', text: p.msg || 'info' });
          break;
        default:
          pushEvent({ kind: 'bridge.raw', text: JSON.stringify(p).slice(0, 160) });
      }
    }
  };
}

export function stopBridgeBridge() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}

export async function sendBridge(cmd) {
  if (!window.mobilax?.sendBridge) return { ok: false, error: 'no preload' };
  try { return await window.mobilax.sendBridge(cmd); }
  catch (e) { return { ok: false, error: e.message }; }
}
