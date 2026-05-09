import { useEffect } from 'react';
import { PreparerPage } from './pages/PreparerPage';
import { startSerialBridge } from './services/serial';
import { startBridgeBridge } from './services/bridge';
import { useMeasureStore } from './store/measureStore';
// Cloud WS (startSocket) is intentionally disabled during COM-only testing.

export default function App() {
  useEffect(() => {
    const { pushEvent } = useMeasureStore.getState();
    pushEvent({ kind: 'user.new', text: `App montée v${__APP_VERSION__}` });

    if (typeof window !== 'undefined' && window.mobilax) {
      const apis = Object.keys(window.mobilax).join(', ');
      pushEvent({ kind: 'serial.open', text: `preload OK — apis: ${apis}` });
    } else {
      pushEvent({ kind: 'serial.error', text: 'preload mobilax indisponible — IPC cassée' });
    }

    pushEvent({ kind: 'serial.open', text: 'startSerialBridge() called' });
    startSerialBridge();

    pushEvent({ kind: 'bridge.init', text: 'startBridgeBridge() called' });
    startBridgeBridge();
  }, []);
  return <PreparerPage />;
}
