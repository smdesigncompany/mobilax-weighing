import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import { useLiveWeight, useLiveStable } from '../store/measureStore';

// Continuous weight readout from the balance over the COM port.
// Stays separate from the locked measure so the live stream and the
// validated package data can both be visible.
function LiveWeightPanelImpl() {
  const weight = useLiveWeight();
  const stable = useLiveStable();
  const hasReading = weight != null;
  const display = hasReading ? weight.toFixed(2) : '—';

  return (
    <Card className="relative overflow-hidden">
      {/* Live indicator strip on the left edge */}
      <span
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          hasReading
            ? stable
              ? 'bg-emerald-400 shadow-[0_0_18px_2px_rgba(52,211,153,0.5)]'
              : 'bg-amber-400 animate-pulse'
            : 'bg-steel-600'
        }`}
      />
      <div className="flex items-center justify-between gap-6 px-6 py-5 pl-7">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${
              hasReading ? 'bg-accent-400 pulse-accent' : 'bg-steel-500'
            }`} />
            <Label>Poids en direct — balance</Label>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-6xl font-mono font-semibold tabular-nums tracking-tight ${
              hasReading ? 'text-white' : 'text-steel-500'
            }`}>
              {display}
            </span>
            <span className="text-xl text-steel-300 font-mono uppercase tracking-wider">kg</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {hasReading && (
            <Badge tone={stable ? 'success' : 'warning'}>
              {stable ? '● Stable' : '◌ Mouvement'}
            </Badge>
          )}
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-steel-400">
            Flux temps réel
          </span>
        </div>
      </div>
    </Card>
  );
}

export const LiveWeightPanel = memo(LiveWeightPanelImpl);
