// Generator pola QRIS DEKORATIF (bukan kode QR valid) — dipakai saat admin
// belum mengunggah gambar QRIS asli. Deterministik agar tidak berubah tiap render.
export const QR_SIZE = 33

export function qrPlaceholderCells(size = QR_SIZE) {
  const grid = Array.from({ length: size }, () => Array(size).fill(false))
  const finder = (r, c) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const border = i === 0 || i === 6 || j === 0 || j === 6
        const core = i >= 2 && i <= 4 && j >= 2 && j <= 4
        grid[r + i][c + j] = border || core
      }
  }
  finder(0, 0)
  finder(0, size - 7)
  finder(size - 7, 0)
  // Pola data pseudo-acak deterministik (murni dekoratif).
  let s = 1013904223
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
  const inFinder = (r, c) =>
    (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)
  const cells = []
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      if (!inFinder(r, c)) grid[r][c] = rand() > 0.52
      if (grid[r][c]) cells.push({ x: c, y: r })
    }
  return cells
}
