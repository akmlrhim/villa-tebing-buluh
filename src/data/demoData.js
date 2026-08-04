import { addDaysISO, todayISO } from '../lib/format'

const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

const imgSrcset = (id, widths) =>
  widths.map((w) => `${img(id, w)} ${w}w`).join(', ')

export const demoRooms = [
  {
    id: 'demo-cemerlang-1',
    name: 'Cemerlang 1',
    slug: 'cemerlang-1',
    description:
      'Kamar di lantai satu dengan akses langsung ke teras menghadap pegunungan. Interior kayu jati yang hangat, tempat tidur king, dan kamar mandi dalam dengan air panas serta bathtub. Cocok untuk pasangan yang ingin bangun pagi ditemani udara sejuk gunung.',
    price_per_night: 850000,
    min_nights: 1,
    max_guests: 2,
    size_sqm: 28,
    bed_count: 1,
    bed_type: 'King',
    amenities: [
      'AC',
      'Water Heater',
      'Free WiFi',
      'Teras Pribadi',
      'Bathtub',
      'Pemandangan Pegunungan',
    ],
    images: [
      {
        url: img('1611892440504-42a792e24d32'),
        alt: 'Kamar Cemerlang 1, tempat tidur king berbingkai kayu jati dengan pencahayaan hangat',
      },
      {
        url: img('1552321554-5fefe8c9ef14'),
        alt: 'Kamar mandi dalam Cemerlang 1 yang bersih dengan tanaman hijau',
      },
      {
        url: img('1602002418082-a4443e081dd1'),
        alt: 'Pemandangan teras pribadi dari dalam kamar Cemerlang 1',
      },
    ],
  },
  {
    id: 'demo-cemerlang-2',
    name: 'Cemerlang 2',
    slug: 'cemerlang-2',
    description:
      'Kamar di lantai dua dengan jendela lebar menghadap rumpun bambu dan lembah Pegunungan Meratus. Inilah kamar paling tenang di seluruh vila: yang terdengar hanya angin dan bambu bergesekan. Tempat tidur king, meja kerja kecil, dan balkon untuk kopi pagi.',
    price_per_night: 950000,
    min_nights: 1,
    max_guests: 2,
    size_sqm: 30,
    bed_count: 1,
    bed_type: 'King',
    amenities: [
      'AC',
      'Water Heater',
      'Free WiFi',
      'Balkon View Pegunungan',
      'Meja Kerja',
    ],
    images: [
      {
        url: img('1582719478250-c89cae4dc85b'),
        alt: 'Kamar Cemerlang 2, interior kayu dengan jendela lebar menghadap pepohonan',
      },
      {
        url: img('1591088398332-8a7791972843'),
        alt: 'Sudut duduk kamar Cemerlang 2 dengan kursi dan bangku empuk',
      },
      {
        url: img('1566073771259-6a8506099945'),
        alt: 'Kursi santai di dek kayu dekat kamar Cemerlang 2 saat matahari terbenam',
      },
    ],
  },
  {
    id: 'demo-serumpun',
    name: 'Serumpun (Family)',
    slug: 'serumpun-family',
    description:
      'Unit keluarga dengan dua tempat tidur besar dan ruang duduk sendiri. Dapur kecil lengkap dengan peralatan masak, cocok untuk keluarga yang menginap beberapa malam. Kapasitas hingga 5 tamu.',
    price_per_night: 1400000,
    min_nights: 2,
    max_guests: 5,
    size_sqm: 46,
    bed_count: 2,
    bed_type: 'Queen',
    amenities: [
      'AC',
      'Water Heater',
      'Free WiFi',
      'Dapur + Peralatan Lengkap',
      'Ruang Duduk',
      'Gazebo',
    ],
    images: [
      {
        url: img('1512918728675-ed5a9ecdebfd'),
        alt: 'Tempat tidur utama unit Serumpun dengan cahaya pagi',
      },
      {
        url: img('1595576508898-0ad5c879a061'),
        alt: 'Kamar Serumpun, dua tempat tidur besar untuk keluarga',
      },
      {
        url: img('1584132967334-10e028bd69f7'),
        alt: 'Dek kayu bersama di depan unit Serumpun',
      },
    ],
  },
]

