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
  const onValidate = () => useMeasureStore.getState().validateNow();

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
    <div className="relative flex items-center justify-between gap-4 px-6 py-4 surface-panel rounded-lg overflow-hidden">
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500" />
      <div className="flex items-center gap-4 pl-2">
        <span className="text-[10px] font-bold text-accent-400 uppercase tracking-[0.22em]">
          ▸ Préparation
        </span>
        <span className="w-px h-6 bg-steel-700/60" />
        {pendingId ? (
          <div className="flex items-center gap-2">
            <Badge tone="info">En attente de pesée</Badge>
            <span className="text-sm font-mono text-accent-400 tracking-wider">
              {pendingId}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-[0.16em] text-steel-300 font-semibold">
              Compteur du jour
            </span>
            <span className="text-2xl font-mono font-bold text-white tabular-nums">
              {String(daily).padStart(3, '0')}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onSimulate}>Simuler</Button>
        {pendingId && (
          <Button variant="ghost" onClick={onValidate}>Valider maintenant</Button>
        )}
        <Button onClick={onNew}>+ Nouveau colis</Button>
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
