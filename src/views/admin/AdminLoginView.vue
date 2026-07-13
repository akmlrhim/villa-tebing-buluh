<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconGlyph from '../../components/IconGlyph.vue'
import { useAuth } from '../../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { signIn } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

function go() {
	const redirect = route.query.redirect
	router.replace(typeof redirect === 'string' ? redirect : { name: 'admin-dashboard' })
}

async function onSubmit() {
	errorMsg.value = ''
	loading.value = true
	try {
		await signIn(email.value.trim(), password.value)
		go()
	} catch (err) {
		errorMsg.value =
			err?.message === 'Invalid login credentials'
				? 'Email atau password salah.'
				: err?.message || 'Gagal masuk. Coba lagi.'
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="grid min-h-dvh place-items-center bg-surface-soft px-4 py-10">
		<div class="w-full max-w-sm">
			<form class="mt-8 space-y-4 rounded-md border border-hairline bg-canvas p-6 shadow-float"
				@submit.prevent="onSubmit">
				<h1 class="font-sans text-lg font-semibold text-ink">Masuk</h1>

				<div v-if="errorMsg" class="flex items-start gap-2 rounded-sm bg-error/10 px-3 py-2.5 text-sm text-error"
					role="alert">
					<IconGlyph name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
					<span>{{ errorMsg }}</span>
				</div>

				<label class="block">
					<span class="text-sm font-medium text-ink">Email</span>
					<input v-model="email" type="email" required autocomplete="username" placeholder="admin@vila.com"
						class="h-8 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 mt-1.5" />
				</label>

				<label class="block">
					<span class="text-sm font-medium text-ink">Password</span>
					<div class="relative mt-1.5">
						<input v-model="password" :type="showPassword ? 'text' : 'password'" required
							autocomplete="current-password" placeholder="••••••••"
							class="h-8 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 pr-11" />
						<button type="button"
							class="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted hover:text-ink"
							:aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
							@click="showPassword = !showPassword">
							<IconGlyph :name="showPassword ? 'eye-off' : 'eye'" class="h-5 w-5" />
						</button>
					</div>
				</label>

				<button type="submit" :disabled="loading"
					class="flex h-8 w-full items-center justify-center gap-2 rounded-sm bg-primary text-sm font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60">
					{{ loading ? 'Memproses…' : 'Masuk' }}
				</button>
			</form>

			<p class="mt-6 text-center text-xs text-black">
				<RouterLink to="/" class="underline underline-offset-2 hover:text-ink">Kembali ke situs</RouterLink>
			</p>
		</div>
	</div>
</template>
