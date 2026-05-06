const net = require('net');

function startHengxunListener({ onMeasure, port = Number(process.env.HENGXUN_TCP_PORT) || 0 } = {}) {
  if (!port) {
    console.log('[hengxun-tcp] disabled (set HENGXUN_TCP_PORT to enable)');
    return null;
  }

  const server = net.createServer((socket) => {
    let buffer = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        try {
          onMeasure(JSON.parse(line));
          socket.write(JSON.stringify({ result: 'OK' }) + '\n');
        } catch (e) {
          socket.write(JSON.stringify({ result: 'NOK', msg: e.message }) + '\n');
        }
      }
    });
    socket.on('error', () => {});
  });

  server.listen(port, () => console.log(`[hengxun-tcp] listening on ${port}`));
  return server;
}

module.exports = { startHengxunListener };
