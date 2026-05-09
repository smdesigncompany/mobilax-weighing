import { memo } from 'react';
import { Header } from '../organisms/Header';

function PreparerLayoutImpl({ children }) {
  return (
    <div className="min-h-screen bg-steel-950 text-steel-100 font-sans relative">
      {/* Faint grid backdrop for industrial flavor */}
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-40" />
      <div className="relative">
        <Header />
        <main className="px-6 py-6 max-w-[1600px] mx-auto">{children}</main>
        <footer className="px-6 py-3 text-[10px] uppercase tracking-[0.18em] text-steel-500 font-mono border-t border-steel-700/40 flex items-center justify-between">
          <span>Mobilax · Hengxun Bridge · COM</span>
          <span>Système opérationnel</span>
        </footer>
      </div>
    </div>
  );
}

export const PreparerLayout = memo(PreparerLayoutImpl);
