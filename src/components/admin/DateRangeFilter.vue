<script setup>
import { computed } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { RANGE_PRESETS } from '../../lib/dateRange'
import { dateClass } from '../../lib/ui'

const props = defineProps({
  modelValue: { type: Object, required: true },
})
const emit = defineEmits(['update:modelValue'])

const activeId = computed(() => props.modelValue.presetId)

function pick(preset) {
  emit('update:modelValue', { presetId: preset.id, ...preset.range() })
}

function setBound(field, value) {
  if (!value) return
  const next = { ...props.modelValue, presetId: 'custom', [field]: value }
  if (next.end < next.start) next[field === 'start' ? 'end' : 'start'] = value
  emit('update:modelValue', next)
}
</script>

<template>
  <div
    class="flex flex-col gap-3 rounded-md border border-hairline bg-canvas p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
      <IconGlyph name="filter" class="mr-0.5 h-4 w-4 shrink-0 text-muted" />
      <button v-for="preset in RANGE_PRESETS" :key="preset.id" type="button"
        class="h-8 rounded-full border px-3 text-xs font-medium transition-colors sm:h-9 sm:px-3.5 sm:text-sm"
        :class="activeId === preset.id
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-hairline text-body hover:border-border-strong'"
        :aria-pressed="activeId === preset.id" @click="pick(preset)">
        {{ preset.label }}
      </button>
      <span v-if="activeId === 'custom'"
        class="inline-flex h-8 items-center rounded-full border border-primary bg-primary/10 px-3 text-xs font-medium text-primary sm:h-9 sm:px-3.5 sm:text-sm">
        Kustom
      </span>
    </div>

    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex sm:shrink-0">
      <label class="sr-only" for="range-start">Tanggal mulai</label>
      <input id="range-start" type="date" :value="modelValue.start" :class="dateClass" class="sm:w-40"
        @change="setBound('start', $event.target.value)" />
      <span class="text-xs text-muted sm:text-sm">s/d</span>
      <label class="sr-only" for="range-end">Tanggal akhir</label>
      <input id="range-end" type="date" :value="modelValue.end" :class="dateClass" class="sm:w-40"
        @change="setBound('end', $event.target.value)" />
    </div>
  </div>
</template>
