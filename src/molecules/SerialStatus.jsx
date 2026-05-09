import { memo } from 'react';
import { Badge } from '../atoms/Badge';
import { useSerialStatus } from '../store/measureStore';

const labels = {
  open:    { tone: 'success', text: 'Balance' },
  closed:  { tone: 'neutral', text: 'Balance fermée' },
  error:   { tone: 'danger',  text: 'Balance erreur' },
  unknown: { tone: 'neutral', text: 'Balance —' },
};

function SerialStatusImpl() {
  const { status, error, path } = useSerialStatus();
  if (status === 'unknown' && !path) return null;
  const cfg = labels[status] || labels.unknown;
  const title = error ? `${cfg.text} (${error})` : path ? `${cfg.text} ${path}` : cfg.text;
  return (
    <span title={title}>
      <Badge tone={cfg.tone}>
        {cfg.text}{path ? ` ${path}` : ''}
      </Badge>
    </span>
  );
}

export const SerialStatus = memo(SerialStatusImpl);
