const fs = require('fs');
const path = require('path');

const srcPath = 'C:\\Users\\marce\\.gemini\\antigravity\\brain\\021a4c0b-6a2a-4195-b286-10ffa589eb5d\\og_image_1788129374404.jpg';
const publicDir = path.join(__dirname, 'public');
const distDir = path.join(__dirname, 'dist');

const ogImagePublic = path.join(publicDir, 'og-image.png');
const ogPreviewPublic = path.join(publicDir, 'og-preview.png');

if (fs.existsSync(srcPath)) {
  fs.copyFileSync(srcPath, ogImagePublic);
  fs.copyFileSync(srcPath, ogPreviewPublic);
  console.log('✅ Copied OG image to public/og-image.png & public/og-preview.png');
  
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(srcPath, path.join(distDir, 'og-image.png'));
    fs.copyFileSync(srcPath, path.join(distDir, 'og-preview.png'));
    console.log('✅ Copied OG image to dist/og-image.png & dist/og-preview.png');
  }
} else {
  console.error('❌ Source OG image not found:', srcPath);
}
