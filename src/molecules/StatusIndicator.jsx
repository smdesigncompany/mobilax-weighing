import { memo } from 'react';
import { useStatus } from '../store/measureStore';

const map = {
  idle:      { label: "En attente d'un colis", tone: 'bg-steel-700/60 text-steel-200 border-steel-600/60', dot: 'bg-steel-400' },
  measuring: { label: 'Mesure en cours…',       tone: 'bg-amber-500/10 text-amber-300 border-amber-500/30', dot: 'bg-amber-400 animate-pulse' },
  ready:     { label: 'Mesure validée',         tone: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.5)]' },
  error:     { label: 'Erreur',                 tone: 'bg-rose-500/10 text-rose-300 border-rose-500/30', dot: 'bg-rose-400' },
};

function StatusIndicatorImpl() {
  const status = useStatus();
  const { label, tone, dot } = map[status] ?? map.idle;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-[11px] font-semibold uppercase tracking-[0.14em] ${tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

export const StatusIndicator = memo(StatusIndicatorImpl);
