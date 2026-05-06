import { useEffect } from 'react';
import { PreparerPage } from './pages/PreparerPage';
import { startSocket } from './services/socket';

export default function App() {
  useEffect(() => { startSocket(); }, []);
  return <PreparerPage />;
}
