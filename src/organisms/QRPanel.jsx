import { memo, useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
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
    <Card className="p-6 flex flex-col items-center justify-center min-h-[420px]">
      {src ? (
        <img src={src} alt="QR code colis" className="w-[360px] h-[360px]" />
      ) : (
        <div className="text-slate-400 text-center">
          <div className="text-5xl mb-3">⏳</div>
          <div>QR code en attente d'une mesure</div>
        </div>
      )}
    </Card>
  );
}

export const QRPanel = memo(QRPanelImpl);
