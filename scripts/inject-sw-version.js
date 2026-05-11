const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const version = process.env.EXPO_PUBLIC_APP_VERSION || packageJson.version;

// Update both public/ and dist/ service workers
const publicSwPath = path.join(__dirname, '../public/service-worker.js');
const distSwPath = path.join(__dirname, '../dist/service-worker.js');

// Update public/ (used by Vercel directly)
if (fs.existsSync(publicSwPath)) {
  const publicContent = fs.readFileSync(publicSwPath, 'utf8');
  // Use regex to replace either the placeholder or an existing version pattern
  const publicUpdated = publicContent.replace(/ipu-calc-([\d.]+)/, `ipu-calc-${version}`).replace('__APP_VERSION__', version);
  fs.writeFileSync(publicSwPath, publicUpdated);
  console.log(`[SW] Public cache name set to: ipu-calc-${version}`);
}

// Update dist/ (used after expo export)
if (fs.existsSync(distSwPath)) {
  const distContent = fs.readFileSync(distSwPath, 'utf8');
  const distUpdated = distContent.replace(/ipu-calc-([\d.]+)/, `ipu-calc-${version}`).replace('__APP_VERSION__', version);
  fs.writeFileSync(distSwPath, distUpdated);
  console.log(`[SW] Dist cache name set to: ipu-calc-${version}`);
}