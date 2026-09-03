<script setup>
import IconGlyph from './IconGlyph.vue'
import PriceBreakdown from './PriceBreakdown.vue'
import { formatDateID } from '../lib/format'

defineProps({
  room: { type: Object, required: true },
  range: { type: Object, default: null },
  guests: { type: Number, required: true },
  nights: { type: Number, default: 0 },
  stay: { type: Object, default: null },
  belowMinNights: { type: Boolean, default: false },
  canBook: { type: Boolean, default: false },
})
const emit = defineEmits(['update:guests', 'book'])
</script>

<template>
  <div class="rounded-md border border-hairline bg-canvas p-5 shadow-float">
    <div class="space-y-2">
      <div class="rounded-sm border border-hairline px-3 py-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Check-in</p>
        <p class="mt-0.5 text-sm whitespace-nowrap" :class="range ? 'text-ink' : 'text-muted-soft'">
          {{ range ? formatDateID(range.checkIn) : 'Pilih tanggal' }}
        </p>
      </div>
      <div class="rounded-sm border border-hairline px-3 py-2">
        <p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Check-out</p>
        <p class="mt-0.5 text-sm whitespace-nowrap" :class="range ? 'text-ink' : 'text-muted-soft'">
          {{ range ? formatDateID(range.checkOut) : 'Pilih tanggal' }}
        </p>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-between rounded-sm border border-hairline px-3 py-2">
      <p class="text-sm text-ink">Jumlah tamu</p>
      <div class="flex items-center gap-2.5">
        <button type="button"
          class="grid size-7 place-items-center rounded-full border border-border-strong text-sm leading-none text-ink hover:enabled:border-ink disabled:cursor-not-allowed disabled:border-hairline-soft disabled:text-muted-soft"
          aria-label="Kurangi tamu" :disabled="guests <= 1" @click="emit('update:guests', guests - 1)">−</button>
        <span class="min-w-5 text-center text-sm font-medium">{{ guests }}</span>
        <button type="button"
          class="grid size-7 place-items-center rounded-full border border-border-strong text-sm leading-none text-ink hover:enabled:border-ink disabled:cursor-not-allowed disabled:border-hairline-soft disabled:text-muted-soft"
          aria-label="Tambah tamu" :disabled="guests >= room.max_guests"
          @click="emit('update:guests', guests + 1)">+</button>
      </div>
    </div>
    <p class="mt-1.5 text-xs text-muted">Maksimal {{ room.max_guests }} tamu untuk kamar ini.</p>

    <div v-if="nights > 0" class="mt-4 border-t border-hairline-soft pt-4">
      <PriceBreakdown :stay="stay" total-label="Estimasi total" />
    </div>

    <p v-if="belowMinNights" class="mt-3 text-sm text-error" role="alert">
      Kamar ini minimal menginap {{ room.min_nights }} malam.
    </p>

    <button v-if="canBook" type="button" @click="emit('book')"
      class="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary text-base font-medium text-white transition-colors hover:bg-primary-active">
      Lanjut ke Pembayaran
      <IconGlyph name="arrow-right" class="h-5 w-5" />
    </button>
    <button v-else type="button" disabled
      class="mt-4 flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-sm bg-primary-disabled text-base font-medium text-white">
      Lanjut ke Pembayaran
      <IconGlyph name="arrow-right" class="h-5 w-5" />
    </button>
    <p class="mt-3 text-xs leading-relaxed text-muted">
      Pembayaran lewat QRIS. Di halaman berikutnya tampil kode QRIS dan
      tata cara pembayaran; ketersediaan kamar dikonfirmasi admin setelah
      bukti pembayaran diterima.
    </p>
  </div>
</template>
