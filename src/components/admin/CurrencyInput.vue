<script setup>
import { computed } from 'vue'
import { fieldClass } from '../../lib/ui'

// Input angka yang menampilkan pemisah ribuan (.) saat diketik, mis. 12000 ->
// 12.000. v-model tetap berupa Number|null (bukan string berformat).
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
  <input :value="displayValue" inputmode="numeric" autocomplete="off" :class="fieldClass" @input="onInput" />
</template>
