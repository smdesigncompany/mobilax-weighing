import { memo } from 'react';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import { useBarcode, useCodeSource } from '../store/measureStore';

function CodeDisplayImpl() {
  const barcode = useBarcode();
  const source = useCodeSource();

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Label>Code colis</Label>
        {source === 'generated' ? (
          <Badge tone="warning">Code généré</Badge>
        ) : source === 'scanned' ? (
          <Badge tone="success">Code scanné</Badge>
        ) : null}
      </div>
      <div className="text-2xl font-mono font-semibold text-brand-900 truncate">
        {barcode || '—'}
      </div>
    </div>
  );
}

export const CodeDisplay = memo(CodeDisplayImpl);
