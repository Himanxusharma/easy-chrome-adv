import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const inputSvg = path.join(__dirname, '../src/icons/icon.svg');
const outputDir = path.join(__dirname, '../src/icons');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PNGs for each size
for (const size of sizes) {
  try {
    await sharp(inputSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`Generated ${size}x${size} icon`);
  } catch (err) {
    console.error(`Error generating ${size}x${size} icon:`, err);
  }
} 