import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'villatebingbuluh',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',

  dateStrings: ['DATE'],

  decimalNumbers: true,
});

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** SELECT satu baris — mengembalikan baris pertama atau null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

/** INSERT/UPDATE/DELETE — mengembalikan ResultSetHeader (affectedRows dll). */
export async function execute(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result;
}

/**
 * Menjalankan `fn` di dalam satu transaksi; commit bila sukses, rollback bila
 * melempar. Dipakai untuk operasi yang harus atomik — terutama pembuatan
 * booking publik (cek bentrok + insert) dan penulisan ulang foto kamar.
 */
export async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * MySQL menyimpan boolean sebagai TINYINT(1) dan mengembalikannya sebagai
 * 0/1. Supabase dulu mengembalikan true/false, dan frontend memakainya
 * langsung di v-model checkbox (`is_active`) — 0/1 akan membuat checkbox
 * tampak selalu "berubah". Semua route memakai ini sebelum mengirim JSON.
 */
export const bool = (v) => Boolean(v);
