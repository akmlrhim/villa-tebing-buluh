<script setup>
import { computed, ref } from 'vue'
import EmptyState from '../components/EmptyState.vue'
import IconGlyph from '../components/IconGlyph.vue'
import QrisCard from '../components/payment/QrisCard.vue'
import PaymentConfirmForm from '../components/payment/PaymentConfirmForm.vue'
import PaymentSuccess from '../components/payment/PaymentSuccess.vue'
import BookingSummary from '../components/payment/BookingSummary.vue'
import { usePaymentBooking } from '../composables/usePaymentBooking'
import { useSettings } from '../composables/useSettings'
import { formatRupiah } from '../lib/format'

const { params, room, nights, stay, total, stillLoading, invalid } = usePaymentBooking()
const {
  whatsappNumber,
  qrisImageUrl,
  qrisMerchantName,
  qrisNmid,
  paymentDeadlineHours,
} = useSettings()

const submitted = ref(null)

const steps = computed(() => [
  'Buka aplikasi e-wallet (GoPay, OVO, DANA, ShopeePay) atau m-banking, lalu pilih menu Bayar / Scan QRIS.',
  'Arahkan kamera ke kode QRIS di samping, atau simpan gambarnya lalu unggah dari galeri.',
  `Pastikan nama merchant "${qrisMerchantName.value}" muncul, lalu masukkan nominal ${formatRupiah(total.value)}.`,
  'Selesaikan pembayaran, lalu simpan / screenshot bukti pembayarannya.',
  'Isi formulir konfirmasi di bawah - masukkan nama, nomor WhatsApp, dan unggah bukti pembayaranmu.',
])

function onSubmitted(payload) {
  submitted.value = payload
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function scrollToForm() {
  document.getElementById('form-konfirmasi')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
    <RouterLink v-if="!submitted" to="/"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink">
      <IconGlyph name="chevron-left" class="h-4 w-4" />
      Kembali ke daftar kamar
    </RouterLink>

    <div v-if="stillLoading" class="mt-10 animate-pulse space-y-4">
      <div class="h-8 w-64 rounded-xs bg-surface-strong" />
      <div class="grid gap-8 md:grid-cols-[1fr_360px]">
        <div class="h-80 rounded-md bg-surface-strong" />
        <div class="h-64 rounded-md bg-surface-soft" />
      </div>
    </div>

    <EmptyState
      v-else-if="invalid"
      icon="calendar"
      title="Data booking belum lengkap"
      description="Silakan pilih kamar dan tanggal menginap terlebih dahulu untuk melanjutkan ke pembayaran."
      class="mt-12"
    >
      <RouterLink to="/"
        class="inline-flex h-11 items-center rounded-sm bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-active">
        Pilih Kamar
      </RouterLink>
    </EmptyState>

    <PaymentSuccess v-else-if="submitted" :code="submitted.code" :guest-name="submitted.guestName" :room="room"
      :check-in="params.checkIn" :check-out="params.checkOut" :total="total" :whatsapp-number="whatsappNumber" />

    <template v-else>
      <header class="mt-6">
        <h1 class="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          Selesaikan pembayaran
        </h1>
        <p class="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          Scan QRIS di bawah dengan aplikasi pembayaran favoritmu, lalu isi form
          konfirmasi dan unggah bukti pembayaran - kamar dikunci setelah
          pembayaran diverifikasi admin.
        </p>
      </header>

      <div class="mt-8 grid items-start gap-8 md:grid-cols-[1fr_360px]">
        <div class="space-y-8">
          <QrisCard :merchant-name="qrisMerchantName" :nmid="qrisNmid" :image-url="qrisImageUrl" :total="total" />

          <section>
            <h2 class="text-lg font-semibold text-ink">Tata cara pembayaran</h2>
            <ol class="mt-4 space-y-4">
              <li v-for="(step, i) in steps" :key="i" class="flex gap-3.5">
                <span
                  class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                  {{ i + 1 }}
                </span>
                <p class="text-base leading-relaxed text-body">{{ step }}</p>
              </li>
            </ol>
          </section>

          <PaymentConfirmForm :room="room" :check-in="params.checkIn" :check-out="params.checkOut"
            :guests="params.guests" @submitted="onSubmitted" />
        </div>

        <BookingSummary :room="room" :check-in="params.checkIn" :check-out="params.checkOut" :guests="params.guests"
          :nights="nights" :stay="stay" :deadline-hours="paymentDeadlineHours" @confirm="scrollToForm" />
      </div>
    </template>
  </div>
</template>
