import { memo } from 'react';

function CardImpl({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 ${className}`}>
      {children}
    </div>
  );
}

export const Card = memo(CardImpl);
