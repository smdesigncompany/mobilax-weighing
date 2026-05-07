const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mobilax', {
  onUpdaterStatus: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
  onSerialEvent: (cb) => {
    const handler = (_e, payload) => cb(payload);
    ipcRenderer.on('serial:event', handler);
    return () => ipcRenderer.removeListener('serial:event', handler);
  },
  flushSerial: () => ipcRenderer.invoke('serial:flush'),
});
