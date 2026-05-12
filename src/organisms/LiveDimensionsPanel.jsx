import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import { useLiveDims, useStatus, useLiveWeight } from '../store/measureStore';

// Mirror of LiveWeightPanel for the volumetric camera. Shows the latest
// frame the bridge delivered while a package is actually on the scale.
// When the scale is empty (status=idle, no weight) the cached dims are
// hidden — the store keeps them as a same-size-swap fallback for the
// lock logic, but they shouldn't read as "live" in the UI.
function LiveDimensionsPanelImpl() {
  const live = useLiveDims();
  const status = useStatus();
  const liveWeight = useLiveWeight();
  const onScale = status !== 'idle' && liveWeight != null && liveWeight > 0.05;
  const has = !!live && onScale;
  const len = has ? live.len : null;
  const width = has ? live.width : null;
  const height = has ? live.height : null;
  const vol = has ? live.vol : null;

  return (
    <Card className="relative overflow-hidden">
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          has
            ? 'bg-cyan-400 shadow-[0_0_18px_2px_rgba(34,211,238,0.45)]'
            : 'bg-steel-600'
        }`}
      />
      <div className="px-6 py-5 pl-7">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              has ? 'bg-cyan-400 pulse-accent' : 'bg-steel-500'
            }`} />
            <Label>Dimensions en direct — caméra</Label>
          </div>
          {has ? (
            <Badge tone="info">Flux temps réel</Badge>
          ) : (
            <Badge tone="neutral">En attente</Badge>
          )}
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Cell label="Longueur" value={fmt(len)} unit="mm" />
          <Cell label="Largeur"  value={fmt(width)} unit="mm" />
          <Cell label="Hauteur"  value={fmt(height)} unit="mm" />
          <Cell label="Volume"   value={fmtVol(vol)} unit="cm³" />
        </div>
      </div>
    </Card>
  );
}

const Cell = memo(function Cell({ label, value, unit }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.16em] text-steel-400 font-mono">
        {label}
      </span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-mono font-semibold tabular-nums text-white">
          {value ?? '—'}
        </span>
        <span className="text-xs text-steel-400 font-mono">{unit}</span>
      </div>
    </div>
  );
});

function fmt(v) {
  if (v == null) return null;
  return Number(v).toFixed(0);
}
function fmtVol(mm3) {
  if (mm3 == null) return null;
  // mm³ → cm³ for readable scale (1 cm³ = 1000 mm³)
  return (mm3 / 1000).toFixed(0);
}

export const LiveDimensionsPanel = memo(LiveDimensionsPanelImpl);
