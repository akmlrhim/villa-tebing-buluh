<script setup>
import { toRef } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { useBookingForm } from '../../composables/useBookingForm'
import { formatRupiah, todayISO } from '../../lib/format'
import { STATUSES } from '../../lib/bookingStatus'
import { fieldClass, selectClass, btnGhost, btnPrimary } from '../../lib/ui'

// Modal input/edit booking (F-10). prop.booking: null = baru, object = edit,
// undefined = tersembunyi. prop.rooms: daftar kamar untuk dropdown.
const props = defineProps({
  booking: { type: Object, default: undefined },
  rooms: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const { form, saving, errorMsg, isOpen, isEdit, nights, markTotalTouched, onSubmit } = useBookingForm(
  toRef(props, 'booking'),
  toRef(props, 'rooms'),
  emit,
)

// Input tanggal punya gaya khusus (picker kustom).
const DATE_CLASS =
  'h-10.5 w-full cursor-pointer appearance-none rounded-sm border border-hairline bg-canvas px-3.5 pr-10 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-date-and-time-value]:text-left'
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

    <div
      class="relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg bg-canvas shadow-float sm:rounded-lg">
      <header class="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
        <h2 class="font-sans text-lg font-semibold text-ink">{{ isEdit ? 'Edit Booking' : 'Booking Baru' }}</h2>
        <button type="button" class="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-strong"
          aria-label="Tutup" @click="emit('close')">
          <IconGlyph name="x" class="h-5 w-5" />
        </button>
      </header>

      <form class="flex-1 space-y-4 overflow-y-auto px-5 py-5" @submit.prevent="onSubmit">
        <div v-if="errorMsg" class="flex items-start gap-2 rounded-sm bg-error/10 px-3 py-2.5 text-sm text-error"
          role="alert">
          <IconGlyph name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <div>
          <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Kamar *</label>
          <select v-model="form.room_id" :class="selectClass">
            <option value="" disabled>Pilih kamar…</option>
            <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Nama tamu *</label>
            <input v-model="form.guest_name" :class="fieldClass" placeholder="Nama lengkap" />
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Nomor WhatsApp *</label>
            <input v-model="form.guest_phone" :class="fieldClass" placeholder="628xxxxxxxxxx" />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Check-in *</label>
            <div class="relative">
              <input v-model="form.check_in" type="date" :min="todayISO()" :class="DATE_CLASS"
                @click="$event.currentTarget.showPicker?.()" />
              <IconGlyph name="calendar"
                class="pointer-events-none absolute right-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Check-out *</label>
            <div class="relative">
              <input v-model="form.check_out" type="date" :min="form.check_in || todayISO()" :class="DATE_CLASS"
                @click="$event.currentTarget.showPicker?.()" />
              <IconGlyph name="calendar"
                class="pointer-events-none absolute right-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
            </div>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Jumlah tamu</label>
            <input v-model="form.guest_count" type="number" min="1" :class="fieldClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Status</label>
            <select v-model="form.status" :class="selectClass">
              <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">
            Total harga (Rp)
            <span v-if="nights" class="font-normal text-muted">· {{ nights }} malam</span>
          </label>
          <input v-model="form.total_price" type="number" min="0" :class="fieldClass" @input="markTotalTouched" />
          <p v-if="form.total_price" class="mt-1 text-xs text-muted">{{ formatRupiah(Number(form.total_price)) }}</p>
        </div>

        <div>
          <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Catatan</label>
          <textarea v-model="form.notes"
            class="min-h-21 w-full resize-y rounded-sm border border-hairline bg-canvas px-3.5 py-2.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
            placeholder="Permintaan khusus, dll." />
        </div>
      </form>

      <footer class="flex items-center justify-end gap-3 border-t border-hairline-soft px-5 py-4">
        <button type="button" :class="btnGhost" @click="emit('close')">Batal</button>
        <button type="button" :class="btnPrimary" :disabled="saving" @click="onSubmit">
          <IconGlyph name="save" class="h-5 w-5" />
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
      </footer>
    </div>
  </div>
</template>
