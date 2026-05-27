const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, '../package.json');
const appJsonPath = path.join(__dirname, '../app.json');
const versionTsPath = path.join(__dirname, '../src/core/version.ts');

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

const parts = pkg.version.split('.').map(Number);
parts[2] += 1; // bump patch
const newVersion = parts.join('.');

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`package.json → ${newVersion}`);

// Update app.json
const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
appJson.expo.version = newVersion;
fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
console.log(`app.json → ${newVersion}`);

// Update src/core/version.ts
const versionTsContent = `export const APP_VERSION = '${newVersion}';\n`;
fs.writeFileSync(versionTsPath, versionTsContent);
console.log(`src/core/version.ts → ${newVersion}`);

console.log(`\n✓ Version bumped to ${newVersion}`);
