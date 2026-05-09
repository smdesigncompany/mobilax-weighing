import { memo } from 'react';

function ValueImpl({ children, unit, size = 'lg', tone = 'default' }) {
  const sizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-7xl leading-none',
    xl: 'text-8xl leading-none',
  };
  const tones = {
    default: 'text-white',
    accent: 'text-accent-400',
    muted: 'text-steel-200',
    dim: 'text-steel-400',
  };
  const isEmpty = children === '—' || children == null;
  return (
    <div className="flex items-baseline gap-3">
      <span
        className={`${sizes[size]} font-mono font-semibold tabular-nums ${
          isEmpty ? 'text-steel-500' : tones[tone]
        }`}
      >
        {children ?? '—'}
      </span>
      {unit ? (
        <span className="text-base text-steel-300 font-mono font-medium tracking-wide uppercase">
          {unit}
        </span>
      ) : null}
    </div>
  );
}

export const Value = memo(ValueImpl);
