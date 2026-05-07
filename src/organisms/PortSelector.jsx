import { memo, useEffect, useState } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { listSerialPorts, reconnectSerial } from '../services/serial';
import { useMeasureStore } from '../store/measureStore';

const BAUDS = [9600, 19200, 38400, 57600, 115200, 4800, 2400];
const PARITIES = ['none', 'even', 'odd'];
const DATABITS = [8, 7];
const STOPBITS = [1, 2];

function PortSelectorImpl() {
  const [ports, setPorts] = useState([]);
  const [path, setPath] = useState('COM2');
  const [baud, setBaud] = useState(9600);
  const [parity, setParity] = useState('none');
  const [dataBits, setDataBits] = useState(8);
  const [stopBits, setStopBits] = useState(1);
  const [dtr, setDtr] = useState(true);
  const [rts, setRts] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const r = await listSerialPorts();
    if (r.ok) setPorts(r.ports || []);
    else useMeasureStore.getState().pushEvent({ kind: 'serial.error', text: `listPorts: ${r.error}` });
  };

  useEffect(() => { refresh(); }, []);

  const connect = async () => {
    setBusy(true);
    useMeasureStore.getState().pushEvent({
      kind: 'user.new',
      text: `Reconnect ${path} ${baud} ${dataBits}${parity[0].toUpperCase()}${stopBits} dtr=${dtr} rts=${rts}`,
    });
    const r = await reconnectSerial({ path, baudRate: baud, parity, dataBits, stopBits, dtr, rts });
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

      <div className="grid grid-cols-2 gap-2 mb-3">
        <Field label="Port">
          <input value={path} onChange={(e) => setPath(e.target.value)} className="input" placeholder="COM2" />
        </Field>
        <Field label="Baud">
          <select value={baud} onChange={(e) => setBaud(Number(e.target.value))} className="input">
            {BAUDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Data bits">
          <select value={dataBits} onChange={(e) => setDataBits(Number(e.target.value))} className="input">
            {DATABITS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Parité">
          <select value={parity} onChange={(e) => setParity(e.target.value)} className="input">
            {PARITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Stop bits">
          <select value={stopBits} onChange={(e) => setStopBits(Number(e.target.value))} className="input">
            {STOPBITS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lignes contrôle">
          <div className="flex items-center gap-3 text-xs h-[34px]">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={dtr} onChange={(e) => setDtr(e.target.checked)} /> DTR
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked={rts} onChange={(e) => setRts(e.target.checked)} /> RTS
            </label>
          </div>
        </Field>
      </div>

      <div className="flex justify-end">
        <Button onClick={connect}>{busy ? '...' : 'Connecter'}</Button>
      </div>

      <style>{`.input { padding: 6px 10px; border: 1px solid rgb(203 213 225); border-radius: 8px; font-family: ui-monospace, monospace; font-size: 12px; width: 100%; }`}</style>
    </Card>
  );
}

const Field = memo(function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">{label}</span>
      {children}
    </label>
  );
});

export const PortSelector = memo(PortSelectorImpl);
