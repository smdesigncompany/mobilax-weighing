const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');

// Wires up auto-update for packaged builds.
// In dev (app.isPackaged === false), this is a no-op so we don't poll
// the release server while iterating locally.
function setupAutoUpdater(app, win) {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('updater:status', { state: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    win?.webContents.send('updater:status', { state: 'idle' });
  });

  autoUpdater.on('download-progress', (p) => {
    win?.webContents.send('updater:status', { state: 'downloading', percent: p.percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    win?.webContents.send('updater:status', { state: 'ready', version: info.version });
    dialog.showMessageBox(win, {
      type: 'info',
      buttons: ['Redémarrer maintenant', 'Plus tard'],
      defaultId: 0,
      cancelId: 1,
      title: 'Mise à jour prête',
      message: `Mobilax Weighing ${info.version} est prêt à être installé.`,
      detail: 'L\'application va redémarrer pour appliquer la mise à jour.',
    }).then((res) => {
      if (res.response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    win?.webContents.send('updater:status', { state: 'error', message: err?.message || 'unknown' });
  });

  // Initial check + every 30 min
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  setInterval(() => autoUpdater.checkForUpdatesAndNotify().catch(() => {}), 30 * 60 * 1000);
}

module.exports = { setupAutoUpdater };
