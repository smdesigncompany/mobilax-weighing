import { memo, useState } from 'react';
import { Card } from '../atoms/Card';
import { Label } from '../atoms/Label';
import { Button } from '../atoms/Button';
import { sendSerial } from '../services/serial';

const PRESETS = [
  { label: 'P (print)', cmd: 'P\r\n' },
  { label: 'S (stable)', cmd: 'S\r\n' },
  { label: '? (query)', cmd: '?\r\n' },
  { label: 'W (weight)', cmd: 'W\r\n' },
  { label: 'CR/LF', cmd: '\r\n' },
  { label: 'ENQ', cmd: '\x05' },
];

// Manual probe panel: lets us send arbitrary bytes/strings to the balance
// to find the wake-up command it accepts. Each send is logged in the
// activity feed (kind=serial.sent) and any reply will arrive as serial.raw.
function SerialCommandBarImpl() {
  const [custom, setCustom] = useState('');

  const send = async (cmd) => {
    const result = await sendSerial(cmd);
    if (!result.ok) console.warn('sendSerial failed', result.error);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-steel-700/60">
        <Label>Commandes balance</Label>
        <span className="text-[10px] uppercase tracking-[0.16em] text-steel-400 font-mono">
          TX manuel
        </span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map((p) => (
          <Button key={p.label} variant="ghost" onClick={() => send(p.cmd)}>{p.label}</Button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="ex: P, ou \r\n pour CR/LF"
          className="flex-1 px-3 py-2 bg-steel-900 border border-steel-600 focus:border-accent-500 focus:outline-none rounded-md text-sm font-mono text-steel-100"
        />
        <Button onClick={() => send(custom.replace(/\\r/g, '\r').replace(/\\n/g, '\n'))}>
          Envoyer
        </Button>
      </div>
    </Card>
  );
}

export const SerialCommandBar = memo(SerialCommandBarImpl);
