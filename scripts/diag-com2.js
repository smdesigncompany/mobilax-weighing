// Diagnostic-only listener for the balance's serial port.
// Logs both raw bytes (hex) and decoded text so we can see exactly what
// the balance emits in yhlo mode without making assumptions about format.
//
// Usage on the Windows PC:
//   1. Close DataOutput so it releases COM2
//   2. Run: node scripts/diag-com2.js
//   3. Place items on the balance, observe output
//   4. Ctrl-C to stop

const { SerialPort } = require('serialport');

const PATH = process.env.COM_PATH || 'COM2';
const BAUD = Number(process.env.COM_BAUD || 9600);

console.log(`[diag-com2] opening ${PATH} @ ${BAUD} baud, 8N1`);
const port = new SerialPort({
  path: PATH,
  baudRate: BAUD,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
}, (err) => {
  if (err) {
    console.error(`[diag-com2] open failed: ${err.message}`);
    process.exit(1);
  }
});

port.on('open', () => console.log('[diag-com2] open. Place an item on the balance...'));
port.on('error', (err) => console.error('[diag-com2] error:', err.message));

port.on('data', (chunk) => {
  const hex = chunk.toString('hex').match(/.{1,2}/g)?.join(' ') || '';
  const text = chunk.toString('utf8').replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  console.log(`[${new Date().toISOString()}] RAW (${chunk.length}B)  hex=${hex}  text="${text}"`);
});

process.on('SIGINT', () => {
  port.close(() => process.exit(0));
});
