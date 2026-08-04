import express from 'express'
import { query, transaction } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { badRequest, wrap } from '../lib/http.js'

export const settingsRouter = express.Router()

/**
 * Kunci setting yang boleh ditulis. Allowlist, bukan blocklist: tabel settings
 * dibaca publik, jadi tanpa daftar ini admin (atau request yang menyamar jadi
 * admin) bisa menyuntikkan kunci sembarang yang ikut terkirim ke semua
 * pengunjung.
 */
const ALLOWED_KEYS = [
  'whatsapp_number',
  'villa_name',
  'address',
  'check_in_time',
  'check_out_time',
  'instagram',
  'qris_image_url',
  'qris_merchant_name',
  'qris_nmid',
  'payment_deadline_hours',
]

/**
 * Dibaca publik (nomor WA, nama vila, info QRIS semuanya tampil di situs).
 * Dikembalikan sebagai objek datar { key: value } — frontend tinggal memakai
 * langsung tanpa perlu memetakan array baris seperti dulu.
 */
settingsRouter.get(
  '/',
  wrap(async (req, res) => {
    const rows = await query('SELECT `key`, `value` FROM settings')
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])))
  }),
)

/** Simpan sebagian setting (F-11.2). Body = { key: value, ... }. */
settingsRouter.put(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const patch = req.body ?? {}
    const entries = Object.entries(patch)

    if (entries.length === 0) throw badRequest('Tidak ada pengaturan untuk disimpan.', 'EMPTY_PATCH')

    const unknown = entries.map(([k]) => k).filter((k) => !ALLOWED_KEYS.includes(k))
    if (unknown.length) {
      throw badRequest(`Pengaturan tidak dikenal: ${unknown.join(', ')}.`, 'UNKNOWN_SETTING')
    }

    await transaction(async (conn) => {
      for (const [key, value] of entries) {
        // Padanan upsert Supabase.
        await conn.execute(
          'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
          [key, value == null ? '' : String(value)],
        )
      }
    })

    res.json({ saved: entries.length })
  }),
)
