import { memo } from 'react';
import { Card } from '../atoms/Card';
import { MeasureField } from '../molecules/MeasureField';
import { useWeight } from '../store/measureStore';

function WeightPanelImpl() {
  const weight = useWeight();
  return (
    <Card className="p-6">
      <MeasureField
        label="Poids"
        value={weight != null ? weight.toFixed(2) : null}
        unit="kg"
        size="lg"
      />
    </Card>
  );
}

export const WeightPanel = memo(WeightPanelImpl);
