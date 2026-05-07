import { memo } from 'react';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { useMeasureStore, usePendingId, useDailyCounter } from '../store/measureStore';
import { hasApiConfigured } from '../services/config';
import { apiFetch } from '../services/socket';

// Main operator action: arms the next package ID. Once armed, the
// next stable weight read from the balance (or HTTP/TCP measure) is
// recorded under that ID and the slot clears.
function NewPackageBarImpl() {
  const pendingId = usePendingId();
  const daily = useDailyCounter();

  const onNew = () => useMeasureStore.getState().newPackage();

  const onSimulate = async () => {
    const store = useMeasureStore.getState();
    store.pushEvent({ kind: 'user.simulate', text: 'Bouton Simuler cliqué' });
    if (hasApiConfigured()) {
      try {
        const res = await apiFetch('/api/dev/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const body = await res.json().catch(() => null);
        store.pushEvent({
          kind: res.ok ? 'response.ok' : 'response.error',
          text: `Réponse API /dev/simulate (${res.status}) — ${body ? JSON.stringify(body).slice(0, 160) : 'pas de corps'}`,
        });
      } catch (err) {
        store.pushEvent({ kind: 'response.error', text: `Erreur réseau simulate: ${err.message}` });
      }
      return;
    }
    const fake = buildLocalFakeMeasure();
    store.pushEvent({ kind: 'response.ok', text: `Mesure factice générée localement — ${fake.barcode}` });
    store.setMeasure(fake, 'simulate');
  };

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 bg-brand-50 border border-brand-100 rounded-xl">
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-brand-900 uppercase tracking-wider">
          Préparation
        </span>
        {pendingId ? (
          <Badge tone="info">En attente de pesée — {pendingId}</Badge>
        ) : (
          <span className="text-sm text-slate-600">Compteur du jour : {daily}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onSimulate}>Simuler (test)</Button>
        <Button onClick={onNew}>Nouveau colis</Button>
      </div>
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
    len, width, height,
    vol: +(len * width * height).toFixed(2),
  };
}

export const NewPackageBar = memo(NewPackageBarImpl);
