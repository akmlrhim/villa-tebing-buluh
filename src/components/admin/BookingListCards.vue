<script setup>
import IconGlyph from '../IconGlyph.vue'
import { formatDateID, formatRupiah } from '../../lib/format'
import { STATUSES, STATUS_LABEL, STATUS_CLASS } from '../../lib/bookingStatus'
import { selectClass } from '../../lib/ui'

defineProps({
  bookings: { type: Array, default: () => [] },
  busyId: { type: [String, Number], default: null },
  selectedIds: { type: Set, default: () => new Set() },
})
const emit = defineEmits(['status-change', 'edit', 'delete', 'toggle'])
</script>

<template>
  <ul class="mt-5 space-y-3 lg:hidden">
    <li v-for="b in bookings" :key="b.id" class="rounded-md border border-hairline bg-canvas p-4 shadow-float">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-2.5">
          <input type="checkbox" class="mt-1 size-4 shrink-0 accent-primary" :checked="selectedIds.has(b.id)"
            :aria-label="`Pilih booking ${b.guest_name}`" @change="emit('toggle', b.id)" />
          <div class="min-w-0">
            <RouterLink :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
              class="font-medium text-ink hover:underline">{{ b.guest_name }}</RouterLink>
            <p class="text-xs text-muted">{{ b.rooms?.name ?? '-' }} · {{ b.guest_phone }}</p>
          </div>
        </div>
        <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium" :class="STATUS_CLASS[b.status]">
          {{ STATUS_LABEL[b.status] }}
        </span>
      </div>
      <p class="mt-2 text-sm text-body">
        {{ formatDateID(b.check_in, { weekday: false }) }} - {{ formatDateID(b.check_out, { weekday: false }) }}
        <span v-if="b.total_price"> · {{ formatRupiah(b.total_price) }}</span>
      </p>
      <div class="mt-3 flex items-center gap-2 border-t border-hairline-soft pt-3">
        <RouterLink :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
          class="grid size-9.5 shrink-0 place-items-center rounded-sm transition-colors hover:bg-surface-strong"
          :class="b.payment_proof_url ? 'text-primary' : 'text-muted hover:text-ink'" title="Lihat detail">
          <IconGlyph name="eye" class="h-5 w-5" />
        </RouterLink>
        <select :value="b.status" :disabled="busyId === b.id" :class="[selectClass, 'flex-1']"
          @change="emit('status-change', b, $event)">
          <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
        <button type="button"
          class="grid size-9.5 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink disabled:opacity-50"
          title="Edit" @click="emit('edit', b)">
          <IconGlyph name="edit" class="h-5 w-5" />
        </button>
        <button type="button"
          class="grid size-9.5 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong disabled:opacity-50 hover:text-error"
          title="Hapus" @click="emit('delete', b)">
          <IconGlyph name="trash" class="h-5 w-5" />
        </button>
      </div>
    </li>
  </ul>
</template>
