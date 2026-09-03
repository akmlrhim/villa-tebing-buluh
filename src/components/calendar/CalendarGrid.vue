<script setup>
import IconGlyph from '../IconGlyph.vue'

defineProps({
	monthLabel: { type: String, required: true },
	dayNames: { type: Array, required: true },
	cells: { type: Array, required: true },
	rooms: { type: Array, default: () => [] },
	roomColor: { type: Object, default: () => ({}) },
	roomCode: { type: Object, default: () => ({}) },
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
					class="flex min-h-13 w-full flex-col items-center justify-center gap-1 rounded-sm py-1.5 transition-[background-color,box-shadow]"
					:class="cellClass(cell)" :disabled="cell.iso < today" :aria-label="cellAria(cell)"
					:aria-pressed="cell.iso === selected" @click="emit('select', cell.iso)">
					<span class="text-sm leading-none">{{ cell.day }}</span>
					<span class="flex flex-wrap items-center justify-center gap-0.5 px-0.5"
						:class="cell.iso < today && 'opacity-35'" aria-hidden="true">
						<span v-for="id in cell.occupiedIds" :key="id"
							class="rounded-[3px] px-[3px] text-[9px] leading-[13px] font-bold text-white"
							:style="{ background: roomColor[id] }">{{ roomCode[id] }}</span>
					</span>
				</button>
			</template>
		</div>

		<div class="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
			<span v-for="room in rooms" :key="room.id" class="flex items-center gap-1.5">
				<span class="rounded-[3px] px-[3px] text-[9px] leading-[13px] font-bold text-white"
					:style="{ background: roomColor[room.id] }">{{ roomCode[room.id] }}</span>
				{{ room.name }}
			</span>
			<span class="text-muted-soft">Kode = kamar terisi malam itu</span>
		</div>
	</div>
</template>
