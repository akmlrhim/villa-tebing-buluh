<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import IconGlyph from '../../components/IconGlyph.vue';
import DateRangeFilter from '../../components/admin/DateRangeFilter.vue';
import { useBookings } from '../../composables/useBookings';
import { useAdminRooms } from '../../composables/useAdminRooms';
import { defaultRange, rangeLabel } from '../../lib/dateRange';
import {
  addDaysISO,
  formatDateID,
  formatRupiah,
  nightsBetween,
  todayISO,
} from '../../lib/format';

const { bookings, loading, fetchBookings } = useBookings();
const { rooms, fetchRooms } = useAdminRooms();

onMounted(() => {
  fetchBookings();
  fetchRooms();
});

const BLOCKING = ['pending', 'confirmed', 'checked_in'];
const VOID = ['cancelled', 'no_show'];
const today = todayISO();
const roomName = (b) => b.rooms?.name ?? '-';

const range = ref(defaultRange());

const scoped = computed(() =>
  bookings.value.filter(
    (b) => b.check_in >= range.value.start && b.check_in <= range.value.end,
  ),
);
const scopedActive = computed(() =>
  scoped.value.filter((b) => !VOID.includes(b.status)),
);
const scopedPending = computed(() =>
  scoped.value.filter((b) => b.status === 'pending'),
);
const revenue = computed(() =>
  scopedActive.value.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0),
);

const occupancy = computed(() => {
  const start = range.value.start;
  const end = addDaysISO(range.value.end, 1);
  const days = nightsBetween(start, end);
  const activeRooms = rooms.value.filter((r) => r.is_active).length;
  if (!activeRooms || days <= 0) return 0;

  let occupied = 0;
  for (const b of bookings.value) {
    if (!BLOCKING.includes(b.status)) continue;
    const from = b.check_in > start ? b.check_in : start;
    const to = b.check_out < end ? b.check_out : end;
    if (from < to) occupied += nightsBetween(from, to);
  }
  return Math.min(100, Math.round((occupied / (activeRooms * days)) * 100));
});

const checkInsToday = computed(() =>
  bookings.value.filter(
    (b) => b.check_in === today && !VOID.includes(b.status),
  ),
);
const checkOutsToday = computed(() =>
  bookings.value.filter(
    (b) => b.check_out === today && !VOID.includes(b.status),
  ),
);

const scopedList = computed(() =>
  [...scoped.value]
    .sort((a, b) => a.check_in.localeCompare(b.check_in))
    .slice(0, 8),
);

const stats = computed(() => [
  {
    label: 'Check-in di rentang ini',
    value: scopedActive.value.length,
    icon: 'log-in',
    tone: 'primary',
  },
  {
    label: 'Booking pending',
    value: scopedPending.value.length,
    icon: 'clock',
    tone: 'sand',
  },
  {
    label: 'Perkiraan pendapatan',
    value: formatRupiah(revenue.value),
    icon: 'tag',
    tone: 'bronze',
    compact: true,
  },
  {
    label: 'Kepadatan',
    value: occupancy.value + '%',
    icon: 'trending-up',
    tone: 'primary',
  },
]);

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Terkonfirmasi',
  checked_in: 'Check-in',
  checked_out: 'Check-out',
  completed: 'Selesai',
  cancelled: 'Batal',
  no_show: 'Tidak datang',
};
const STATUS_CLASS = {
  pending: 'bg-sand/25 text-bronze',
  confirmed: 'bg-primary/12 text-primary',
  checked_in: 'bg-primary/12 text-primary',
  checked_out: 'bg-surface-strong text-muted',
  completed: 'bg-surface-strong text-muted',
  cancelled: 'bg-error/10 text-error',
  no_show: 'bg-error/10 text-error',
};
</script>

