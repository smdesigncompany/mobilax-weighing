import { memo } from 'react';
import { useStatus } from '../store/measureStore';

const map = {
  idle: { label: 'En attente d\'un colis', tone: 'bg-slate-100 text-slate-600' },
  measuring: { label: 'Mesure en cours…', tone: 'bg-amber-100 text-amber-800' },
  ready: { label: 'Mesure validée', tone: 'bg-emerald-100 text-emerald-700' },
  error: { label: 'Erreur', tone: 'bg-rose-100 text-rose-700' },
};

function StatusIndicatorImpl() {
  const status = useStatus();
  const { label, tone } = map[status] ?? map.idle;
  return (
    <div className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${tone}`}>
      {label}
    </div>
  );
}

export const StatusIndicator = memo(StatusIndicatorImpl);
