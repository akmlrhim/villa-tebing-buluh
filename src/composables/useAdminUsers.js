import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// Kelola siapa saja yang jadi admin (halaman /admin/pengguna). Lewat RPC
// SECURITY DEFINER (admin_list_admins/admin_add_admin_by_email/admin_remove_admin)
// karena auth.users tidak bisa diquery langsung dari client.
const admins = ref([])
const loading = ref(false)
const error = ref(null)

export function useAdminUsers() {
  async function fetchAdmins() {
    loading.value = admins.value.length === 0
    error.value = null
    try {
      const { data, error: err } = await supabase.rpc('admin_list_admins')
      if (err) throw err
      admins.value = data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  /** Jadikan akun (yang sudah ada di Supabase Auth) sebagai admin lewat email. */
  async function addAdmin(email) {
    const { data, error: err } = await supabase.rpc('admin_add_admin_by_email', { p_email: email })
    if (err) throw err
    await fetchAdmins()
    return data?.[0]
  }

  /** Cabut akses admin satu user_id. */
  async function removeAdmin(userId) {
    const { error: err } = await supabase.rpc('admin_remove_admin', { p_user_id: userId })
    if (err) throw err
    await fetchAdmins()
  }

  return { admins, loading, error, fetchAdmins, addAdmin, removeAdmin }
}
