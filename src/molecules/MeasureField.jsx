import { memo } from 'react';
import { Label } from '../atoms/Label';
import { Value } from '../atoms/Value';

function MeasureFieldImpl({ label, value, unit, size = 'md' }) {
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <Value unit={unit} size={size}>{value}</Value>
    </div>
  );
}

export const MeasureField = memo(MeasureFieldImpl);
