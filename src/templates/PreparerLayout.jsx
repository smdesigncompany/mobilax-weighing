import { memo } from 'react';
import { Header } from '../organisms/Header';

function PreparerLayoutImpl({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Header />
      <main className="p-8">{children}</main>
    </div>
  );
}

export const PreparerLayout = memo(PreparerLayoutImpl);
