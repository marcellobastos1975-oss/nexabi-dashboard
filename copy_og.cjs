const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

const ogImagePublic = path.join(publicDir, 'og-image.png');
const ogPreviewPublic = path.join(publicDir, 'og-preview.png');

if (fs.existsSync(ogImagePublic) && fs.existsSync(distDir)) {
  fs.copyFileSync(ogImagePublic, path.join(distDir, 'og-image.png'));
  fs.copyFileSync(ogPreviewPublic, path.join(distDir, 'og-preview.png'));
  console.log('✅ Copied OG image to dist/og-image.png & dist/og-preview.png');
}

