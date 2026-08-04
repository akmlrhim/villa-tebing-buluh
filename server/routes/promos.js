import express from 'express'
import crypto from 'node:crypto'
import { query, execute, transaction, bool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { assertAffected, badRequest, placeholders, requireIdList, wrap } from '../lib/http.js'
import { PROMO_TYPES } from '../../shared/pricing.js'

export const promosRouter = express.Router()

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const todayISO = () => new Date().toISOString().slice(0, 10)

/**
 * Menempelkan `room_ids` ke setiap promo. Pola yang sama dengan attachImages
 * di routes/rooms.js: satu query tambahan berjumlah tetap, bukan N+1.
 *
 * Bentuk yang dikembalikan sengaja sama persis dengan yang dibaca
 * shared/pricing.js (is_active & applies_to_all sebagai boolean, room_ids
 * sebagai array), supaya server dan browser memberi mesin harga input identik.
 */
async function attachRooms(promos) {
  if (promos.length === 0) return []
  const ids = promos.map((p) => p.id)
  const links = await query(
    `SELECT promo_id, room_id FROM promo_rooms
      WHERE promo_id IN (${placeholders(ids.length)})`,
    ids,
  )

  const byPromo = new Map()
  for (const link of links) {
    if (!byPromo.has(link.promo_id)) byPromo.set(link.promo_id, [])
    byPromo.get(link.promo_id).push(link.room_id)
  }

  return promos.map((promo) => ({
    ...promo,
    is_active: bool(promo.is_active),
    applies_to_all: bool(promo.applies_to_all),
    room_ids: byPromo.get(promo.id) ?? [],
  }))
}

// ===========================================================================
// PUBLIK
// ===========================================================================

/**
 * Promo yang masih relevan bagi pengunjung: aktif dan belum lewat.
 *
 * Promo yang sudah berakhir sengaja tidak dikirim — halaman publik tidak
 * pernah menghitung harga untuk tanggal di masa lalu, jadi mengirimnya hanya
 * memperbesar payload. Promo yang BELUM mulai tetap dikirim supaya kartu kamar
 * bisa memasang badge "promo mulai <tanggal>".
 *
 * Tidak ada data sensitif di sini; ini memang materi pemasaran.
 */
promosRouter.get(
  '/active',
  wrap(async (req, res) => {
    const promos = await query(
      `SELECT id, name, description, discount_type, discount_value,
              start_date, end_date, applies_to_all, is_active
         FROM promos
        WHERE is_active = 1 AND end_date >= ?
        ORDER BY start_date ASC`,
      [todayISO()],
    )
    res.json(await attachRooms(promos))
  }),
)

// ===========================================================================
// ADMIN
// ===========================================================================

promosRouter.get(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const promos = await query('SELECT * FROM promos ORDER BY start_date DESC, created_at DESC')
    res.json(await attachRooms(promos))
  }),
)

/** Field promo yang boleh ditulis klien — id & created_at tidak ikut. */
function promoFields(body) {
  const name = String(body?.name ?? '').trim()
  const discountType = String(body?.discount_type ?? '')
  const discountValue = Number(body?.discount_value)
  const startDate = String(body?.start_date ?? '')
  const endDate = String(body?.end_date ?? '')
  const appliesToAll = body?.applies_to_all !== false

  if (!name) throw badRequest('Nama promo wajib diisi.', 'INVALID_NAME')
  if (name.length > 150) throw badRequest('Nama promo maksimal 150 karakter.', 'INVALID_NAME')
  if (!PROMO_TYPES.includes(discountType)) {
    throw badRequest('Tipe diskon tidak dikenal.', 'INVALID_DISCOUNT_TYPE')
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw badRequest('Nilai diskon wajib diisi.', 'INVALID_DISCOUNT_VALUE')
  }
  // Diskon 100% berarti gratis — hampir selalu salah ketik, dan efeknya
  // (kamar Rp0 yang bisa dipesan siapa saja) terlalu mahal untuk dibiarkan.
  if (discountType === 'percent' && discountValue >= 100) {
    throw badRequest('Diskon persen harus di bawah 100%.', 'INVALID_DISCOUNT_VALUE')
  }
  if (!ISO_DATE.test(startDate) || !ISO_DATE.test(endDate)) {
    throw badRequest('Tanggal promo tidak valid.', 'INVALID_DATES')
  }
  if (endDate < startDate) {
    throw badRequest('Tanggal berakhir tidak boleh sebelum tanggal mulai.', 'INVALID_DATE_RANGE')
  }

  return {
    name,
    description: body.description?.trim() || null,
    discount_type: discountType,
    discount_value: discountValue,
    start_date: startDate,
    end_date: endDate,
    applies_to_all: appliesToAll ? 1 : 0,
    is_active: body.is_active === false ? 0 : 1,
  }
}

