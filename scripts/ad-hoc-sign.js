// Runs after electron-builder finishes packaging the .app on macOS.
// Apple-Developer signing costs $99/year; for unsigned apps macOS labels
// them "damaged" via the quarantine flag. An ad-hoc signature ("-") makes
// macOS treat the bundle as locally signed, which removes the misleading
// "damaged" message after the user clears the quarantine.

const { execSync } = require('child_process');
const path = require('path');

exports.default = async function adHocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;
  const appPath = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`[ad-hoc-sign] signing ${appPath}`);
  execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
};
