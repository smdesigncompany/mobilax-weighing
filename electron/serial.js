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

function setupSerial({
  emit,
  path = 'COM2',
  baudRate = 9600,
  dataBits = 8,
  parity = 'none',
  stopBits = 1,
  dtr = true,
  rts = true,
}) {
  if (typeof emit !== 'function') throw new Error('setupSerial requires an emit function');

  let port;
  let buffer = '';
  let lastWeight = null;
  let lastChangeAt = 0;
  let stableSent = null;
  let receivedAny = false;
  let pollHandle = null;
  let stopped = false;
  let reopenHandle = null;

  emit({ kind: 'init', text: `opening ${path} @ ${baudRate} ${dataBits}${parity[0].toUpperCase()}${stopBits} (dtr=${dtr}, rts=${rts})` });

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
      port = new SerialPort({ path, baudRate, dataBits, stopBits, parity }, (err) => {
        if (err) {
          emit({ kind: 'error', message: err.message, path });
          scheduleReopen();
          return;
        }
        // Many serial devices only emit when the host raises DTR/RTS.
        // We set them right after open and log the outcome so a missing
        // assertion is visible in the activity log.
        port.set({ dtr, rts }, (setErr) => {
          if (setErr) emit({ kind: 'error', message: `DTR/RTS set failed: ${setErr.message}` });
          else emit({ kind: 'init', text: `DTR=${dtr} RTS=${rts} asserted` });
        });
        emit({ kind: 'open', path, baudRate });
        setTimeout(startPolling, 500);
      });

      port.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        // 1. Yaohua / yhlo frames: ASCII like "=67.20000" with NO terminator,
        //    9 bytes, broadcast continuously. We extract every match greedily.
        const yhRe = /=([+-]?\d+(?:\.\d+)?)/g;
        let lastIndex = 0;
        let yh;
        while ((yh = yhRe.exec(buffer))) {
          handleLine(yh[0]);
          lastIndex = yh.index + yh[0].length;
        }
        if (lastIndex > 0) buffer = buffer.slice(lastIndex);
        // 2. Newline-terminated frames (Mettler / JSON / generic): keep working too.
        let m;
        while ((m = buffer.match(FRAME_DELIMITER))) {
          const idx = m.index;
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + m[0].length);
          if (line) handleLine(line);
        }
        if (buffer.length > 256) buffer = buffer.slice(-256);
      });

      port.on('close', () => { emit({ kind: 'close' }); scheduleReopen(); });
      port.on('error', (err) => emit({ kind: 'error', message: err.message, path }));
    } catch (e) {
      emit({ kind: 'error', message: `port construct failed: ${e.message}`, path });
      scheduleReopen();
    }
  };

  const scheduleReopen = () => {
    if (stopped) return;
    if (reopenHandle) clearTimeout(reopenHandle);
    reopenHandle = setTimeout(() => { reopenHandle = null; if (!stopped) open(); }, 2000);
  };

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
    close: () => new Promise((resolve) => {
      stopped = true;
      if (reopenHandle) { clearTimeout(reopenHandle); reopenHandle = null; }
      if (pollHandle) { clearInterval(pollHandle); pollHandle = null; }
      if (!port || !port.isOpen) return resolve();
      try {
        port.close((err) => {
          if (err) emit({ kind: 'error', message: `close: ${err.message}` });
          resolve();
        });
      } catch (e) {
        emit({ kind: 'error', message: `close threw: ${e.message}` });
        resolve();
      }
    }),
    write: (cmd) => writeCommand(cmd),
  };
}

function parseWeight(line) {
  // Yaohua / yhlo: "=67.20000"
  const yh = line.match(/^=([+-]?\d+(?:\.\d+)?)$/);
  if (yh) {
    const v = parseFloat(yh[1]);
    return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
  }
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

async function listPorts() {
  return SerialPort.list();
}

module.exports = { setupSerial, listPorts };
