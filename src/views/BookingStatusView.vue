<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import EmptyState from '../components/EmptyState.vue'
import IconGlyph from '../components/IconGlyph.vue'
import WhatsAppGlyph from '../components/WhatsAppGlyph.vue'
import { useBookingStatus } from '../composables/useBookingStatus'
import { useSettings } from '../composables/useSettings'
import { formatDateID, formatRupiah, nightsBetween } from '../lib/format'
import { normalizePhone, waLink, generalMessage } from '../lib/whatsapp'
import { STATUS_CLASS, STATUS_LABEL } from '../lib/bookingStatus'

const route = useRoute()
const { whatsappNumber } = useSettings()
const { result, loading, error, notFound, checkStatus, reset } = useBookingStatus()

const code = ref(String(route.query.code ?? '').toUpperCase().slice(0, 8))
const phone = ref('')
const triedSubmit = ref(false)

const phoneNormalized = computed(() => normalizePhone(phone.value))
const codeValid = computed(() => /^[0-9a-f]{8}$/i.test(code.value.trim()))
const phoneValid = computed(() => /^62\d{8,13}$/.test(phoneNormalized.value))

async function onSubmit() {
  triedSubmit.value = true
  if (!codeValid.value || !phoneValid.value) return
  await checkStatus(code.value, phoneNormalized.value)
}

function onEditSearch() {
  reset()
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

const INPUT_CLASS =
  'h-11 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15'
</script>

<template>
  <div class="mx-auto max-w-lg px-4 py-10 sm:px-6 md:py-16">
    <div class="text-center">
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10">
        <IconGlyph name="search" class="h-6 w-6 text-primary" />
      </span>
      <h1 class="font-display mt-4 text-2xl font-semibold tracking-tight text-ink md:text-3xl">Cek Status Booking</h1>
      <p class="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Masukkan kode booking dan nomor WhatsApp yang kamu pakai saat konfirmasi pembayaran.
      </p>
    </div>

    <form v-if="!result" class="mt-7 space-y-4 rounded-md border border-hairline bg-canvas p-5 shadow-float" novalidate
      @submit.prevent="onSubmit">
      <div v-if="error" class="flex items-start gap-2 rounded-sm bg-error/10 px-3 py-2.5 text-sm text-error" role="alert">
        <IconGlyph name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
        <span>{{ error }}</span>
      </div>

      <div>
        <label for="kode" class="text-sm font-medium text-ink">Kode booking</label>
        <input id="kode" v-model="code" type="text" maxlength="8" placeholder="Contoh: 3FA85F64"
          class="mt-1.5 uppercase tracking-widest" :class="INPUT_CLASS" @input="code = code.toUpperCase()" />
        <p v-if="triedSubmit && !codeValid" class="mt-1.5 text-xs text-error">
          Kode terdiri dari 8 huruf/angka - lihat di layar konfirmasi atau pesan WhatsApp.
        </p>
      </div>

      <div>
        <label for="wa" class="text-sm font-medium text-ink">Nomor WhatsApp</label>
        <input id="wa" v-model="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"
          class="mt-1.5" :class="INPUT_CLASS" />
        <p v-if="triedSubmit && !phoneValid" class="mt-1.5 text-xs text-error">
          Nomor tidak valid - gunakan format 08xx atau 62xx.
        </p>
      </div>

      <button type="submit" :disabled="loading"
        class="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary text-base font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60">
        <svg v-if="loading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <IconGlyph v-else name="search" class="h-5 w-5" />
        {{ loading ? 'Memeriksa…' : 'Cek Status' }}
      </button>
    </form>

    <EmptyState
      v-if="notFound"
      icon="search"
      title="Booking tidak ditemukan"
      description="Pastikan kode booking dan nomor WhatsApp sudah benar, atau tanyakan langsung ke admin."
      class="mt-5"
    >
      <a :href="waLink(whatsappNumber, generalMessage())" target="_blank" rel="noopener noreferrer"
        class="inline-flex h-11 items-center gap-2 rounded-sm bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-active">
        <WhatsAppGlyph class="h-4.5 w-4.5" />
        Tanya Admin via WhatsApp
      </a>
    </EmptyState>

    <div v-if="result" class="mt-7 overflow-hidden rounded-md border border-hairline bg-canvas shadow-float">
      <div class="flex items-center justify-between gap-3 bg-primary px-6 py-6 text-center">
        <div class="mx-auto">
          <p class="text-sm text-white/85">Halo, {{ result.guest_name }}</p>
          <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white">
            {{ STATUS_LABEL[result.status] ?? result.status }}
          </span>
        </div>
      </div>

      <div class="space-y-5 p-6">
        <dl class="space-y-2.5 text-sm">
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Kamar</dt>
            <dd class="text-right font-medium text-ink">{{ result.room_name }}</dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Menginap</dt>
            <dd class="text-right font-medium text-ink">
              {{ formatDateID(result.check_in, { weekday: false }) }} -
              {{ formatDateID(result.check_out, { weekday: false }) }}
              <span class="block text-xs font-normal text-muted">
                {{ nightsBetween(result.check_in, result.check_out) }} malam · {{ result.guest_count }} tamu
              </span>
            </dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Total</dt>
            <dd class="text-right font-medium text-ink">
              {{ result.total_price ? formatRupiah(result.total_price) : '-' }}
            </dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Bukti bayar</dt>
            <dd class="text-right font-medium text-ink">{{ result.has_proof ? 'Sudah diterima' : 'Belum diunggah' }}</dd>
          </div>
          <div class="flex items-start justify-between gap-3">
            <dt class="text-muted">Dikonfirmasi</dt>
            <dd class="text-right font-medium text-ink">{{ createdAt(result.created_at) }}</dd>
          </div>
          <div v-if="result.notes" class="flex items-start justify-between gap-3">
            <dt class="text-muted">Catatan</dt>
            <dd class="text-right font-medium text-ink">{{ result.notes }}</dd>
          </div>
        </dl>

        <div class="rounded-md px-2 py-0.5 text-xs font-medium" :class="STATUS_CLASS[result.status]">
          <p class="px-2 py-1.5">
            <template v-if="result.status === 'pending'">Menunggu verifikasi admin.</template>
            <template v-else-if="result.status === 'confirmed'">Terkonfirmasi - tanggal menginapmu sudah terkunci.</template>
            <template v-else-if="result.status === 'checked_in'">Sedang menginap. Selamat menikmati!</template>
            <template v-else-if="result.status === 'checked_out'">Selesai. Terima kasih sudah menginap!</template>
            <template v-else-if="result.status === 'cancelled'">Booking ini dibatalkan.</template>
          </p>
        </div>

        <div class="space-y-3">
          <a :href="waLink(whatsappNumber, generalMessage())" target="_blank" rel="noopener noreferrer"
            class="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-wa text-base font-medium text-white transition-opacity hover:opacity-90">
            <WhatsAppGlyph class="h-5 w-5" />
            Hubungi Admin via WhatsApp
          </a>
          <button type="button"
            class="flex h-11 w-full items-center justify-center rounded-sm border border-hairline text-sm font-medium text-ink transition-colors hover:border-border-strong"
            @click="onEditSearch">
            Cek Booking Lain
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
