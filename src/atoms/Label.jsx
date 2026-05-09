import { memo } from 'react';

function LabelImpl({ children }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.18em] text-steel-300 font-semibold">
      {children}
    </span>
  );
}

export const Label = memo(LabelImpl);
