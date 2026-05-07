const { SerialPort } = require('serialport');

// Reads the balance on a serial port (default COM2 @ 9600 8N1) and pushes
// parsed weights to the renderer via IPC. Designed to be tolerant: it tries
// several balance text formats (yhlo, ST/GS, plain "12.34kg") and extracts
// the first plausible weight.

const FRAME_DELIMITER = /\r?\n/;
const STABLE_WINDOW_MS = 600;       // weight must hold this long to be 'stable'
const STABLE_TOLERANCE = 0.01;      // kg

function setupSerial(win, options = {}) {
  const path = options.path || process.env.COM_PATH || 'COM2';
  const baudRate = Number(options.baudRate || process.env.COM_BAUD || 9600);

  let port;
  let buffer = '';
  let lastWeight = null;
  let lastChangeAt = 0;
  let stableSent = null;

  const open = () => {
    port = new SerialPort({ path, baudRate, dataBits: 8, stopBits: 1, parity: 'none' }, (err) => {
      if (err) {
        emit('error', { message: err.message, path });
        scheduleReopen();
        return;
      }
      emit('open', { path, baudRate });
    });

    port.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx;
      while ((idx = buffer.search(FRAME_DELIMITER)) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + buffer.match(FRAME_DELIMITER)[0].length);
        if (line) handleLine(line);
      }
      // also try the buffer as-is (some balances don't terminate)
      if (buffer.length > 64) buffer = buffer.slice(-64);
    });

    port.on('close', () => {
      emit('close');
      scheduleReopen();
    });

    port.on('error', (err) => emit('error', { message: err.message }));
  };

  const scheduleReopen = () => setTimeout(open, 2000);

  const handleLine = (raw) => {
    const weight = parseWeight(raw);
    emit('raw', { line: raw, weight });
    if (weight == null) return;

    const now = Date.now();
    if (lastWeight == null || Math.abs(weight - lastWeight) > STABLE_TOLERANCE) {
      lastWeight = weight;
      lastChangeAt = now;
      stableSent = null;
      emit('weight', { weight, stable: false });
      return;
    }

    emit('weight', { weight, stable: false });
    if (now - lastChangeAt >= STABLE_WINDOW_MS && stableSent !== weight) {
      stableSent = weight;
      emit('weight', { weight, stable: true });
    }
  };

  const emit = (kind, payload = {}) => {
    if (!win || win.isDestroyed()) return;
    win.webContents.send('serial:event', { kind, ...payload });
  };

  open();
  return { close: () => port?.close() };
}

// Parses a single line from the balance and returns the weight in kg, or null.
// Handles common formats:
//   yhlo:  "ST,GS,+0012.34kg"  /  "US,NT,-0001.20kg"
//   plain: "12.34kg"  /  "+0012.34"
//   JSON:  {"weight":12.34}
function parseWeight(line) {
  const json = tryJson(line);
  if (json && typeof json.weight === 'number') return json.weight;

  const num = line.match(/([+-]?\d+\.?\d*)\s*(?:kg|KG|g|G)?/);
  if (!num) return null;
  let v = parseFloat(num[1]);
  if (!Number.isFinite(v)) return null;
  // grams → kg if the token clearly says g (and not kg)
  if (/[^k]g\b/i.test(line) && !/kg/i.test(line)) v = v / 1000;
  return Math.round(v * 100) / 100;
}

function tryJson(s) {
  try { return JSON.parse(s); } catch { return null; }
}

module.exports = { setupSerial };
