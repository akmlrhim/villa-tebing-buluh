<script setup>
import { onMounted, ref } from 'vue'
import IconGlyph from '../../components/IconGlyph.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import { useAdminUsers } from '../../composables/useAdminUsers'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { friendlyDbError } from '../../lib/supabase'
import { fieldClass, btnPrimary } from '../../lib/ui'

const { admins, loading, fetchAdmins, addAdmin, removeAdmin } = useAdminUsers()
const { userEmail } = useAuth()
const toast = useToast()

const newEmail = ref('')
const adding = ref(false)
const confirmRemove = ref(null)
const busyId = ref(null)

onMounted(fetchAdmins)

// Pesan ramah untuk error tervalidasi dari fungsi RPC admin_*.
const RPC_ERRORS = {
	USER_NOT_FOUND:
		'Tidak ada akun dengan email itu. Buat akunnya dulu lewat Supabase Dashboard -> Authentication -> Add user, baru daftarkan sebagai admin di sini.',
	LAST_ADMIN: 'Tidak bisa menghapus admin terakhir — tambahkan admin lain dulu sebelum mencabut akses ini.',
}
function friendlyRpcError(err) {
	const msg = err?.message || String(err)
	for (const key of Object.keys(RPC_ERRORS)) if (msg.includes(key)) return RPC_ERRORS[key]
	return friendlyDbError(err)
}

function formatDate(iso) {
	return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function onAdd() {
	const email = newEmail.value.trim()
	if (!email) return
	adding.value = true
	try {
		await addAdmin(email)
		toast.success(`${email} sekarang jadi admin.`)
		newEmail.value = ''
	} catch (err) {
		toast.error(friendlyRpcError(err))
	} finally {
		adding.value = false
	}
}

async function onRemove() {
	const admin = confirmRemove.value
	busyId.value = admin.user_id
	try {
		await removeAdmin(admin.user_id)
		confirmRemove.value = null
		toast.success(`Akses admin ${admin.email} dicabut.`)
	} catch (err) {
		toast.error(friendlyRpcError(err))
	} finally {
		busyId.value = null
	}
}
</script>

<template>
	<div class="max-w-2xl">
		<h1 class="font-sans text-2xl font-semibold tracking-tight text-ink">Kelola Pengguna</h1>
		<p class="mt-1 text-sm text-black">
			Atur siapa saja yang punya akses admin. Akun Supabase Auth-nya harus sudah dibuat lebih dulu lewat
			Dashboard -> Authentication -> Add user — halaman ini hanya menjadikannya admin atau mencabutnya.
		</p>

		<!-- Tambah admin -->
		<form class="mt-6 flex flex-wrap items-end gap-3 rounded-sm border border-hairline bg-canvas p-5 shadow-sm"
			@submit.prevent="onAdd">
			<div class="min-w-56 flex-1">
				<label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Email akun yang sudah ada</label>
				<input v-model="newEmail" type="email" required :class="fieldClass" placeholder="nama@email.com" />
			</div>
			<button type="submit" :class="btnPrimary" :disabled="adding">
				<IconGlyph name="plus" class="h-5 w-5" />
				{{ adding ? 'Menambahkan…' : 'Jadikan Admin' }}
			</button>
		</form>

		<!-- Loading -->
		<div v-if="loading" class="mt-5 space-y-3">
			<div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-md bg-surface-strong" />
		</div>

		<!-- Daftar admin -->
		<ul v-else class="mt-5 space-y-3">
			<li v-for="admin in admins" :key="admin.user_id"
				class="flex items-center justify-between gap-3 rounded-md border border-hairline bg-canvas p-4 shadow-sm">
				<div class="flex items-center gap-3 min-w-0">
					<span class="grid size-10 shrink-0 place-items-center rounded-full bg-surface-strong">
						<IconGlyph name="user-round" class="h-5 w-5 text-muted" />
					</span>
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<p class="truncate font-medium text-ink">{{ admin.email }}</p>
							<span v-if="admin.email === userEmail"
								class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Anda</span>
						</div>
						<p class="text-xs text-muted">Admin sejak {{ formatDate(admin.added_at) }}</p>
					</div>
				</div>
				<button type="button"
					class="grid size-10 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong disabled:opacity-50 hover:text-error"
					title="Cabut akses admin" :disabled="busyId === admin.user_id" @click="confirmRemove = admin">
					<IconGlyph name="trash" class="h-5 w-5" />
				</button>
			</li>
		</ul>

		<ConfirmDialog :open="Boolean(confirmRemove)" title="Cabut akses admin?"
			:busy="busyId === confirmRemove?.user_id" @cancel="confirmRemove = null" @confirm="onRemove">
			<strong class="text-ink">{{ confirmRemove?.email }}</strong> tidak akan bisa masuk ke admin panel lagi.
			<template v-if="confirmRemove?.email === userEmail">
				Ini akun Anda sendiri — Anda akan langsung ter-logout dari akses admin.
			</template>
		</ConfirmDialog>
	</div>
</template>
