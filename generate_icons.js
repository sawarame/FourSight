const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const isDev = process.argv.includes("--dev");
const isBeta = process.argv.includes("--beta");

const iconDir = path.join(__dirname, 'package', 'icons');

const svgPath = 
  isDev ? path.join(__dirname, 'src', 'icon_dev.svg') : 
  isBeta ? path.join(__dirname, 'src', 'icon_beta.svg') :
    path.join(__dirname, 'src', 'icon.svg');

if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

const svg = fs.readFileSync(svgPath);

const sizes = [16, 32, 48, 128];
Promise.all(sizes.map(size => 
  sharp(svg)
    .resize(size, size)
    .toFile(path.join(iconDir, `icon_${size}.png`))
)).then(() => console.log('Icons generated successfully in package/icons/'))
  .catch(err => console.error('Error generating icons:', err));
