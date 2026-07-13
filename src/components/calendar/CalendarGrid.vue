<script setup>
import IconGlyph from '../IconGlyph.vue'

// Grid kalender bulan penuh (presentasional). Data & derivasi state sel
// (cells / cellClass / cellAria) dihitung oleh induk MasterCalendar dan
// dioper lewat props agar `bookingFor` tetap satu sumber.
defineProps({
	monthLabel: { type: String, required: true },
	dayNames: { type: Array, required: true },
	cells: { type: Array, required: true },
	rooms: { type: Array, default: () => [] },
	roomColor: { type: Object, default: () => ({}) },
	today: { type: String, required: true },
	selected: { type: String, required: true },
	monthOffset: { type: Number, required: true },
	monthsAhead: { type: Number, required: true },
	cellClass: { type: Function, required: true },
	cellAria: { type: Function, required: true },
})
const emit = defineEmits(['prev', 'next', 'select'])
</script>

<template>
	<div>
		<div class="flex items-center justify-between">
			<p class="text-base font-semibold text-ink" aria-live="polite">{{ monthLabel }}</p>
			<div class="flex items-center gap-1">
				<button type="button"
					class="grid size-9 place-items-center rounded-full text-ink transition-colors hover:enabled:bg-surface-soft disabled:cursor-not-allowed disabled:text-muted-soft"
					aria-label="Bulan sebelumnya" :disabled="monthOffset <= 0" @click="emit('prev')">
					<IconGlyph name="chevron-left" class="h-4 w-4" />
				</button>
				<button type="button"
					class="grid size-9 place-items-center rounded-full text-ink transition-colors hover:enabled:bg-surface-soft disabled:cursor-not-allowed disabled:text-muted-soft"
					aria-label="Bulan berikutnya" :disabled="monthOffset >= monthsAhead" @click="emit('next')">
					<IconGlyph name="chevron-right" class="h-4 w-4" />
				</button>
			</div>
		</div>

		<div class="mt-3 grid grid-cols-7 gap-y-1 text-center">
			<span v-for="name in dayNames" :key="name" class="pb-2 text-xs font-medium text-muted">
				{{ name }}
			</span>

			<template v-for="(cell, index) in cells" :key="index">
				<span v-if="!cell" />
				<button v-else type="button"
					class="flex h-13 w-full flex-col items-center justify-center gap-1 rounded-sm transition-[background-color,box-shadow]"
					:class="cellClass(cell)" :disabled="cell.iso < today" :aria-label="cellAria(cell)"
					:aria-pressed="cell.iso === selected" @click="emit('select', cell.iso)">
					<span class="text-sm leading-none">{{ cell.day }}</span>
					<span class="flex h-1.5 gap-[3px]" :class="cell.iso < today && 'opacity-35'" aria-hidden="true">
						<i v-for="id in cell.occupiedIds" :key="id" class="inline-block size-1.5 rounded-full"
							:style="{ background: roomColor[id] }" />
					</span>
				</button>
			</template>
		</div>

		<div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
			<span v-for="room in rooms" :key="room.id" class="flex items-center gap-1.5">
				<span class="inline-block size-1.5 rounded-full" :style="{ background: roomColor[room.id] }" />
				{{ room.name }}
			</span>
			<span class="text-muted-soft">Titik = kamar terisi malam itu</span>
		</div>
	</div>
</template>
