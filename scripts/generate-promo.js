import sharp from 'sharp';
import { createCanvas, loadImage, registerFont } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create promo directory if it doesn't exist
const promoDir = path.join(__dirname, '../promo');
if (!fs.existsSync(promoDir)) {
  fs.mkdirSync(promoDir);
}

// Create canvas
const canvas = createCanvas(1400, 560);
const ctx = canvas.getContext('2d');

// Function to draw rounded rectangle
function roundRect(x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  return ctx;
}

// Draw modern gradient background
const gradient = ctx.createLinearGradient(0, 0, 1400, 560);
gradient.addColorStop(0, '#1a1a1a');
gradient.addColorStop(1, '#2d2d2d');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1400, 560);

// Add subtle pattern overlay
ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
for (let i = 0; i < 1400; i += 40) {
  for (let j = 0; j < 560; j += 40) {
    ctx.beginPath();
    ctx.arc(i, j, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw left side content
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 72px Arial';
ctx.fillText('Easy Chrome', 100, 120);

// Add glowing effect for the title
ctx.shadowColor = '#4285F4';
ctx.shadowBlur = 20;
ctx.fillStyle = '#4285F4';
ctx.font = '32px Arial';
ctx.fillText('Your Essential Browser Companion', 100, 180);
ctx.shadowBlur = 0;

// Draw feature cards - now with more features in two columns
const leftFeatures = [
  { text: 'Hard Refresh & Cache', icon: '🔄', y: 250 },
  { text: 'Smart Note Taking', icon: '📝', y: 300 },
  { text: 'URL Management', icon: '🔗', y: 350 },
  { text: 'Tab Organization', icon: '📑', y: 400 },
  { text: 'Auto Refresh Timer', icon: '⏱️', y: 450 },
  { text: 'Quick URL Shortening', icon: '🔗', y: 500 }
];

const rightFeatures = [
  { text: 'Daily URLs Tracking', icon: '📊', y: 250 },
  { text: 'Secure Data Storage', icon: '🔒', y: 300 },
  { text: 'Feedback System', icon: '💬', y: 350 },
  { text: 'Tab Archiving', icon: '📁', y: 400 },
  { text: 'Privacy Focused', icon: '🛡️', y: 450 },
  { text: 'Modern UI Design', icon: '🎨', y: 500 }
];

// Draw left column features
leftFeatures.forEach((feature) => {
  // Draw feature card background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(100, feature.y - 30, 300, 40, 10).fill();
  
  // Draw icon
  ctx.fillStyle = '#4285F4';
  ctx.font = '24px Arial';
  ctx.fillText(feature.icon, 120, feature.y);
  
  // Draw feature text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(feature.text, 160, feature.y);
});

// Draw right column features
rightFeatures.forEach((feature) => {
  // Draw feature card background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  roundRect(420, feature.y - 30, 300, 40, 10).fill();
  
  // Draw icon
  ctx.fillStyle = '#4285F4';
  ctx.font = '24px Arial';
  ctx.fillText(feature.icon, 440, feature.y);
  
  // Draw feature text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(feature.text, 480, feature.y);
});

// Draw right side mockup with 3D effect
ctx.fillStyle = '#ffffff';
roundRect(800, 50, 500, 450, 20).fill();

// Add mockup content
ctx.fillStyle = '#1a1a1a';
ctx.font = 'bold 24px Arial';
ctx.fillText('Browser Extension', 820, 90);

// Draw mockup interface elements
ctx.fillStyle = '#4285F4';
roundRect(820, 120, 460, 360, 5).fill();

// Add interface preview
ctx.fillStyle = '#ffffff';
ctx.font = '16px Arial';
ctx.fillText('Features Preview:', 840, 150);

// Draw sample interface elements
const interfaceElements = [
  { text: 'Hard Refresh', y: 190 },
  { text: 'Quick Notes', y: 230 },
  { text: 'URL Manager', y: 270 },
  { text: 'Tab Archive', y: 310 },
  { text: 'Auto Refresh', y: 350 },
  { text: 'Settings', y: 390 }
];

interfaceElements.forEach((element) => {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  roundRect(840, element.y - 20, 420, 30, 5).fill();
  ctx.fillStyle = '#4285F4';
  ctx.fillText(element.text, 855, element.y);
});

// Add decorative elements
ctx.fillStyle = 'rgba(66, 133, 244, 0.1)';
ctx.beginPath();
ctx.arc(1300, 100, 100, 0, Math.PI * 2);
ctx.fill();

// Convert canvas to buffer and save as JPEG
const buffer = canvas.toBuffer('image/jpeg');
sharp(buffer)
  .jpeg({ quality: 95 })
  .toFile(path.join(promoDir, 'promo.jpg'))
  .then(() => console.log('Promo image generated successfully!'))
  .catch(err => console.error('Error generating promo image:', err)); 