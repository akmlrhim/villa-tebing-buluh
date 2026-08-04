<script setup>
import { computed, ref } from 'vue'
import IconGlyph from './IconGlyph.vue'
import { addDaysISO, toISODate, todayISO } from '../lib/format'

const props = defineProps({
  occupied: { type: Set, required: true },
  modelValue: { type: Object, default: null },
  monthsAhead: { type: Number, default: 5 },
})
const emit = defineEmits(['update:modelValue'])

const today = todayISO()
const now = new Date()
const monthOffset = ref(0)
const pendingStart = ref(null)

const DAY_CLASS = {
  free: 'text-ink hover:shadow-[inset_0_0_0_1.5px_var(--color-ink)]',
  past: 'cursor-not-allowed text-muted-soft',
  occupied: 'bg-surface-soft text-muted-soft line-through',
  endpoint: 'bg-ink font-semibold text-white',
  'in-range': 'bg-surface-strong text-ink',
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const viewYear = computed(() => new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1).getFullYear())
const viewMonth = computed(() => new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1).getMonth())
const monthLabel = computed(() => `${MONTH_NAMES[viewMonth.value]} ${viewYear.value}`)

const cells = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const leading = (first.getDay() + 6) % 7

  const list = Array.from({ length: leading }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    const iso = toISODate(new Date(viewYear.value, viewMonth.value, day))
    list.push({ day, iso })
  }
  return list
})

const selection = computed(() => {
  if (pendingStart.value) return { checkIn: pendingStart.value, checkOut: null }
  return props.modelValue
})

function isPast(iso) {
  return iso < today
}
function isOccupied(iso) {
  return props.occupied.has(iso)
}
function nightsFreeBetween(startISO, endISO) {
  for (let iso = startISO; iso < endISO; iso = addDaysISO(iso, 1)) {
    if (props.occupied.has(iso)) return false
  }
  return true
}

function cellState(iso) {
  const sel = selection.value
  if (sel?.checkIn === iso || sel?.checkOut === iso) return 'endpoint'
  if (sel?.checkIn && sel?.checkOut && iso > sel.checkIn && iso < sel.checkOut) return 'in-range'
  if (isPast(iso)) return 'past'
  if (isOccupied(iso)) return 'occupied'
  return 'free'
}

function pick(iso) {
  if (isPast(iso)) return

  if (!pendingStart.value) {
    if (isOccupied(iso)) return
    pendingStart.value = iso
    emit('update:modelValue', null)
    return
  }

  if (iso <= pendingStart.value) {
    if (!isOccupied(iso)) pendingStart.value = iso
    return
  }

  if (nightsFreeBetween(pendingStart.value, iso)) {
    emit('update:modelValue', { checkIn: pendingStart.value, checkOut: iso })
    pendingStart.value = null
  } else if (!isOccupied(iso)) {
    pendingStart.value = iso
    emit('update:modelValue', null)
  }
}

function reset() {
  pendingStart.value = null
  emit('update:modelValue', null)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <p class="text-base font-semibold text-ink" aria-live="polite">{{ monthLabel }}</p>
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="grid size-9 place-items-center rounded-full text-ink transition-colors hover:enabled:bg-surface-soft disabled:cursor-not-allowed disabled:text-muted-soft"
          aria-label="Bulan sebelumnya"
          :disabled="monthOffset <= 0"
          @click="monthOffset--"
        >
          <IconGlyph name="chevron-left" class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="grid size-9 place-items-center rounded-full text-ink transition-colors hover:enabled:bg-surface-soft disabled:cursor-not-allowed disabled:text-muted-soft"
          aria-label="Bulan berikutnya"
          :disabled="monthOffset >= props.monthsAhead"
          @click="monthOffset++"
        >
          <IconGlyph name="chevron-right" class="h-4 w-4" />
        </button>
      </div>
    </div>

    <div class="mt-3 grid grid-cols-7 text-center">
      <span v-for="name in DAY_NAMES" :key="name" class="pb-2 text-xs font-medium text-muted">
        {{ name }}
      </span>

      <template v-for="(cell, index) in cells" :key="index">
        <span v-if="!cell" />
        <button
          v-else
          type="button"
          class="mx-auto size-10 rounded-full text-sm transition-colors"
          :class="DAY_CLASS[cellState(cell.iso)]"
          :disabled="cellState(cell.iso) === 'past'"
          :aria-label="`${cell.day} ${monthLabel}${isOccupied(cell.iso) ? ' (terisi)' : ''}`"
          :aria-pressed="cellState(cell.iso) === 'endpoint'"
          @click="pick(cell.iso)"
        >
          {{ cell.day }}
        </button>
      </template>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      <span class="flex items-center gap-1.5">
        <span class="h-3.5 w-3.5 rounded-full border border-border-strong" /> Kosong
      </span>
      <span class="flex items-center gap-1.5">
        <span class="grid h-3.5 w-3.5 place-items-center rounded-full bg-surface-strong text-[9px] leading-none text-muted-soft">✕</span>
        Terisi
      </span>
      <span class="flex items-center gap-1.5">
        <span class="h-3.5 w-3.5 rounded-full bg-ink" /> Dipilih
      </span>
      <button
        v-if="selection"
        type="button"
        class="ml-auto font-medium text-ink underline underline-offset-2 hover:text-primary"
        @click="reset"
      >
        Reset tanggal
      </button>
    </div>
  </div>
</template>
