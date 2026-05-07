import { useEffect } from 'react';
import { PreparerPage } from './pages/PreparerPage';
import { startSocket } from './services/socket';
import { startSerialBridge } from './services/serial';

export default function App() {
  useEffect(() => {
    startSocket();
    startSerialBridge();
  }, []);
  return <PreparerPage />;
}
