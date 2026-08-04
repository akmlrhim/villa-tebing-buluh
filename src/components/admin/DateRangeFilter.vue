<script setup>
import { computed } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { RANGE_PRESETS } from '../../lib/dateRange'
import { fieldClass } from '../../lib/ui'

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
  <div class="flex flex-col gap-3 rounded-md border border-hairline bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-wrap items-center gap-2">
      <IconGlyph name="filter" class="h-4 w-4 shrink-0 text-muted" />
      <button v-for="preset in RANGE_PRESETS" :key="preset.id" type="button"
        class="h-9 rounded-full border px-3.5 text-sm font-medium transition-colors" :class="activeId === preset.id
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-hairline text-body hover:border-border-strong'"
        :aria-pressed="activeId === preset.id" @click="pick(preset)">
        {{ preset.label }}
      </button>
      <span v-if="activeId === 'custom'"
        class="inline-flex h-9 items-center rounded-full border border-primary bg-primary/10 px-3.5 text-sm font-medium text-primary">
        Kustom
      </span>
    </div>

    <div class="flex items-center gap-2">
      <label class="sr-only" for="range-start">Tanggal mulai</label>
      <input id="range-start" type="date" :value="modelValue.start" :class="fieldClass"
        class="!w-auto" @change="setBound('start', $event.target.value)" />
      <span class="text-sm text-muted">–</span>
      <label class="sr-only" for="range-end">Tanggal akhir</label>
      <input id="range-end" type="date" :value="modelValue.end" :class="fieldClass" class="!w-auto"
        @change="setBound('end', $event.target.value)" />
    </div>
  </div>
</template>
