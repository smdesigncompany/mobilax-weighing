import { memo } from 'react';

function ButtonImpl({ children, onClick, variant = 'primary', type = 'button' }) {
  const styles = {
    primary:
      'bg-accent-500 hover:bg-accent-400 text-steel-950 border border-accent-400/60 shadow-[0_0_24px_-6px_rgba(34,211,238,0.6)]',
    ghost:
      'bg-steel-800/70 hover:bg-steel-700 text-steel-100 border border-steel-600/70 hover:border-accent-500/40',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-md font-semibold text-xs uppercase tracking-[0.12em] transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export const Button = memo(ButtonImpl);
