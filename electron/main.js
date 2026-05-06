const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { setupAutoUpdater } = require('./updater');

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
