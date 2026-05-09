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
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-steel-700/60">
        <Label>Port série — sélection</Label>
        <Button variant="ghost" onClick={refresh}>Rafraîchir</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {ports.length === 0 ? (
          <Badge tone="warning">Aucun port détecté</Badge>
        ) : ports.map((p) => (
          <button
            key={p.path}
            onClick={() => setPath(p.path)}
            className={`text-[11px] font-mono px-2.5 py-1 rounded-md border transition uppercase tracking-wider ${
              path === p.path
                ? 'bg-accent-500 text-steel-950 border-accent-400 shadow-[0_0_18px_-4px_rgba(34,211,238,0.6)]'
                : 'bg-steel-800/60 text-steel-200 border-steel-600/60 hover:border-accent-500/40'
            }`}
            title={`${p.manufacturer || ''} ${p.pnpId || ''}`.trim() || undefined}
          >
            {p.path}{p.manufacturer ? ` (${p.manufacturer})` : ''}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Field label="Port">
          <input value={path} onChange={(e) => setPath(e.target.value)} className="industrial-input" placeholder="COM2" />
        </Field>
        <Field label="Baud">
          <select value={baud} onChange={(e) => setBaud(Number(e.target.value))} className="industrial-input">
            {BAUDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Data bits">
          <select value={dataBits} onChange={(e) => setDataBits(Number(e.target.value))} className="industrial-input">
            {DATABITS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Parité">
          <select value={parity} onChange={(e) => setParity(e.target.value)} className="industrial-input">
            {PARITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Stop bits">
          <select value={stopBits} onChange={(e) => setStopBits(Number(e.target.value))} className="industrial-input">
            {STOPBITS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lignes contrôle">
          <div className="flex items-center gap-3 text-xs h-[34px] text-steel-200">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={dtr} onChange={(e) => setDtr(e.target.checked)} className="accent-accent-500" /> DTR
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={rts} onChange={(e) => setRts(e.target.checked)} className="accent-accent-500" /> RTS
            </label>
          </div>
        </Field>
      </div>

      <div className="flex justify-end">
        <Button onClick={connect}>{busy ? '...' : 'Connecter'}</Button>
      </div>

      <style>{`
        .industrial-input {
          padding: 7px 10px;
          background: #0b111c;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 6px;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 12px;
          width: 100%;
          color: #e2e8f0;
          outline: none;
          transition: border-color 0.15s;
        }
        .industrial-input:focus {
          border-color: rgba(34, 211, 238, 0.6);
        }
      `}</style>
    </Card>
  );
}

const Field = memo(function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] uppercase tracking-[0.16em] text-steel-300 font-semibold">
        {label}
      </span>
      {children}
    </label>
  );
});

export const PortSelector = memo(PortSelectorImpl);
