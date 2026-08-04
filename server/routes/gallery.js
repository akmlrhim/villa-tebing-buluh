import express from 'express'
import crypto from 'node:crypto'
import { query, execute, transaction } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { assertAffected, badRequest, placeholders, requireIdList, wrap } from '../lib/http.js'

export const galleryRouter = express.Router()

/** Publik & admin membaca daftar yang sama — tidak ada kolom sensitif di sini. */
galleryRouter.get(
  '/',
  wrap(async (req, res) => {
    res.json(await query('SELECT * FROM gallery_images ORDER BY sort_order ASC'))
  }),
)

/** Tambah foto galeri. `urls` = array URL hasil unggah. */
galleryRouter.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const urls = req.body?.urls
    if (!Array.isArray(urls) || urls.length === 0) {
      throw badRequest('Tidak ada foto untuk ditambahkan.', 'NO_IMAGES')
    }

    await transaction(async (conn) => {
      // Urutan baru melanjutkan yang sudah ada. Dihitung di dalam transaksi
      // supaya dua unggahan bersamaan tidak memakai sort_order yang sama.
      const [[{ next }]] = await conn.execute(
        'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM gallery_images',
      )
      for (const [i, url] of urls.entries()) {
        await conn.execute(
          'INSERT INTO gallery_images (id, image_url, alt, sort_order) VALUES (?, ?, ?, ?)',
          [crypto.randomUUID(), String(url), req.body?.alt?.trim() || null, next + i],
        )
      }
    })

    res.status(201).json({ added: urls.length })
  }),
)

galleryRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const result = await execute('DELETE FROM gallery_images WHERE id = ?', [req.params.id])
    assertAffected(result, 'Foto tidak ditemukan.')
    res.json({ deleted: 1 })
  }),
)

galleryRouter.post(
  '/bulk-delete',
  requireAuth,
  wrap(async (req, res) => {
    const ids = requireIdList(req.body?.ids)
    const result = await execute(
      `DELETE FROM gallery_images WHERE id IN (${placeholders(ids.length)})`,
      ids,
    )
    assertAffected(result, 'Foto tidak ditemukan.')
    res.json({ deleted: result.affectedRows })
  }),
)