/**
 * Daftar kamar terpilih. Promo "kamar tertentu" tanpa satu kamar pun tidak
 * akan pernah berlaku ke apa pun — lebih baik ditolak daripada tersimpan
 * diam-diam sebagai promo yang tidak berefek.
 */
function selectedRoomIds(body, appliesToAll) {
  if (appliesToAll) return []
  const ids = Array.isArray(body?.room_ids) ? body.room_ids.map(String) : []
  if (ids.length === 0) {
    throw badRequest('Pilih minimal satu kamar untuk promo ini.', 'NO_ROOMS_SELECTED')
  }
  return [...new Set(ids)]
}

/** Tulis ulang daftar kamar promo (hapus semua lalu insert) di dalam transaksi. */
async function writeRooms(conn, promoId, roomIds) {
  await conn.execute('DELETE FROM promo_rooms WHERE promo_id = ?', [promoId])
  for (const roomId of roomIds) {
    await conn.execute('INSERT INTO promo_rooms (promo_id, room_id) VALUES (?, ?)', [
      promoId,
      roomId,
    ])
  }
}

/**
 * Foreign key promo_rooms->rooms menolak room_id yang tidak ada. Errornya
 * mentah ("Cannot add or update a child row") tidak berarti apa-apa bagi admin
 * vila, jadi diterjemahkan — kasus nyatanya: kamar dihapus di tab lain saat
 * form promo masih terbuka.
 */
function translateFkError(err) {
  if (err?.code === 'ER_NO_REFERENCED_ROW_2' || err?.errno === 1452) {
    return badRequest(
      'Ada kamar terpilih yang sudah tidak tersedia. Muat ulang halaman lalu pilih ulang kamarnya.',
      'ROOM_NOT_FOUND',
    )
  }
  return err
}

promosRouter.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const fields = promoFields(req.body)
    const roomIds = selectedRoomIds(req.body, fields.applies_to_all === 1)
    const id = crypto.randomUUID()
    const cols = Object.keys(fields)

    try {
      await transaction(async (conn) => {
        await conn.execute(
          `INSERT INTO promos (id, ${cols.join(', ')})
           VALUES (?, ${placeholders(cols.length)})`,
          [id, ...cols.map((c) => fields[c])],
        )
        await writeRooms(conn, id, roomIds)
      })
    } catch (err) {
      throw translateFkError(err)
    }

    res.status(201).json({ id })
  }),
)

promosRouter.put(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const fields = promoFields(req.body)
    const roomIds = selectedRoomIds(req.body, fields.applies_to_all === 1)
    const cols = Object.keys(fields)
    const { id } = req.params

    try {
      await transaction(async (conn) => {
        const [result] = await conn.execute(
          `UPDATE promos SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
          [...cols.map((c) => fields[c]), id],
        )
        assertAffected(result, 'Promo tidak ditemukan.')
        await writeRooms(conn, id, roomIds)
      })
    } catch (err) {
      throw translateFkError(err)
    }

    res.json({ id })
  }),
)

promosRouter.patch(
  '/:id/active',
  requireAuth,
  wrap(async (req, res) => {
    const isActive = req.body?.is_active ? 1 : 0
    const result = await execute('UPDATE promos SET is_active = ? WHERE id = ?', [
      isActive,
      req.params.id,
    ])
    assertAffected(result, 'Promo tidak ditemukan.')
    res.json({ id: req.params.id, is_active: Boolean(isActive) })
  }),
)

// Menghapus promo tidak mengubah booking yang sudah terlanjur dibuat: harga
// yang dibayar tamu sudah membeku di bookings.total_price saat pemesanan.
promosRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const result = await execute('DELETE FROM promos WHERE id = ?', [req.params.id])
    assertAffected(result, 'Promo tidak ditemukan.')
    res.json({ deleted: 1 })
  }),
)

promosRouter.post(
  '/bulk-delete',
  requireAuth,
  wrap(async (req, res) => {
    const ids = requireIdList(req.body?.ids)
    const result = await execute(
      `DELETE FROM promos WHERE id IN (${placeholders(ids.length)})`,
      ids,
    )
    assertAffected(result, 'Promo tidak ditemukan.')
    res.json({ deleted: result.affectedRows })
  }),
)
