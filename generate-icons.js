const fs = require('fs');
const path = require('path');

// This script uses sharp to convert SVG to PNG
// Install with: npm install sharp

async function generateIcons() {
  try {
    const sharp = require('sharp');
    const svgPath = path.join(__dirname, 'public', 'favicon.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate icon-192.png
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, 'public', 'icon-192.png'));

    // Generate icon-512.png
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, 'public', 'icon-512.png'));

    // Generate apple-touch-icon.png (180x180)
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, 'public', 'apple-touch-icon.png'));

    console.log('✅ All icon PNGs generated successfully!');
    console.log('   - icon-192.png');
    console.log('   - icon-512.png');
    console.log('   - apple-touch-icon.png');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Error: sharp module not found.');
      console.log('   Please install it with: npm install sharp');
    } else {
      console.error('❌ Error generating icons:', error.message);
    }
    process.exit(1);
  }
}

generateIcons();

