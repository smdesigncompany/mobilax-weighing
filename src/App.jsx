import { useEffect } from 'react';
import { PreparerPage } from './pages/PreparerPage';
import { startSerialBridge } from './services/serial';
// Cloud WS (startSocket) is intentionally disabled during COM-only testing.
// Re-enable here once we're ready to push measures to the Render API.

export default function App() {
  useEffect(() => {
    startSerialBridge();
  }, []);
  return <PreparerPage />;
}
