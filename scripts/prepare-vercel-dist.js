const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Find frontend/dist regardless of current working directory
const rootDir = fs.existsSync(path.resolve('frontend')) 
  ? path.resolve('.') 
  : path.resolve('..');

const frontendDist = path.join(rootDir, 'frontend', 'dist');
const rootDist = path.join(rootDir, 'dist');
const nestedDist = path.join(rootDir, 'frontend', 'frontend', 'dist');

if (fs.existsSync(frontendDist)) {
  copyDir(frontendDist, rootDist);
  copyDir(frontendDist, nestedDist);
  console.log('✓ Mirroring build output to dist/ and frontend/frontend/dist/');
} else {
  console.warn('⚠️ frontend/dist directory not found');
}
