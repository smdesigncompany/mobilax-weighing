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
  const display = weight != null ? weight.toFixed(2) : '—';
  return (
    <Card className="p-5 flex items-center justify-between">
      <div className="flex flex-col gap-1">
        <Label>Poids en direct (balance)</Label>
        <div className="text-3xl font-bold tabular-nums text-brand-900">
          {display} <span className="text-base text-slate-500 font-medium">kg</span>
        </div>
      </div>
      {weight != null && (
        <Badge tone={stable ? 'success' : 'warning'}>
          {stable ? 'Stable' : 'En mouvement'}
        </Badge>
      )}
    </Card>
  );
}

export const LiveWeightPanel = memo(LiveWeightPanelImpl);
