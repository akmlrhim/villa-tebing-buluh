<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import IconGlyph from './IconGlyph.vue';
import AvailabilityCalendar from './AvailabilityCalendar.vue';
import { useRooms } from '../composables/useRooms';
import { useAvailability } from '../composables/useAvailability';
import { formatDateID, nightsBetween } from '../lib/format';

const emit = defineEmits(['search', 'clear']);

const { rooms, fetchRooms } = useRooms();
const { fetchAvailability, fullyOccupiedNights } = useAvailability();

const rootEl = ref(null);
const open = ref(false);
const range = ref(null);
const hasSearched = ref(false);

onMounted(() => {
  fetchRooms();
  fetchAvailability();
  document.addEventListener('pointerdown', onOutsideClick);
  document.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onOutsideClick);
  document.removeEventListener('keydown', onKeydown);
});

const occupied = computed(() =>
  fullyOccupiedNights(rooms.value.map((room) => room.id)),
);
const nights = computed(() =>
  range.value ? nightsBetween(range.value.checkIn, range.value.checkOut) : 0,
);

function toggle() {
  open.value = !open.value;
}
function onOutsideClick(event) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target)) {
    open.value = false;
  }
}
function onKeydown(event) {
  if (event.key === 'Escape' && open.value) {
    open.value = false;
  }
}

function submit() {
  if (!range.value) return;
  hasSearched.value = true;
  open.value = false;
  emit('search', { checkIn: range.value.checkIn, checkOut: range.value.checkOut });
}

function clear() {
  range.value = null;
  hasSearched.value = false;
  open.value = false;
  emit('clear');
}

defineExpose({ clear });
</script>

<template>
  <div ref="rootEl" class="relative mx-auto max-w-2xl">
    <div class="bg-canvas shadow-float overflow-hidden rounded-3xl">
      <button
        type="button"
        class="flex w-full flex-col text-left"
        :aria-expanded="open"
        aria-controls="availability-panel"
        @click="toggle"
      >
        <span class="flex flex-col sm:flex-row">
          <span class="flex items-center gap-3.5 px-5 py-5 sm:flex-1 md:px-7">
            <span class="bg-primary/10 grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <IconGlyph name="calendar" class="text-primary h-5 w-5" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="text-ink text-sm font-semibold">Check-in</span>
              <span class="mt-0.5 text-base" :class="range ? 'text-ink' : 'text-muted'">
                {{ range ? formatDateID(range.checkIn, { weekday: false }) : 'Pilih tanggal' }}
              </span>
            </span>
          </span>

          <span
            class="border-hairline border-t border-dashed sm:border-t-0 sm:border-l"
            aria-hidden="true"
          />

          <span class="flex items-center gap-3.5 px-5 py-5 sm:flex-1 md:px-7">
            <span class="bg-primary/10 grid h-10 w-10 shrink-0 place-items-center rounded-full">
              <IconGlyph name="calendar" class="text-primary h-5 w-5" />
            </span>
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="text-ink text-sm font-semibold">Check-out</span>
              <span class="mt-0.5 text-base" :class="range ? 'text-ink' : 'text-muted'">
                {{ range ? formatDateID(range.checkOut, { weekday: false }) : 'Pilih tanggal' }}
              </span>
            </span>
          </span>
        </span>

        <span
          class="bg-primary hover:bg-primary-active flex h-14 items-center justify-center gap-2 text-white transition-colors"
        >
          <span class="text-base font-medium">
            {{ open ? 'Tutup kalender' : 'Lihat kalender' }}
          </span>
          <IconGlyph
            name="chevron-down"
            class="h-4 w-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none"
            :class="open && 'rotate-180'"
          />
        </span>
      </button>

      <div
        class="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        :style="{ gridTemplateRows: open ? '1fr' : '0fr' }"
      >
        <div id="availability-panel" class="overflow-hidden">
          <div class="border-hairline-soft border-t px-5 py-5 md:px-7">
            <AvailabilityCalendar v-model="range" :occupied="occupied" />

            <div
              class="border-hairline-soft mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4"
            >
              <p class="text-muted text-sm">
                <template v-if="nights > 0">{{ nights }} malam dipilih</template>
                <template v-else>Pilih tanggal check-in lalu check-out</template>
              </p>
              <button
                type="button"
                class="bg-primary hover:enabled:bg-primary-active disabled:bg-primary-disabled flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
                :disabled="!range"
                @click="submit"
              >
                <IconGlyph name="search" class="h-4 w-4 shrink-0" />
                Cek Ketersediaan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 flex items-center justify-center px-2">
      <button
        v-if="hasSearched"
        type="button"
        class="text-muted hover:text-ink text-sm font-medium transition-colors"
        @click="clear"
      >
        Hapus tanggal
      </button>
      <span v-else class="text-muted text-xs">
        Klik untuk pilih tanggal check-in dan check-out
      </span>
    </div>
  </div>
</template>