const t = todayISO()
export const demoBookings = [
  { room_id: 'demo-cemerlang-1', check_in: addDaysISO(t, 3), check_out: addDaysISO(t, 6), status: 'confirmed' },
  { room_id: 'demo-cemerlang-1', check_in: addDaysISO(t, 14), check_out: addDaysISO(t, 18), status: 'pending' },
  { room_id: 'demo-cemerlang-1', check_in: addDaysISO(t, 32), check_out: addDaysISO(t, 39), status: 'confirmed' },
  { room_id: 'demo-cemerlang-2', check_in: addDaysISO(t, 2), check_out: addDaysISO(t, 3), status: 'confirmed' },
  { room_id: 'demo-cemerlang-2', check_in: addDaysISO(t, 11), check_out: addDaysISO(t, 13), status: 'confirmed' },
  { room_id: 'demo-serumpun', check_in: addDaysISO(t, 17), check_out: addDaysISO(t, 21), status: 'pending' },
  { room_id: 'demo-serumpun', check_in: addDaysISO(t, 25), check_out: addDaysISO(t, 27), status: 'confirmed' },
]

export const demoSettings = {
  whatsapp_number: '6281234567890',
  villa_name: 'Villa Tebing Buluh',
  address: 'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282',
  check_in_time: '14.00',
  check_out_time: '12.00',
  instagram: 'villatebingbuluh',
  qris_image_url: '',
  qris_merchant_name: 'Villa Tebing Buluh',
  qris_nmid: 'ID1024xxxxxxxxx',
  payment_deadline_hours: 2,
}

export const demoGallery = [
  { url: img('1582610116397-edb318620f90', 1600), alt: 'Taman Villa Tebing Buluh saat senja', group: 'Area Vila', tall: false },
  { url: img('1584132967334-10e028bd69f7', 1600), alt: 'Dek kayu dan kursi santai di area vila', group: 'Area Vila', tall: false },
  { url: img('1571003123894-1f0594d2b5d9', 1600), alt: 'Gazebo bambu dengan tirai putih saat langit ungu senja', group: 'Area Vila', tall: true },
  { url: img('1566073771259-6a8506099945', 1600), alt: 'Deretan kursi berjemur menghadap matahari terbenam', group: 'Area Vila', tall: false },
  { url: img('1552733407-5d5c46c3bb3b', 1600), alt: 'Sungai kecil di antara pohon kelapa dekat vila', group: 'Area Vila', tall: true },
  { url: img('1611892440504-42a792e24d32', 1600), alt: 'Interior kamar Cemerlang 1 dengan kayu jati hangat', group: 'Kamar', roomSlug: 'cemerlang-1', tall: false },
  { url: img('1582719478250-c89cae4dc85b', 1600), alt: 'Kamar Cemerlang 2 dengan jendela menghadap pepohonan', group: 'Kamar', roomSlug: 'cemerlang-2', tall: false },
  { url: img('1595576508898-0ad5c879a061', 1600), alt: 'Unit keluarga Serumpun dengan dua tempat tidur', group: 'Kamar', roomSlug: 'serumpun-family', tall: false },
  { url: img('1591088398332-8a7791972843', 1600), alt: 'Sudut duduk kamar Cemerlang 2', group: 'Kamar', roomSlug: 'cemerlang-2', tall: false },
  { url: img('1552321554-5fefe8c9ef14', 1600), alt: 'Kamar mandi bersih dengan tanaman gantung', group: 'Kamar', roomSlug: 'cemerlang-1', tall: true },
  { url: img('1512918728675-ed5a9ecdebfd', 1600), alt: 'Tempat tidur unit Serumpun dengan cahaya pagi', group: 'Kamar', roomSlug: 'serumpun-family', tall: false },
  { url: img('1555400038-63f5ba517a47', 1600), alt: 'Terasering sawah hijau tidak jauh dari vila', group: 'Sekitar Vila', tall: false },
  { url: img('1573790387438-4da905039392', 1600), alt: 'Tebing dan pantai berpasir putih di pesisir dekat vila', group: 'Sekitar Vila', tall: true },
  { url: img('1537996194471-e657df975ab4', 1600), alt: 'Pura di tepi danau berkabut pagi hari', group: 'Sekitar Vila', tall: true },
  { url: img('1559628233-100c798642d4', 1600), alt: 'Pemandangan udara sawah dan hutan kelapa saat matahari terbit', group: 'Sekitar Vila', tall: true },
  { url: img('1518548419970-58e3b4079ab2', 1600), alt: 'Pura di atas batu karang saat matahari terbenam', group: 'Sekitar Vila', tall: false },
]

export const heroImage = {
  url: '/img/hero/home-2000.webp',
  srcset: [640, 828, 1080, 1600, 2000].map((w) => `/img/hero/home-${w}.webp ${w}w`).join(', '),
  alt: 'Villa Tebing Buluh, teras kayu dikelilingi rumpun bambu dan tanaman tropis',
}
