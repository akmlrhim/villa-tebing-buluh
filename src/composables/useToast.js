import { ref } from 'vue'

// Toast global: notifikasi singkat untuk hasil aksi (simpan, hapus, salin, dll).
// Dipakai di admin maupun publik; dirender oleh <ToastHost> di App.vue.
const toasts = ref([])
let nextId = 0

const DURATION = { success: 3200, info: 3200, error: 5000 }

function push(type, message) {
  const id = ++nextId
  toasts.value.push({ id, type, message })
  setTimeout(() => dismiss(id), DURATION[type])
  return id
}

function dismiss(id) {
  const i = toasts.value.findIndex((t) => t.id === id)
  if (i !== -1) toasts.value.splice(i, 1)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message),
  }
}
