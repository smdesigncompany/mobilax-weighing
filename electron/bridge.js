// Spawns and manages MobilaxBridge.exe — the small C# helper that owns the
// Hikrobot camera connection. Its stdout is one JSON event per line; we
// parse it and forward to the host via the supplied `emit` callback so the
// host can both broadcast to the renderer and buffer for late subscribers.
//
// Bridge layout expected on Windows:
//   <appResources>/bridge/MobilaxBridge.exe
//   <appResources>/bridge/VolMeasure.Net.dll
//   <appResources>/HikBinoConfig/...
// On macOS / Linux dev, we emit a notice and skip spawning since the SDK
// is Windows-only.

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

function bridgePaths(app) {
  const isPackaged = app.isPackaged;
  if (isPackaged) {
    // electron-builder ships extraResources directly under <app>/resources
    return {
      bridgeExe: path.join(process.resourcesPath, 'bridge', 'MobilaxBridge.exe'),
      bridgeDir: path.join(process.resourcesPath, 'bridge'),
      configDir: path.join(process.resourcesPath, 'HikBinoConfig'),
      sdkDir: process.env.MOBILAX_SDK_DIR
        || 'D:\\项目软件\\V2.6.0_240618_实例分割版本stable\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
    };
  }
  const repo = path.join(__dirname, '..');
  return {
    bridgeExe: path.join(repo, 'bridge', 'dist', 'MobilaxBridge.exe'),
    bridgeDir: path.join(repo, 'bridge', 'dist'),
    configDir: path.join(repo, 'resources', 'HikBinoConfig'),
    sdkDir: process.env.MOBILAX_SDK_DIR
      || 'D:\\项目软件\\V2.6.0_240618_实例分割版本stable\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
  };
}

function setupBridge({ emit, app, mode = 14, serial }) {
  if (typeof emit !== 'function') throw new Error('setupBridge needs an emit fn');
  let proc = null;
  let killed = false;

  if (process.platform !== 'win32') {
    emit({ kind: 'init', text: 'bridge skipped (SDK is Windows-only)' });
    return { write: () => false, kill: () => {} };
  }

  const paths = bridgePaths(app);
  if (!fs.existsSync(paths.bridgeExe)) {
    emit({ kind: 'error', message: `bridge missing: ${paths.bridgeExe}` });
    return { write: () => false, kill: () => {} };
  }

  const args = [
    '--mode', String(mode),
    '--config', paths.configDir,
  ];
  if (serial) args.push('--serial', serial);

  emit({ kind: 'init', text: `spawning bridge from ${paths.bridgeExe}; cwd=${paths.sdkDir}` });

  // cwd is the SDK x64 folder so the 140+ native DLLs resolve from there.
  const cwd = fs.existsSync(paths.sdkDir) ? paths.sdkDir : paths.bridgeDir;

  proc = spawn(paths.bridgeExe, args, {
    cwd,
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stdoutBuf = '';
  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', (chunk) => {
    stdoutBuf += chunk;
    let nl;
    while ((nl = stdoutBuf.indexOf('\n')) >= 0) {
      const line = stdoutBuf.slice(0, nl).trim();
      stdoutBuf = stdoutBuf.slice(nl + 1);
      if (!line) continue;
      try {
        emit({ kind: 'event', payload: JSON.parse(line) });
      } catch {
        emit({ kind: 'raw', line });
      }
    }
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', (chunk) => {
    chunk.split(/\r?\n/).filter(Boolean).forEach((line) => emit({ kind: 'stderr', line }));
  });

  proc.on('exit', (code, signal) => {
    proc = null;
    if (killed) return;
    emit({ kind: 'exit', code, signal });
  });

  proc.on('error', (err) => emit({ kind: 'error', message: 'spawn failed: ' + err.message }));

  return {
    write: (cmd) => {
      if (!proc || !proc.stdin.writable) return false;
      try { proc.stdin.write(cmd.endsWith('\n') ? cmd : cmd + '\n'); return true; }
      catch { return false; }
    },
    kill: () => {
      killed = true;
      if (proc) { try { proc.kill(); } catch {} proc = null; }
    },
  };
}

module.exports = { setupBridge };
