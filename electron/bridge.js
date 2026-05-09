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

// Candidate locations for the Hikrobot SDK x64 folder. The first one
// that exists on the host is used as cwd for MobilaxBridge.exe so all
// 140+ native DLLs (Qt5 / VTK / OpenBLAS / etc.) load correctly.
const SDK_CANDIDATES = [
  'D:\\项目软件\\V2.6.0_240618_实例分割版本stable\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
  'C:\\Users\\king\\Desktop\\新建文件夹\\V2.6.0_240618_实例分割版本stable\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
  'C:\\Users\\Public\\Desktop\\新建文件夹\\V2.6.0_240618_实例分割版本stable\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
  'C:\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
  'D:\\MvVolMeasureSDK\\Samples\\VolMeasureTools_V2.7_240618最新版本\\x64',
];

function findSdkDir(emit) {
  if (process.env.MOBILAX_SDK_DIR) {
    const p = process.env.MOBILAX_SDK_DIR;
    emit({ kind: 'init', text: `MOBILAX_SDK_DIR set: ${p}` });
    if (fs.existsSync(p)) return p;
    emit({ kind: 'error', message: `MOBILAX_SDK_DIR does not exist: ${p}` });
  }
  for (const p of SDK_CANDIDATES) {
    if (fs.existsSync(p)) {
      emit({ kind: 'init', text: `SDK found at: ${p}` });
      return p;
    }
  }
  emit({ kind: 'error', message: `no SDK found in any candidate path. Set MOBILAX_SDK_DIR or place SDK at one of: ${SDK_CANDIDATES.join(' | ')}` });
  return null;
}

function bridgePaths(app) {
  const isPackaged = app.isPackaged;
  if (isPackaged) {
    return {
      bridgeExe: path.join(process.resourcesPath, 'bridge', 'MobilaxBridge.exe'),
      bridgeDir: path.join(process.resourcesPath, 'bridge'),
      configDir: path.join(process.resourcesPath, 'HikBinoConfig'),
    };
  }
  const repo = path.join(__dirname, '..');
  return {
    bridgeExe: path.join(repo, 'bridge', 'dist', 'MobilaxBridge.exe'),
    bridgeDir: path.join(repo, 'bridge', 'dist'),
    configDir: path.join(repo, 'resources', 'HikBinoConfig'),
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

  emit({ kind: 'init', text: `platform=win32 isPackaged=${app.isPackaged} resourcesPath=${process.resourcesPath || '<dev>'}` });

  const paths = bridgePaths(app);
  emit({ kind: 'init', text: `bridgeExe=${paths.bridgeExe}` });
  emit({ kind: 'init', text: `bridgeDir=${paths.bridgeDir}` });
  emit({ kind: 'init', text: `configDir=${paths.configDir}` });

  if (!fs.existsSync(paths.bridgeExe)) {
    emit({ kind: 'error', message: `bridge.exe missing: ${paths.bridgeExe}` });
    // List what IS in the folder so we know what was bundled
    try {
      const list = fs.existsSync(paths.bridgeDir) ? fs.readdirSync(paths.bridgeDir) : ['<bridgeDir does not exist>'];
      emit({ kind: 'error', message: `bridgeDir contents: ${list.join(', ').slice(0, 400)}` });
    } catch (e) {
      emit({ kind: 'error', message: `could not list bridgeDir: ${e.message}` });
    }
    return { write: () => false, kill: () => {} };
  }
  emit({ kind: 'init', text: `bridge.exe OK (${fs.statSync(paths.bridgeExe).size} bytes)` });

  const sdkDir = findSdkDir(emit);
  const cwd = sdkDir || paths.bridgeDir;
  emit({ kind: 'init', text: `using cwd=${cwd}` });
  if (!sdkDir) {
    emit({ kind: 'error', message: 'no SDK x64 folder found — native DLLs will not load and the bridge will exit' });
  }

  // The SDK ships with a complete HikBinoConfig (incl. the 34 MB AI model
  // pkg_base_SF*.bin) inside its x64 folder. Prefer that one over the
  // smaller bundle we ship in resources/HikBinoConfig — Start() fails with
  // 0x8001100c when the AI model is missing.
  let configDir = paths.configDir;
  if (sdkDir) {
    const sdkConfig = path.join(sdkDir, 'HikBinoConfig');
    const hasModel = fs.existsSync(sdkConfig) &&
      fs.readdirSync(sdkConfig).some((f) => f.startsWith('pkg_base_SF') && f.endsWith('.bin'));
    if (hasModel) {
      configDir = sdkConfig;
      emit({ kind: 'init', text: `using full HikBinoConfig from SDK: ${configDir}` });
    } else {
      emit({ kind: 'init', text: `falling back to bundled HikBinoConfig (no AI model in SDK config)` });
    }
  }

  if (!fs.existsSync(configDir)) {
    emit({ kind: 'error', message: `HikBinoConfig folder missing at ${configDir}` });
  }

  const args = [
    '--mode', String(mode),
    '--config', configDir,
  ];
  if (serial) args.push('--serial', serial);

  emit({ kind: 'init', text: `spawning ${paths.bridgeExe} ${args.join(' ')}` });

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
