<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import IconGlyph from '../../components/IconGlyph.vue'
import { useAuth } from '../../composables/useAuth'

const router = useRouter()
const { userEmail, signOut } = useAuth()

const mobileOpen = ref(false)

const nav = [
	{ to: { name: 'admin-dashboard' }, label: 'Dashboard', icon: 'grid' },
	{ to: { name: 'admin-rooms' }, label: 'Kamar', icon: 'bed' },
	{ to: { name: 'admin-bookings' }, label: 'Booking', icon: 'calendar' },
	{ to: { name: 'admin-promos' }, label: 'Promo', icon: 'tag' },
	{ to: { name: 'admin-gallery' }, label: 'Galeri', icon: 'image' },
	{ to: { name: 'admin-settings' }, label: 'Pengaturan', icon: 'settings' },
]

async function onLogout() {
	await signOut()
	router.replace({ name: 'admin-login' })
}
</script>

<template>
	<div class="min-h-dvh lg:flex">
		<aside
			class="fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-gray-300 bg-canvas transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0"
			:class="{ 'translate-x-0': mobileOpen }">
			<div class="flex h-full flex-col">
				<div class="flex items-center gap-2 border-b border-gray-300 px-5 py-4">
					<img src="/logo.png" alt="" width="168" height="158" class="h-8 w-8" />
					<div class="min-w-0">
						<p class="truncate text-sm font-semibold text-ink">Villa Tebing Buluh</p>
					</div>
				</div>

				<nav class="flex-1 space-y-1 px-3 py-4">
					<RouterLink v-for="item in nav" :key="item.label" :to="item.to" custom
						v-slot="{ href, navigate, isExactActive, isActive }">
						<a :href="href" @click="navigate(); mobileOpen = false"
							class="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors" :class="(item.to.name === 'admin-dashboard' ? isExactActive : isActive)
								? 'bg-primary/10 text-primary'
								: 'text-body hover:bg-surface-strong'">
							<IconGlyph :name="item.icon" class="h-5 w-5 shrink-0" />
							{{ item.label }}
						</a>
					</RouterLink>
				</nav>

				<div class="border-t border-hairline-soft p-3">
					<div class="flex items-center gap-2.5 px-2 py-2">
						<span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-strong">
							<IconGlyph name="user-round" class="h-5 w-5 text-muted" />
						</span>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium text-ink">{{ userEmail }}</p>
							<p class="text-xs text-muted">Admin</p>
						</div>
					</div>
					<button type="button" @click="onLogout"
						class="mt-1 flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-body transition-colors hover:bg-surface-strong">
						<IconGlyph name="log-out" class="h-5 w-5" />
						Keluar
					</button>
				</div>
			</div>
		</aside>

		<div v-if="mobileOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" @click="mobileOpen = false" />

		<div class="min-w-0 flex-1">
			<header class="sticky top-0 z-20 flex items-center gap-3 border-b border-hairline bg-canvas px-4 py-3 lg:hidden">
				<button type="button" class="grid h-10 w-10 place-items-center rounded-sm hover:bg-surface-strong"
					aria-label="Buka menu" @click="mobileOpen = true">
					<IconGlyph name="menu" class="h-5 w-5" />
				</button>
			</header>

			<main class="mx-auto px-4 py-6 sm:px-6 md:py-8">
				<RouterView />
			</main>
		</div>
	</div>
</template>
