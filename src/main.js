import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'

// Tunggu route awal selesai resolve (termasuk guard auth admin) sebelum mount,
// supaya chrome publik (navbar/footer) tidak sempat berkedip di halaman /admin.
const app = createApp(App).use(router)
router.isReady().then(() => app.mount('#app'))
