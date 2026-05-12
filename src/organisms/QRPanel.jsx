import { memo, useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Badge } from '../atoms/Badge';
import { useMeasureStore, useBarcode, useCodeSource, useStatus, usePrinter } from '../store/measureStore';
import { buildQRPayload, renderQRDataURL } from '../services/qrService';

// Subscribes via a derived selector so the QR re-renders only when the
// QR-relevant fields actually change (not on connection events, etc.).
const selQRSeed = (s) => {
  const m = s.measure;
  if (!m) return null;
  return `${m.barcode}|${m.weight}|${m.len}|${m.width}|${m.height}|${m.vol}|${m.printer}`;
};

// Printer slot → tailwind classes for the badge. Keeps the three slots
// distinguishable at a glance.
const PRINTER_TONES = {
  1: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
  2: 'bg-violet-500/15 text-violet-300 border-violet-500/40',
  3: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
};

function QRPanelImpl() {
  const seed = useMeasureStore(selQRSeed);
  const [src, setSrc] = useState(null);
  const barcode = useBarcode();
  const source = useCodeSource();
  const status = useStatus();
  const printer = usePrinter();
  const relocking = status === 'relocking';

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
        <Badge tone={relocking ? 'warning' : src ? 'success' : 'neutral'}>
          {relocking ? '↻ Mise à jour…' : src ? 'Prêt' : 'En attente'}
        </Badge>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {src ? (
          <>
            <div className={`relative p-4 bg-white rounded-md transition-opacity ${
              relocking
                ? 'opacity-50 shadow-[0_0_40px_-10px_rgba(56,189,248,0.4)]'
                : 'shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)]'
            }`}>
              <img src={src} alt="QR code colis" className="w-[300px] h-[300px] block" />
              <span className={`absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 ${relocking ? 'border-sky-400 animate-pulse' : 'border-accent-500'}`} />
              <span className={`absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 ${relocking ? 'border-sky-400 animate-pulse' : 'border-accent-500'}`} />
              <span className={`absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 ${relocking ? 'border-sky-400 animate-pulse' : 'border-accent-500'}`} />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 ${relocking ? 'border-sky-400 animate-pulse' : 'border-accent-500'}`} />
            </div>
            {barcode && (
              <div className="flex items-center gap-2 text-center">
                <span className="text-xs font-mono text-steel-300 tracking-wider">{barcode}</span>
                {source === 'generated' ? (
                  <span className="text-[9px] uppercase tracking-[0.12em] text-amber-400 font-semibold">généré</span>
                ) : source === 'scanned' ? (
                  <span className="text-[9px] uppercase tracking-[0.12em] text-emerald-400 font-semibold">scanné</span>
                ) : null}
              </div>
            )}
            {printer != null && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-[0.16em] ${
                PRINTER_TONES[printer] || 'bg-steel-700/40 text-steel-200 border-steel-600/60'
              }`}>
                <span className="text-base leading-none">🖨</span>
                Imprimante {printer}
              </div>
            )}
          </>
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
