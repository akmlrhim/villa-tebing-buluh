import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { authRouter } from './routes/auth.js';
import { roomsRouter } from './routes/rooms.js';
import { bookingsRouter } from './routes/bookings.js';
import { galleryRouter } from './routes/gallery.js'
import { promosRouter } from './routes/promos.js';
import { settingsRouter } from './routes/settings.js';
import { uploadRouter, proofRouter } from './routes/upload.js';
import { HttpError } from './lib/http.js';
import { UPLOAD_ROOT, ensureUploadDirs } from './lib/uploads.js';
import { pool } from './db.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(here, '../dist');

// JWT_SECRET juga menandatangani URL bukti bayar. Tanpa rahasia yang benar
// nyata, token admin bisa ditempa siapa saja — jadi server menolak start,
// bukan diam-diam jalan dengan default yang tertulis di repo publik.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error(
    'FATAL: JWT_SECRET belum diset di .env (minimal 32 karakter).\n' +
      "Buat satu dengan:  node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
  );
  process.exit(1);
}

ensureUploadDirs();

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));

const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "connect-src 'self'",
  'frame-src https://www.google.com',
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }
  next();
});

const staticOpts = { maxAge: '30d', index: false, redirect: false };
app.use(
  '/uploads/room-images',
  express.static(path.join(UPLOAD_ROOT, 'room-images'), staticOpts),
);
app.use(
  '/uploads/gallery-images',
  express.static(path.join(UPLOAD_ROOT, 'gallery-images'), staticOpts),
);

app.use('/uploads', (req, res) => {
  res.status(404).json({ error: 'Berkas tidak ditemukan.', code: 'NOT_FOUND' });
});

// --- API ------------------------------------------------------------------
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/gallery', galleryRouter)
app.use('/api/promos', promosRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/proofs', proofRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

app.use('/api', (req, res) => {
  res
    .status(404)
    .json({ error: 'Endpoint tidak ditemukan.', code: 'NOT_FOUND' });
});

if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { index: false, maxAge: '1y' }));
  app.get(/.*/, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

// --- Penanganan error terpusat -------------------------------------------
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, code: err.code });
    return;
  }
  console.error('[api]', req.method, req.originalUrl, err);
  res
    .status(500)
    .json({
      error: 'Terjadi kesalahan di server. Coba lagi.',
      code: 'INTERNAL',
    });
});

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`API Villa Tebing Buluh jalan di http://localhost:${port}`);
});
