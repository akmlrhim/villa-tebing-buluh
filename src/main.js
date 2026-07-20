import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'

// Aktifkan stylesheet Google Fonts (di index.html: media="print" supaya tidak
// menahan render awal). Dilakukan lewat JS eksternal, bukan onload= inline,
// karena CSP script-src 'self' di vercel.json memblokir atribut event inline.
document.getElementById('gfonts-stylesheet')?.removeAttribute('media')

// Tunggu route awal selesai resolve (termasuk guard auth admin) sebelum mount,
// supaya chrome publik (navbar/footer) tidak sempat berkedip di halaman /admin.
const app = createApp(App).use(router)
router.isReady().then(() => app.mount('#app'))
