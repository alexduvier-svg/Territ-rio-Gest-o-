// Generates the Android launcher icons, themed (monochrome) icon, splash images and the
// Play Store icon from resources/icon.svg. Usage: npm run icons
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const res = resolve(root, 'android/app/src/main/res');
const foregroundSvg = readFileSync(resolve(root, 'resources/icon.svg'), 'utf8');

const BACKGROUND = { from: '#2F8A57', to: '#123D27' };
const backgroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="${BACKGROUND.from}"/><stop offset="1" stop-color="${BACKGROUND.to}"/>
  </linearGradient></defs>
  <rect width="108" height="108" fill="url(#bg)"/>
</svg>`;
// Android 13+ themed icons recolor a single-color silhouette.
const monochromeSvg = foregroundSvg.replace(/url\(#sun\)/g, '#FFFFFF');

const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const png = (svg, size) => sharp(Buffer.from(svg), { density: 72 * size / 108 * 4 }).resize(size, size).png();

async function composite(size, mask) {
  const layers = await Promise.all([png(backgroundSvg, size).toBuffer(), png(foregroundSvg, size).toBuffer()]);
  if (mask === 'none') return sharp(await sharp(layers[0]).composite([{ input: layers[1] }]).png().toBuffer());
  const shape = mask === 'circle'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size * 0.225}"/></svg>`;
  return sharp(layers[0]).composite([{ input: layers[1] }, { input: Buffer.from(shape), blend: 'dest-in' }]).png();
}

for (const [name, scale] of Object.entries(densities)) {
  const dir = resolve(res, 'mipmap-' + name);
  mkdirSync(dir, { recursive: true });
  const layer = Math.round(108 * scale);
  // Legacy (pre-Android 8) icons are 48dp; they show the adaptive artwork zoomed to its safe zone.
  const legacy = Math.round(48 * scale);
  const crop = Math.round(layer * 18 / 108);
  await png(foregroundSvg, layer).toFile(resolve(dir, 'ic_launcher_foreground.png'));
  await png(backgroundSvg, layer).toFile(resolve(dir, 'ic_launcher_background.png'));
  await png(monochromeSvg, layer).toFile(resolve(dir, 'ic_launcher_monochrome.png'));
  for (const [file, mask] of [['ic_launcher.png', 'rounded'], ['ic_launcher_round.png', 'circle']]) {
    const full = await (await composite(layer, 'none')).toBuffer();
    const zoomed = await sharp(full).extract({ left: crop, top: crop, width: layer - crop * 2, height: layer - crop * 2 }).resize(legacy, legacy).toBuffer();
    const maskSvg = mask === 'circle'
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${legacy}" height="${legacy}"><rect width="${legacy}" height="${legacy}" rx="${legacy * 0.2}"/></svg>`;
    await sharp(zoomed).composite([{ input: Buffer.from(maskSvg), blend: 'dest-in' }]).png().toFile(resolve(dir, file));
  }
}

const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`;
for (const file of ['ic_launcher.xml', 'ic_launcher_round.xml']) writeFileSync(resolve(res, 'mipmap-anydpi-v26', file), adaptive);

// Splash images used by Android < 12 and by the splash plugin's fallback: the icon centered on black.
const splashSizes = {
  'drawable': [480, 320], 'drawable-port-mdpi': [320, 480], 'drawable-port-hdpi': [480, 800], 'drawable-port-xhdpi': [720, 1280],
  'drawable-port-xxhdpi': [960, 1600], 'drawable-port-xxxhdpi': [1280, 1920], 'drawable-land-mdpi': [480, 320],
  'drawable-land-hdpi': [800, 480], 'drawable-land-xhdpi': [1280, 720], 'drawable-land-xxhdpi': [1600, 960], 'drawable-land-xxxhdpi': [1920, 1280],
};
for (const [dir, [width, height]] of Object.entries(splashSizes)) {
  const iconSize = Math.round(Math.min(width, height) * 0.32);
  const icon = await (await composite(iconSize, 'rounded')).toBuffer();
  await sharp({ create: { width, height, channels: 4, background: '#000000' } })
    .composite([{ input: icon, gravity: 'center' }]).png().toFile(resolve(res, dir, 'splash.png'));
}

mkdirSync(resolve(root, 'resources/store'), { recursive: true });
await (await composite(512, 'none')).toFile(resolve(root, 'resources/store/play-store-icon-512.png'));
await (await composite(1024, 'rounded')).toFile(resolve(root, 'resources/store/icon-preview-1024.png'));
console.log('Ícones gerados.');
