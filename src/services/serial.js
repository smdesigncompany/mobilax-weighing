import { useMeasureStore } from '../store/measureStore';

// Subscribes to Electron-main serial events via the preload bridge.
// On the web (no preload) this is a no-op so the UI still works in dev.
let unsubscribe = null;

export function startSerialBridge() {
  if (typeof window === 'undefined' || !window.mobilax?.onSerialEvent) {
    useMeasureStore.getState().pushEvent({
      kind: 'serial.error',
      text: 'IPC bridge mobilax indisponible — préload non chargé',
    });
    return;
  }
  if (unsubscribe) return;

  const dispatch = makeDispatcher();
  // Drain anything emitted before this listener was wired.
  if (window.mobilax.flushSerial) {
    window.mobilax.flushSerial().then((buffered) => {
      (buffered || []).forEach(dispatch);
    }).catch(() => {});
  }
  unsubscribe = window.mobilax.onSerialEvent(dispatch);
}

function makeDispatcher() {
  return (evt) => {
    const { setSerialStatus, setLiveWeight, pushEvent } = useMeasureStore.getState();
    switch (evt.kind) {
      case 'open':
        setSerialStatus({ status: 'open', path: evt.path });
        pushEvent({ kind: 'serial.open', text: `Port ${evt.path} ouvert @ ${evt.baudRate} baud` });
        break;
      case 'close':
        setSerialStatus({ status: 'closed' });
        pushEvent({ kind: 'serial.close', text: 'Port fermé' });
        break;
      case 'error':
        setSerialStatus({ status: 'error', error: evt.message, path: evt.path });
        pushEvent({ kind: 'serial.error', text: evt.message });
        break;
      case 'weight':
        setLiveWeight({ weight: evt.weight, stable: evt.stable });
        break;
      case 'raw':
        pushEvent({ kind: 'serial.raw', text: evt.line, parsed: evt.weight });
        break;
      case 'init':
        pushEvent({ kind: 'serial.open', text: evt.text || 'init' });
        break;
      case 'sent':
        pushEvent({ kind: 'serial.sent', text: `→ envoyé : ${evt.text}` });
        break;
    }
  };
}

export async function sendSerial(cmd) {
  if (!window.mobilax?.sendSerial) return { ok: false, error: 'no preload' };
  try {
    return await window.mobilax.sendSerial(cmd);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function listSerialPorts() {
  if (!window.mobilax?.listSerialPorts) return { ok: false, error: 'no preload' };
  return window.mobilax.listSerialPorts();
}

export async function reconnectSerial(cfg) {
  if (!window.mobilax?.reconnectSerial) return { ok: false, error: 'no preload' };
  return window.mobilax.reconnectSerial(cfg);
}

export function stopSerialBridge() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}
