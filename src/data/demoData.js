import { addDaysISO, todayISO } from '../lib/format';

const img = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const imgSrcset = (id, widths) =>
  widths.map((w) => `${img(id, w)} ${w}w`).join(', ');

const THUMB_WIDTHS = [480, 768, 1080, 1600, 2000];

const photo = (id, alt, extra = {}) => ({
  url: img(id, 1600),
  srcset: imgSrcset(id, THUMB_WIDTHS),
  alt,
  ...extra,
});

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
      photo(
        '1611892440504-42a792e24d32',
        'Kamar Cemerlang 1, tempat tidur king berbingkai kayu jati dengan pencahayaan hangat',
      ),
      photo(
        '1552321554-5fefe8c9ef14',
        'Kamar mandi dalam Cemerlang 1 yang bersih dengan tanaman hijau',
      ),
      photo(
        '1602002418082-a4443e081dd1',
        'Pemandangan teras pribadi dari dalam kamar Cemerlang 1',
      ),
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
      photo(
        '1582719478250-c89cae4dc85b',
        'Kamar Cemerlang 2, interior kayu dengan jendela lebar menghadap pepohonan',
      ),
      photo(
        '1591088398332-8a7791972843',
        'Sudut duduk kamar Cemerlang 2 dengan kursi dan bangku empuk',
      ),
      photo(
        '1566073771259-6a8506099945',
        'Kursi santai di dek kayu dekat kamar Cemerlang 2 saat matahari terbenam',
      ),
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
      photo(
        '1512918728675-ed5a9ecdebfd',
        'Tempat tidur utama unit Serumpun dengan cahaya pagi',
      ),
      photo(
        '1595576508898-0ad5c879a061',
        'Kamar Serumpun, dua tempat tidur besar untuk keluarga',
      ),
      photo(
        '1584132967334-10e028bd69f7',
        'Dek kayu bersama di depan unit Serumpun',
      ),
    ],
  },
];

const t = todayISO();
export const demoBookings = [
  {
    room_id: 'demo-cemerlang-1',
    check_in: addDaysISO(t, 3),
    check_out: addDaysISO(t, 6),
    status: 'confirmed',
  },
  {
    room_id: 'demo-cemerlang-1',
    check_in: addDaysISO(t, 14),
    check_out: addDaysISO(t, 18),
    status: 'pending',
  },
  {
    room_id: 'demo-cemerlang-1',
    check_in: addDaysISO(t, 32),
    check_out: addDaysISO(t, 39),
    status: 'confirmed',
  },
  {
    room_id: 'demo-cemerlang-2',
    check_in: addDaysISO(t, 2),
    check_out: addDaysISO(t, 3),
    status: 'confirmed',
  },
  {
    room_id: 'demo-cemerlang-2',
    check_in: addDaysISO(t, 11),
    check_out: addDaysISO(t, 13),
    status: 'confirmed',
  },
  {
    room_id: 'demo-serumpun',
    check_in: addDaysISO(t, 17),
    check_out: addDaysISO(t, 21),
    status: 'pending',
  },
  {
    room_id: 'demo-serumpun',
    check_in: addDaysISO(t, 25),
    check_out: addDaysISO(t, 27),
    status: 'confirmed',
  },
];

export const demoSettings = {
  whatsapp_number: '6281234567890',
  villa_name: 'Villa Tebing Buluh',
  address:
    'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282',
  check_in_time: '14.00',
  check_out_time: '12.00',
  instagram: 'villatebingbuluh_',
  qris_image_url: '',
  qris_merchant_name: 'Villa Tebing Buluh',
  qris_nmid: 'ID1024xxxxxxxxx',
  payment_deadline_hours: 2,
};

