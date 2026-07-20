<script setup>
import { computed, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import IconGlyph from '../../components/IconGlyph.vue';
import { useBookings } from '../../composables/useBookings';
import { useAdminRooms } from '../../composables/useAdminRooms';
import {
  formatDateID,
  nightsBetween,
  todayISO,
  toISODate,
} from '../../lib/format';

const { bookings, loading, fetchBookings } = useBookings();
const { rooms, fetchRooms } = useAdminRooms();

onMounted(() => {
  fetchBookings();
  fetchRooms();
});

const BLOCKING = ['pending', 'confirmed', 'checked_in'];
const today = todayISO();
const roomName = (b) => b.rooms?.name ?? '-';

const checkInsToday = computed(() =>
  bookings.value.filter(
    (b) => b.check_in === today && b.status !== 'cancelled',
  ),
);
const checkOutsToday = computed(() =>
  bookings.value.filter(
    (b) => b.check_out === today && b.status !== 'cancelled',
  ),
);
const pending = computed(() =>
  bookings.value.filter((b) => b.status === 'pending'),
);

// Okupansi bulan berjalan: malam terisi / (kamar aktif × jumlah hari bulan ini).
const occupancy = computed(() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const monthStart = toISODate(new Date(y, m, 1));
  const monthEnd = toISODate(new Date(y, m + 1, 1));
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const activeRooms = rooms.value.filter((r) => r.is_active).length;
  if (!activeRooms) return 0;

  let occupied = 0;
  for (const b of bookings.value) {
    if (!BLOCKING.includes(b.status)) continue;
    const start = b.check_in > monthStart ? b.check_in : monthStart;
    const end = b.check_out < monthEnd ? b.check_out : monthEnd;
    if (start < end) occupied += nightsBetween(start, end);
  }
  return Math.min(
    100,
    Math.round((occupied / (activeRooms * daysInMonth)) * 100),
  );
});

const upcoming = computed(() =>
  bookings.value
    .filter(
      (b) =>
        b.check_in >= today &&
        b.status !== 'cancelled' &&
        b.status !== 'checked_out',
    )
    .sort((a, b) => a.check_in.localeCompare(b.check_in))
    .slice(0, 6),
);

const stats = computed(() => [
  {
    label: 'Check-in hari ini',
    value: checkInsToday.value.length,
    icon: 'log-in',
    tone: 'primary',
  },
  {
    label: 'Check-out hari ini',
    value: checkOutsToday.value.length,
    icon: 'log-out',
    tone: 'bronze',
  },
  {
    label: 'Booking pending',
    value: pending.value.length,
    icon: 'clock',
    tone: 'sand',
  },
  {
    label: 'Kepadatan bulan ini',
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
  cancelled: 'Batal',
};
const STATUS_CLASS = {
  pending: 'bg-sand/25 text-bronze',
  confirmed: 'bg-primary/12 text-primary',
  checked_in: 'bg-primary/12 text-primary',
  checked_out: 'bg-surface-strong text-muted',
  cancelled: 'bg-error/10 text-error',
};
</script>

<template>
  <div>
    <h1 class="text-ink font-sans text-2xl font-semibold tracking-tight">
      Dashboard
    </h1>
    <p class="mt-1 text-sm text-black">Ringkasan aktivitas vila hari ini.</p>

    <!-- Kartu statistik -->
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
        <p class="text-ink mt-3 text-3xl font-semibold tracking-tight">
          {{ s.value }}
        </p>
        <p class="text-muted mt-0.5 text-sm">{{ s.label }}</p>
      </div>
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <!-- Booking mendatang -->
      <section class="border-hairline bg-canvas shadow-float rounded-md border">
        <div
          class="border-hairline-soft flex items-center justify-between border-b px-5 py-4"
        >
          <h2 class="text-ink font-sans text-base font-semibold">
            Booking mendatang
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
          v-else-if="!upcoming.length"
          class="text-muted px-5 py-10 text-center text-sm"
        >
          Belum ada booking mendatang.
        </p>
        <ul v-else class="divide-hairline-soft divide-y">
          <li v-for="b in upcoming" :key="b.id">
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
                {{ STATUS_LABEL[b.status] }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Agenda hari ini -->
      <section class="space-y-6">
        <div
          class="border-hairline bg-canvas shadow-float rounded-md border p-5"
        >
          <h2
            class="text-ink flex items-center gap-2 font-sans text-base font-semibold"
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
            class="text-ink flex items-center gap-2 font-sans text-base font-semibold"
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
