import { memo } from 'react';

function ValueImpl({ children, unit, size = 'lg' }) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };
  return (
    <div className="flex items-baseline gap-2">
      <span className={`${sizes[size]} font-bold tabular-nums text-brand-900`}>{children ?? '—'}</span>
      {unit ? <span className="text-lg text-slate-500 font-medium">{unit}</span> : null}
    </div>
  );
}

export const Value = memo(ValueImpl);
