<script setup>
// Hero pendek untuk halaman selain Home: foto latar + judul putih, dengan
// navbar overlay transparan di atasnya (konsep sama dengan hero Home).
// -mt menarik hero ke bawah navbar; scrim atas menjaga keterbacaan link putih.
defineProps({
	image: { type: String, required: true },
	srcset: { type: String, default: '' },
	alt: { type: String, default: '' },
	title: { type: String, required: true },
	subtitle: { type: String, default: '' },
})
</script>

<template>
	<section
		class="relative isolate -mt-14 flex min-h-[340px] flex-col justify-end pb-10 md:-mt-20 md:min-h-[420px] md:pb-12">
		<img :src="image" :srcset="srcset" sizes="100vw" :alt="alt" fetchpriority="high"
			class="absolute inset-0 -z-10 h-full w-full object-cover" />
		<div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/40 to-black/25" />
		<div class="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-black/45 to-transparent" />

		<div class="mx-auto w-full max-w-6xl px-4 pt-32 sm:px-6">
			<h1
				class="animate-rise-in motion-reduce:animate-none max-w-2xl text-[clamp(1.7rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white">
				{{ title }}
			</h1>
			<p v-if="subtitle"
				class="animate-rise-in-late motion-reduce:animate-none mt-3 max-w-xl text-sm leading-relaxed text-white md:text-base">
				{{ subtitle }}
			</p>
		</div>
	</section>
</template>
