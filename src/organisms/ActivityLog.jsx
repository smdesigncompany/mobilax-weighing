import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { useEventLog } from '../store/measureStore';

const KIND_STYLES = {
  'user.new':       { tone: 'text-brand-700',    pill: 'bg-brand-100 text-brand-700',     label: 'Action' },
  'user.simulate':  { tone: 'text-amber-700',    pill: 'bg-amber-100 text-amber-800',     label: 'Test' },
  'measure.locked': { tone: 'text-emerald-700',  pill: 'bg-emerald-100 text-emerald-700', label: 'Mesure' },
  'serial.open':    { tone: 'text-emerald-700',  pill: 'bg-emerald-100 text-emerald-700', label: 'Balance' },
  'serial.close':   { tone: 'text-slate-600',    pill: 'bg-slate-100 text-slate-600',     label: 'Balance' },
  'serial.error':   { tone: 'text-rose-700',     pill: 'bg-rose-100 text-rose-700',       label: 'Erreur' },
  'serial.raw':     { tone: 'text-slate-700',    pill: 'bg-slate-100 text-slate-600',     label: 'COM' },
  'response.ok':    { tone: 'text-emerald-700',  pill: 'bg-emerald-100 text-emerald-700', label: 'Réponse' },
  'response.error': { tone: 'text-rose-700',     pill: 'bg-rose-100 text-rose-700',       label: 'Erreur' },
};

function ActivityLogImpl() {
  const log = useEventLog();
  const reversed = [...log].reverse();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <Label>Journal d'activité</Label>
        <span className="text-xs text-slate-500">{log.length} événements</span>
      </div>
      <div className="max-h-[260px] overflow-y-auto pr-1">
        {reversed.length === 0 ? (
          <div className="text-sm text-slate-400 py-4 text-center">
            Aucune activité — clique "Nouveau colis" ou pose un colis sur la balance.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {reversed.map((e, i) => {
              const cfg = KIND_STYLES[e.kind] || KIND_STYLES['serial.raw'];
              return (
                <li key={i} className="py-2 flex items-start gap-3 text-sm">
                  <span className="text-xs text-slate-400 tabular-nums w-16 shrink-0 pt-0.5">{formatTime(e.t)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${cfg.pill}`}>
                    {cfg.label}
                  </span>
                  <span className={`flex-1 ${cfg.tone} font-mono text-[12px] break-all`}>
                    {e.text}
                    {e.parsed != null && (
                      <span className="ml-2 text-emerald-600 font-semibold">→ {e.parsed} kg</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}

function formatTime(t) {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function pad(n) { return String(n).padStart(2, '0'); }

export const ActivityLog = memo(ActivityLogImpl);
