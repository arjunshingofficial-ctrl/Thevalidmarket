const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRAIN_DIR = 'C:\\Users\\ronej\\.gemini\\antigravity-ide\\brain\\866d170b-d37a-40e0-b4ad-12c49230f3c8';
const inCropPath = path.join(BRAIN_DIR, 'test_crop.png');

async function createIco(pngBuffers, outputPath) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO format
  header.writeUInt16LE(count, 4); // count of images

  let offset = 6 + count * 16;
  const entries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.width >= 256 ? 0 : item.width, 0);
    entry.writeUInt8(item.height >= 256 ? 0 : item.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(item.buffer.length, 8); // size
    entry.writeUInt32LE(offset, 12); // offset
    entries.push(entry);
    offset += item.buffer.length;
  }

  const finalBuffer = Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
  fs.writeFileSync(outputPath, finalBuffer);
  console.log(`Created ICO at ${outputPath} (${finalBuffer.length} bytes)`);
}

async function run() {
  console.log('1. Generating transparent cutout of emblem...');
  const cropped = await sharp(inCropPath).raw().toBuffer({ resolveWithObject: true });
  const numPixels = cropped.info.width * cropped.info.height;
  const transBuf = Buffer.alloc(numPixels * 4);

  for (let i = 0; i < numPixels; i++) {
    const r = cropped.data[i * 3];
    const g = cropped.data[i * 3 + 1];
    const b = cropped.data[i * 3 + 2];

    transBuf[i * 4] = r;
    transBuf[i * 4 + 1] = g;
    transBuf[i * 4 + 2] = b;

    const bgDist = Math.sqrt(Math.pow(r - 11, 2) + Math.pow(g - 21, 2) + Math.pow(b - 33, 2));
    if (bgDist < 18) {
      transBuf[i * 4 + 3] = 0;
    } else if (bgDist < 36) {
      transBuf[i * 4 + 3] = Math.round(((bgDist - 18) / 18) * 255);
    } else {
      transBuf[i * 4 + 3] = 255;
    }
  }

  const emblemTransparent = await sharp(transBuf, {
    raw: { width: cropped.info.width, height: cropped.info.height, channels: 4 }
  })
  .png()
  .toBuffer();

  console.log('2. Generating master 512x512 app icon & squircle badge...');
  const size = 512;
  const radius = 112;

  const svgBackground = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.25"/>
          <stop offset="50%" stop-color="#6366f1" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#080c16" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="badgeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.9"/>
          <stop offset="50%" stop-color="#3b82f6" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.9"/>
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#080c16"/>
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bgGlow)"/>
      <rect x="2" y="2" width="${size - 4}" height="${size - 4}" rx="${radius}" ry="${radius}" fill="none" stroke="url(#badgeBorder)" stroke-width="4"/>
    </svg>
  `);

  const scaledEmblem = await sharp(emblemTransparent)
    .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svgMask = Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/>
    </svg>
  `);

  const withEmblem = await sharp(svgBackground)
    .composite([
      { input: scaledEmblem, gravity: 'center' }
    ])
    .png()
    .toBuffer();

  const masterBadge = await sharp(withEmblem)
    .composite([
      { input: svgMask, blend: 'dest-in' }
    ])
    .png()
    .toBuffer();

  console.log('3. Generating wide brand logos...');
  const wideW = 920;
  const wideH = 220;
  const wideEmblem = await sharp(emblemTransparent)
    .resize(170, 170, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const svgWideDark = Buffer.from(`
    <svg width="${wideW}" height="${wideH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="titleG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="65%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="${wideW}" height="${wideH}" fill="#080c16" rx="20"/>
      <text x="220" y="105" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" letter-spacing="-1" fill="#ffffff">THE VALID MARKET</text>
      
      <rect x="222" y="128" width="168" height="28" rx="6" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-opacity="0.5" stroke-width="1.2"/>
      <text x="234" y="147" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="12" font-weight="800" letter-spacing="2" fill="#10b981">VERIFIED MARKET</text>
      <text x="410" y="147" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="500" letter-spacing="0.5" fill="#94a3b8">Software &#8226; Proxies &#8226; Licenses &#8226; Courses</text>
    </svg>
  `);

  const wideDarkLogo = await sharp(svgWideDark)
    .composite([
      { input: wideEmblem, left: 25, top: 25 }
    ])
    .png()
    .toBuffer();

  console.log('4. Generating OpenGraph social sharing card (1200x630)...');
  const ogW = 1200;
  const ogH = 630;
  const ogEmblem = await sharp(emblemTransparent)
    .resize(320, 320, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const ogSvg = Buffer.from(`
    <svg width="${ogW}" height="${ogH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ogGlow" cx="22%" cy="50%" r="65%">
          <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.22"/>
          <stop offset="50%" stop-color="#6366f1" stop-opacity="0.10"/>
          <stop offset="100%" stop-color="#080c16" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="ogTitle" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="60%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="${ogW}" height="${ogH}" fill="#080c16"/>
      <rect width="${ogW}" height="${ogH}" fill="url(#ogGlow)"/>
      <rect x="2" y="2" width="${ogW - 4}" height="${ogH - 4}" rx="16" fill="none" stroke="#1e293b" stroke-width="2"/>
      
      <text x="440" y="260" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="62" font-weight="900" letter-spacing="-1.5" fill="url(#ogTitle)">THE VALID MARKET</text>
      
      <rect x="445" y="295" width="220" height="36" rx="8" fill="#10b981" fill-opacity="0.18" stroke="#10b981" stroke-opacity="0.45" stroke-width="1.5"/>
      <text x="460" y="320" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="15" font-weight="800" letter-spacing="2.5" fill="#10b981">VERIFIED MARKETPLACE</text>
      
      <text x="445" y="380" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="400" fill="#94a3b8">Premium Software, Verified Licenses, Cybersecurity Courses,</text>
      <text x="445" y="414" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="400" fill="#94a3b8">Digital Tools &amp; Dedicated Proxies &#8226; Instant Delivery</text>
      
      <text x="445" y="485" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="19" font-weight="700" fill="#38bdf8">https://www.thevalidmarket.com</text>
    </svg>
  `);

  const ogCard = await sharp(ogSvg)
    .composite([
      { input: ogEmblem, left: 65, top: 155 }
    ])
    .jpeg({ quality: 92 })
    .toBuffer();

  console.log('5. Exporting all assets to public/ and src/app/...');
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  // 1. Apple Touch Icon (180x180)
  const appleTouch = await sharp(masterBadge).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), appleTouch);

  // 2. Icon 192x192 & 512x512
  const icon192 = await sharp(masterBadge).resize(192, 192).png().toBuffer();
  const icon512 = await sharp(masterBadge).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), icon192);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), icon512);

  // 3. Favicon PNGs: 16x16, 32x32, 48x48
  const fav16 = await sharp(masterBadge).resize(16, 16).png().toBuffer();
  const fav32 = await sharp(masterBadge).resize(32, 32).png().toBuffer();
  const fav48 = await sharp(masterBadge).resize(48, 48).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), fav16);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), fav32);
  fs.writeFileSync(path.join(appDir, 'icon.png'), fav32);

  // 4. Multi-size ICO file (16, 32, 48)
  await createIco([
    { width: 16, height: 16, buffer: fav16 },
    { width: 32, height: 32, buffer: fav32 },
    { width: 48, height: 48, buffer: fav48 },
  ], path.join(publicDir, 'favicon.ico'));
  fs.copyFileSync(path.join(publicDir, 'favicon.ico'), path.join(appDir, 'favicon.ico'));

  // 5. Square Brand Logo (512x512)
  fs.writeFileSync(path.join(publicDir, 'logo.png'), masterBadge);

  // 6. Transparent Emblem (512x512)
  const trans512 = await sharp(emblemTransparent)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'logo-mark.png'), trans512);

  // 7. Wide Brand Logo (920x220)
  fs.writeFileSync(path.join(publicDir, 'logo-wide.png'), wideDarkLogo);

  // 8. OpenGraph Social Share Card (1200x630)
  fs.writeFileSync(path.join(publicDir, 'og-image.jpg'), ogCard);

  console.log('✅ ALL PRODUCTION ASSETS GENERATED SUCCESSFULLY!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
