import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const rootDir = path.join(__dirname, '..');
const srcIconsDir = path.join(rootDir, 'src', 'icons');
const distDir = path.join(rootDir, 'dist');
const distIconsDir = path.join(distDir, 'icons');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create icons directory in dist if it doesn't exist
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true });
}

// Copy icons from src to dist
const iconFiles = fs.readdirSync(srcIconsDir);
iconFiles.forEach(file => {
  if (file.endsWith('.png')) {
    const srcPath = path.join(srcIconsDir, file);
    const destPath = path.join(distIconsDir, file);
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to dist/icons/`);
  }
});

// Copy manifest.json to dist
const manifestSrc = path.join(rootDir, 'manifest.json');
const manifestDest = path.join(distDir, 'manifest.json');
fs.copyFileSync(manifestSrc, manifestDest);
console.log('Copied manifest.json to dist/'); 