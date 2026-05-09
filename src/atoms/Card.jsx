import { memo } from 'react';

function CardImpl({ children, className = '' }) {
  return (
    <div className={`surface-panel rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export const Card = memo(CardImpl);
