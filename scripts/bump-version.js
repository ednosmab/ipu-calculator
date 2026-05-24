const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const [major, minor, patch] = pkg.version.split('.').map(Number);
pkg.version = `${major}.${minor}.${patch + 1}`;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// Sync version.ts
const versionTsPath = path.join(__dirname, '../src/core/version.ts');
fs.writeFileSync(versionTsPath, `export const APP_VERSION = '${pkg.version}';\n`);
console.log(`[Bump] Version updated to ${pkg.version}`);
