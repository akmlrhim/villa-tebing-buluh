<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { useToast } from '../../composables/useToast'
import { formatDateID, formatRupiah, nightsBetween } from '../../lib/format'
import { STATUS_CLASS, STATUS_LABEL } from '../../lib/bookingStatus'

// Isi detail booking + bukti bayar, dipakai oleh BookingDetailView.
const props = defineProps({
  booking: { type: Object, required: true },
  proofUrl: { type: String, default: '' },
  proofLoading: { type: Boolean, default: false },
  proofError: { type: String, default: '' },
})

const toast = useToast()
const copied = ref(false)

// 8 karakter pertama UUID, huruf besar — kode yang sama persis dipakai tamu
// di layar sukses pembayaran & halaman publik /cek-booking.
const code = computed(() => props.booking.id.slice(0, 8).toUpperCase())

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
    toast.success('Kode booking disalin.')
  } catch {
    toast.error('Gagal menyalin - salin kode secara manual.')
  }
}

const createdAt = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'
</script>

<template>
  <div class="grid gap-8 px-6 py-6 md:grid-cols-2">
    <!-- Ringkasan booking & pembayaran -->
    <dl class="grid grid-cols-2 content-start gap-x-5 gap-y-4 text-sm">
      <div class="col-span-2">
        <dt class="text-xs text-muted">Kode booking</dt>
        <dd class="mt-1">
          <button type="button"
            class="inline-flex items-center gap-2 rounded-sm bg-surface-strong px-2.5 py-1.5 font-mono text-sm font-semibold tracking-[0.2em] text-ink transition-colors hover:bg-surface-soft"
            @click="copyCode">
            {{ code }}
            <IconGlyph :name="copied ? 'check' : 'copy'" class="h-3.5 w-3.5 text-muted" />
          </button>
          <span class="ml-2 text-xs text-muted">dipakai tamu untuk cek status di /cek-booking</span>
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Tamu</dt>
        <dd class="mt-0.5 font-medium text-ink">{{ booking.guest_name }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Telepon</dt>
        <dd class="mt-0.5 text-body">{{ booking.guest_phone || '-' }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Kamar</dt>
        <dd class="mt-0.5 text-body">{{ booking.rooms?.name ?? '-' }}</dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Jumlah tamu</dt>
        <dd class="mt-0.5 text-body">{{ booking.guest_count }} orang</dd>
      </div>
      <div class="col-span-2">
        <dt class="text-xs text-muted">Menginap</dt>
        <dd class="mt-0.5 text-body">
          {{ formatDateID(booking.check_in, { weekday: false }) }} -
          {{ formatDateID(booking.check_out, { weekday: false }) }}
          <span class="text-xs text-muted">({{ nightsBetween(booking.check_in, booking.check_out) }} malam)</span>
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Status</dt>
        <dd class="mt-0.5">
          <span class="rounded-full px-2 py-0.5 text-xs font-medium" :class="STATUS_CLASS[booking.status]">
            {{ STATUS_LABEL[booking.status] }}
          </span>
        </dd>
      </div>
      <div>
        <dt class="text-xs text-muted">Total pembayaran</dt>
        <dd class="mt-0.5 font-semibold text-ink">
          {{ booking.total_price ? formatRupiah(booking.total_price) : '-' }}
        </dd>
      </div>
      <div class="col-span-2">
        <dt class="text-xs text-muted">Booking dibuat</dt>
        <dd class="mt-0.5 text-body">{{ createdAt(booking.created_at) }}</dd>
      </div>
      <div v-if="booking.notes" class="col-span-2">
        <dt class="text-xs text-muted">Catatan tamu</dt>
        <dd class="mt-0.5 text-body">{{ booking.notes }}</dd>
      </div>
    </dl>

    <!-- Bukti bayar -->
    <div>
      <p class="text-xs font-medium text-muted">Bukti bayar</p>
      <div class="mt-2 grid min-h-64 place-items-center rounded-md bg-surface-soft p-3">
        <div v-if="proofLoading" class="h-56 w-56 animate-pulse rounded-md bg-surface-strong" />
        <p v-else-if="proofError" class="px-4 text-center text-sm text-error">{{ proofError }}</p>
        <img v-else-if="proofUrl" :src="proofUrl" alt="Bukti pembayaran tamu"
          class="mx-auto max-h-[60vh] rounded-sm border border-hairline bg-white object-contain" />
        <p v-else class="px-4 text-center text-sm text-muted">Belum ada bukti bayar yang diunggah.</p>
      </div>
      <a v-if="proofUrl" :href="proofUrl" target="_blank" rel="noopener noreferrer"
        class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <IconGlyph name="expand" class="h-4 w-4" />
        Buka ukuran penuh di tab baru
      </a>
    </div>
  </div>
</template>
