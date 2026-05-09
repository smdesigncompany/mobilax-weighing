import { memo } from 'react';

const tones = {
  connected:    'bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.45)]',
  connecting:   'bg-amber-400 animate-pulse shadow-[0_0_10px_2px_rgba(251,191,36,0.45)]',
  disconnected: 'bg-rose-500 shadow-[0_0_10px_2px_rgba(244,63,94,0.45)]',
};

function StatusDotImpl({ state }) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${tones[state] ?? 'bg-steel-500'}`}
    />
  );
}

export const StatusDot = memo(StatusDotImpl);
