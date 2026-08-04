import express from 'express'
import fs from 'node:fs'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { badRequest, wrap } from '../lib/http.js'
import {
  ALLOWED_MIME,
  BUCKETS,
  UPLOAD_ROOT,
  bucketPath,
  publicUrl,
  randomFilename,
  verifyProofSignature,
} from '../lib/uploads.js'
import path from 'node:path'

export const uploadRouter = express.Router()
export const proofRouter = express.Router()

/** Multer untuk satu bucket: simpan ke disk dengan nama acak. */
function uploaderFor(bucket) {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, path.join(UPLOAD_ROOT, bucket)),
      filename: (req, file, cb) => cb(null, randomFilename(file.mimetype)),
    }),
    limits: { fileSize: BUCKETS[bucket].maxBytes, files: 1 },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED_MIME.includes(file.mimetype)) {
        cb(badRequest('Hanya berkas JPG, PNG, atau WebP yang diperbolehkan.', 'INVALID_MIME'))
        return
      }
      cb(null, true)
    },
  }).single('file')
}

const roomUpload = uploaderFor('room-images')
const galleryUpload = uploaderFor('gallery-images')
const proofUpload = uploaderFor('payment-proofs')

/** Ubah error multer jadi HttpError yang pesannya ramah. */
function handleUpload(mw) {
  return (req, res, next) =>
    mw(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') {
        next(badRequest('Ukuran berkas melebihi batas yang diizinkan.', 'FILE_TOO_LARGE'))
        return
      }
      if (err) {
        next(err)
        return
      }
      if (!req.file) {
        next(badRequest('Tidak ada berkas yang dikirim.', 'NO_FILE'))
        return
      }
      next()
    })
}

// --- Bucket publik: admin-only untuk mengunggah, hasilnya URL publik. -------
uploadRouter.post(
  '/room-image',
  requireAuth,
  handleUpload(roomUpload),
  wrap(async (req, res) => {
    res.json({ path: req.file.filename, publicUrl: publicUrl('room-images', req.file.filename) })
  }),
)

uploadRouter.post(
  '/gallery-image',
  requireAuth,
  handleUpload(galleryUpload),
  wrap(async (req, res) => {
    res.json({ path: req.file.filename, publicUrl: publicUrl('gallery-images', req.file.filename) })
  }),
)

/**
 * Bukti bayar QRIS: SENGAJA tanpa requireAuth — diunggah tamu yang belum
 * punya akun, persis seperti policy "Anyone can upload payment proofs" untuk
 * role anon dulu. Yang dikembalikan cuma NAMA FILE, bukan URL: bucket ini
 * privat dan hanya bisa dibaca lewat /api/proofs dengan tanda tangan.
 * Sisi baca tetap tertutup, jadi tamu tidak bisa mengintip bukti bayar
 * orang lain walaupun tahu nama filenya.
 */
uploadRouter.post(
  '/payment-proof',
  handleUpload(proofUpload),
  wrap(async (req, res) => {
    res.json({ path: req.file.filename })
  }),
)

/**
 * Penyaji bukti bayar. Tidak memakai requireAuth: izin dibawa oleh tanda
 * tangan HMAC di query string, karena <img> tidak bisa mengirim header.
 * URL-nya sendiri hanya bisa dibuat oleh admin yang sudah login (lihat
 * GET /api/bookings/:id/proof-url).
 */
proofRouter.get(
  '/:filename',
  wrap(async (req, res) => {
    const filename = verifyProofSignature(req.params.filename, req.query.exp, req.query.sig)
    const full = bucketPath('payment-proofs', filename)
    if (!fs.existsSync(full)) {
      res.status(404).json({ error: 'Berkas bukti bayar tidak ditemukan.', code: 'NOT_FOUND' })
      return
    }
    // Privat: jangan sampai tersimpan di cache bersama (proxy/CDN).
    res.setHeader('Cache-Control', 'private, max-age=300')
    res.sendFile(full)
  }),
)
