<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { useToast } from '../../composables/useToast'
import { QR_SIZE, qrPlaceholderCells } from '../../composables/useQrisPlaceholder'
import { formatRupiah } from '../../lib/format'

const props = defineProps({
  merchantName: { type: String, default: '' },
  nmid: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  total: { type: Number, default: 0 },
})

const qrModules = computed(() => qrPlaceholderCells())
const toast = useToast()
const copied = ref(false)

async function copyAmount() {
  try {
    await navigator.clipboard.writeText(String(props.total))
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
    toast.success('Nominal pembayaran disalin.')
  } catch {
    toast.error('Gagal menyalin - salin nominal secara manual.')
  }
}
</script>

<template>
  <section class="overflow-hidden rounded-md border border-hairline bg-canvas shadow-float">
    <div class="flex items-center justify-between gap-3 bg-primary px-5 py-3.5">
      <div>
        <p class="text-xs font-medium uppercase tracking-wide text-white/70">Bayar dengan</p>
        <p class="text-lg font-semibold tracking-tight text-white">QRIS</p>
      </div>
      <p class="text-right text-xs leading-tight text-white/80">
        Semua e-wallet<br />&amp; mobile banking
      </p>
    </div>

    <div class="flex flex-col items-center px-5 py-7">
      <!-- Nama merchant & NMID hanya ditampilkan untuk placeholder demo; gambar QRIS
           asli yang diunduh dari penyedia QRIS sudah memuat info ini di dalam gambarnya. -->
      <template v-if="!imageUrl">
        <p class="text-sm font-semibold text-ink">{{ merchantName }}</p>
        <p class="mt-0.5 text-xs text-muted">NMID: {{ nmid }}</p>
      </template>

      <!-- Gambar QRIS asli bila diunggah admin, jika tidak pakai placeholder -->
      <div class="rounded-md border border-hairline bg-white p-3" :class="!imageUrl && 'mt-4'">
        <img v-if="imageUrl" :src="imageUrl" alt="Kode QRIS pembayaran" class="max-h-[480px] w-64 object-contain" />
        <svg v-else :viewBox="`0 0 ${QR_SIZE} ${QR_SIZE}`" shape-rendering="crispEdges" class="h-56 w-56 text-ink"
          role="img" aria-label="Contoh kode QRIS (placeholder demo)">
          <rect v-for="(cell, i) in qrModules" :key="i" :x="cell.x" :y="cell.y" width="1" height="1"
            fill="currentColor" />
        </svg>
      </div>

      <p v-if="!imageUrl"
        class="mt-3 flex items-center gap-1.5 rounded-full bg-surface-strong px-3 py-1 text-[11px] font-medium text-bronze">
        <IconGlyph name="qr" class="h-3.5 w-3.5" />
        Contoh QRIS (demo) - admin belum mengunggah kode asli
      </p>

      <!-- Nominal -->
      <div class="mt-5 w-full rounded-md bg-surface-soft px-4 py-3.5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-xs text-muted">Total pembayaran</p>
            <p class="text-xl font-semibold text-ink">{{ formatRupiah(total) }}</p>
          </div>
          <button type="button" @click="copyAmount"
            class="inline-flex h-9 items-center gap-1.5 rounded-sm border border-hairline bg-canvas px-3 text-xs font-medium text-ink transition-colors hover:border-border-strong">
            <IconGlyph :name="copied ? 'check' : 'copy'" class="h-4 w-4" />
            {{ copied ? 'Tersalin' : 'Salin' }}
          </button>
        </div>
        <p class="mt-1.5 text-[11px] leading-relaxed text-muted">
          Masukkan nominal ini secara manual saat membayar (QRIS statis tidak
          mengunci jumlah).
        </p>
      </div>
    </div>
  </section>
</template>
