# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (Settings -> API for the URL + anon key).
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. In the Supabase dashboard, open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql). This creates:
   - `villas` table (content: name, price, photos, amenities) — public read, admin write
   - `bookings` table (guest reservation requests) — anyone can insert, only admin can read/manage
   - `villa-images` storage bucket — public read, admin write
4. Create the admin account: dashboard -> **Authentication -> Users -> Add user**, set an email/password (this is the only login — no public sign-up is wired up).
5. Code entry points:
   - `src/lib/supabase.js` — client instance (+ `isSupabaseConfigured`; tanpa `.env` valid, situs publik memakai data demo dari `src/data/demoData.js`)
   - `src/composables/useAuth.js` — admin sign in/out, reactive `user`
   - `src/composables/useRooms.js` — daftar kamar + foto (`rooms`, `room_images`)
   - `src/composables/useAvailability.js` — ketersediaan publik (view `public_availability`)
   - `src/composables/useSettings.js` — nomor WhatsApp admin dkk. (tabel `settings`)
   - `src/composables/useBookings.js` — admin: kelola booking
