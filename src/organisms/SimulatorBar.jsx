import { memo } from 'react';
import { Button } from '../atoms/Button';
import { apiFetch } from '../services/socket';

// Single-button simulator: triggers a fresh measure (weight + dims + vol + QR).
// Uses no overrides so the backend rolls all values randomly each click.
function SimulatorBarImpl() {
  const simulate = () => {
    apiFetch('/api/dev/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
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

export const SimulatorBar = memo(SimulatorBarImpl);
