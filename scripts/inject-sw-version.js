const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = process.env.EXPO_PUBLIC_APP_VERSION || packageJson.version;

// Update dist/ service worker (generated after expo export)
const distSwPath = path.join(__dirname, '../dist/service-worker.js');

if (fs.existsSync(distSwPath)) {
  let distContent = fs.readFileSync(distSwPath, 'utf8');
  distContent = distContent.replace('__APP_VERSION__', version);
  fs.writeFileSync(distSwPath, distContent);
  console.log(`[SW] Cache name set to: ipu-calc-${version}`);
} else {
  console.warn('[SW] dist/service-worker.js not found. Run build first.');
}