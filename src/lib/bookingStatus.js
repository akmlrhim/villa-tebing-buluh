// Status booking (F-10) — dipakai di AdminBookingsView, BookingFormModal,
// dan AdminBookingCalendar.

export const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Terkonfirmasi' },
  { value: 'checked_in', label: 'Check-in' },
  { value: 'checked_out', label: 'Check-out' },
  { value: 'cancelled', label: 'Batal' },
]

export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]))

export const STATUS_CLASS = {
  pending: 'bg-sand/25 text-bronze',
  confirmed: 'bg-primary/12 text-primary',
  checked_in: 'bg-primary/12 text-primary',
  checked_out: 'bg-surface-strong text-muted',
  cancelled: 'bg-error/10 text-error',
}
