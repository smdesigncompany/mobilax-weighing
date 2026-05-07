const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setupAutoUpdater } = require('./updater');

// Buffered serial events emitted before the renderer is ready.
// Flushed when the renderer calls window.mobilax.flushSerial().
const serialBuffer = [];
function bufferEvent(evt) { serialBuffer.push(evt); if (serialBuffer.length > 200) serialBuffer.shift(); }

ipcMain.handle('serial:flush', () => serialBuffer.splice(0));

let serialModule;
try {
  serialModule = require('./serial');
  bufferEvent({ kind: 'init', text: 'serial module loaded' });
} catch (err) {
  bufferEvent({ kind: 'error', message: `failed to load serial module: ${err.message}`, path: 'COM?' });
  serialModule = null;
}

// The Electron app no longer spawns a local server.
// It is a thin wrapper around the React UI which connects to the
// remote API (configured via VITE_API_BASE at build time, or via the
// in-app settings stored in localStorage).

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: '#f8fafc',
    title: 'Mobilax Weighing',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (process.env.NODE_ENV === 'production' || app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } else {
    win.loadURL(devUrl);
  }

  setupAutoUpdater(app, win);

  // Forward serial events to the renderer + keep a buffer for late subscribers.
  const sendOrBuffer = (evt) => {
    bufferEvent(evt);
    if (!win.isDestroyed()) win.webContents.send('serial:event', evt);
  };

  let serialHandle = null;
  if (serialModule?.setupSerial) {
    try {
      serialHandle = serialModule.setupSerial({
        emit: sendOrBuffer,
        path: process.env.COM_PATH || 'COM2',
      });
      sendOrBuffer({ kind: 'init', text: 'setupSerial invoked' });
    } catch (err) {
      sendOrBuffer({ kind: 'error', message: `setupSerial threw: ${err.message}`, path: 'COM?' });
    }
  } else {
    sendOrBuffer({ kind: 'error', message: 'serial module unavailable (native bindings missing?)', path: 'COM?' });
  }

  // Renderer can ask the main process to send a custom command on the serial port.
  ipcMain.handle('serial:send', (_e, cmd) => {
    if (!serialHandle?.write) return { ok: false, error: 'no serial handle' };
    serialHandle.write(cmd);
    return { ok: true };
  });

  // Scan all available serial ports on the host.
  ipcMain.handle('serial:list', async () => {
    if (!serialModule?.listPorts) return { ok: false, error: 'serial module unavailable' };
    try {
      const ports = await serialModule.listPorts();
      return { ok: true, ports };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  // Reconnect on a different COM port at runtime.
  ipcMain.handle('serial:reconnect', async (_e, { path, baudRate }) => {
    if (!serialModule?.setupSerial) return { ok: false, error: 'serial module unavailable' };
    try {
      if (serialHandle?.close) await new Promise((r) => { try { serialHandle.close(); } finally { setTimeout(r, 200); } });
    } catch {}
    try {
      serialHandle = serialModule.setupSerial({ emit: sendOrBuffer, path, baudRate: baudRate || 9600 });
      sendOrBuffer({ kind: 'init', text: `reconnect on ${path}` });
      return { ok: true };
    } catch (err) {
      sendOrBuffer({ kind: 'error', message: `reconnect failed: ${err.message}`, path });
      return { ok: false, error: err.message };
    }
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
