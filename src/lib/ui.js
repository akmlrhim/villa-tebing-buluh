// Konstanta string utility Tailwind yang berulang di banyak komponen.
// Konvensi proyek: styling hanya utility inline; mengekstrak string utility ke
// konstanta JS diizinkan (pola yang sama seperti INPUT_CLASS/DAY_CLASS lama)
// dan menghindari duplikasi kelas panjang yang identik.

/** Input / textarea di form admin (tinggi 10.5). */
export const fieldClass =
  'h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15'

// Chevron SVG (data-URI) untuk <select> appearance-none.
const CHEVRON =
  "bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236e6759%22%20stroke-width=%221.8%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-position-[right_0.875rem_center] bg-no-repeat"

/** <select> bergaya field admin dengan chevron kustom. */
export const selectClass = `h-10.5 w-full appearance-none rounded-sm border border-hairline bg-canvas ${CHEVRON} pl-3.5 pr-10 text-sm text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15`

/** Tombol aksi utama (hijau). */
export const btnPrimary =
  'inline-flex h-10.5 items-center justify-center gap-2 rounded-sm bg-primary px-[1.1rem] text-[0.9375rem] font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60'

/** Tombol sekunder (garis). */
export const btnGhost =
  'inline-flex h-10.5 items-center justify-center gap-2 rounded-sm border border-hairline bg-canvas px-[1.1rem] text-[0.9375rem] font-medium text-ink transition-colors hover:border-border-strong'

/** Tombol destruktif (merah). */
export const btnDanger =
  'inline-flex h-10.5 items-center gap-2 rounded-sm bg-error px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60'
