import { memo, useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import { useMeasureStore } from '../store/measureStore';
import { buildQRPayload, renderQRDataURL } from '../services/qrService';

// Subscribes via a derived selector so the QR re-renders only when the
// QR-relevant fields actually change (not on connection events, etc.).
const selQRSeed = (s) => {
  const m = s.measure;
  if (!m) return null;
  return `${m.barcode}|${m.weight}|${m.len}|${m.width}|${m.height}|${m.vol}`;
};

function QRPanelImpl() {
  const seed = useMeasureStore(selQRSeed);
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!seed) { setSrc(null); return; }
    const measure = useMeasureStore.getState().measure;
    const payload = buildQRPayload(measure);
    renderQRDataURL(payload, { width: 360 }).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => { cancelled = true; };
  }, [seed]);

  return (
    <Card className="p-6 flex flex-col min-h-[420px]">
      <div className="flex items-center justify-between mb-4">
        <Label>QR Code colis</Label>
        <Badge tone={src ? 'success' : 'neutral'}>
          {src ? 'Prêt' : 'En attente'}
        </Badge>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {src ? (
          <div className="relative p-4 bg-white rounded-md shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)]">
            <img src={src} alt="QR code colis" className="w-[320px] h-[320px] block" />
            {/* Industrial corner brackets */}
            <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-accent-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-accent-500" />
            <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-accent-500" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-accent-500" />
          </div>
        ) : (
          <div className="text-center select-none">
            <div className="mx-auto w-32 h-32 rounded-md border border-dashed border-steel-600 flex items-center justify-center mb-4">
              <span className="text-3xl font-mono text-steel-500">QR</span>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-steel-400 font-semibold">
              En attente d'une mesure
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export const QRPanel = memo(QRPanelImpl);
