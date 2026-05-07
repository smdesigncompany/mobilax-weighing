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
    <Card className="p-4">
      <Label>Tester la balance — envoyer une commande</Label>
      <div className="flex flex-wrap gap-2 mt-3">
        {PRESETS.map((p) => (
          <Button key={p.label} variant="ghost" onClick={() => send(p.cmd)}>{p.label}</Button>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <input
          type="text"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Commande (ex: P, ou \\r\\n pour CR/LF)"
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
        />
        <Button onClick={() => send(custom.replace(/\\r/g, '\r').replace(/\\n/g, '\n'))}>Envoyer</Button>
      </div>
    </Card>
  );
}

export const SerialCommandBar = memo(SerialCommandBarImpl);
