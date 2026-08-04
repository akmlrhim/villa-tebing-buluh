<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { toISODate, todayISO } from '../../lib/format'

const props = defineProps({
	bookings: { type: Array, default: () => [] },
})
const emit = defineEmits(['edit'])

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const STATUS_DOT = {
	pending: 'bg-sand',
	confirmed: 'bg-primary',
	checked_in: 'bg-primary',
	checked_out: 'bg-muted-soft',
	cancelled: 'bg-error',
}

const cursor = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const today = todayISO()

const monthLabel = computed(() =>
	cursor.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
)

const cells = computed(() => {
	const y = cursor.value.getFullYear()
	const m = cursor.value.getMonth()
	const first = new Date(y, m, 1)
	const lead = (first.getDay() + 6) % 7
	const daysInMonth = new Date(y, m + 1, 0).getDate()
	const out = []
	for (let i = 0; i < lead; i++) out.push(null)
	for (let d = 1; d <= daysInMonth; d++) {
		const iso = toISODate(new Date(y, m, d))
		const items = props.bookings.filter(
			(b) => b.status !== 'cancelled' && b.check_in <= iso && b.check_out > iso,
		)
		out.push({ iso, day: d, items })
	}
	return out
})

function shift(delta) {
	cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + delta, 1)
}
</script>

<template>
	<div class="rounded-md border border-hairline bg-canvas p-4 shadow-float sm:p-5">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-base font-semibold text-ink">{{ monthLabel }}</h2>
			<div class="flex items-center gap-1">
				<button type="button" class="grid h-9 w-9 place-items-center rounded-sm hover:bg-surface-strong"
					aria-label="Bulan sebelumnya" @click="shift(-1)">
					<IconGlyph name="chevron-left" class="h-5 w-5" />
				</button>
				<button type="button" class="grid h-9 w-9 place-items-center rounded-sm hover:bg-surface-strong"
					aria-label="Bulan berikutnya" @click="shift(1)">
					<IconGlyph name="chevron-right" class="h-5 w-5" />
				</button>
			</div>
		</div>

		<div class="grid grid-cols-7 gap-1">
			<div v-for="w in WEEKDAYS" :key="w"
				class="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
				{{ w }}
			</div>

			<div v-for="(cell, i) in cells" :key="i"
				class="min-h-[76px] rounded-sm border p-1"
				:class="cell
					? cell.iso === today ? 'border-primary/50 bg-primary/5' : 'border-hairline-soft'
					: 'border-transparent'">
				<template v-if="cell">
					<span class="block px-0.5 text-[11px] font-medium"
						:class="cell.iso === today ? 'text-primary' : 'text-muted'">{{ cell.day }}</span>
					<button v-for="b in cell.items.slice(0, 3)" :key="b.id" type="button"
						class="mt-0.5 flex w-full items-center gap-1 rounded-xs px-1 py-0.5 text-left text-[11px] leading-tight text-ink hover:bg-surface-strong"
						:title="`${b.guest_name} · ${b.rooms?.name ?? ''}`" @click="emit('edit', b)">
						<span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="STATUS_DOT[b.status]" />
						<span class="truncate">{{ b.guest_name }}</span>
					</button>
					<span v-if="cell.items.length > 3" class="mt-0.5 block px-1 text-[10px] text-muted">
						+{{ cell.items.length - 3 }} lagi
					</span>
				</template>
			</div>
		</div>

		<div class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
			<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-sand" /> Pending</span>
			<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-primary" /> Terkonfirmasi / Check-in</span>
			<span class="flex items-center gap-1.5"><span class="h-2 w-2 rounded-full bg-muted-soft" /> Check-out</span>
		</div>
	</div>
</template>
