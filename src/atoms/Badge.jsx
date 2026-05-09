import { memo } from 'react';

const tones = {
  neutral: 'bg-steel-700/60 text-steel-200 border-steel-600/60',
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  danger:  'bg-rose-500/10 text-rose-300 border-rose-500/30',
  info:    'bg-accent-500/10 text-accent-400 border-accent-500/30',
};

function BadgeImpl({ children, tone = 'neutral' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md border text-[10px] font-semibold uppercase tracking-[0.12em] ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export const Badge = memo(BadgeImpl);
