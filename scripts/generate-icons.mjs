import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

/**
 * Generates crisp pixel-art PNG icons for PWA compliance (192x192, 512x512,
 * maskable 512x512 with 15% safe zone padding, and 180x180 apple-touch-icon)
 * using zero external dependencies.
 */

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, {level: 9})),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// 16x16 pixel-art peso coin + graduation cap sprite
const PALETTE = {
  '.': [30, 21, 16, 255],
  'B': [44, 29, 20, 255],
  'C': [217, 119, 6, 255],
  'G': [245, 158, 11, 255],
  'Y': [251, 191, 36, 255],
  'D': [120, 53, 15, 255],
  'N': [30, 58, 138, 255],
  'L': [59, 130, 246, 255],
  'T': [250, 204, 21, 255],
};

const SPRITE = [
  '................',
  '....LLLLLLLL....',
  '..NNNNNNNNNNNN..',
  '....NNNNNNNNT...',
  '.....CCCCCC.T...',
  '....CGGGGGGCT...',
  '...CGYYYYYYGCT..',
  '...CGYDDDDYGC...',
  '...CGDYYYYDGC...',
  '...CGDDDDDDGC...',
  '...CGYDDDDYGC...',
  '...CGYDYYYYGC...',
  '...CGYDYYYYGC...',
  '....CGGGGGGC....',
  '.....CCCCCC.....',
  '................',
];

function renderIcon(size, maskable) {
  const rgba = Buffer.alloc(size * size * 4);
  const bg = PALETTE['.'];
  for (let i = 0; i < size * size; i++) {
    rgba[i * 4] = bg[0];
    rgba[i * 4 + 1] = bg[1];
    rgba[i * 4 + 2] = bg[2];
    rgba[i * 4 + 3] = bg[3];
  }

  const margin = maskable ? Math.floor(size * 0.16) : Math.floor(size * 0.06);
  const inner = size - margin * 2;
  const grid = 16;

  for (let y = 0; y < inner; y++) {
    const sy = Math.min(grid - 1, Math.floor((y / inner) * grid));
    for (let x = 0; x < inner; x++) {
      const sx = Math.min(grid - 1, Math.floor((x / inner) * grid));
      const ch = SPRITE[sy][sx];
      const col = PALETTE[ch] || bg;
      const px = margin + x;
      const py = margin + y;
      const idx = (py * size + px) * 4;
      rgba[idx] = col[0];
      rgba[idx + 1] = col[1];
      rgba[idx + 2] = col[2];
      rgba[idx + 3] = col[3];
    }
  }
  return encodePNG(size, size, rgba);
}

const outDir = path.resolve('public');
fs.mkdirSync(outDir, {recursive: true});

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), renderIcon(192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), renderIcon(512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), renderIcon(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), renderIcon(180, false));

console.log('Generated PWA PNG icons in public/.');
