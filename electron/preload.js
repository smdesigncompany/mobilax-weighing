const { contextBridge, ipcRenderer } = require('electron');

// Exposes a tiny API to the renderer for update events only.
// Anything else (HTTP, WS) goes directly to the remote API.
contextBridge.exposeInMainWorld('mobilax', {
  onUpdaterStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
