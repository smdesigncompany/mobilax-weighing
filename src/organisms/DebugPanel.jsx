import { memo, useState } from 'react';
import { Card } from '../atoms/Card';
import { Button } from '../atoms/Button';
import { useSerialLog } from '../store/measureStore';

// Floating debug panel: shows the last raw lines coming from the serial
// port plus the parser's interpretation, so we can diagnose issues
// remotely from a screenshot without needing log files.
function DebugPanelImpl() {
  const [open, setOpen] = useState(false);
  const log = useSerialLog();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 px-3 py-2 rounded-full bg-slate-800 text-white text-xs font-mono shadow-lg hover:bg-slate-700"
      >
        Debug ({log.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[520px] max-w-[95vw] z-40">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-brand-900">Debug — Serial COM</h3>
          <Button variant="ghost" onClick={() => setOpen(false)}>Fermer</Button>
        </div>
        <div className="bg-slate-900 text-slate-200 rounded-lg p-3 max-h-[280px] overflow-y-auto font-mono text-[11px] leading-relaxed">
          {log.length === 0 ? (
            <div className="text-slate-500">Aucune donnée pour l'instant.</div>
          ) : log.map((entry, i) => (
            <div key={i} className={kindColor(entry.kind)}>
              <span className="text-slate-500">{formatTime(entry.t)}</span>{' '}
              <span className="font-semibold">[{entry.kind}]</span>{' '}
              {entry.text}
              {entry.parsed != null && (
                <span className="text-emerald-400"> → poids: {entry.parsed} kg</span>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function kindColor(k) {
  switch (k) {
    case 'error': return 'text-rose-400';
    case 'open': case 'close': return 'text-amber-400';
    case 'raw': return 'text-slate-200';
    default: return 'text-slate-400';
  }
}

function formatTime(t) {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function pad(n) { return String(n).padStart(2, '0'); }

export const DebugPanel = memo(DebugPanelImpl);
