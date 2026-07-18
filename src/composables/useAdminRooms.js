import { ref } from 'vue'
import { supabase, assertRowsAffected } from '../lib/supabase'

// CRUD kamar untuk admin (F-09). Berbeda dari useRooms publik: memuat SEMUA
// kamar termasuk yang nonaktif, dan menyediakan tulis (create/update/delete).
const rooms = ref([])
const loading = ref(false)
const error = ref(null)

/** Bentuk seragam: room + images:[{url, is_primary}] terurut (primary dulu). */
function normalizeSupabaseRoom(room) {
  const images = [...(room.room_images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
    .map((img) => ({ url: img.image_url, alt: `Foto kamar ${room.name}`, is_primary: img.is_primary }))
  return { ...room, images }
}

export function useAdminRooms() {
  async function fetchRooms() {
    // Skeleton hanya saat muat pertama; refetch setelah aksi berjalan diam-diam
    // supaya daftar tidak diganti skeleton (bikin scroll lompat ke atas).
    loading.value = rooms.value.length === 0
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('rooms')
        .select('*, room_images(id, image_url, is_primary, sort_order)')
        .order('created_at', { ascending: true })
      if (err) throw err
      rooms.value = data.map(normalizeSupabaseRoom)
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function saveRoomImages(roomId, images) {
    // Sederhana & benar untuk skala kecil: hapus semua lalu tulis ulang.
    await supabase.from('room_images').delete().eq('room_id', roomId)
    if (images.length) {
      const rows = images.map((img, i) => ({
        room_id: roomId,
        image_url: img.url,
        is_primary: img.is_primary ?? i === 0,
        sort_order: i,
      }))
      const { error: err } = await supabase.from('room_images').insert(rows)
      if (err) throw err
    }
  }

  /** Buat atau perbarui kamar. `form` berisi field kamar + images:[{url,is_primary}]. */
  async function saveRoom(form) {
    const { id, images = [], ...fields } = form

    let roomId = id
    if (id) {
      const { data, error: err } = await supabase.from('rooms').update(fields).eq('id', id).select('id')
      if (err) throw err
      assertRowsAffected(data)
    } else {
      const { data, error: err } = await supabase.from('rooms').insert(fields).select('id').single()
      if (err) throw err
      roomId = data.id
    }
    await saveRoomImages(roomId, images)
    await fetchRooms()
    return roomId
  }

  async function toggleActive(room) {
    const { data, error: err } = await supabase
      .from('rooms')
      .update({ is_active: !room.is_active })
      .eq('id', room.id)
      .select('id')
    if (err) throw err
    assertRowsAffected(data)
    await fetchRooms()
  }

  async function deleteRoom(id) {
    const { data, error: err } = await supabase.from('rooms').delete().eq('id', id).select('id')
    if (err) throw err
    assertRowsAffected(data)
    await fetchRooms()
  }

  async function bulkDeleteRooms(ids) {
    const { data, error: err } = await supabase.from('rooms').delete().in('id', ids).select('id')
    if (err) throw err
    assertRowsAffected(data)
    await fetchRooms()
  }

  return { rooms, loading, error, fetchRooms, saveRoom, toggleActive, deleteRoom, bulkDeleteRooms }
}
