import { memo } from 'react';
import { Button } from '../atoms/Button';
import { apiFetch } from '../services/socket';
import { hasApiConfigured } from '../services/config';
import { useMeasureStore } from '../store/measureStore';

// Single-button simulator: triggers a fresh measure (weight + dims + vol + QR).
// In API-connected mode it hits the backend which broadcasts via WebSocket.
// In offline mode (no API base, file:// context) it pushes a fake measure
// directly into the store so the UI works without any backend.
function SimulatorBarImpl() {
  const simulate = () => {
    if (hasApiConfigured()) {
      apiFetch('/api/dev/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return;
    }
    useMeasureStore.getState().setMeasure(buildLocalFakeMeasure());
  };

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
      <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">
        Mode test (sans hardware Hengxun)
      </span>
      <Button onClick={simulate}>Simuler un colis</Button>
    </div>
  );
}

function buildLocalFakeMeasure() {
  const len = +(Math.random() * 400 + 100).toFixed(2);
  const width = +(Math.random() * 300 + 80).toFixed(2);
  const height = +(Math.random() * 200 + 50).toFixed(2);
  return {
    barcode: `BC${Math.floor(Math.random() * 1e10)}`,
    codeSource: 'scanned',
    datetime: new Date().toISOString().replace('T', ' ').slice(0, 19),
    weight: +(Math.random() * 20 + 0.5).toFixed(2),
    len,
    width,
    height,
    vol: +(len * width * height).toFixed(2),
  };
}

export const SimulatorBar = memo(SimulatorBarImpl);
