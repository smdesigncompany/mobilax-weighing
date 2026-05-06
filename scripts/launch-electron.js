#!/usr/bin/env node
// Launches Electron with ELECTRON_RUN_AS_NODE removed from the env.
// Some macOS shells set this var globally, which forces Electron to run as
// plain Node and breaks `require('electron')`.

const { spawn } = require('child_process');
const electronPath = require('electron');

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env,
});

child.on('close', (code) => process.exit(code ?? 0));
