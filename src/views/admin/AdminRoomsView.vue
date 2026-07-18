<script setup>
import { computed, onMounted, ref } from 'vue'
import IconGlyph from '../../components/IconGlyph.vue'
import RoomFormModal from '../../components/admin/RoomFormModal.vue'
import RoomDetailModal from '../../components/admin/RoomDetailModal.vue'
import BulkActionBar from '../../components/admin/BulkActionBar.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { useAdminRooms } from '../../composables/useAdminRooms'
import { useToast } from '../../composables/useToast'
import { usePagination } from '../../composables/usePagination'
import { formatRupiah } from '../../lib/format'
import { friendlyDbError } from '../../lib/supabase'

const { rooms, loading, fetchRooms, toggleActive, deleteRoom, bulkDeleteRooms } = useAdminRooms()
const toast = useToast()

const { page, pageCount, pageItems: pagedRooms, total, rangeStart, rangeEnd, goTo } = usePagination(rooms, 10)

// undefined = modal tertutup, null = tambah, object = edit
const editing = ref(undefined)
const viewing = ref(null)
const confirmDelete = ref(null)
const busyId = ref(null)

const selectedIds = ref(new Set())
const confirmBulkDelete = ref(false)
const bulkBusy = ref(false)
const allSelected = computed(
	() => pagedRooms.value.length > 0 && pagedRooms.value.every((r) => selectedIds.value.has(r.id)),
)

function toggleSelect(id) {
	const next = new Set(selectedIds.value)
	next.has(id) ? next.delete(id) : next.add(id)
	selectedIds.value = next
}
function toggleSelectAll() {
	const next = new Set(selectedIds.value)
	if (allSelected.value) pagedRooms.value.forEach((r) => next.delete(r.id))
	else pagedRooms.value.forEach((r) => next.add(r.id))
	selectedIds.value = next
}
function clearSelection() {
	selectedIds.value = new Set()
}
async function onBulkDelete() {
	bulkBusy.value = true
	try {
		const ids = [...selectedIds.value]
		await bulkDeleteRooms(ids)
		toast.success(`${ids.length} kamar dihapus.`)
		confirmBulkDelete.value = false
		clearSelection()
	} catch (err) {
		toast.error('Gagal menghapus kamar: ' + friendlyDbError(err))
	} finally {
		bulkBusy.value = false
	}
}

onMounted(fetchRooms)

function openNew() {
	editing.value = null
}
function openEdit(room) {
	viewing.value = null
	editing.value = room
}
function openDetail(room) {
	viewing.value = room
}
function onSaved() {
	toast.success(editing.value?.id ? 'Perubahan kamar disimpan.' : 'Kamar baru ditambahkan.')
	editing.value = undefined
}

async function onToggle(room) {
	busyId.value = room.id
	try {
		await toggleActive(room)
		toast.success(room.is_active ? `Kamar ${room.name} dinonaktifkan.` : `Kamar ${room.name} diaktifkan.`)
	} catch (err) {
		toast.error('Gagal mengubah status kamar: ' + friendlyDbError(err))
	} finally {
		busyId.value = null
	}
}

async function onDelete() {
	const room = confirmDelete.value
	busyId.value = room.id
	try {
		await deleteRoom(room.id)
		confirmDelete.value = null
		toast.success(`Kamar ${room.name} dihapus.`)
	} catch (err) {
		toast.error('Gagal menghapus kamar: ' + friendlyDbError(err))
	} finally {
		busyId.value = null
	}
}

const primaryImage = (room) =>
	room.images?.find((i) => i.is_primary)?.url ?? room.images?.[0]?.url ?? null
</script>

