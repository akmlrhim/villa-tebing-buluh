<script setup>
import { computed } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { useSettings } from '../../composables/useSettings'

const { settings, paymentDeadlineHours } = useSettings()

const faqs = computed(() => [
	{
		q: 'Bagaimana cara booking kamar?',
		a: 'Cek ketersediaan tanggal di bagian atas halaman ini, pilih kamar yang kosong, lalu isi form konfirmasi. Kamu akan diarahkan ke halaman pembayaran QRIS untuk menyelesaikan booking.',
	},
	{
		q: 'Berapa lama batas waktu pembayaran?',
		a: `Setelah mengisi form booking, kamu punya waktu ${paymentDeadlineHours.value} jam untuk transfer via QRIS dan mengunggah bukti bayar. Lewat dari itu, booking otomatis dibatalkan.`,
	},
	{
		q: 'Jam berapa check-in dan check-out?',
		a: `Check-in mulai pukul ${settings.check_in_time}, check-out sebelum pukul ${settings.check_out_time}. Kalau butuh jadwal di luar jam ini, tanyakan dulu ke admin lewat WhatsApp.`,
	},
	{
		q: 'Bagaimana cara cek status booking saya?',
		a: 'Buka halaman Cek Booking, lalu masukkan kode booking atau nomor WhatsApp yang kamu daftarkan. Status pending, terkonfirmasi, atau ditolak akan langsung terlihat di sana.',
	},
	{
		q: 'Bisakah membatalkan atau mengubah tanggal booking?',
		a: 'Bisa, tapi belum otomatis lewat situs. Hubungi admin via WhatsApp dengan menyertakan kode booking, dan perubahan akan disesuaikan secara manual.',
	},
	{
		q: 'Metode pembayaran apa saja yang tersedia?',
		a: 'Saat ini pembayaran hanya lewat QRIS (mendukung semua e-wallet dan m-banking yang mendukung QRIS). Bukti transfer diunggah langsung di halaman pembayaran.',
	},
])
</script>

<template>
	<!-- FAQ -->
	<section id="faq" class="mx-auto max-w-3xl scroll-mt-24 px-4 pt-16 pb-16 sm:px-6 md:pt-20 md:pb-24">
		<div class="text-center">
			<h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Pertanyaan yang sering ditanyakan</h2>
			<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-black">
				Belum ketemu jawabannya? Hubungi admin langsung via WhatsApp.
			</p>
		</div>

		<div class="mt-7 divide-y divide-hairline border-t border-b border-hairline">
			<details v-for="faq in faqs" :key="faq.q" class="group py-4">
				<summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
					<span class="font-display text-lg text-ink">{{ faq.q }}</span>
					<IconGlyph name="chevron-down"
						class="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
				</summary>
				<p class="mt-3 max-w-[65ch] font-sans text-sm leading-relaxed text-muted">{{ faq.a }}</p>
			</details>
		</div>
	</section>
</template>
