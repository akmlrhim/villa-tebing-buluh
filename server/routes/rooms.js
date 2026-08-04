import express from 'express'
import crypto from 'node:crypto'
import { query, execute, transaction, bool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { assertAffected, badRequest, placeholders, requireIdList, wrap } from '../lib/http.js'

export const roomsRouter = express.Router()

/**
 * Postgres bisa mengembalikan relasi bersarang lewat `select('*, room_images(...)')`.
 * MySQL tidak, jadi foto diambil dalam satu query terpisah lalu digabungkan di
 * sini — dua query dengan jumlah tetap, bukan N+1 per kamar.
 */
async function attachImages(rooms, { includeId = false } = {}) {
  if (rooms.length === 0) return []
  const ids = rooms.map((r) => r.id)
  const images = await query(
    `SELECT id, room_id, image_url, is_primary, sort_order
       FROM room_images
      WHERE room_id IN (${placeholders(ids.length)})
      ORDER BY is_primary DESC, sort_order ASC`,
    ids,
  )

  const byRoom = new Map()
  for (const img of images) {
    if (!byRoom.has(img.room_id)) byRoom.set(img.room_id, [])
    byRoom.get(img.room_id).push(img)
  }

  return rooms.map((room) => ({
    ...room,
    is_active: bool(room.is_active),
    // amenities disimpan sebagai JSON; kolom NULL untuk kamar lama tetap
    // harus jadi array supaya `amenities.map(...)` di komponen tidak meledak.
    amenities: Array.isArray(room.amenities) ? room.amenities : [],
    images: (byRoom.get(room.id) ?? []).map((img) => ({
      ...(includeId ? { id: img.id } : {}),
      url: img.image_url,
      alt: `Foto kamar ${room.name}`,
      is_primary: bool(img.is_primary),
    })),
  }))
}

/** Publik: hanya kamar aktif, termurah dulu (sama dengan useRooms lama). */
roomsRouter.get(
  '/',
  wrap(async (req, res) => {
    const rooms = await query(
      'SELECT * FROM rooms WHERE is_active = 1 ORDER BY price_per_night ASC',
    )
    res.json(await attachImages(rooms))
  }),
)

/** Admin: SEMUA kamar termasuk yang nonaktif, urut waktu dibuat. */
roomsRouter.get(
  '/admin',
  requireAuth,
  wrap(async (req, res) => {
    const rooms = await query('SELECT * FROM rooms ORDER BY created_at ASC')
    res.json(await attachImages(rooms, { includeId: true }))
  }),
)

/** Field kamar yang boleh ditulis klien — mencegah id/created_at ikut tertimpa. */
function roomFields(body) {
  const name = String(body?.name ?? '').trim()
  const slug = String(body?.slug ?? '').trim()
  const price = Number(body?.price_per_night)

  if (!name) throw badRequest('Nama kamar wajib diisi.', 'INVALID_NAME')
  if (!slug) throw badRequest('Slug kamar wajib diisi.', 'INVALID_SLUG')
  if (!Number.isFinite(price) || price <= 0) {
    throw badRequest('Harga per malam wajib diisi.', 'INVALID_PRICE')
  }

  return {
    name,
    slug,
    description: body.description?.trim() || null,
    price_per_night: price,
    min_nights: Number(body.min_nights) || 1,
    max_guests: Number(body.max_guests) || 1,
    size_sqm: body.size_sqm ? Number(body.size_sqm) : null,
    bed_count: Number(body.bed_count) || 1,
    bed_type: body.bed_type?.trim() || null,
    // JSON.stringify: mysql2 mengirim array JS sebagai string biasa ke kolom
    // JSON kalau tidak diserialisasi dulu.
    amenities: JSON.stringify(Array.isArray(body.amenities) ? body.amenities : []),
    is_active: body.is_active === false ? 0 : 1,
  }
}

/**
 * Tulis ulang foto kamar: hapus semua lalu insert ulang. Sederhana & benar
 * untuk skala kecil (sama seperti saveRoomImages versi Supabase), tapi kini
 * di dalam transaksi bersama penyimpanan kamarnya — kalau insert foto gagal,
 * foto lama tidak ikut hilang.
 */
async function writeImages(conn, roomId, images) {
  await conn.execute('DELETE FROM room_images WHERE room_id = ?', [roomId])
  const list = Array.isArray(images) ? images : []
  for (const [i, img] of list.entries()) {
    // Foto pertama jadi primary bila klien tidak menyebutkan satu pun.
    const isPrimary = (img.is_primary ?? i === 0) ? 1 : 0
    await conn.execute(
      `INSERT INTO room_images (id, room_id, image_url, is_primary, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [crypto.randomUUID(), roomId, String(img.url), isPrimary, i],
    )
  }
}

roomsRouter.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const fields = roomFields(req.body)
    const id = crypto.randomUUID()
    const cols = Object.keys(fields)

    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO rooms (id, ${cols.join(', ')})
         VALUES (?, ${placeholders(cols.length)})`,
        [id, ...cols.map((c) => fields[c])],
      )
      await writeImages(conn, id, req.body?.images)
    })

    res.status(201).json({ id })
  }),
)

