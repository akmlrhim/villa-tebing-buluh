# Product

## Register

brand

## Users

- **Tamu (calon penyewa)** — mayoritas mengakses via ponsel, terbiasa bertransaksi lewat WhatsApp, tidak mau membuat akun. Job-to-be-done: dalam satu-dua menit tahu kamar apa saja yang ada, berapa harganya, dan apakah tanggal yang mereka mau masih kosong — lalu langsung chat admin lewat WhatsApp dengan pesan yang sudah terisi otomatis.
- **Admin pengelola vila** — non-teknis; mengelola kamar dan booking dari panel admin sederhana (di luar scope halaman publik).

Bahasa antarmuka: Bahasa Indonesia (satu-satunya bahasa, per PRD).

## Product Purpose

Situs publik Villa Tebing Buluh: etalase kamar + cek ketersediaan real-time + booking via WhatsApp (tanpa payment gateway). Sukses = tamu berhenti bertanya "tanggal X kosong tidak?" karena bisa cek sendiri, dan pesan WhatsApp yang masuk sudah lengkap (kamar, tanggal, jumlah tamu).

## Brand Personality

**Tenang, hangat, tanpa basa-basi.** Vila kecil di tepian sungai/tebing bambu — bukan resort korporat, bukan OTA. Fotografi memikul suasana; antarmuka minggir dan memandu. Satu aksen warna (Rausch dari DESIGN.md) dipakai hemat untuk momen aksi: cek ketersediaan dan tombol WhatsApp.

## Anti-references

- **OTA ramai** (Traveloka/Agoda-style): badge diskon bertumpuk, countdown, banner promo, harga dicoret. Tidak ada urgensi palsu di sini.
- **Template landing AI**: eyebrow uppercase di tiap section, grid kartu ikon-judul-teks seragam, gradient text, glassmorphism.
- **Resort mewah yang dingin**: serif italic dramatis, foto gelap moody, copywriting puitis berlebihan. Vila ini ramah dan membumi.

## Design Principles

1. **Foto yang bicara, UI yang minggir** — kanvas putih, tipe sedang, warna hampir semuanya netral; fotografi membawa bobot visual (per DESIGN.md).
2. **Jarak ke WhatsApp selalu satu ketukan** — CTA booking/chat tampak di setiap layar tanpa menutupi konten.
3. **Kepastian tanggal adalah fitur utama** — kalender ketersediaan dan hasil cek tanggal harus jujur, jelas, dan real-time; jangan pernah menyesatkan tamu.
4. **Mobile dulu, jempol dulu** — target sentuh ≥48px, kontennya nyaman di 360px.
5. **Informasi harga tanpa drama** — harga per malam apa adanya, estimasi total dihitung jelas (harga × malam).

## Accessibility & Inclusion

- Kontras teks tubuh ≥4.5:1, teks besar ≥3:1 (di atas kanvas putih maupun foto ber-scrim).
- Target sentuh minimal 48×48px untuk CTA utama.
- `prefers-reduced-motion` dihormati di semua animasi.
- Alt text deskriptif pada semua foto kamar/vila (juga kebutuhan SEO per PRD).
- Navigasi keyboard untuk modal, lightbox, dan kalender.
