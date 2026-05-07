const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');
const { startHengxunListener } = require('./hengxun/listener');
const { broadcast, registerClient } = require('./bus');

let lastMeasure = null;
const STATE = {};

function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  app.post('/api/hengxun/data', (req, res) => {
    const measure = normalizeMeasure(req.body);
    if (!measure) return res.status(400).json({ result: 'NOK', msg: 'invalid payload' });
    publishMeasure(measure);
    res.json({ barcode: measure.barcode, result: 'OK' });
  });

  app.post('/api/hengxun/image', (req, res) => res.json({ barcode: req.body?.barcode || null, result: 'OK' }));

  app.get('/api/last', (req, res) => res.json(lastMeasure || {}));
  app.get('/api/health', (req, res) => res.json({ ok: true, version: STATE.version || 'unknown' }));

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
    publishMeasure(measure);
    res.json({ result: 'OK', data: measure });
  });

  return app;
}

function publishMeasure(measure) {
  lastMeasure = measure;
  broadcast({ type: 'measure', data: measure });
}

function startServer({ port = process.env.PORT || 4000, tcpPort = process.env.HENGXUN_TCP_PORT, version } = {}) {
  STATE.version = version;
  const app = buildApp();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws) => {
    registerClient(ws);
    if (lastMeasure) ws.send(JSON.stringify({ type: 'measure', data: lastMeasure }));
  });
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[server] http://localhost:${port}  ws://localhost:${port}/ws`);
      if (tcpPort) {
        startHengxunListener({
          port: Number(tcpPort),
          onMeasure: (m) => {
            const measure = normalizeMeasure(m);
            if (measure) publishMeasure(measure);
          },
        });
      }
      resolve({ server, port });
    });
  });
}

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
    datetime, weight, len, width, height, vol,
  };
}

function generateInternalCode() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
  return `MBX-${ymd}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function pad(n) { return String(n).padStart(2, '0'); }
function num(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

module.exports = { startServer, publishMeasure, normalizeMeasure };

if (require.main === module) {
  startServer();
}
