<script setup>
import { computed, ref } from 'vue'
import CalendarGrid from './calendar/CalendarGrid.vue'
import { useRooms } from '../composables/useRooms'
import { useAvailability } from '../composables/useAvailability'
import { nightsBetween, parseISODate, toISODate, todayISO } from '../lib/format'

const props = defineProps({
	monthsAhead: { type: Number, default: 5 },
})
const emit = defineEmits(['open-room'])

const { rooms } = useRooms()
const { occupancies, loading } = useAvailability()

const today = todayISO()
const now = new Date()
const monthOffset = ref(0)
const selected = ref(today)

const MONTH_NAMES = [
	'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
	'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const DOT_COLORS = [
	'var(--color-primary)',
	'var(--color-bronze)',
	'var(--color-ink)',
	'var(--color-error)',
]
const roomColor = computed(() => {
	const map = {}
	rooms.value.forEach((room, index) => {
		map[room.id] = DOT_COLORS[index % DOT_COLORS.length]
	})
	return map
})

const viewYear = computed(() => new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1).getFullYear())
const viewMonth = computed(() => new Date(now.getFullYear(), now.getMonth() + monthOffset.value, 1).getMonth())
const monthLabel = computed(() => `${MONTH_NAMES[viewMonth.value]} ${viewYear.value}`)

function bookingFor(roomId, iso) {
	return (
		occupancies.value.find(
			(row) => row.room_id === roomId && row.check_in <= iso && iso < row.check_out,
		) ?? null
	)
}

const cells = computed(() => {
	const first = new Date(viewYear.value, viewMonth.value, 1)
	const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
	const leading = (first.getDay() + 6) % 7

	const list = Array.from({ length: leading }, () => null)
	for (let day = 1; day <= daysInMonth; day++) {
		const iso = toISODate(new Date(viewYear.value, viewMonth.value, day))
		const occupiedIds = rooms.value.filter((room) => bookingFor(room.id, iso)).map((room) => room.id)
		list.push({ day, iso, occupiedIds })
	}
	return list
})

function cellClasses(cell) {
	const isPast = cell.iso < today
	const isSelected = cell.iso === selected.value
	const isFull = rooms.value.length > 0 && cell.occupiedIds.length === rooms.value.length
	return [
		isPast ? 'cursor-not-allowed text-muted-soft' : 'text-ink',
		isFull && 'bg-surface-strong',
		isSelected
			? 'font-semibold shadow-[inset_0_0_0_2px_var(--color-ink)]'
			: 'hover:enabled:bg-surface-soft',
		!isSelected && cell.iso === today && 'shadow-[inset_0_0_0_1px_var(--color-border-strong)]',
	]
}

function cellAria(cell) {
	const base = `${cell.day} ${monthLabel.value}`
	if (cell.iso < today) return base
	if (cell.occupiedIds.length === 0) return `${base}, semua kamar kosong`
	return `${base}, ${cell.occupiedIds.length} dari ${rooms.value.length} kamar terisi`
}

const selectedLabel = computed(() =>
	parseISODate(selected.value).toLocaleDateString('id-ID', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	}),
)

const dayRooms = computed(() =>
	rooms.value.map((room) => ({ room, booking: bookingFor(room.id, selected.value) })),
)
const occupiedCount = computed(() => dayRooms.value.filter((entry) => entry.booking).length)

function shortDate(iso) {
	const date = parseISODate(iso)
	return date.toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
	})
}
</script>

<template>
	<div v-if="loading" class="grid animate-pulse items-start gap-8 md:grid-cols-[1fr_340px]">
		<div>
			<div class="h-6 w-40 rounded-xs bg-surface-strong" />
			<div class="mt-4 grid grid-cols-7 gap-1">
				<div v-for="index in 35" :key="index" class="h-12 rounded-sm bg-surface-soft" />
			</div>
		</div>
		<div class="h-64 rounded-md bg-surface-soft" />
	</div>

	<div v-else class="grid items-start gap-8 md:grid-cols-[1fr_340px]">
		<CalendarGrid :month-label="monthLabel" :day-names="DAY_NAMES" :cells="cells" :rooms="rooms" :room-color="roomColor"
			:today="today" :selected="selected" :month-offset="monthOffset" :months-ahead="props.monthsAhead"
			:cell-class="cellClasses" :cell-aria="cellAria" @prev="monthOffset--" @next="monthOffset++"
			@select="selected = $event" />

		<aside class="rounded-md border border-hairline bg-canvas p-5 shadow-sm" aria-live="polite">
			<p class="text-base font-semibold text-ink">{{ selectedLabel }}</p>
			<p class="mt-1 text-sm" :class="occupiedCount === 0 ? 'text-primary' : 'text-muted'">
				<template v-if="occupiedCount === 0">Semua kamar kosong malam ini</template>
				<template v-else>{{ occupiedCount }} dari {{ rooms.length }} kamar terisi</template>
			</p>

			<ul class="mt-2 divide-y divide-hairline-soft">
				<li v-for="{ room, booking } in dayRooms" :key="room.id" class="flex items-start gap-3 py-3.5">
					<span class="mt-1.5 inline-block size-1.5 shrink-0 rounded-full" :style="{ background: roomColor[room.id] }"
						aria-hidden="true" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-ink">{{ room.name }}</p>
						<p v-if="booking" class="mt-0.5 text-[13px] text-muted">
							Terisi · check-in {{ shortDate(booking.check_in) }} -
							check-out {{ shortDate(booking.check_out) }}
							· {{ nightsBetween(booking.check_in, booking.check_out) }} malam
						</p>
						<p v-else class="mt-0.5 text-[13px] font-medium text-primary">Kosong, bisa dibooking</p>
					</div>
					<button v-if="!booking" type="button"
						class="shrink-0 text-sm font-medium text-ink underline underline-offset-4 transition-colors hover:text-primary"
						@click="emit('open-room', room)">
						Lihat kamar
					</button>
				</li>
			</ul>

			<p class="mt-2 border-t border-hairline-soft pt-3 text-xs leading-relaxed text-muted">
				Demi privasi, nama tamu tidak ditampilkan hanya tanggal yang sudah terisi.
			</p>
		</aside>
	</div>
</template>
