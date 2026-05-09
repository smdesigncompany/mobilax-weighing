import { memo } from 'react';
import { Label } from '../atoms/Label';
import { Value } from '../atoms/Value';

function MeasureFieldImpl({ label, value, unit, size = 'md', tone = 'default' }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Value unit={unit} size={size} tone={tone}>{value}</Value>
    </div>
  );
}

export const MeasureField = memo(MeasureFieldImpl);
