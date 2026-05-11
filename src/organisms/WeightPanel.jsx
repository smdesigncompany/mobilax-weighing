import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Value } from '../atoms/Value';
import { Badge } from '../atoms/Badge';
import { useWeight, useStatus } from '../store/measureStore';

function WeightPanelImpl() {
  const weight = useWeight();
  const status = useStatus();
  const has = weight != null;
  const relocking = status === 'relocking';
  return (
    <Card className={`p-6 relative overflow-hidden transition-opacity ${relocking ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <Label>Poids verrouillé</Label>
        <Badge tone={relocking ? 'warning' : has ? 'info' : 'neutral'}>
          {relocking ? '↻ Mise à jour…' : has ? 'Mesuré' : 'Vide'}
        </Badge>
      </div>
      <Value
        unit="kg"
        size="xl"
        tone={!has ? 'dim' : relocking ? 'dim' : 'accent'}
      >
        {has ? weight.toFixed(2) : '—'}
      </Value>
      {/* Decorative rule under the value */}
      <div className="mt-4 h-px bg-gradient-to-r from-steel-700/0 via-steel-600/60 to-steel-700/0" />
    </Card>
  );
}

export const WeightPanel = memo(WeightPanelImpl);
