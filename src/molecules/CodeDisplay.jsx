import { memo } from 'react';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import { useBarcode, useCodeSource } from '../store/measureStore';

function CodeDisplayImpl() {
  const barcode = useBarcode();
  const source = useCodeSource();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label>Code colis</Label>
        {source === 'generated' ? (
          <Badge tone="warning">Code généré</Badge>
        ) : source === 'scanned' ? (
          <Badge tone="success">Code scanné</Badge>
        ) : (
          <Badge tone="neutral">En attente</Badge>
        )}
      </div>
      <div
        className={`text-3xl font-mono font-semibold tracking-wider truncate ${
          barcode ? 'text-accent-400' : 'text-steel-500'
        }`}
      >
        {barcode || '— — — — —'}
      </div>
    </div>
  );
}

export const CodeDisplay = memo(CodeDisplayImpl);
