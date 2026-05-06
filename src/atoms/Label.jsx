import { memo } from 'react';

function LabelImpl({ children }) {
  return <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">{children}</span>;
}

export const Label = memo(LabelImpl);
