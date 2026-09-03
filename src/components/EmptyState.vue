<script setup>
import IconGlyph from './IconGlyph.vue'

defineProps({
  icon: { type: String, default: 'image' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<template>
  <div class="mx-auto flex max-w-sm flex-col items-center px-6 py-12 text-center">
    <span
      class="border-border-strong text-muted-soft grid h-16 w-16 shrink-0 place-items-center rounded-2xl border-2 border-dashed"
    >
      <IconGlyph :name="icon" class="h-7 w-7" />
    </span>
    <h3 class="text-ink mt-5 text-base font-semibold">{{ title }}</h3>
    <p v-if="description" class="text-muted mt-1.5 text-sm leading-relaxed">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