export const demoGallery = [
  photo('1582610116397-edb318620f90', 'Taman Villa Tebing Buluh saat senja', {
    group: 'Area Vila',
    tall: false,
  }),
  photo('1584132967334-10e028bd69f7', 'Dek kayu dan kursi santai di area vila', {
    group: 'Area Vila',
    tall: false,
  }),
  photo('1571003123894-1f0594d2b5d9', 'Gazebo bambu dengan tirai putih saat langit ungu senja', {
    group: 'Area Vila',
    tall: true,
  }),
  photo('1566073771259-6a8506099945', 'Deretan kursi berjemur menghadap matahari terbenam', {
    group: 'Area Vila',
    tall: false,
  }),
  photo('1552733407-5d5c46c3bb3b', 'Sungai kecil di antara pohon kelapa dekat vila', {
    group: 'Area Vila',
    tall: true,
  }),
  photo('1611892440504-42a792e24d32', 'Interior kamar Cemerlang 1 dengan kayu jati hangat', {
    group: 'Kamar',
    roomSlug: 'cemerlang-1',
    tall: false,
  }),
  photo('1582719478250-c89cae4dc85b', 'Kamar Cemerlang 2 dengan jendela menghadap pepohonan', {
    group: 'Kamar',
    roomSlug: 'cemerlang-2',
    tall: false,
  }),
  photo('1595576508898-0ad5c879a061', 'Unit keluarga Serumpun dengan dua tempat tidur', {
    group: 'Kamar',
    roomSlug: 'serumpun-family',
    tall: false,
  }),
  photo('1591088398332-8a7791972843', 'Sudut duduk kamar Cemerlang 2', {
    group: 'Kamar',
    roomSlug: 'cemerlang-2',
    tall: false,
  }),
  photo('1552321554-5fefe8c9ef14', 'Kamar mandi bersih dengan tanaman gantung', {
    group: 'Kamar',
    roomSlug: 'cemerlang-1',
    tall: true,
  }),
  photo('1512918728675-ed5a9ecdebfd', 'Tempat tidur unit Serumpun dengan cahaya pagi', {
    group: 'Kamar',
    roomSlug: 'serumpun-family',
    tall: false,
  }),
  photo('1555400038-63f5ba517a47', 'Terasering sawah hijau tidak jauh dari vila', {
    group: 'Sekitar Vila',
    tall: false,
  }),
  photo('1573790387438-4da905039392', 'Tebing dan pantai berpasir putih di pesisir dekat vila', {
    group: 'Sekitar Vila',
    tall: true,
  }),
  photo('1537996194471-e657df975ab4', 'Pura di tepi danau berkabut pagi hari', {
    group: 'Sekitar Vila',
    tall: true,
  }),
  photo('1559628233-100c798642d4', 'Pemandangan udara sawah dan hutan kelapa saat matahari terbit', {
    group: 'Sekitar Vila',
    tall: true,
  }),
  photo('1518548419970-58e3b4079ab2', 'Pura di atas batu karang saat matahari terbenam', {
    group: 'Sekitar Vila',
    tall: false,
  }),
];

export const heroImage = {
  url: img('1441974231531-c6227db76b6e', 1920),
  srcset: [640, 828, 1080, 1600, 1920].map((w) => `${img('1441974231531-c6227db76b6e', w)} ${w}w`).join(', '),
  alt: 'Villa Tebing Buluh, hutan bambu hijau lebat saat cahaya matahari menembus dedaunan',
};

export const heroImages = {
  gallery: {
    url: img('1555400038-63f5ba517a47', 1920),
    srcset: [640, 828, 1080, 1600, 1920].map((w) => `${img('1555400038-63f5ba517a47', w)} ${w}w`).join(', '),
    alt: 'Terasering hijau dan hutan tropis tidak jauh dari vila',
  },
  about: {
    url: img('1501854140801-50d01698950b', 1920),
    srcset: [640, 828, 1080, 1600, 1920].map((w) => `${img('1501854140801-50d01698950b', w)} ${w}w`).join(', '),
    alt: 'Tebing dan pegunungan hijau di pesisir dekat vila',
  },
  contact: {
    url: img('1507525428034-b723cf961d3e', 1920),
    srcset: [640, 828, 1080, 1600, 1920].map((w) => `${img('1507525428034-b723cf961d3e', w)} ${w}w`).join(', '),
    alt: 'Deretan kursi berjemur menghadap matahari terbenam di pantai',
  },
};
