import { memo } from 'react';
import { StatusIndicator } from '../molecules/StatusIndicator';
import { SettingsButton } from '../molecules/SettingsButton';
import { UpdateBadge } from '../molecules/UpdateBadge';
import { SerialStatus } from '../molecules/SerialStatus';

function HeaderImpl() {
  return (
    <header className="relative flex items-center justify-between px-8 py-4 border-b border-steel-700/60 bg-steel-900/80 backdrop-blur supports-[backdrop-filter]:bg-steel-900/60">
      <div className="flex items-center gap-4">
        {/* Logo block — sharp, industrial, with accent edge */}
        <div className="relative w-11 h-11 rounded-md bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center font-extrabold text-steel-950 text-xl shadow-[0_0_24px_-6px_rgba(34,211,238,0.7)] border border-accent-400/50">
          M
          <span className="absolute -inset-px rounded-md ring-1 ring-inset ring-white/10 pointer-events-none" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-base font-bold text-white tracking-[0.18em] uppercase">
            Mobilax <span className="text-accent-400">Weighing</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.22em] text-steel-300 font-semibold">
            Station de pesée &amp; volumétrie
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-steel-700/60">
          <span className="text-[10px] uppercase tracking-[0.16em] text-steel-400 font-mono">
            v0.3
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <UpdateBadge />
        <SerialStatus />
        <StatusIndicator />
        <span className="w-px h-6 bg-steel-700/60" />
        <SettingsButton />
      </div>
      {/* Bottom accent rule */}
      <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-500/40 to-transparent" />
    </header>
  );
}

export const Header = memo(HeaderImpl);
