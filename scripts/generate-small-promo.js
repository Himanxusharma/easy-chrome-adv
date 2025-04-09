import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';
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
const canvas = createCanvas(440, 280);
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
const gradient = ctx.createLinearGradient(0, 0, 440, 280);
gradient.addColorStop(0, '#0f172a');  // Darker blue
gradient.addColorStop(1, '#1e293b');  // Lighter blue
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 440, 280);

// Add modern pattern overlay
ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
for (let i = 0; i < 440; i += 15) {
  for (let j = 0; j < 280; j += 15) {
    ctx.beginPath();
    ctx.arc(i, j, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw decorative accent circles
const circles = [
  { x: 410, y: 40, radius: 60, color: 'rgba(66, 133, 244, 0.1)' },
  { x: 20, y: 260, radius: 40, color: 'rgba(52, 168, 83, 0.1)' }
];

circles.forEach(circle => {
  ctx.fillStyle = circle.color;
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
  ctx.fill();
});

// Draw title with enhanced glow effect
ctx.shadowColor = '#4285F4';
ctx.shadowBlur = 20;
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 40px Arial';
ctx.fillText('Easy Chrome', 30, 60);

// Add subtitle with subtle glow
ctx.shadowBlur = 10;
ctx.fillStyle = '#4285F4';
ctx.font = 'bold 18px Arial';
ctx.fillText('Your Essential Browser Companion', 30, 90);
ctx.shadowBlur = 0;

// Draw key features in a modern layout
const features = [
  { icon: '🔄', text: 'Quick Refresh & Cache', color: '#4285F4' },
  { icon: '📝', text: 'Smart Notes', color: '#34A853' },
  { icon: '🔗', text: 'URL Tools', color: '#FBBC05' },
  { icon: '📑', text: 'Tab Manager', color: '#EA4335' }
];

features.forEach((feature, index) => {
  const y = 135 + (index * 35);
  
  // Feature card background with gradient
  const cardGradient = ctx.createLinearGradient(30, y - 20, 210, y + 10);
  cardGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
  cardGradient.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = cardGradient;
  roundRect(30, y - 20, 180, 30, 8).fill();
  
  // Add subtle border
  ctx.strokeStyle = feature.color;
  ctx.lineWidth = 1;
  roundRect(30, y - 20, 180, 30, 8).stroke();
  
  // Draw icon with shadow
  ctx.shadowColor = feature.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial';
  ctx.fillText(feature.icon, 40, y);
  ctx.shadowBlur = 0;
  
  // Draw text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(feature.text, 70, y);
});

// Draw interface preview with enhanced design
ctx.fillStyle = '#ffffff';
ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
ctx.shadowBlur = 15;
roundRect(230, 40, 180, 220, 15).fill();
ctx.shadowBlur = 0;

// Interface header with gradient
const headerGradient = ctx.createLinearGradient(230, 40, 410, 75);
headerGradient.addColorStop(0, '#4285F4');
headerGradient.addColorStop(1, '#0F9D58');
ctx.fillStyle = headerGradient;
roundRect(230, 40, 180, 35, 15).fill();

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 14px Arial';
ctx.fillText('Browser Extension', 270, 62);

// Interface content with modern styling
const previewItems = ['Hard Refresh', 'Quick Notes', 'URL Tools', 'Settings'];
previewItems.forEach((item, index) => {
  const y = 100 + (index * 40);
  
  // Item background with hover effect
  const itemGradient = ctx.createLinearGradient(240, y - 15, 400, y + 15);
  itemGradient.addColorStop(0, 'rgba(66, 133, 244, 0.1)');
  itemGradient.addColorStop(1, 'rgba(52, 168, 83, 0.1)');
  ctx.fillStyle = itemGradient;
  roundRect(240, y - 15, 160, 30, 5).fill();
  
  // Item text with shadow
  ctx.fillStyle = '#4285F4';
  ctx.shadowColor = 'rgba(66, 133, 244, 0.2)';
  ctx.shadowBlur = 3;
  ctx.font = 'bold 13px Arial';
  ctx.fillText(item, 255, y);
  ctx.shadowBlur = 0;
});

// Convert canvas to buffer and save as JPEG
const buffer = canvas.toBuffer('image/jpeg');
sharp(buffer)
  .jpeg({ quality: 100 })
  .toFile(path.join(promoDir, 'promo-small.jpg'))
  .then(() => console.log('Small promo image generated successfully!'))
  .catch(err => console.error('Error generating small promo image:', err)); 