// Generates app icons with zero dependencies (built-in zlib PNG encoder).
// Renders a gradient heart on a dark tile. Run: npm run icons
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

// ---- tiny PNG encoder (RGBA, 8-bit) ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---- drawing ----
function lerp(a, b, t) { return a + (b - a) * t; }
const BG = [14, 11, 20];
const C1 = [229, 68, 125];  // brand pink
const C2 = [138, 92, 246];  // brand violet

// Implicit heart: inside when f<=0, with y up. scale fits ~[-1.3,1.3].
function heartInside(nx, ny) {
  const x = nx, y = ny;
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function render(size, { rounded, safeScale }) {
  const rgba = Buffer.alloc(size * size * 4);
  const r = size * 0.22; // corner radius
  const cx = size / 2, cy = size / 2;
  const heartScale = 1.28 / (safeScale ?? 1); // bigger scale => smaller heart
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const i = (py * size + px) * 4;
      // rounded-corner alpha (outside radius => transparent) when rounded
      let alpha = 255;
      if (rounded) {
        const dx = Math.max(r - px, px - (size - r), 0);
        const dy = Math.max(r - py, py - (size - r), 0);
        if (dx > 0 && dy > 0 && dx * dx + dy * dy > r * r) alpha = 0;
      }
      // normalized coords centered, y up
      const nx = ((px - cx) / (size / 2)) * heartScale;
      const ny = -((py - cy + size * 0.06) / (size / 2)) * heartScale;
      let col = BG;
      if (heartInside(nx, ny)) {
        const t = Math.min(1, Math.max(0, (px + py) / (2 * size)));
        col = [Math.round(lerp(C1[0], C2[0], t)), Math.round(lerp(C1[1], C2[1], t)), Math.round(lerp(C1[2], C2[2], t))];
      }
      rgba[i] = col[0]; rgba[i + 1] = col[1]; rgba[i + 2] = col[2]; rgba[i + 3] = alpha;
    }
  }
  return encodePNG(size, size, rgba);
}

const jobs = [
  ['icon-192.png', 192, { rounded: true }],
  ['icon-512.png', 512, { rounded: true }],
  ['icon-maskable-512.png', 512, { rounded: false, safeScale: 1.35 }],
  ['apple-touch-icon.png', 180, { rounded: false }],
];
for (const [name, size, opts] of jobs) {
  writeFileSync(join(OUT, name), render(size, opts));
  console.log('wrote', name, size + 'x' + size);
}
