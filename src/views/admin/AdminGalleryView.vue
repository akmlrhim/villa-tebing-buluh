<script setup>
import { onMounted, ref } from 'vue'
import IconGlyph from '../../components/IconGlyph.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import GalleryUploadGrid from '../../components/admin/GalleryUploadGrid.vue'
import BulkActionBar from '../../components/admin/BulkActionBar.vue'
import { useAdminGallery } from '../../composables/useAdminGallery'
import { usePagination } from '../../composables/usePagination'
import { useToast } from '../../composables/useToast'
import { uploadGalleryImage } from '../../lib/storage'
import { btnPrimary } from '../../lib/ui'
import { friendlyDbError } from '../../lib/supabase'

const { images, loading, fetchGallery, addImages, deleteImage, bulkDeleteImages } = useAdminGallery()
const toast = useToast()

const uploading = ref(false)
const confirmDelete = ref(null)
const busyId = ref(null)

const selectedIds = ref(new Set())
const confirmBulkDelete = ref(false)
const bulkBusy = ref(false)

function toggleSelect(id) {
	const next = new Set(selectedIds.value)
	next.has(id) ? next.delete(id) : next.add(id)
	selectedIds.value = next
}
function clearSelection() {
	selectedIds.value = new Set()
}
async function onBulkDelete() {
	bulkBusy.value = true
	try {
		const ids = [...selectedIds.value]
		await bulkDeleteImages(ids)
		toast.success(`${ids.length} foto dihapus.`)
		confirmBulkDelete.value = false
		clearSelection()
	} catch (err) {
		toast.error('Gagal menghapus foto: ' + friendlyDbError(err))
	} finally {
		bulkBusy.value = false
	}
}

onMounted(fetchGallery)

const { page, pageCount, pageItems: paged, total, rangeStart, rangeEnd, goTo } = usePagination(images, 12)

async function onFiles(event) {
	const files = [...event.target.files]
	event.target.value = ''
	if (!files.length) return
	uploading.value = true
	try {
		const urls = []
		for (const file of files) urls.push(await uploadGalleryImage(file))
		await addImages(urls)
		toast.success(`${urls.length} foto ditambahkan ke galeri.`)
	} catch (err) {
		toast.error('Gagal mengunggah foto: ' + friendlyDbError(err))
	} finally {
		uploading.value = false
	}
}

async function onDelete() {
	const image = confirmDelete.value
	busyId.value = image.id
	try {
		await deleteImage(image.id)
		confirmDelete.value = null
		toast.success('Foto dihapus dari galeri.')
	} catch (err) {
		toast.error('Gagal menghapus foto: ' + friendlyDbError(err))
	} finally {
		busyId.value = null
	}
}
</script>

<template>
	<div>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="font-sans text-2xl font-semibold tracking-tight text-ink">Kelola Galeri</h1>
				<p class="mt-1 text-sm text-black">Unggah foto galeri publik bebas, tanpa kategori. Foto otomatis dikompres
					& dikonversi ke WebP.</p>
			</div>
			<label :class="[btnPrimary, uploading && 'pointer-events-none opacity-60', 'cursor-pointer']">
				<IconGlyph name="upload" class="h-5 w-5" />
				{{ uploading ? 'Mengunggah…' : 'Unggah Foto' }}
				<input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="onFiles" />
			</label>
		</div>

		<div v-if="loading" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
			<div v-for="i in 8" :key="i" class="aspect-square animate-pulse rounded-md bg-surface-strong" />
		</div>

		<div v-else-if="!images.length"
			class="mt-6 rounded-md border border-dashed border-border-strong bg-canvas px-6 py-12 text-center">
			<span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-strong">
				<IconGlyph name="image" class="h-6 w-6 text-muted" />
			</span>
			<p class="mt-3 font-medium text-ink">Belum ada foto galeri</p>
			<p class="mx-auto mt-1 max-w-xs text-sm text-muted">Unggah foto pertama untuk ditampilkan di halaman Gallery
				publik.</p>
			<label :class="[btnPrimary, uploading && 'pointer-events-none opacity-60', 'mx-auto mt-5 cursor-pointer']">
				<IconGlyph name="upload" class="h-5 w-5" />
				{{ uploading ? 'Mengunggah…' : 'Unggah Foto' }}
				<input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="onFiles" />
			</label>
		</div>

		<template v-else>
			<BulkActionBar :count="selectedIds.size" item-label="foto" @cancel="clearSelection"
				@delete="confirmBulkDelete = true" />
			<GalleryUploadGrid :images="paged" :busy-id="busyId" :selected-ids="selectedIds" @delete="confirmDelete = $event"
				@toggle="toggleSelect" />
			<PaginationBar :page="page" :page-count="pageCount" :total="total" :range-start="rangeStart" :range-end="rangeEnd"
				item-label="foto" @change="goTo" />
		</template>

		<ConfirmDialog :open="Boolean(confirmDelete)" title="Hapus foto?" :busy="busyId === confirmDelete?.id"
			@cancel="confirmDelete = null" @confirm="onDelete">
			Foto ini akan dihapus permanen dari galeri publik.
		</ConfirmDialog>

		<ConfirmDialog :open="confirmBulkDelete" title="Hapus foto terpilih?" :busy="bulkBusy"
			@cancel="confirmBulkDelete = false" @confirm="onBulkDelete">
			<strong class="text-ink">{{ selectedIds.size }} foto</strong> akan dihapus permanen dari galeri publik.
		</ConfirmDialog>
	</div>
</template>
