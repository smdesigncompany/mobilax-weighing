import { useMeasureStore } from '../store/measureStore';

// Subscribes to Electron-main serial events via the preload bridge.
// On the web (no preload) this is a no-op so the UI still works in dev.
let unsubscribe = null;

export function startSerialBridge() {
  if (typeof window === 'undefined' || !window.mobilax?.onSerialEvent) return;
  if (unsubscribe) return;
  unsubscribe = window.mobilax.onSerialEvent((evt) => {
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
    }
  });
}

export function stopSerialBridge() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}
