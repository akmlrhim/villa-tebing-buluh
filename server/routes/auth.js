import express from 'express'
import bcrypt from 'bcryptjs'
import { queryOne } from '../db.js'
import { signToken, requireAuth, TOKEN_TTL } from '../middleware/auth.js'
import { HttpError, wrap } from '../lib/http.js'

export const authRouter = express.Router()

/**
 * Login admin — pengganti supabase.auth.signInWithPassword().
 * TIDAK ADA endpoint registrasi: akun hanya dibuat lewat
 * `node server/scripts/create-admin.js`. Ini padanan dari mematikan
 * "Allow new users to sign up" di dashboard Supabase.
 */
authRouter.post(
  '/login',
  wrap(async (req, res) => {
    const email = String(req.body?.email ?? '').trim().toLowerCase()
    const password = String(req.body?.password ?? '')

    const user = email
      ? await queryOne('SELECT id, email, password_hash FROM admin_users WHERE email = ?', [email])
      : null

    // Pesan yang sama untuk email tidak terdaftar maupun password salah, dan
    // hash dibandingkan walau user tidak ada — supaya tidak ada cara (baik
    // dari pesan maupun dari selisih waktu respons) untuk menebak email mana
    // yang terdaftar sebagai admin.
    const hash = user?.password_hash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin'
    const ok = await bcrypt.compare(password, hash)
    if (!user || !ok) {
      throw new HttpError(401, 'Email atau password salah.', 'INVALID_CREDENTIALS')
    }

    res.json({
      token: signToken(user),
      user: { id: user.id, email: user.email },
      expiresIn: TOKEN_TTL,
    })
  }),
)

/**
 * Memulihkan sesi saat halaman dimuat ulang — pengganti
 * supabase.auth.getSession(). Token disimpan frontend di localStorage;
 * endpoint ini yang memutuskan apakah masih sah.
 */
authRouter.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const user = await queryOne('SELECT id, email FROM admin_users WHERE id = ?', [req.user.sub])
    if (!user) throw new HttpError(401, 'Akun sudah tidak ada.', 'UNAUTHORIZED')
    res.json({ user })
  }),
)
