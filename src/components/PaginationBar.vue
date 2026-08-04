<script setup>
import { computed } from 'vue'
import IconGlyph from './IconGlyph.vue'

const props = defineProps({
  page: { type: Number, required: true },
  pageCount: { type: Number, required: true },
  total: { type: Number, required: true },
  rangeStart: { type: Number, required: true },
  rangeEnd: { type: Number, required: true },
  itemLabel: { type: String, default: 'item' },
})
const emit = defineEmits(['change'])

const pages = computed(() => {
  const { page, pageCount } = props
  const out = []
  const add = (v) => out.push(v)
  const window = 1

  add(1)
  if (page - window > 2) add('…')
  for (let p = Math.max(2, page - window); p <= Math.min(pageCount - 1, page + window); p++) add(p)
  if (page + window < pageCount - 1) add('…')
  if (pageCount > 1) add(pageCount)

  return out
})
</script>

<template>
  <div v-if="pageCount > 1" class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <p class="text-xs text-muted">
      Menampilkan {{ rangeStart }}–{{ rangeEnd }} dari {{ total }} {{ itemLabel }}
    </p>
    <div class="flex items-center gap-1">
      <button type="button"
        class="grid size-8.5 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        :disabled="page === 1" title="Halaman sebelumnya" @click="emit('change', page - 1)">
        <IconGlyph name="chevron-left" class="h-4 w-4" />
      </button>

      <template v-for="(p, i) in pages" :key="i">
        <span v-if="p === '…'" class="grid size-8.5 place-items-center text-xs text-muted-soft">…</span>
        <button v-else type="button"
          class="grid size-8.5 place-items-center rounded-sm text-xs font-medium transition-colors"
          :class="p === page ? 'bg-primary text-white' : 'text-muted hover:bg-surface-strong hover:text-ink'"
          @click="emit('change', p)">
          {{ p }}
        </button>
      </template>

      <button type="button"
        class="grid size-8.5 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
        :disabled="page === pageCount" title="Halaman berikutnya" @click="emit('change', page + 1)">
        <IconGlyph name="chevron-right" class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
