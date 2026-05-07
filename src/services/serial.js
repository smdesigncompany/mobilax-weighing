import { useMeasureStore } from '../store/measureStore';

// Subscribes to Electron-main serial events via the preload bridge.
// On the web (no preload) this is a no-op so the UI still works in dev.
let unsubscribe = null;

export function startSerialBridge() {
  if (typeof window === 'undefined' || !window.mobilax?.onSerialEvent) return;
  if (unsubscribe) return;
  unsubscribe = window.mobilax.onSerialEvent((evt) => {
    const { setSerialStatus, setLiveWeight } = useMeasureStore.getState();
    switch (evt.kind) {
      case 'open':
        setSerialStatus({ status: 'open', path: evt.path });
        break;
      case 'close':
        setSerialStatus({ status: 'closed' });
        break;
      case 'error':
        setSerialStatus({ status: 'error', error: evt.message, path: evt.path });
        break;
      case 'weight':
        setLiveWeight({ weight: evt.weight, stable: evt.stable });
        break;
      // 'raw' kept for diagnostics; UI ignores it
    }
  });
}

export function stopSerialBridge() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}
