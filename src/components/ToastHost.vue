<script setup>
import IconGlyph from './IconGlyph.vue'
import { useToast } from '../composables/useToast'

const { toasts, dismiss } = useToast()

const ICONS = { success: 'check', error: 'alert', info: 'clock' }
</script>

<template>
	<div class="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
		aria-live="polite">
		<TransitionGroup name="toast">
			<div v-for="toast in toasts" :key="toast.id"
				class="pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-md border bg-canvas px-4 py-3 shadow-float"
				:class="toast.type === 'error' ? 'border-error/30' : 'border-hairline'" role="status">
				<span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
					:class="toast.type === 'error' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'">
					<IconGlyph :name="ICONS[toast.type]" class="h-3.5 w-3.5" />
				</span>
				<p class="flex-1 text-sm leading-snug text-ink">{{ toast.message }}</p>
				<button type="button"
					class="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-strong hover:text-ink"
					aria-label="Tutup notifikasi" @click="dismiss(toast.id)">
					<IconGlyph name="x" class="h-3.5 w-3.5" />
				</button>
			</div>
		</TransitionGroup>
	</div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active,
.toast-move {
	transition: opacity 0.25s ease, transform 0.25s var(--ease-out-quart);
}

.toast-enter-from {
	opacity: 0;
	transform: translateY(10px);
}

.toast-leave-to {
	opacity: 0;
	transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {

	.toast-enter-from,
	.toast-leave-to {
		transform: none;
	}
}
</style>
