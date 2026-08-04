<script setup>
import IconGlyph from '../IconGlyph.vue'
import PriceBreakdown from '../PriceBreakdown.vue'
import { formatDateID } from '../../lib/format'

defineProps({
  room: { type: Object, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true },
  nights: { type: Number, required: true },
  stay: { type: Object, default: null },
  deadlineHours: { type: [Number, String], default: 24 },
})
const emit = defineEmits(['confirm'])
</script>

<template>
  <aside class="md:sticky md:top-24">
    <div class="overflow-hidden rounded-md border border-hairline bg-canvas shadow-float">
      <img v-if="room.images?.length" :src="room.images[0].url" :alt="room.images[0].alt"
        class="aspect-[16/10] w-full object-cover" />
      <div class="space-y-4 p-5">
        <h2 class="text-base font-semibold text-ink">{{ room.name }}</h2>

        <dl class="space-y-2.5 text-sm">
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Check-in</dt>
            <dd class="text-right font-medium text-ink">{{ formatDateID(checkIn) }}</dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Check-out</dt>
            <dd class="text-right font-medium text-ink">{{ formatDateID(checkOut) }}</dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Tamu</dt>
            <dd class="text-right font-medium text-ink">{{ guests }} orang</dd>
          </div>
        </dl>

        <div class="border-t border-hairline-soft pt-4">
          <PriceBreakdown :stay="stay" />
        </div>

        <div
          class="flex items-start gap-2 rounded-sm bg-surface-soft px-3 py-2.5 text-xs leading-relaxed text-muted">
          <IconGlyph name="clock" class="mt-0.5 h-4 w-4 shrink-0 text-bronze" />
          <span>Selesaikan pembayaran dalam {{ deadlineHours }} jam agar tanggalmu tidak
            dilepas kembali.</span>
        </div>

        <button type="button" @click="emit('confirm')"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary text-base font-medium text-white transition-colors hover:bg-primary-active">
          <IconGlyph name="check" class="h-5 w-5" />
          Saya Sudah Bayar
        </button>
        <p class="text-center text-xs leading-relaxed text-muted">
          Lanjut ke form konfirmasi untuk mengisi data diri dan mengunggah
          bukti pembayaran - tanpa keluar dari halaman ini.
        </p>
      </div>
    </div>
  </aside>
</template>
