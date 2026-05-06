const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { startHengxunListener } = require('./hengxun/listener');
const { broadcast, registerClient } = require('./bus');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

let lastMeasure = null;

// Hengxun HTTP output endpoint (config the camera/balance to POST here)
app.post('/api/hengxun/data', (req, res) => {
  const measure = normalizeMeasure(req.body);
  if (!measure) return res.status(400).json({ result: 'NOK', msg: 'invalid payload' });
  lastMeasure = measure;
  broadcast({ type: 'measure', data: measure });
  res.json({ barcode: measure.barcode, result: 'OK' });
});

// Hengxun image upload (multipart) — placeholder, accepts and acks
app.post('/api/hengxun/image', (req, res) => {
  res.json({ barcode: req.body?.barcode || null, result: 'OK' });
});

app.get('/api/last', (req, res) => res.json(lastMeasure || {}));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Dev simulator — generates a random measure and broadcasts it.
// Useful when Hengxun hardware isn't connected (e.g. testing on Mac).
app.post('/api/dev/simulate', (req, res) => {
  const overrides = req.body && typeof req.body === 'object' ? req.body : {};
  const fake = {
    barcode: overrides.barcode ?? `BC${Math.floor(Math.random() * 1e10)}`,
    weight: overrides.weight ?? +(Math.random() * 20 + 0.5).toFixed(2),
    len: overrides.len ?? +(Math.random() * 400 + 100).toFixed(2),
    width: overrides.width ?? +(Math.random() * 300 + 80).toFixed(2),
    height: overrides.height ?? +(Math.random() * 200 + 50).toFixed(2),
  };
  const measure = normalizeMeasure(fake);
  if (!measure) return res.status(400).json({ result: 'NOK' });
  lastMeasure = measure;
  broadcast({ type: 'measure', data: measure });
  res.json({ result: 'OK', data: measure });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  registerClient(ws);
  if (lastMeasure) ws.send(JSON.stringify({ type: 'measure', data: lastMeasure }));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
  console.log(`[server] ws://localhost:${PORT}/ws`);
});

// Optional: also listen on a TCP socket for Hengxun TCP output
startHengxunListener({
  onMeasure: (m) => {
    const measure = normalizeMeasure(m);
    if (!measure) return;
    lastMeasure = measure;
    broadcast({ type: 'measure', data: measure });
  },
});

function normalizeMeasure(b) {
  if (!b || typeof b !== 'object') return null;
  const rawBarcode = (b.barcode ?? b.code ?? '').toString().trim();
  const weight = num(b.weight);
  const len = num(b.len ?? b.length);
  const width = num(b.width);
  const height = num(b.height);
  const vol = num(b.vol ?? b.volume) ?? (len && width && height ? +(len * width * height).toFixed(2) : null);
  const datetime = b.datetime || new Date().toISOString().replace('T', ' ').slice(0, 19);
  if (!rawBarcode && weight == null && vol == null) return null;

  const hasBarcode = rawBarcode.length > 0;
  return {
    barcode: hasBarcode ? rawBarcode : generateInternalCode(),
    codeSource: hasBarcode ? 'scanned' : 'generated',
    datetime,
    weight,
    len,
    width,
    height,
    vol,
  };
}

function generateInternalCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MBX-${ymd}-${rand}`;
}

function pad(n) { return n.toString().padStart(2, '0'); }

function num(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
