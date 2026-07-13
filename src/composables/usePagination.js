import { computed, ref, watch } from 'vue'

/**
 * Pagination sisi klien untuk daftar admin (booking, kamar, dst).
 * `items` boleh ref/computed reaktif — halaman otomatis kembali ke 1
 * saat isi (mis. hasil filter) berubah panjangnya.
 */
export function usePagination(items, pageSize = 10) {
  const page = ref(1)

  const pageCount = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize)))

  watch(pageCount, (count) => {
    if (page.value > count) page.value = count
  })

  const pageItems = computed(() => {
    const start = (page.value - 1) * pageSize
    return items.value.slice(start, start + pageSize)
  })

  const rangeStart = computed(() => (items.value.length === 0 ? 0 : (page.value - 1) * pageSize + 1))
  const rangeEnd = computed(() => Math.min(page.value * pageSize, items.value.length))

  function goTo(n) {
    page.value = Math.min(Math.max(1, n), pageCount.value)
  }

  return {
    page,
    pageCount,
    pageItems,
    total: computed(() => items.value.length),
    rangeStart,
    rangeEnd,
    goTo,
  }
}
