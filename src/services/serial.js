import { useMeasureStore } from '../store/measureStore';

// Subscribes to Electron-main serial events via the preload bridge.
// On the web (no preload) this is a no-op so the UI still works in dev.
let unsubscribe = null;

export function startSerialBridge() {
  if (typeof window === 'undefined' || !window.mobilax?.onSerialEvent) return;
  if (unsubscribe) return;
  unsubscribe = window.mobilax.onSerialEvent((evt) => {
    const { setSerialStatus, setLiveWeight, pushSerialLog } = useMeasureStore.getState();
    switch (evt.kind) {
      case 'open':
        setSerialStatus({ status: 'open', path: evt.path });
        pushSerialLog({ kind: 'open', text: `port opened ${evt.path} @ ${evt.baudRate}` });
        break;
      case 'close':
        setSerialStatus({ status: 'closed' });
        pushSerialLog({ kind: 'close', text: 'port closed' });
        break;
      case 'error':
        setSerialStatus({ status: 'error', error: evt.message, path: evt.path });
        pushSerialLog({ kind: 'error', text: evt.message });
        break;
      case 'weight':
        setLiveWeight({ weight: evt.weight, stable: evt.stable });
        break;
      case 'raw':
        pushSerialLog({ kind: 'raw', text: evt.line, parsed: evt.weight });
        break;
    }
  });
}

export function stopSerialBridge() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
}
