import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcIconsDir = path.join(__dirname, '../src/icons');
const distIconsDir = path.join(__dirname, '../dist/icons');

// Create dist/icons directory if it doesn't exist
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true });
}

// Copy all PNG files from src/icons to dist/icons
const files = fs.readdirSync(srcIconsDir);
files.forEach(file => {
  if (file.endsWith('.png')) {
    fs.copyFileSync(
      path.join(srcIconsDir, file),
      path.join(distIconsDir, file)
    );
    console.log(`Copied ${file} to dist/icons/`);
  }
}); 