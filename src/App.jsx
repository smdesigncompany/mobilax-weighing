import { useEffect } from 'react';
import { PreparerPage } from './pages/PreparerPage';
import { startSerialBridge } from './services/serial';
import { startBridgeBridge } from './services/bridge';
// Cloud WS (startSocket) is intentionally disabled during COM-only testing.

export default function App() {
  useEffect(() => {
    startSerialBridge();
    startBridgeBridge();
  }, []);
  return <PreparerPage />;
}
