import { memo } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { useEventLog } from '../store/measureStore';

const KIND_STYLES = {
  'user.new':       { tone: 'text-accent-300',   pill: 'bg-accent-500/10 text-accent-400 border-accent-500/30',    label: 'Action' },
  'user.simulate':  { tone: 'text-amber-300',    pill: 'bg-amber-500/10 text-amber-300 border-amber-500/30',       label: 'Test' },
  'measure.locked': { tone: 'text-emerald-300',  pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', label: 'Mesure' },
  'serial.open':    { tone: 'text-emerald-300',  pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', label: 'Balance' },
  'serial.close':   { tone: 'text-steel-300',    pill: 'bg-steel-700/60 text-steel-200 border-steel-600/60',       label: 'Balance' },
  'serial.error':   { tone: 'text-rose-300',     pill: 'bg-rose-500/10 text-rose-300 border-rose-500/30',          label: 'Erreur' },
  'serial.raw':     { tone: 'text-steel-100',    pill: 'bg-steel-700/60 text-steel-200 border-steel-600/60',       label: 'COM' },
  'serial.sent':    { tone: 'text-indigo-300',   pill: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',    label: 'TX' },
  'response.ok':    { tone: 'text-emerald-300',  pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', label: 'Réponse' },
  'response.error': { tone: 'text-rose-300',     pill: 'bg-rose-500/10 text-rose-300 border-rose-500/30',          label: 'Erreur' },
  'bridge.init':    { tone: 'text-cyan-300',     pill: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',          label: 'Caméra' },
  'bridge.volume':  { tone: 'text-emerald-300',  pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', label: 'Volume' },
  'bridge.error':   { tone: 'text-rose-300',     pill: 'bg-rose-500/10 text-rose-300 border-rose-500/30',          label: 'Caméra' },
  'bridge.stderr':  { tone: 'text-amber-300',    pill: 'bg-amber-500/10 text-amber-300 border-amber-500/30',       label: 'Caméra' },
  'bridge.exit':    { tone: 'text-rose-300',     pill: 'bg-rose-500/10 text-rose-300 border-rose-500/30',          label: 'Caméra' },
  'bridge.raw':     { tone: 'text-steel-100',    pill: 'bg-steel-700/60 text-steel-200 border-steel-600/60',       label: 'Caméra' },
};

function ActivityLogImpl() {
  const log = useEventLog();
  const reversed = [...log].reverse();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-steel-700/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-400 pulse-accent" />
          <Label>Journal d'activité</Label>
        </div>
        <span className="text-[10px] uppercase tracking-[0.16em] text-steel-400 font-mono">
          {log.length} évén.
        </span>
      </div>
      <div className="max-h-[260px] overflow-y-auto pr-1">
        {reversed.length === 0 ? (
          <div className="text-xs text-steel-400 py-6 text-center font-mono uppercase tracking-wider">
            ∅ Aucune activité
          </div>
        ) : (
          <ul className="divide-y divide-steel-700/40">
            {reversed.map((e, i) => {
              const cfg = KIND_STYLES[e.kind] || KIND_STYLES['serial.raw'];
              return (
                <li key={i} className="py-2 flex items-start gap-3 text-sm">
                  <span className="text-[11px] text-steel-400 font-mono tabular-nums w-16 shrink-0 pt-0.5">
                    {formatTime(e.t)}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-[0.12em] shrink-0 ${cfg.pill}`}>
                    {cfg.label}
                  </span>
                  <span className={`flex-1 ${cfg.tone} font-mono text-[12px] break-all leading-relaxed`}>
                    {e.text}
                    {e.parsed != null && (
                      <span className="ml-2 text-emerald-400 font-bold">→ {e.parsed} kg</span>
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
