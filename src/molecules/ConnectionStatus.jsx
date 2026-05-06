import { memo } from 'react';
import { StatusDot } from '../atoms/StatusDot';
import { useConnection } from '../store/measureStore';

const labels = {
  connected: 'Connecté',
  connecting: 'Connexion…',
  disconnected: 'Déconnecté',
};

function ConnectionStatusImpl() {
  const state = useConnection();
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <StatusDot state={state} />
      <span>{labels[state] ?? state}</span>
    </div>
  );
}

export const ConnectionStatus = memo(ConnectionStatusImpl);
