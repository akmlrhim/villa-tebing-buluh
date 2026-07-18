<script setup>
import { heroImage } from '../../data/demoData'
</script>

<template>
	<!-- Hero (F-01.1). -mt menarik hero ke bawah navbar (navbar transparan sebelum di-scroll) -->
	<section
		class="relative isolate -mt-14 flex min-h-[640px] flex-col justify-end bg-ink pb-24 md:-mt-20 md:h-[78vh] md:max-h-[820px] md:pb-28">
		 <img :src="heroImage.url" :alt="heroImage.alt" fetchpriority="high"
			class="absolute inset-0 -z-10 h-full w-full object-cover" />
		<div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/40 to-black/25" />
		<!-- Scrim atas: menjaga keterbacaan link navbar putih di atas foto -->
		 <div class="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-black/45 to-transparent" />

		<div class="mx-auto w-full max-w-6xl px-4 pt-40 sm:px-6">
			<h1
				class="animate-rise-in motion-reduce:animate-none max-w-xl text-[clamp(2.1rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
				Menginap tenang di tebing buluh
			</h1>
			<p class="animate-rise-in-late motion-reduce:animate-none mt-4 max-w-lg text-sm leading-relaxed text-white">
				Vila privat dengan kolam renang, suara sungai, dan udara yang lambat.
				Cek tanggal kosong di bawah, lalu booking cukup lewat WhatsApp.
			</p>
			<div class="animate-rise-in-late motion-reduce:animate-none mt-8 flex flex-wrap gap-3">
				<a href="#cek-ketersediaan"
					class="flex h-12 items-center rounded-sm bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary-active">
					Cek Ketersediaan
				</a>
				<a href="#kamar"
					class="flex h-12 items-center rounded-sm border border-white/70 px-6 text-base font-medium text-white transition-colors hover:bg-white/10">
					Lihat Kamar
				</a>
			</div>
		</div>
	</section>
</template>
