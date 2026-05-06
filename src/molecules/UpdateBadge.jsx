import { memo, useEffect, useState } from 'react';
import { Badge } from '../atoms/Badge';

// Subscribes to the Electron auto-updater channel via the preload bridge.
// On the web (no preload), the hook never fires and the badge stays hidden.
function UpdateBadgeImpl() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.mobilax?.onUpdaterStatus) return;
    return window.mobilax.onUpdaterStatus(setStatus);
  }, []);

  if (!status || status.state === 'idle') return null;

  if (status.state === 'available') {
    return <Badge tone="info">MAJ disponible {status.version ? `v${status.version}` : ''}</Badge>;
  }
  if (status.state === 'downloading') {
    const pct = status.percent != null ? `${Math.round(status.percent)}%` : '…';
    return <Badge tone="info">Téléchargement MAJ {pct}</Badge>;
  }
  if (status.state === 'ready') {
    return <Badge tone="success">MAJ prête — redémarrer</Badge>;
  }
  if (status.state === 'error') {
    return <Badge tone="warning">MAJ erreur</Badge>;
  }
  return null;
}

export const UpdateBadge = memo(UpdateBadgeImpl);
