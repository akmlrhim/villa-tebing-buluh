import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const source = join(root, 'assets/logo-mark.png');

const PNGS = [
  { size: 96, name: 'favicon-96.png', flatten: false },
  { size: 180, name: 'apple-touch-icon.png', flatten: true },
];
const ICO_SIZES = [16, 32, 48];

function icoFromPngs(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = header.length + dir.length;

  entries.forEach((entry, i) => {
    const p = i * 16;
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, p);
    dir.writeUInt8(entry.size >= 256 ? 0 : entry.size, p + 1);
    dir.writeUInt8(0, p + 2);
    dir.writeUInt8(0, p + 3);
    dir.writeUInt16LE(1, p + 4);
    dir.writeUInt16LE(32, p + 6);
    dir.writeUInt32LE(entry.buf.length, p + 8);
    dir.writeUInt32LE(offset, p + 12);
    offset += entry.buf.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

const master = await readFile(source);

const render = (size, flatten) => {
  let pipeline = sharp(master).resize(size, size, {
    kernel: 'lanczos3',
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });
  if (flatten) pipeline = pipeline.flatten({ background: '#ffffff' });
  return pipeline.png({ compressionLevel: 9 }).toBuffer();
};

for (const { size, name, flatten } of PNGS) {
  const buf = await render(size, flatten);
  await writeFile(join(publicDir, name), buf);
  console.log(
    `  ${name.padEnd(24)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)}KB`,
  );
}

const icoEntries = [];
for (const size of ICO_SIZES) {
  icoEntries.push({ size, buf: await render(size, false) });
}
const ico = icoFromPngs(icoEntries);
await writeFile(join(publicDir, 'favicon.ico'), ico);
console.log(
  `  ${'favicon.ico'.padEnd(24)} ${ICO_SIZES.join('/')}  ${(ico.length / 1024).toFixed(1)}KB`,
);
