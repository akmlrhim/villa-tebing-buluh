<script setup>
import { computed, ref } from 'vue';
import IconGlyph from './IconGlyph.vue';
import { addDaysISO, todayISO } from '../lib/format';

// F-02: widget cek ketersediaan - check-in & check-out.
const emit = defineEmits(['search', 'clear']);
const checkIn = ref('');
const checkOut = ref('');
const errorMessage = ref('');
const hasSearched = ref(false);

const today = todayISO();
const minCheckOut = computed(() =>
  checkIn.value ? addDaysISO(checkIn.value, 1) : addDaysISO(today, 1),
);

function submit() {
  errorMessage.value = '';

  if (!checkIn.value || !checkOut.value) {
    errorMessage.value = 'Pilih tanggal check-in dan check-out dulu, ya.';
    return;
  }
  if (checkIn.value < today) {
    errorMessage.value = 'Tanggal check-in tidak boleh di masa lalu.';
    return;
  }
  if (checkOut.value <= checkIn.value) {
    errorMessage.value = 'Tanggal check-out harus setelah check-in.';
    return;
  }

  hasSearched.value = true;
  emit('search', { checkIn: checkIn.value, checkOut: checkOut.value });
}

function clear() {
  checkIn.value = '';
  checkOut.value = '';
  errorMessage.value = '';
  hasSearched.value = false;
  emit('clear');
}

defineExpose({ clear });
</script>

<template>
  <form
    class="border-hairline bg-canvas shadow-float rounded-md border"
    novalidate
    @submit.prevent="submit"
  >
    <div class="flex flex-col md:flex-row md:items-stretch">
      <label
        class="border-hairline-soft flex cursor-pointer items-center gap-3 border-b px-5 py-3 md:flex-1 md:border-r md:border-b-0 md:px-6"
      >
        <IconGlyph name="calendar" class="text-muted h-5 w-5 shrink-0" />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-ink text-[13px] font-semibold">Check-in</span>
          <input
            v-model="checkIn"
            type="date"
            :min="today"
            class="mt-0.5 h-6 w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-base focus:outline-none md:text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-date-and-time-value]:text-left"
            :class="checkIn ? 'text-ink' : 'text-muted'"
            aria-label="Tanggal check-in"
            @click="$event.currentTarget.showPicker?.()"
          />
        </span>
      </label>

      <label
        class="border-hairline-soft flex cursor-pointer items-center gap-3 border-b px-5 py-3 md:flex-1 md:border-b-0 md:px-6"
      >
        <IconGlyph name="calendar" class="text-muted h-5 w-5 shrink-0" />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class="text-ink text-[13px] font-semibold">Check-out</span>
          <input
            v-model="checkOut"
            type="date"
            :min="minCheckOut"
            class="mt-0.5 h-6 w-full cursor-pointer appearance-none border-none bg-transparent p-0 text-base focus:outline-none md:text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-date-and-time-value]:text-left"
            :class="checkOut ? 'text-ink' : 'text-muted'"
            aria-label="Tanggal check-out"
            @click="$event.currentTarget.showPicker?.()"
          />
        </span>
      </label>

      <div class="flex items-center gap-2 p-3 md:p-2">
        <button
          v-if="hasSearched"
          type="button"
          class="text-muted hover:text-ink hidden h-12 items-center rounded-full px-4 text-sm font-medium transition-colors md:flex"
          @click="clear"
        >
          Hapus
        </button>
        <button
          type="submit"
          class="bg-primary hover:bg-primary-active flex h-12 w-full items-center justify-center gap-2 rounded-full text-white transition-colors md:w-12"
          aria-label="Cek ketersediaan kamar"
        >
          <IconGlyph name="search" class="h-5 w-5" />
          <span class="text-base font-medium md:hidden">Cek Ketersediaan</span>
        </button>
      </div>
    </div>

    <p
      v-if="errorMessage"
      class="text-error px-6 pt-1 pb-4 text-sm md:pt-2"
      role="alert"
    >
      {{ errorMessage }}
    </p>
  </form>
</template>
