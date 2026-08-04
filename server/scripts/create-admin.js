import 'dotenv/config'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { pool, queryOne, execute } from '../db.js'

/**
 * Membuat / mengganti password akun admin.
 *   node server/scripts/create-admin.js admin@vila.com rahasia123
 *
 * Ini satu-satunya cara membuat akun admin — tidak ada endpoint registrasi di
 * API. Padanan dari "Authentication -> Add user" di dashboard Supabase.
 * Menjalankan ulang dengan email yang sama akan MENGGANTI passwordnya
 * (berguna kalau lupa password).
 */
const [email, password] = process.argv.slice(2)

if (!email || !password) {
  console.error('Pemakaian: node server/scripts/create-admin.js <email> <password>')
  process.exit(1)
}
if (password.length < 8) {
  console.error('Password minimal 8 karakter.')
  process.exit(1)
}

const normalized = email.trim().toLowerCase()
const hash = await bcrypt.hash(password, 10)

try {
  const existing = await queryOne('SELECT id FROM admin_users WHERE email = ?', [normalized])
  if (existing) {
    await execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hash, existing.id])
    console.log(`Password untuk ${normalized} berhasil diperbarui.`)
  } else {
    await execute('INSERT INTO admin_users (id, email, password_hash) VALUES (?, ?, ?)', [
      crypto.randomUUID(),
      normalized,
      hash,
    ])
    console.log(`Akun admin ${normalized} berhasil dibuat.`)
  }
} catch (err) {
  console.error('Gagal:', err.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
