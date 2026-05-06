import { memo } from 'react';

const tones = {
  connected: 'bg-emerald-500',
  connecting: 'bg-amber-400 animate-pulse',
  disconnected: 'bg-rose-500',
};

function StatusDotImpl({ state }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${tones[state] ?? 'bg-slate-300'}`} />;
}

export const StatusDot = memo(StatusDotImpl);
