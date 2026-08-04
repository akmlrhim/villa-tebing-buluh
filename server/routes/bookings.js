import express from 'express'
import crypto from 'node:crypto'
import { query, queryOne, execute, transaction, bool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import {
  assertAffected,
  badRequest,
  conflict,
  notFound,
  placeholders,
  requireIdList,
  wrap,
} from '../lib/http.js'
import { signProofUrl } from '../lib/uploads.js'
import { computeStay } from '../../shared/pricing.js'

export const bookingsRouter = express.Router()

/**
 * Promo yang mungkin menyentuh masa inap ini, dibaca di dalam transaksi yang
 * sama dengan penyimpanan booking — jadi promo yang dinonaktifkan admin
 * setengah detik sebelumnya tidak bisa ikut terpakai.
 *
 * Penyaringan tanggal di SQL sengaja longgar (cukup "beririsan"); keputusan
 * malam mana yang benar-benar kena promo diserahkan seluruhnya ke
 * shared/pricing.js supaya aturannya hanya ada di satu tempat. Malam terakhir
 * yang dibayar adalah checkOut - 1, karena itu `start_date < checkOut`.
 */
async function loadPromos(conn, roomId, checkIn, checkOut) {
  const [rows] = await conn.execute(
    `SELECT id, name, discount_type, discount_value, start_date, end_date,
            applies_to_all, is_active
       FROM promos
      WHERE is_active = 1
        AND start_date < ?
        AND end_date >= ?
        AND (applies_to_all = 1
             OR EXISTS (SELECT 1 FROM promo_rooms pr
                         WHERE pr.promo_id = promos.id AND pr.room_id = ?))`,
    [checkOut, checkIn, roomId],
  )
  return rows.map((row) => ({
    ...row,
    is_active: bool(row.is_active),
    applies_to_all: bool(row.applies_to_all),
    // Baris yang lolos WHERE di atas sudah pasti relevan untuk kamar ini.
    room_ids: [roomId],
  }))
}

/** Status yang "menahan" tanggal — dipakai untuk cek double-booking. */
const BLOCKING = ['pending', 'confirmed', 'checked_in']
const ALL_STATUS = [...BLOCKING, 'completed', 'cancelled', 'no_show']

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const todayISO = () => new Date().toISOString().slice(0, 10)

/** Selisih malam antara dua tanggal ISO. */
function nightsBetween(a, b) {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
}

function normalizeBooking(row) {
  return {
    ...row,
    // Supabase mengembalikan relasi bersarang `rooms(name, slug)`; bentuk itu
    // dipertahankan supaya komponen admin tidak perlu diubah sama sekali.
    rooms: row.room_name ? { name: row.room_name, slug: row.room_slug } : null,
    room_name: undefined,
    room_slug: undefined,
  }
}

// ===========================================================================
// PUBLIK
// ===========================================================================

/**
 * Ketersediaan publik — pengganti view `public_availability`.
 * HANYA room_id + tanggal: tidak ada nama, telepon, atau harga, supaya
 * kalender publik tidak pernah membocorkan data pribadi tamu (PRD F-03.6).
 */
bookingsRouter.get(
  '/availability',
  wrap(async (req, res) => {
    const rows = await query(
      `SELECT room_id, check_in, check_out, status
         FROM bookings
        WHERE status IN (${placeholders(BLOCKING.length)})`,
      BLOCKING,
    )
    res.json(rows)
  }),
)

/**
 * Booking publik — pengganti RPC create_public_booking (SECURITY DEFINER).
 * Semua validasi dan perhitungan harga tetap di SERVER: klien tidak pernah
 * boleh menentukan total_price atau status sendiri. Urutan pemeriksaan
 * sengaja dibuat sama persis dengan fungsi Postgres yang digantikannya.
 */
bookingsRouter.post(
  '/public',
  wrap(async (req, res) => {
    const b = req.body ?? {}
    const roomId = String(b.room_id ?? '')
    const guestName = String(b.guest_name ?? '').trim()
    const guestPhone = String(b.guest_phone ?? '')
    const checkIn = String(b.check_in ?? '')
    const checkOut = String(b.check_out ?? '')
    const guestCount = Number(b.guest_count)
    const notes = String(b.notes ?? '').trim() || null
    const proof = String(b.payment_proof_path ?? '')

    const room = await queryOne('SELECT * FROM rooms WHERE id = ? AND is_active = 1', [roomId])
    if (!room) throw notFound('Kamar tidak ditemukan atau sedang tidak tersedia.')

    if (!ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) {
      throw badRequest('Tanggal tidak valid.', 'INVALID_DATES')
    }
    if (checkIn < todayISO()) {
      throw badRequest('Tanggal check-in sudah lewat.', 'CHECKIN_IN_PAST')
    }
    if (checkOut <= checkIn) {
      throw badRequest('Tanggal check-out harus setelah check-in.', 'INVALID_DATE_RANGE')
    }

    const maxDate = new Date()
    maxDate.setFullYear(maxDate.getFullYear() + 1)
    if (checkOut > maxDate.toISOString().slice(0, 10)) {
      throw badRequest('Tanggal terlalu jauh ke depan (maksimal 1 tahun).', 'DATE_TOO_FAR')
    }

    const nights = nightsBetween(checkIn, checkOut)

    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > room.max_guests) {
      throw badRequest(`Jumlah tamu harus antara 1 dan ${room.max_guests}.`, 'INVALID_GUEST_COUNT')
    }
    if (nights < room.min_nights) {
      throw badRequest(`Menginap minimal ${room.min_nights} malam di kamar ini.`, 'BELOW_MIN_NIGHTS')
    }
    if (guestName.length < 3 || guestName.length > 100) {
      throw badRequest('Nama tamu harus 3-100 karakter.', 'INVALID_NAME')
    }
    if (!/^62\d{8,13}$/.test(guestPhone)) {
      throw badRequest('Nomor WhatsApp tidak valid.', 'INVALID_PHONE')
    }
    if (notes && notes.length > 500) {
      throw badRequest('Catatan maksimal 500 karakter.', 'NOTES_TOO_LONG')
    }
    if (!/^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$/.test(proof)) {
      throw badRequest('Bukti pembayaran wajib diunggah.', 'INVALID_PROOF')
    }

    const id = crypto.randomUUID()

    // Cek bentrok + insert dalam SATU transaksi dengan penguncian baris.
    // Tanpa ini dua tamu yang menekan "kirim" bersamaan bisa lolos berdua
    // (keduanya membaca "kosong" sebelum salah satunya menulis) — inilah
    // atomisitas yang dulu dijamin fungsi SECURITY DEFINER di Postgres.
    await transaction(async (conn) => {
      const [taken] = await conn.execute(
        `SELECT id FROM bookings
          WHERE room_id = ?
            AND status IN (${placeholders(BLOCKING.length)})
            AND check_in < ? AND check_out > ?
          FOR UPDATE`,
        [roomId, ...BLOCKING, checkOut, checkIn],
      )
      if (taken.length > 0) {
        throw conflict('Tanggal tersebut sudah dipesan orang lain.', 'DATE_TAKEN')
      }

      const [dupe] = await conn.execute(
        `SELECT id FROM bookings
          WHERE room_id = ? AND guest_phone = ? AND check_in = ? AND status = 'pending'
          FOR UPDATE`,
        [roomId, guestPhone, checkIn],
      )
      if (dupe.length > 0) {
        throw conflict(
          'Sudah ada pesanan menunggu konfirmasi dengan nomor dan tanggal yang sama.',
          'DUPLICATE_PENDING',
        )
      }

      // Harga dihitung ulang dari data kamar + promo di database — nilai apa
      // pun yang dikirim klien diabaikan. Estimasi yang tampil di browser
      // memakai modul yang sama (shared/pricing.js), jadi angkanya sama tanpa
      // perlu saling percaya.
      const promos = await loadPromos(conn, roomId, checkIn, checkOut)
      const { total } = computeStay({ room, checkIn, checkOut, promos })

      await conn.execute(
        `INSERT INTO bookings
           (id, room_id, guest_name, guest_phone, check_in, check_out,
            guest_count, status, total_price, notes, payment_proof_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [id, roomId, guestName, guestPhone, checkIn, checkOut, guestCount, total, notes, proof],
      )
    })

    res.status(201).json({ id })
  }),
)

/**
 * Cek status booking publik (/cek-booking) — pengganti RPC get_booking_status.
 * Kode booking DAN nomor WA harus dua-duanya cocok. Bukti bayar hanya
 * dikembalikan sebagai boolean has_proof, tidak pernah sebagai tautan:
 * halaman ini tidak butuh login, jadi tidak boleh membuka berkas apa pun.
 */
bookingsRouter.post(
  '/status',
  wrap(async (req, res) => {
    const code = String(req.body?.code ?? '').trim().toLowerCase()
    const phone = String(req.body?.phone ?? '')

    // Kode = 8 heksadesimal pertama dari UUID booking. Divalidasi ketat supaya
    // tidak ada wildcard LIKE ('%') yang diselundupkan untuk memindai booking
    // orang lain hanya berbekal satu nomor telepon.
    if (!/^[0-9a-f]{8}$/.test(code) || !/^62\d{8,13}$/.test(phone)) {
      res.json({ found: false })
      return
    }

    const row = await queryOne(
      `SELECT b.id, b.guest_name, b.status, r.name AS room_name,
              b.check_in, b.check_out, b.guest_count, b.total_price,
              b.notes, b.created_at,
              (b.payment_proof_url IS NOT NULL) AS has_proof
         FROM bookings b
         JOIN rooms r ON r.id = b.room_id
        WHERE LOWER(b.id) LIKE CONCAT(?, '-%') AND b.guest_phone = ?
        LIMIT 1`,
      [code, phone],
    )

    if (!row) {
      res.json({ found: false })
      return
    }
    res.json({ found: true, booking: { ...row, has_proof: bool(row.has_proof) } })
  }),
)

// ===========================================================================
// ADMIN
// ===========================================================================

bookingsRouter.get(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const rows = await query(
      `SELECT b.*, r.name AS room_name, r.slug AS room_slug
         FROM bookings b
         LEFT JOIN rooms r ON r.id = b.room_id
        ORDER BY b.check_in DESC`,
    )
    res.json(rows.map(normalizeBooking))
  }),
)

bookingsRouter.get(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const row = await queryOne(
      `SELECT b.*, r.name AS room_name, r.slug AS room_slug
         FROM bookings b
         LEFT JOIN rooms r ON r.id = b.room_id
        WHERE b.id = ?`,
      [req.params.id],
    )
    if (!row) throw notFound('Booking tidak ditemukan.')
    res.json(normalizeBooking(row))
  }),
)

/**
 * URL bertanda tangan untuk bukti bayar — pengganti createSignedUrl Supabase.
 * Hanya admin yang bisa memintanya; URL hasilnya berlaku sementara.
 */
bookingsRouter.get(
  '/:id/proof-url',
  requireAuth,
  wrap(async (req, res) => {
    const row = await queryOne('SELECT payment_proof_url FROM bookings WHERE id = ?', [
      req.params.id,
    ])
    if (!row) throw notFound('Booking tidak ditemukan.')
    if (!row.payment_proof_url) {
      res.json({ url: '' })
      return
    }
    res.json({ url: signProofUrl(row.payment_proof_url) })
  }),
)

/** Field booking yang boleh ditulis admin. */
function bookingFields(body) {
  const roomId = String(body?.room_id ?? '')
  const guestName = String(body?.guest_name ?? '').trim()
  const guestPhone = String(body?.guest_phone ?? '').trim()
  const checkIn = String(body?.check_in ?? '')
  const checkOut = String(body?.check_out ?? '')
  const status = String(body?.status ?? 'pending')

  if (!roomId || !guestName || !guestPhone) {
    throw badRequest('Kamar, nama tamu, dan nomor WA wajib diisi.', 'MISSING_FIELDS')
  }
  if (!ISO_DATE.test(checkIn) || !ISO_DATE.test(checkOut)) {
    throw badRequest('Tanggal tidak valid.', 'INVALID_DATES')
  }
  if (checkOut <= checkIn) {
    throw badRequest('Tanggal check-out harus setelah check-in.', 'INVALID_DATE_RANGE')
  }
  if (!ALL_STATUS.includes(status)) {
    throw badRequest('Status booking tidak dikenal.', 'INVALID_STATUS')
  }

  return {
    room_id: roomId,
    guest_name: guestName,
    guest_phone: guestPhone,
    check_in: checkIn,
    check_out: checkOut,
    guest_count: Number(body.guest_count) || 1,
    status,
    total_price: body.total_price ? Number(body.total_price) : null,
    notes: body.notes?.trim() || null,
  }
}

/**
 * Cek bentrok sisi admin. Berbeda dengan jalur publik, admin BOLEH melihat
 * nama tamu yang bentrok supaya pesan errornya berguna.
 */
async function findConflict(conn, { roomId, checkIn, checkOut, ignoreId }) {
  const [rows] = await conn.execute(
    `SELECT id, guest_name FROM bookings
      WHERE room_id = ?
        AND status IN (${placeholders(BLOCKING.length)})
        AND check_in < ? AND check_out > ?
        AND (? IS NULL OR id <> ?)
      LIMIT 1
      FOR UPDATE`,
    [roomId, ...BLOCKING, checkOut, checkIn, ignoreId, ignoreId],
  )
  return rows[0] ?? null
}

bookingsRouter.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const fields = bookingFields(req.body)
    const id = crypto.randomUUID()
    const cols = Object.keys(fields)

    await transaction(async (conn) => {
      if (BLOCKING.includes(fields.status)) {
        const c = await findConflict(conn, {
          roomId: fields.room_id,
          checkIn: fields.check_in,
          checkOut: fields.check_out,
          ignoreId: null,
        })
        if (c) {
          throw conflict(
            `Tanggal bentrok dengan booking lain (${c.guest_name ?? 'tamu'}) di kamar ini.`,
            'DATE_TAKEN',
          )
        }
      }
      await conn.execute(
        `INSERT INTO bookings (id, ${cols.join(', ')})
         VALUES (?, ${placeholders(cols.length)})`,
        [id, ...cols.map((c) => fields[c])],
      )
    })

    res.status(201).json({ id })
  }),
)

bookingsRouter.put(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const fields = bookingFields(req.body)
    const cols = Object.keys(fields)
    const { id } = req.params

    await transaction(async (conn) => {
      if (BLOCKING.includes(fields.status)) {
        const c = await findConflict(conn, {
          roomId: fields.room_id,
          checkIn: fields.check_in,
          checkOut: fields.check_out,
          ignoreId: id,
        })
        if (c) {
          throw conflict(
            `Tanggal bentrok dengan booking lain (${c.guest_name ?? 'tamu'}) di kamar ini.`,
            'DATE_TAKEN',
          )
        }
      }
      const [result] = await conn.execute(
        `UPDATE bookings SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...cols.map((c) => fields[c]), id],
      )
      assertAffected(result, 'Booking tidak ditemukan.')
    })

    res.json({ id })
  }),
)

bookingsRouter.patch(
  '/:id/status',
  requireAuth,
  wrap(async (req, res) => {
    const status = String(req.body?.status ?? '')
    if (!ALL_STATUS.includes(status)) {
      throw badRequest('Status booking tidak dikenal.', 'INVALID_STATUS')
    }
    const result = await execute('UPDATE bookings SET status = ? WHERE id = ?', [
      status,
      req.params.id,
    ])
    assertAffected(result, 'Booking tidak ditemukan.')
    res.json({ id: req.params.id, status })
  }),
)

bookingsRouter.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const result = await execute('DELETE FROM bookings WHERE id = ?', [req.params.id])
    assertAffected(result, 'Booking tidak ditemukan.')
    res.json({ deleted: 1 })
  }),
)

bookingsRouter.post(
  '/bulk-delete',
  requireAuth,
  wrap(async (req, res) => {
    const ids = requireIdList(req.body?.ids)
    const result = await execute(
      `DELETE FROM bookings WHERE id IN (${placeholders(ids.length)})`,
      ids,
    )
    assertAffected(result, 'Booking tidak ditemukan.')
    res.json({ deleted: result.affectedRows })
  }),
)
