import { memo } from 'react';
import { Card } from '../atoms/Card';
import { MeasureField } from '../molecules/MeasureField';
import { useDims, useVol } from '../store/measureStore';

function DimensionsPanelImpl() {
  const { len, width, height } = useDims();
  const vol = useVol();
  return (
    <Card className="p-6 grid grid-cols-2 gap-6">
      <MeasureField label="Longueur" value={fmt(len)} unit="mm" size="md" />
      <MeasureField label="Largeur" value={fmt(width)} unit="mm" size="md" />
      <MeasureField label="Hauteur" value={fmt(height)} unit="mm" size="md" />
      <MeasureField label="Volume" value={fmt(vol)} unit="mm³" size="md" />
    </Card>
  );
}

function fmt(v) {
  if (v == null) return null;
  return Number(v).toFixed(2);
}

export const DimensionsPanel = memo(DimensionsPanelImpl);
