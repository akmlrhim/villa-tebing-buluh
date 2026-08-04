<script setup>
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: [Number, String, null], default: null },
})
const emit = defineEmits(['update:modelValue'])

function formatThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const displayValue = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return ''
  return formatThousands(String(props.modelValue).replace(/\D/g, ''))
})

function onInput(event) {
  const digits = event.target.value.replace(/\D/g, '')
  event.target.value = formatThousands(digits)
  emit('update:modelValue', digits === '' ? null : Number(digits))
}
</script>

<template>
  <div
    class="flex h-10.5 w-full items-center rounded-sm border border-hairline bg-canvas focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15">
    <span class="select-none pl-3.5 pr-2 text-sm text-muted">Rp</span>
    <input v-bind="$attrs" :value="displayValue" inputmode="numeric" autocomplete="off"
      class="h-full min-w-0 flex-1 rounded-sm bg-transparent pr-3.5 text-sm leading-normal text-ink placeholder:text-sm focus:outline-none"
      @input="onInput" />
  </div>
</template>