<template>
  <div>
    <h1 class="text-ink text-2xl font-semibold tracking-tight">
      Dashboard
    </h1>
    <p class="mt-1 text-sm text-black">
      Ringkasan aktivitas vila untuk {{ rangeLabel(range) }}.
    </p>

    <div class="mt-5">
      <DateRangeFilter v-model="range" />
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="s in stats"
        :key="s.label"
        class="border-hairline bg-canvas shadow-float rounded-md border p-5"
      >
        <div class="flex items-center justify-between">
          <span
            class="grid h-10 w-10 place-items-center rounded-full"
            :class="{
              'bg-primary/12 text-primary': s.tone === 'primary',
              'bg-bronze/15 text-bronze': s.tone === 'bronze',
              'bg-sand/25 text-bronze': s.tone === 'sand',
            }"
          >
            <IconGlyph :name="s.icon" class="h-5 w-5" />
          </span>
        </div>
        <p
          class="text-ink mt-3 font-semibold tracking-tight"
          :class="s.compact ? 'text-xl' : 'text-3xl'"
        >
          {{ s.value }}
        </p>
        <p class="text-muted mt-0.5 text-sm">{{ s.label }}</p>
      </div>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section class="border-hairline bg-canvas shadow-float rounded-md border">
        <div
          class="border-hairline-soft flex items-center justify-between border-b px-5 py-4"
        >
          <h2 class="text-ink text-base font-semibold">
            Booking di rentang ini
          </h2>
          <RouterLink
            :to="{ name: 'admin-bookings' }"
            class="text-primary text-sm font-medium hover:underline"
            >Lihat semua</RouterLink
          >
        </div>

        <div v-if="loading" class="space-y-3 p-5">
          <div
            v-for="i in 4"
            :key="i"
            class="bg-surface-strong h-12 animate-pulse rounded-sm"
          />
        </div>
        <p
          v-else-if="!scopedList.length"
          class="text-muted px-5 py-10 text-center text-sm"
        >
          Tidak ada booking yang check-in di rentang tanggal ini.
        </p>
        <ul v-else class="divide-hairline-soft divide-y">
          <li v-for="b in scopedList" :key="b.id">
            <RouterLink
              :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
              class="hover:bg-surface-soft flex items-center justify-between gap-3 px-5 py-3 transition-colors"
            >
              <div class="min-w-0">
                <p class="text-ink truncate text-sm font-medium">
                  {{ b.guest_name }}
                </p>
                <p class="text-muted truncate text-xs">
                  {{ roomName(b) }} ·
                  {{ formatDateID(b.check_in, { weekday: false }) }} -
                  {{ formatDateID(b.check_out, { weekday: false }) }}
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                :class="STATUS_CLASS[b.status]"
              >
                {{ STATUS_LABEL[b.status] ?? b.status }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="space-y-6">
        <div
          class="border-hairline bg-canvas shadow-float rounded-md border p-5"
        >
          <h2
            class="text-ink flex items-center gap-2 text-base font-semibold"
          >
            <IconGlyph name="log-in" class="text-primary h-5 w-5" /> Check-in
            hari ini
          </h2>
          <ul v-if="checkInsToday.length" class="mt-3 space-y-2">
            <li
              v-for="b in checkInsToday"
              :key="b.id"
              class="text-body text-sm"
            >
              <span class="text-ink font-medium">{{ b.guest_name }}</span> ·
              {{ roomName(b) }}
            </li>
          </ul>
          <p v-else class="text-muted mt-3 text-sm">Tidak ada.</p>
        </div>

        <div
          class="border-hairline bg-canvas shadow-float rounded-md border p-5"
        >
          <h2
            class="text-ink flex items-center gap-2 text-base font-semibold"
          >
            <IconGlyph name="log-out" class="text-bronze h-5 w-5" /> Check-out
            hari ini
          </h2>
          <ul v-if="checkOutsToday.length" class="mt-3 space-y-2">
            <li
              v-for="b in checkOutsToday"
              :key="b.id"
              class="text-body text-sm"
            >
              <span class="text-ink font-medium">{{ b.guest_name }}</span> ·
              {{ roomName(b) }}
            </li>
          </ul>
          <p v-else class="text-muted mt-3 text-sm">Tidak ada.</p>
        </div>
      </section>
    </div>
  </div>
</template>
