import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'assets/img-src');
const publicDir = join(root, 'public');

// Anggaran per lebar (bukan satu batas rata 50 KB untuk semua ukuran) —
// budget rata membuat varian besar (1080px+) jatuh ke kualitas q<30 yang
// terlihat pecah. Angka ini dikalibrasi supaya kualitas mendarat di sekitar
// q75-80 (masih tajam) untuk foto biasa. Lihat README bagian "Gambar".
const AUDIT_MAX_BYTES = 50 * 1024;
function budgetFor(width) {
  if (width <= 640) return 70 * 1024;
  if (width <= 828) return 110 * 1024;
  if (width <= 1080) return 160 * 1024;
  if (width <= 1600) return 270 * 1024;
  return 340 * 1024;
}
const WIDTHS = [640, 828, 1080];
const ASPECT = 3 / 2;

const HEROES = [
  { src: 'about-hero.webp', out: 'img/about/hero' },
  { src: 'gallery-hero.webp', out: 'img/gallery/hero' },
  { src: 'contact-hero.webp', out: 'img/contact/hero' },
  { src: 'home-hero.webp', out: 'img/hero/home' },
];

const PEEK = {
  src: 'gallery-peek.webp',
  variants: [
    { out: 'img/gallery_heros-1920.webp', width: 1920, aspect: 3 / 2 },
    { out: 'img/gallery_heros.webp', width: 1080, aspect: 3 / 2 },
    { out: 'img/gallery_heros-mobile.webp', width: 750, aspect: 3 / 2 },
  ],
};

const OG = {
  src: 'home-hero.webp',
  out: 'img/og.jpg',
  width: 1200,
  height: 630,
};
const OG_MAX_BYTES = 150 * 1024;

function kb(bytes) {
  return (bytes / 1024).toFixed(1).padStart(6) + 'KB';
}

async function encodeUnderLimit(pipeline, limit) {
  let lo = 1;
  let hi = 95;
  let best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const buf = await pipeline
      .clone()
      .webp({ quality: mid, effort: 6, smartSubsample: true })
      .toBuffer();
    if (buf.length <= limit) {
      best = { buf, quality: mid };
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

async function writeVariant(sourceBuf, outPath, width, aspect) {
  const pipeline = sharp(sourceBuf).resize({
    width,
    height: Math.round(width / aspect),
    fit: 'cover',
    position: 'attention',
    withoutEnlargement: true,
  });

  const budget = budgetFor(width);
  const best = await encodeUnderLimit(pipeline, budget);
  if (!best) {
    throw new Error(`tidak muat ${budget} byte: ${outPath}`);
  }

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, best.buf);
  console.log(
    `  ${relative(publicDir, outPath).replace(/\\/g, '/').padEnd(34)} ${String(width).padStart(4)}w  q=${String(best.quality).padStart(2)}  ${kb(best.buf.length)}`,
  );
}

async function buildHeroes() {
  for (const hero of HEROES) {
    const buf = await readFile(join(srcDir, hero.src));
    const meta = await sharp(buf).metadata();
    console.log(`\n${hero.src}  (${meta.width}x${meta.height})`);
    for (const width of WIDTHS) {
      await writeVariant(
        buf,
        join(publicDir, `${hero.out}-${width}.webp`),
        width,
        ASPECT,
      );
    }
  }
}

async function buildPeek() {
  const buf = await readFile(join(srcDir, PEEK.src));
  const meta = await sharp(buf).metadata();
  console.log(`\n${PEEK.src}  (${meta.width}x${meta.height})`);
  for (const variant of PEEK.variants) {
    await writeVariant(
      buf,
      join(publicDir, variant.out),
      variant.width,
      variant.aspect,
    );
  }
}

async function buildOg() {
  const buf = await readFile(join(srcDir, OG.src));
  const pipeline = sharp(buf).resize({
    width: OG.width,
    height: OG.height,
    fit: 'cover',
    position: 'attention',
  });

  let lo = 1;
  let hi = 95;
  let best = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const out = await pipeline
      .clone()
      .jpeg({ quality: mid, mozjpeg: true, progressive: true })
      .toBuffer();
    if (out.length <= OG_MAX_BYTES) {
      best = { buf: out, quality: mid };
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (!best) throw new Error(`tidak muat ${OG_MAX_BYTES} byte: ${OG.out}`);

  const outPath = join(publicDir, OG.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, best.buf);
  console.log(`\n${OG.src}  -> Open Graph`);
  console.log(
    `  ${OG.out.padEnd(34)} ${String(OG.width).padStart(4)}w  q=${String(best.quality).padStart(2)}  ${kb(best.buf.length)}`,
  );
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function auditPublic() {
  console.log('\nsisa berkas gambar di public/');
  const known = new Set([
    ...HEROES.flatMap((h) =>
      WIDTHS.map((w) => join(publicDir, `${h.out}-${w}.webp`)),
    ),
    ...PEEK.variants.map((v) => join(publicDir, v.out)),
    join(publicDir, OG.out),
  ]);

  let over = 0;
  for await (const file of walk(publicDir)) {
    if (
      !['.webp', '.png', '.jpg', '.jpeg', '.avif'].includes(
        extname(file).toLowerCase(),
      )
    )
      continue;
    if (known.has(file)) continue;
    const { size } = await stat(file);
    const flag = size > AUDIT_MAX_BYTES ? '  LEBIH DARI 50KB' : '';
    if (size > AUDIT_MAX_BYTES) over += 1;
    console.log(
      `  ${relative(publicDir, file).replace(/\\/g, '/').padEnd(34)}       ${kb(size)}${flag}`,
    );
  }
  return over;
}

await buildHeroes();
await buildPeek();
await buildOg();
const over = await auditPublic();

if (over > 0) {
  console.error(`\n${over} berkas di luar pipeline masih di atas 50KB.`);
  process.exit(1);
}
console.log('\nSemua gambar di public/ sudah sesuai anggaran (lihat budgetFor per lebar).');
