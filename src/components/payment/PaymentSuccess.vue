<script setup>
import { computed, onMounted } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import WhatsAppGlyph from '../WhatsAppGlyph.vue'
import { formatDateID, formatRupiah } from '../../lib/format'
import { paymentSubmittedMessage, waLink } from '../../lib/whatsapp'

const props = defineProps({
  code: { type: String, required: true },
  guestName: { type: String, required: true },
  room: { type: Object, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  total: { type: Number, required: true },
  whatsappNumber: { type: String, default: '' },
})

const followUpUrl = computed(() =>
  waLink(
    props.whatsappNumber,
    paymentSubmittedMessage({
      guestName: props.guestName,
      roomName: props.room.name,
      checkIn: props.checkIn,
      checkOut: props.checkOut,
      bookingCode: props.code,
    }),
  ),
)

onMounted(() => {
  if (props.whatsappNumber) window.open(followUpUrl.value, '_blank', 'noopener,noreferrer')
})
</script>

<template>
  <div class="mx-auto mt-4 max-w-lg md:mt-8">
    <div class="overflow-hidden rounded-md border border-hairline bg-canvas shadow-float">
      <div class="bg-primary px-6 py-8 text-center">
        <span class="mx-auto grid h-14 w-14 place-items-center rounded-full bg-white/15">
          <IconGlyph name="check" class="h-7 w-7 text-white" />
        </span>
        <h1 class="mt-4 text-2xl font-semibold tracking-tight text-white">Konfirmasi terkirim!</h1>
        <p class="mt-1.5 text-sm text-white/85">
          Kode booking:
          <span class="font-semibold tracking-widest">{{ code }}</span>
        </p>
      </div>

      <div class="space-y-5 p-6">
        <dl class="space-y-2.5 text-sm">
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Kamar</dt>
            <dd class="text-right font-medium text-ink">{{ room.name }}</dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Menginap</dt>
            <dd class="text-right font-medium text-ink">
              {{ formatDateID(checkIn, { weekday: false }) }} -
              {{ formatDateID(checkOut, { weekday: false }) }}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Total dibayar</dt>
            <dd class="text-right font-medium text-ink">{{ formatRupiah(total) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3">
            <dt class="text-muted">Status</dt>
            <dd>
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-sand/25 px-2.5 py-1 text-xs font-medium text-bronze">
                <IconGlyph name="clock" class="h-3.5 w-3.5" />
                Menunggu verifikasi
              </span>
            </dd>
          </div>
        </dl>

        <div class="rounded-md bg-surface-soft px-4 py-3.5">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">Apa selanjutnya?</p>
          <ol class="mt-2.5 space-y-2 text-sm leading-relaxed text-body">
            <li class="flex gap-2.5">
              <span
                class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white">1</span>
              Admin memeriksa bukti pembayaranmu.
            </li>
            <li class="flex gap-2.5">
              <span
                class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white">2</span>
              Kamu dihubungi lewat WhatsApp begitu booking terkonfirmasi.
            </li>
            <li class="flex gap-2.5">
              <span
                class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-white">3</span>
              Tanggal menginapmu terkunci - sampai jumpa di vila!
            </li>
          </ol>
        </div>

        <div class="space-y-3">
          <a :href="followUpUrl" target="_blank" rel="noopener noreferrer"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-wa text-base font-medium text-white transition-opacity hover:opacity-90">
            <WhatsAppGlyph class="h-5 w-5" />
            Hubungi Admin via WhatsApp
          </a>
          <RouterLink :to="{ name: 'booking-status', query: { code } }"
            class="flex h-11 w-full items-center justify-center rounded-sm border border-hairline text-sm font-medium text-ink transition-colors hover:border-border-strong">
            Cek Status Booking
          </RouterLink>
          <RouterLink to="/"
            class="flex h-11 w-full items-center justify-center text-sm font-medium text-muted transition-colors hover:text-ink">
            Kembali ke Beranda
          </RouterLink>
        </div>
      </div>
    </div>
    <p class="mt-3 text-center text-xs leading-relaxed text-muted">
      Simpan kode booking di atas untuk memudahkan komunikasi dengan admin.
    </p>
  </div>
</template>
