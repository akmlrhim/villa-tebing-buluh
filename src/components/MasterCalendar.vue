<script setup>
import { computed, ref } from 'vue'
import IconGlyph from './IconGlyph.vue'
import { useRooms } from '../composables/useRooms'
import { useAvailability } from '../composables/useAvailability'
import { nightsBetween, parseISODate, toISODate, todayISO } from '../lib/format'

// Kalender master: satu kalender untuk semua kamar. Titik berwarna pada
// tanggal = kamar itu terisi malam tersebut. Klik tanggal untuk melihat
// daftar booking (per kamar) di panel samping. Sumber data view
// public_availability - tanpa nama tamu (PRD F-03.6).
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

// Warna titik per kamar - urutannya mengikuti urutan daftar kamar.
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

/** Malam `iso` tertutup booking bila check_in <= iso < check_out. */
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
	const leading = (first.getDay() + 6) % 7 // grid mulai Senin

	const list = Array.from({ length: leading }, () => null)
	for (let day = 1; day <= daysInMonth; day++) {
		const iso = toISODate(new Date(viewYear.value, viewMonth.value, day))
		const occupiedIds = rooms.value.filter((room) => bookingFor(room.id, iso)).map((room) => room.id)
		list.push({ day, iso, occupiedIds })
	}
	return list
})

function cellClasses(cell) {
	return {
		past: cell.iso < today,
		today: cell.iso === today,
		selected: cell.iso === selected.value,
		full: rooms.value.length > 0 && cell.occupiedIds.length === rooms.value.length,
	}
}

function cellAria(cell) {
	const base = `${cell.day} ${monthLabel.value}`
	if (cell.iso < today) return base
	if (cell.occupiedIds.length === 0) return `${base}, semua kamar kosong`
	return `${base}, ${cell.occupiedIds.length} dari ${rooms.value.length} kamar terisi`
}

// ----- Panel detail tanggal terpilih -----
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

/** '2026-07-10' -> '10 Jul' (tahun hanya bila beda dari tahun berjalan) */
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
	<!-- Skeleton saat data ketersediaan dimuat -->
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
		<!-- Kalender bulan penuh -->
		<div>
			<div class="flex items-center justify-between">
				<p class="text-base font-semibold text-ink" aria-live="polite">{{ monthLabel }}</p>
				<div class="flex items-center gap-1">
					<button type="button" class="nav-btn" aria-label="Bulan sebelumnya" :disabled="monthOffset <= 0"
						@click="monthOffset--">
						<IconGlyph name="chevron-left" class="h-4 w-4" />
					</button>
					<button type="button" class="nav-btn" aria-label="Bulan berikutnya"
						:disabled="monthOffset >= props.monthsAhead" @click="monthOffset++">
						<IconGlyph name="chevron-right" class="h-4 w-4" />
					</button>
				</div>
			</div>

			<div class="mt-3 grid grid-cols-7 gap-y-1 text-center">
				<span v-for="name in DAY_NAMES" :key="name" class="pb-2 text-xs font-medium text-muted">
					{{ name }}
				</span>

				<template v-for="(cell, index) in cells" :key="index">
					<span v-if="!cell" />
					<button v-else type="button" class="day" :class="cellClasses(cell)" :disabled="cell.iso < today"
						:aria-label="cellAria(cell)" :aria-pressed="cell.iso === selected" @click="selected = cell.iso">
						<span class="text-sm leading-none">{{ cell.day }}</span>
						<span class="dots" aria-hidden="true">
							<i v-for="id in cell.occupiedIds" :key="id" class="dot" :style="{ background: roomColor[id] }" />
						</span>
					</button>
				</template>
			</div>

			<div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
				<span v-for="room in rooms" :key="room.id" class="flex items-center gap-1.5">
					<span class="dot" :style="{ background: roomColor[room.id] }" />
					{{ room.name }}
				</span>
				<span class="text-muted-soft">Titik = kamar terisi malam itu</span>
			</div>
		</div>

		<!-- Daftar booking pada tanggal terpilih -->
		<aside class="rounded-md border border-hairline bg-canvas p-5 shadow-float" aria-live="polite">
			<p class="text-base font-semibold text-ink">{{ selectedLabel }}</p>
			<p class="mt-1 text-sm" :class="occupiedCount === 0 ? 'text-primary' : 'text-muted'">
				<template v-if="occupiedCount === 0">Semua kamar kosong malam ini</template>
				<template v-else>{{ occupiedCount }} dari {{ rooms.length }} kamar terisi</template>
			</p>

			<ul class="mt-2 divide-y divide-hairline-soft">
				<li v-for="{ room, booking } in dayRooms" :key="room.id" class="flex items-start gap-3 py-3.5">
					<span class="dot mt-1.5 shrink-0" :style="{ background: roomColor[room.id] }" aria-hidden="true" />
					<div class="min-w-0 flex-1">
						<p class="text-sm font-medium text-ink">{{ room.name }}</p>
						<p v-if="booking" class="mt-0.5 text-[13px] text-muted">
							Terisi · check-in {{ shortDate(booking.check_in) }} →
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

<style scoped>
.nav-btn {
	display: grid;
	place-items: center;
	height: 36px;
	width: 36px;
	border-radius: 9999px;
	color: var(--color-ink);
	transition: background-color 0.15s ease;
}

.nav-btn:hover:not(:disabled) {
	background: var(--color-surface-soft);
}

.nav-btn:disabled {
	color: var(--color-muted-soft);
	cursor: not-allowed;
}

.day {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	height: 52px;
	width: 100%;
	border-radius: var(--radius-sm);
	color: var(--color-ink);
	transition: background-color 0.12s ease, box-shadow 0.12s ease;
}

.day:hover:not(:disabled):not(.selected) {
	background: var(--color-surface-soft);
}

.day.full {
	background: var(--color-surface-strong);
}

.day.today {
	box-shadow: inset 0 0 0 1px var(--color-border-strong);
}

.day.selected {
	box-shadow: inset 0 0 0 2px var(--color-ink);
	font-weight: 600;
}

.day.past {
	color: var(--color-muted-soft);
	cursor: not-allowed;
}

.day.past .dots {
	opacity: 0.35;
}

.dots {
	display: flex;
	gap: 3px;
	height: 6px;
}

.dot {
	display: inline-block;
	height: 6px;
	width: 6px;
	border-radius: 9999px;
}
</style>