<template>
	<div>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="font-sans text-2xl font-semibold tracking-tight text-ink">Kelola Kamar</h1>
				<p class="mt-1 text-sm text-black">Tambah, ubah, atau nonaktifkan kamar vila.</p>
			</div>
			<button type="button"
				class="inline-flex h-10.5 items-center justify-center gap-2 rounded-sm bg-primary px-[1.1rem] text-[0.9375rem] font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60"
				@click="openNew">
				<IconGlyph name="plus" class="h-5 w-5" /> Tambah Kamar
			</button>
		</div>

		<!-- Loading -->
		<div v-if="loading" class="mt-6 space-y-3">
			<div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-md bg-surface-strong" />
		</div>

		<!-- Kosong -->
		<div v-else-if="!rooms.length"
			class="mt-6 rounded-md border border-dashed border-border-strong bg-canvas px-6 py-12 text-center">
			<span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-strong">
				<IconGlyph name="bed" class="h-6 w-6 text-muted" />
			</span>
			<p class="mt-3 font-medium text-ink">Belum ada kamar</p>
			<p class="mx-auto mt-1 max-w-xs text-sm text-muted">Mulai dengan menambahkan kamar pertama vila.</p>
			<button type="button"
				class="inline-flex h-10.5 items-center justify-center gap-2 rounded-sm bg-primary px-[1.1rem] text-[0.9375rem] font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60 mx-auto mt-5"
				@click="openNew">
				<IconGlyph name="plus" class="h-5 w-5" /> Tambah Kamar
			</button>
		</div>

		<!-- Daftar -->
		<template v-else>
			<label class="mt-6 flex items-center gap-2 text-sm text-muted">
				<input type="checkbox" class="size-4 accent-primary" :checked="allSelected"
					aria-label="Pilih semua kamar" @change="toggleSelectAll" />
				Pilih semua di halaman ini
			</label>

			<BulkActionBar :count="selectedIds.size" item-label="kamar" @cancel="clearSelection"
				@delete="confirmBulkDelete = true" />

			<ul class="mt-3 space-y-3">
				<li v-for="room in pagedRooms" :key="room.id"
					class="flex flex-col gap-4 rounded-md border border-hairline bg-canvas p-3 shadow-sm sm:flex-row sm:items-center"
					:class="!room.is_active && 'bg-surface-soft/60'">
					<input type="checkbox" class="size-4 shrink-0 accent-primary sm:self-center" :checked="selectedIds.has(room.id)"
						:aria-label="`Pilih kamar ${room.name}`" @change="toggleSelect(room.id)" />
					<button type="button"
					class="h-20 w-full shrink-0 cursor-pointer overflow-hidden rounded-sm bg-surface-strong sm:h-16 sm:w-24"
					:class="!room.is_active && 'opacity-50 grayscale'"
					:aria-label="`Lihat detail ${room.name}`" @click="openDetail(room)">
					<img v-if="primaryImage(room)" :src="primaryImage(room)" alt="" class="h-full w-full object-cover" />
					<div v-else class="grid h-full w-full place-items-center text-muted-soft">
						<IconGlyph name="image" class="h-6 w-6" />
					</div>
				</button>

				<div class="min-w-0 flex-1" :class="!room.is_active && 'opacity-70'">
					<div class="flex flex-wrap items-center gap-2">
						<button type="button" class="cursor-pointer font-semibold text-ink hover:underline"
							@click="openDetail(room)">{{ room.name }}</button>
						<span v-if="room.is_active"
							class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
							<span class="size-1.5 rounded-full bg-primary" /> Aktif
						</span>
						<span v-else
							class="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2 py-0.5 text-[11px] font-medium text-muted">
							<span class="size-1.5 rounded-full bg-muted-soft" /> Nonaktif
						</span>
					</div>
					<p class="mt-0.5 text-sm text-muted">
						{{ formatRupiah(room.price_per_night) }} / malam · maks {{ room.max_guests }} tamu
					</p>
				</div>

				<div class="flex items-center gap-1.5 sm:shrink-0">
					<button type="button"
						class="grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink disabled:opacity-50"
						title="Lihat detail" @click="openDetail(room)">
						<IconGlyph name="eye" class="h-5 w-5" />
					</button>
					<button type="button"
						class="grid size-10 place-items-center rounded-sm transition-colors hover:bg-surface-strong disabled:opacity-50"
						:class="room.is_active ? 'text-primary' : 'text-muted-soft hover:text-ink'"
						:title="room.is_active ? 'Nonaktifkan kamar' : 'Aktifkan kamar'"
						:disabled="busyId === room.id" @click="onToggle(room)">
						<IconGlyph name="power" class="h-5 w-5" />
					</button>
					<button type="button"
						class="grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink disabled:opacity-50"
						title="Edit" @click="openEdit(room)">
						<IconGlyph name="edit" class="h-5 w-5" />
					</button>
					<button type="button"
						class="grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong disabled:opacity-50 hover:text-error"
						title="Hapus" @click="confirmDelete = room">
						<IconGlyph name="trash" class="h-5 w-5" />
					</button>
				</div>
			</li>
		</ul>
		</template>

		<PaginationBar v-if="rooms.length" :page="page" :page-count="pageCount" :total="total" :range-start="rangeStart"
			:range-end="rangeEnd" item-label="kamar" @change="goTo" />

		<RoomDetailModal :room="viewing" @close="viewing = null" @edit="openEdit" />

		<RoomFormModal :room="editing" @close="editing = undefined" @saved="onSaved" />

		<!-- Konfirmasi hapus -->
		<div v-if="confirmDelete" class="fixed inset-0 z-50 grid place-items-center p-4">
			<div class="absolute inset-0 bg-black/50" @click="confirmDelete = null" />
			<div class="relative w-full max-w-sm rounded-md bg-canvas p-6 shadow-float">
				<h2 class="font-sans text-lg font-semibold text-ink">Hapus kamar?</h2>
				<p class="mt-2 text-sm text-muted">
					Kamar <strong class="text-ink">{{ confirmDelete.name }}</strong> akan dihapus permanen beserta
					fotonya. Tindakan ini tidak bisa dibatalkan.
				</p>
				<div class="mt-5 flex justify-end gap-3">
					<button type="button"
						class="inline-flex h-10.5 items-center justify-center gap-2 rounded-sm border border-hairline bg-canvas px-[1.1rem] text-[0.9375rem] font-medium text-ink transition-colors hover:border-border-strong"
						@click="confirmDelete = null">Batal</button>
					<button type="button"
						class="inline-flex h-[42px] items-center gap-2 rounded-sm bg-error px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
						:disabled="busyId === confirmDelete.id" @click="onDelete">
						<IconGlyph name="trash" class="h-5 w-5" /> Hapus
					</button>
				</div>
			</div>
		</div>

		<ConfirmDialog :open="confirmBulkDelete" title="Hapus kamar terpilih?" :busy="bulkBusy"
			@cancel="confirmBulkDelete = false" @confirm="onBulkDelete">
			<strong class="text-ink">{{ selectedIds.size }} kamar</strong> beserta fotonya akan dihapus permanen.
			Tindakan ini tidak bisa dibatalkan.
		</ConfirmDialog>
	</div>
</template>
