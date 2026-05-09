import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Value } from '../atoms/Value';
import { Badge } from '../atoms/Badge';
import { useWeight } from '../store/measureStore';

function WeightPanelImpl() {
  const weight = useWeight();
  const has = weight != null;
  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <Label>Poids verrouillé</Label>
        <Badge tone={has ? 'info' : 'neutral'}>{has ? 'Mesuré' : 'Vide'}</Badge>
      </div>
      <Value
        unit="kg"
        size="xl"
        tone={has ? 'accent' : 'dim'}
      >
        {has ? weight.toFixed(2) : '—'}
      </Value>
      {/* Decorative rule under the value */}
      <div className="mt-4 h-px bg-gradient-to-r from-steel-700/0 via-steel-600/60 to-steel-700/0" />
    </Card>
  );
}

export const WeightPanel = memo(WeightPanelImpl);
