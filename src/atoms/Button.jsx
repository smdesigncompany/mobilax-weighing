import { memo } from 'react';

function ButtonImpl({ children, onClick, variant = 'primary', type = 'button' }) {
  const styles = {
    primary: 'bg-brand-600 hover:bg-brand-500 text-white',
    ghost: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export const Button = memo(ButtonImpl);
