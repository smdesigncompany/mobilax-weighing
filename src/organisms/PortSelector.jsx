import { memo, useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { listSerialPorts, reconnectSerial } from '../services/serial';
import { useMeasureStore } from '../store/measureStore';

const BAUDS = [9600, 19200, 38400, 57600, 115200, 4800, 2400];

function PortSelectorImpl() {
  const [ports, setPorts] = useState([]);
  const [path, setPath] = useState('COM2');
  const [baud, setBaud] = useState(9600);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const r = await listSerialPorts();
    if (r.ok) setPorts(r.ports || []);
    else useMeasureStore.getState().pushEvent({ kind: 'serial.error', text: `listPorts: ${r.error}` });
  };

  useEffect(() => { refresh(); }, []);

  const connect = async () => {
    setBusy(true);
    useMeasureStore.getState().pushEvent({ kind: 'user.new', text: `Reconnect demandé sur ${path} @ ${baud}` });
    const r = await reconnectSerial({ path, baudRate: baud });
    setBusy(false);
    if (!r.ok) {
      useMeasureStore.getState().pushEvent({ kind: 'serial.error', text: `reconnect: ${r.error}` });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <Label>Port série — sélection</Label>
        <Button variant="ghost" onClick={refresh}>Rafraîchir</Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {ports.length === 0 ? (
          <Badge tone="warning">Aucun port détecté</Badge>
        ) : ports.map((p) => (
          <button
            key={p.path}
            onClick={() => setPath(p.path)}
            className={`text-xs px-2.5 py-1 rounded-full border transition ${
              path === p.path
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
            }`}
            title={`${p.manufacturer || ''} ${p.pnpId || ''}`.trim() || undefined}
          >
            {p.path}{p.manufacturer ? ` (${p.manufacturer})` : ''}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          className="w-28 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
          placeholder="COM2"
        />
        <select
          value={baud}
          onChange={(e) => setBaud(Number(e.target.value))}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
        >
          {BAUDS.map((b) => <option key={b} value={b}>{b} baud</option>)}
        </select>
        <Button onClick={connect}>{busy ? '...' : 'Connecter'}</Button>
      </div>
    </Card>
  );
}

export const PortSelector = memo(PortSelectorImpl);
