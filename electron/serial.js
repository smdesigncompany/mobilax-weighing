// Reads the balance on a serial port (default COM2 @ 9600 8N1) and emits
// parsed weights + raw frames + lifecycle events through a caller-supplied
// `emit` function. Designed so the host (Electron main) can both broadcast
// to the renderer and buffer for late subscribers.

const { SerialPort } = require('serialport');

const FRAME_DELIMITER = /\r?\n/;
const STABLE_WINDOW_MS = 600;
const STABLE_TOLERANCE = 0.01;

// Common wake-up commands many request/response balances respond to.
// Sent in order at intervals after the port opens, until raw data shows up.
const WAKE_COMMANDS = ['P\r\n', 'S\r\n', '?\r\n', 'W\r\n', 'p\r\n', 's\r\n'];

function setupSerial({ emit, path = 'COM2', baudRate = 9600 }) {
  if (typeof emit !== 'function') throw new Error('setupSerial requires an emit function');

  let port;
  let buffer = '';
  let lastWeight = null;
  let lastChangeAt = 0;
  let stableSent = null;
  let receivedAny = false;
  let pollHandle = null;

  emit({ kind: 'init', text: `opening ${path} @ ${baudRate} 8N1...` });

  const writeCommand = (cmd) => {
    if (!port || !port.isOpen) return;
    port.write(cmd, (err) => {
      if (err) emit({ kind: 'error', message: `write failed: ${err.message}` });
      else emit({ kind: 'sent', text: JSON.stringify(cmd) });
    });
  };

  const startPolling = () => {
    let i = 0;
    pollHandle = setInterval(() => {
      if (receivedAny) { clearInterval(pollHandle); pollHandle = null; return; }
      writeCommand(WAKE_COMMANDS[i % WAKE_COMMANDS.length]);
      i++;
      if (i > WAKE_COMMANDS.length * 3) { clearInterval(pollHandle); pollHandle = null; }
    }, 1000);
  };

  const open = () => {
    try {
      port = new SerialPort({ path, baudRate, dataBits: 8, stopBits: 1, parity: 'none' }, (err) => {
        if (err) {
          emit({ kind: 'error', message: err.message, path });
          scheduleReopen();
          return;
        }
        emit({ kind: 'open', path, baudRate });
        // Try wake-up commands in case the balance only emits on request.
        setTimeout(startPolling, 500);
      });

      port.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        let m;
        while ((m = buffer.match(FRAME_DELIMITER))) {
          const idx = m.index;
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + m[0].length);
          if (line) handleLine(line);
        }
        if (buffer.length > 64) buffer = buffer.slice(-64);
      });

      port.on('close', () => { emit({ kind: 'close' }); scheduleReopen(); });
      port.on('error', (err) => emit({ kind: 'error', message: err.message, path }));
    } catch (e) {
      emit({ kind: 'error', message: `port construct failed: ${e.message}`, path });
      scheduleReopen();
    }
  };

  const scheduleReopen = () => setTimeout(open, 2000);

  const handleLine = (raw) => {
    receivedAny = true;
    const weight = parseWeight(raw);
    emit({ kind: 'raw', line: raw, weight });
    if (weight == null) return;

    const now = Date.now();
    if (lastWeight == null || Math.abs(weight - lastWeight) > STABLE_TOLERANCE) {
      lastWeight = weight;
      lastChangeAt = now;
      stableSent = null;
      emit({ kind: 'weight', weight, stable: false });
      return;
    }
    emit({ kind: 'weight', weight, stable: false });
    if (now - lastChangeAt >= STABLE_WINDOW_MS && stableSent !== weight) {
      stableSent = weight;
      emit({ kind: 'weight', weight, stable: true });
    }
  };

  open();
  return {
    close: () => port?.close(),
    write: (cmd) => writeCommand(cmd),
  };
}

function parseWeight(line) {
  const json = tryJson(line);
  if (json && typeof json.weight === 'number') return json.weight;
  const num = line.match(/([+-]?\d+\.?\d*)\s*(?:kg|KG|g|G)?/);
  if (!num) return null;
  let v = parseFloat(num[1]);
  if (!Number.isFinite(v)) return null;
  if (/[^k]g\b/i.test(line) && !/kg/i.test(line)) v = v / 1000;
  return Math.round(v * 100) / 100;
}

function tryJson(s) { try { return JSON.parse(s); } catch { return null; } }

module.exports = { setupSerial };
