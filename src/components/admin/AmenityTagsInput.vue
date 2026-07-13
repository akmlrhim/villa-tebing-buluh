<script setup>
import IconGlyph from '../IconGlyph.vue'
import { fieldClass } from '../../lib/ui'

defineProps({
  amenities: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'add', 'remove'])
</script>

<template>
  <div>
    <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Fasilitas</label>
    <div class="flex flex-wrap gap-2">
      <span v-for="(a, i) in amenities" :key="a"
        class="inline-flex items-center gap-1.5 rounded-full bg-surface-strong px-3 py-1 text-sm text-body">
        {{ a }}
        <button type="button" class="text-muted hover:text-error" aria-label="Hapus" @click="emit('remove', i)">
          <IconGlyph name="x" class="h-3.5 w-3.5" />
        </button>
      </span>
    </div>
    <input :value="modelValue" :class="[fieldClass, 'mt-2']"
      placeholder="Ketik fasilitas lalu Enter (mis. Free WiFi)"
      @input="emit('update:modelValue', $event.target.value)"
      @keydown.enter.prevent="emit('add')"
      @keydown="(e) => e.key === ',' && (e.preventDefault(), emit('add'))" />
  </div>
</template>
