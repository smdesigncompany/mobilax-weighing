import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { MeasureField } from '../molecules/MeasureField';
import { useDims, useVol } from '../store/measureStore';

function DimensionsPanelImpl() {
  const { len, width, height } = useDims();
  const vol = useVol();
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <Label>Dimensions colis</Label>
        <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-steel-400">
          mm
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-5">
        <MeasureField label="Longueur" value={fmt(len)}    unit="mm"  size="md" />
        <div className="border-l border-steel-700/60 pl-6">
          <MeasureField label="Largeur"  value={fmt(width)}  unit="mm"  size="md" />
        </div>
        <div className="border-t border-steel-700/60 pt-5">
          <MeasureField label="Hauteur"  value={fmt(height)} unit="mm"  size="md" />
        </div>
        <div className="border-t border-l border-steel-700/60 pt-5 pl-6">
          <MeasureField label="Volume"   value={fmt(vol)}    unit="mm³" size="md" />
        </div>
      </div>
    </Card>
  );
}

function fmt(v) {
  if (v == null) return null;
  return Number(v).toFixed(2);
}

export const DimensionsPanel = memo(DimensionsPanelImpl);
