const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = process.env.EXPO_PUBLIC_APP_VERSION || packageJson.version;
const swPath = path.join(__dirname, '../dist/service-worker.js');

const content = fs.readFileSync(swPath, 'utf8');
const updated = content.replace('__APP_VERSION__', version);

fs.writeFileSync(swPath, updated);

console.log(`[SW] Cache name set to: ipu-calc-${version}`);