roomsRouter.put(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const fields = roomFields(req.body)
    const cols = Object.keys(fields)
    const { id } = req.params

    await transaction(async (conn) => {
      const [result] = await conn.execute(
        `UPDATE rooms SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...cols.map((c) => fields[c]), id],
      )
      // affectedRows 0 berarti id-nya memang tidak ada. Sengaja TIDAK memakai
      // changedRows: menyimpan tanpa mengubah nilai apa pun bukan kegagalan.
      assertAffected(result, 'Kamar tidak ditemukan.')
      await writeImages(conn, id, req.body?.images)
    })

    res.json({ id })
  }),
)

/** Toggle aktif/nonaktif dari daftar kamar admin. */
roomsRouter.patch(
  '/:id/active',
  requireAuth,
  wrap(async (req, res) => {
    const isActive = req.body?.is_active ? 1 : 0
    const result = await execute('UPDATE rooms SET is_active = ? WHERE id = ?', [
      isActive,
      req.params.id,
    ])
    assertAffected(result, 'Kamar tidak ditemukan.')
    res.json({ id: req.params.id, is_active: Boolean(isActive) })
  }),
)

/**
 * Hapus kamar. Foreign key bookings->rooms memakai ON DELETE RESTRICT, jadi
 * MySQL menolak menghapus kamar yang masih punya riwayat booking. Error
 * mentahnya ("Cannot delete or update a parent row") tidak berarti apa-apa
 * bagi admin vila, jadi diterjemahkan ke pesan yang menjelaskan jalan keluar.
 */
function translateFkError(err) {
  if (err?.code === 'ER_ROW_IS_REFERENCED_2' || err?.errno === 1451) {
    return badRequest(
      'Kamar ini masih punya riwayat booking, jadi tidak bisa dihapus. Nonaktifkan saja supaya tidak muncul di situs.',
      'ROOM_HAS_BOOKINGS',
    )
  }
  return err
}

roomsRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    try {
      const result = await execute('DELETE FROM rooms WHERE id = ?', [req.params.id])
      assertAffected(result, 'Kamar tidak ditemukan.')
    } catch (err) {
      throw translateFkError(err)
    }
    res.json({ deleted: 1 })
  }),
)

roomsRouter.post(
  '/bulk-delete',
  requireAuth,
  wrap(async (req, res) => {
    const ids = requireIdList(req.body?.ids)
    try {
      const result = await execute(
        `DELETE FROM rooms WHERE id IN (${placeholders(ids.length)})`,
        ids,
      )
      assertAffected(result, 'Kamar tidak ditemukan.')
      res.json({ deleted: result.affectedRows })
    } catch (err) {
      throw translateFkError(err)
    }
  }),
)
