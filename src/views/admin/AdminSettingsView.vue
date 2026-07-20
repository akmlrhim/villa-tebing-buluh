<script setup>
import { onMounted, reactive, ref } from 'vue'
import IconGlyph from '../../components/IconGlyph.vue'
import { useSettings } from '../../composables/useSettings'
import { useToast } from '../../composables/useToast'
import { uploadRoomImage } from '../../lib/storage'
import { friendlyDbError } from '../../lib/supabase'

const { settings, fetchSettings, saveSettings } = useSettings()
const toast = useToast()

const KEYS = [
	'villa_name',
	'whatsapp_number',
	'address',
	'instagram',
	'check_in_time',
	'check_out_time',
	'qris_merchant_name',
	'qris_nmid',
	'qris_image_url',
	'payment_deadline_hours',
]

const form = reactive({})
const saving = ref(false)
const uploading = ref(false)

onMounted(async () => {
	await fetchSettings()
	for (const key of KEYS) form[key] = settings.value[key] ?? ''
})

async function onQrisFile(event) {
	const file = event.target.files[0]
	event.target.value = ''
	if (!file) return
	uploading.value = true
	try {
		form.qris_image_url = await uploadRoomImage(file)
		toast.success('Gambar QRIS diunggah.')
	} catch (err) {
		toast.error('Gagal mengunggah QRIS: ' + friendlyDbError(err))
	} finally {
		uploading.value = false
	}
}

async function onSave() {
	saving.value = true
	try {
		await saveSettings({ ...form })
		toast.success('Pengaturan disimpan.')
	} catch (err) {
		toast.error('Gagal menyimpan: ' + friendlyDbError(err))
	} finally {
		saving.value = false
	}
}
</script>

<template>
	<div class="max-w-2xl">
		<h1 class="font-sans text-2xl font-semibold tracking-tight text-ink">Pengaturan</h1>
		<p class="mt-1 text-sm text-black">Informasi vila, kontak, dan pembayaran QRIS.</p>

		<form class="mt-6 space-y-4" @submit.prevent="onSave">
			<section class="rounded-sm border border-hairline bg-canvas p-5 shadow-sm">
				<h2 class="font-sans text-base font-semibold text-ink">Informasi Vila</h2>
				<div class="mt-4 space-y-4">
					<div>
						<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Nama vila</label>
						<input v-model="form.villa_name"
							class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15" />
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Nomor WhatsApp admin</label>
							<input v-model="form.whatsapp_number"
								class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
								placeholder="628xxxxxxxxxx" />
						</div>
						<div>
							<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Instagram (username)</label>
							<input v-model="form.instagram"
								class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
								placeholder="villatebingbuluh" />
						</div>
					</div>
					<div>
						<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Alamat</label>
						<textarea v-model="form.address"
							class="min-h-21 w-full resize-y rounded-sm border border-hairline bg-canvas px-3.5 py-2.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15" />
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Jam check-in</label>
							<input v-model="form.check_in_time"
								class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
								placeholder="14.00" />
						</div>
						<div>
							<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Jam check-out</label>
							<input v-model="form.check_out_time"
								class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
								placeholder="12.00" />
						</div>
					</div>
				</div>
			</section>

			<section class="rounded-sm border border-hairline bg-canvas p-5 shadow-sm">
				<h2 class="font-sans text-base font-semibold text-ink">Pembayaran QRIS</h2>
				<p class="mt-1 text-sm text-muted">Tampil di halaman pembayaran saat tamu booking.</p>
				<div class="mt-4 space-y-4">
					<div class="grid gap-4 sm:grid-cols-2">
						<div>
							<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Nama merchant</label>
							<input v-model="form.qris_merchant_name"
								class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15" />
						</div>
						<div>
							<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">NMID</label>
							<input v-model="form.qris_nmid"
								class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
								placeholder="ID10xxxxxxxxxx" />
						</div>
					</div>
					<div>
						<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Batas waktu bayar (jam)</label>
						<input v-model="form.payment_deadline_hours" type="number" min="1"
							class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15" />
					</div>
					<div>
						<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Gambar QRIS</label>
						<div class="flex items-start gap-4">
							<div
								class="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-sm border border-hairline bg-white">
								<img v-if="form.qris_image_url" :src="form.qris_image_url" alt="QRIS"
									class="h-full w-full object-contain" />
								<IconGlyph v-else name="qr" class="h-8 w-8 text-muted-soft" />
							</div>
							<div class="flex-1 space-y-2">
								<label
									class="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border-strong text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary">
									<IconGlyph name="image" class="h-5 w-5" />
									{{ uploading ? 'Mengunggah…' : 'Unggah gambar QRIS' }}
									<input type="file" accept="image/*" class="hidden" :disabled="uploading" @change="onQrisFile" />
								</label>
								<input v-model="form.qris_image_url"
									class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
									placeholder="atau tempel URL gambar QRIS" />
								<p v-if="!form.qris_image_url" class="text-xs text-muted">
									Kosongkan untuk memakai placeholder demo di halaman pembayaran.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<div class="flex items-center gap-3">
				<button type="submit"
					class="inline-flex h-10.5 items-center justify-center gap-2 rounded-sm bg-primary px-[1.1rem] text-[0.9375rem] font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60"
					:disabled="saving || uploading">
					<IconGlyph name="save" class="h-5 w-5" />
					{{ saving ? 'Menyimpan…' : 'Simpan Pengaturan' }}
				</button>
			</div>
		</form>
	</div>
</template>
