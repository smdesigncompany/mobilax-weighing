import { memo } from 'react';
import { ConnectionStatus } from '../molecules/ConnectionStatus';
import { StatusIndicator } from '../molecules/StatusIndicator';
import { SettingsButton } from '../molecules/SettingsButton';
import { UpdateBadge } from '../molecules/UpdateBadge';
import { SerialStatus } from '../molecules/SerialStatus';

function HeaderImpl() {
  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold">M</div>
        <div>
          <h1 className="text-lg font-semibold text-brand-900">Mobilax Weighing</h1>
          <p className="text-xs text-slate-500">Pesée & volumétrie connectée</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <UpdateBadge />
        <SerialStatus />
        <StatusIndicator />
        <ConnectionStatus />
        <SettingsButton />
      </div>
    </header>
  );
}

export const Header = memo(HeaderImpl);
