<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit("Not found\n");
}

require __DIR__ . '/../lib/http.php';
require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/pricing.php';

const SEED_ADMIN_EMAIL = 'admin@villatebingbuluh.test';
const SEED_ADMIN_PASSWORD = 'admin12345';

$args = array_slice($argv, 1);
$fresh = in_array('--fresh', $args, true);
$confirmed = in_array('--yes', $args, true);

foreach ($args as $arg) {
    if (!in_array($arg, ['--fresh', '--yes'], true)) {
        fwrite(STDERR, "Opsi tidak dikenal: $arg\n");
        fwrite(STDERR, "Pemakaian: php api/tools/seed.php [--fresh --yes]\n");
        exit(1);
    }
}

if ($fresh && !$confirmed) {
    fwrite(STDERR, "--fresh menghapus SEMUA baris di bookings, promos, promo_rooms, rooms,\n");
    fwrite(STDERR, "room_images, dan gallery_images sebelum mengisi ulang.\n");
    fwrite(STDERR, "Tambahkan --yes kalau memang itu yang Anda mau.\n");
    exit(1);
}

function seed_id(string $key): string
{
    $h = md5('villatebingbuluh:' . $key);
    return sprintf(
        '%s-%s-4%s-8%s-%s',
        substr($h, 0, 8),
        substr($h, 8, 4),
        substr($h, 13, 3),
        substr($h, 17, 3),
        substr($h, 20, 12),
    );
}

function day(int $offset): string
{
    return (new DateTimeImmutable('today'))->modify(($offset >= 0 ? '+' : '') . $offset . ' days')->format('Y-m-d');
}

function stamp(int $offset): string
{
    return (new DateTimeImmutable('today'))->modify(($offset >= 0 ? '+' : '') . $offset . ' days')->format('Y-m-d H:i:s');
}

function unsplash(string $id, int $w = 1200): string
{
    return "https://images.unsplash.com/photo-$id?auto=format&fit=crop&w=$w&q=80";
}

function upsert(PDO $pdo, string $table, array $row): void
{
    $cols = array_keys($row);
    $updates = array_map(
        static fn(string $c): string => "`$c` = VALUES(`$c`)",
        array_slice($cols, 1),
    );
    $pdo->prepare(
        'INSERT INTO `' . $table . '` (`' . implode('`, `', $cols) . '`)'
        . ' VALUES (' . placeholders(count($cols)) . ')'
        . ' ON DUPLICATE KEY UPDATE ' . implode(', ', $updates),
    )->execute(array_values($row));
}

$rooms = [
    [
        'id' => seed_id('room:cemerlang-1'),
        'name' => 'Cemerlang 1',
        'slug' => 'cemerlang-1',
        'description' => 'Kamar di lantai satu dengan akses langsung ke teras menghadap pegunungan. Interior kayu jati yang hangat, tempat tidur king, dan kamar mandi dalam dengan air panas serta bathtub. Cocok untuk pasangan yang ingin bangun pagi ditemani udara sejuk gunung.',
        'price_per_night' => 850000,
        'min_nights' => 1,
        'max_guests' => 2,
        'size_sqm' => 28,
        'bed_count' => 1,
        'bed_type' => 'King',
        'amenities' => ['AC', 'Water Heater', 'Free WiFi', 'Teras Pribadi', 'Bathtub', 'Pemandangan Pegunungan'],
        'is_active' => 1,
        'images' => [
            unsplash('1611892440504-42a792e24d32'),
            unsplash('1552321554-5fefe8c9ef14'),
            unsplash('1602002418082-a4443e081dd1'),
        ],
    ],
    [
        'id' => seed_id('room:cemerlang-2'),
        'name' => 'Cemerlang 2',
        'slug' => 'cemerlang-2',
        'description' => 'Kamar di lantai dua dengan jendela lebar menghadap rumpun bambu dan lembah Pegunungan Meratus. Inilah kamar paling tenang di seluruh vila: yang terdengar hanya angin dan bambu bergesekan. Tempat tidur king, meja kerja kecil, dan balkon untuk kopi pagi.',
        'price_per_night' => 950000,
        'min_nights' => 1,
        'max_guests' => 2,
        'size_sqm' => 30,
        'bed_count' => 1,
        'bed_type' => 'King',
        'amenities' => ['AC', 'Water Heater', 'Free WiFi', 'Balkon View Pegunungan', 'Meja Kerja'],
        'is_active' => 1,
        'images' => [
            unsplash('1582719478250-c89cae4dc85b'),
            unsplash('1591088398332-8a7791972843'),
            unsplash('1566073771259-6a8506099945'),
        ],
    ],
    [
        'id' => seed_id('room:serumpun-family'),
        'name' => 'Serumpun (Family)',
        'slug' => 'serumpun-family',
        'description' => 'Unit keluarga dengan dua tempat tidur besar dan ruang duduk sendiri. Dapur kecil lengkap dengan peralatan masak, cocok untuk keluarga yang menginap beberapa malam. Kapasitas hingga 5 tamu.',
        'price_per_night' => 1400000,
        'min_nights' => 2,
        'max_guests' => 5,
        'size_sqm' => 46,
        'bed_count' => 2,
        'bed_type' => 'Queen',
        'amenities' => ['AC', 'Water Heater', 'Free WiFi', 'Dapur + Peralatan Lengkap', 'Ruang Duduk', 'Gazebo'],
        'is_active' => 1,
        'images' => [
            unsplash('1512918728675-ed5a9ecdebfd'),
            unsplash('1595576508898-0ad5c879a061'),
            unsplash('1584132967334-10e028bd69f7'),
        ],
    ],
    [
        'id' => seed_id('room:bambu-loft'),
        'name' => 'Bambu Loft',
        'slug' => 'bambu-loft',
        'description' => 'Loft bambu di sudut belakang vila, masih dalam tahap penataan ulang sebelum dibuka untuk tamu. Dipakai untuk mencoba tampilan kamar nonaktif di halaman admin.',
        'price_per_night' => 650000,
        'min_nights' => 1,
        'max_guests' => 3,
        'size_sqm' => 24,
        'bed_count' => 1,
        'bed_type' => 'Queen',
        'amenities' => ['Free WiFi', 'Teras Pribadi', 'Pemandangan Pegunungan'],
        'is_active' => 0,
        'images' => [
            unsplash('1522708323590-d24dbb6b0267'),
        ],
    ],
];

$promos = [
    [
        'id' => seed_id('promo:pembukaan'),
        'name' => 'Promo Pembukaan',
        'description' => 'Diskon 15% untuk semua kamar selama bulan pembukaan.',
        'discount_type' => 'percent',
        'discount_value' => 15,
        'start_date' => day(-3),
        'end_date' => day(27),
        'applies_to_all' => 1,
        'is_active' => 1,
        'room_ids' => [],
    ],
    [
        'id' => seed_id('promo:serumpun-hemat'),
        'name' => 'Serumpun Hemat',
        'description' => 'Potongan Rp300.000 per malam untuk unit keluarga Serumpun.',
        'discount_type' => 'nominal',
        'discount_value' => 300000,
        'start_date' => day(5),
        'end_date' => day(60),
        'applies_to_all' => 0,
        'is_active' => 1,
        'room_ids' => [seed_id('room:serumpun-family')],
    ],
    [
        'id' => seed_id('promo:libur-lalu'),
        'name' => 'Promo Libur Lalu',
        'description' => 'Promo lama yang sudah lewat, dipakai untuk menguji tampilan promo nonaktif.',
        'discount_type' => 'percent',
        'discount_value' => 20,
        'start_date' => day(-60),
        'end_date' => day(-30),
        'applies_to_all' => 1,
        'is_active' => 0,
        'room_ids' => [],
    ],
];

$bookings = [
    ['room' => 'room:cemerlang-1', 'name' => 'Rahmat Hidayat', 'phone' => '6281234500001', 'in' => 3, 'out' => 6, 'guests' => 2, 'status' => 'confirmed', 'notes' => 'Minta dijemput di pertigaan Loksado.', 'proof' => true],
    ['room' => 'room:cemerlang-1', 'name' => 'Dewi Anggraini', 'phone' => '6281234500002', 'in' => 14, 'out' => 18, 'guests' => 2, 'status' => 'pending', 'notes' => null, 'proof' => true],
    ['room' => 'room:cemerlang-1', 'name' => 'Bayu Saputra', 'phone' => '6281234500003', 'in' => 32, 'out' => 39, 'guests' => 2, 'status' => 'confirmed', 'notes' => 'Rencana ikut bamboo rafting hari kedua.', 'proof' => false],
    ['room' => 'room:cemerlang-2', 'name' => 'Siti Nurhaliza', 'phone' => '6281234500004', 'in' => 2, 'out' => 3, 'guests' => 1, 'status' => 'confirmed', 'notes' => null, 'proof' => false],
    ['room' => 'room:cemerlang-2', 'name' => 'Andi Pratama', 'phone' => '6281234500005', 'in' => 11, 'out' => 13, 'guests' => 2, 'status' => 'confirmed', 'notes' => null, 'proof' => true],
    ['room' => 'room:serumpun-family', 'name' => 'Keluarga Wijaya', 'phone' => '6281234500006', 'in' => 17, 'out' => 21, 'guests' => 5, 'status' => 'pending', 'notes' => 'Bawa dua anak kecil, minta kasur tambahan.', 'proof' => false],
    ['room' => 'room:serumpun-family', 'name' => 'Nurul Aini', 'phone' => '6281234500007', 'in' => 25, 'out' => 27, 'guests' => 4, 'status' => 'confirmed', 'notes' => null, 'proof' => false],
    ['room' => 'room:cemerlang-2', 'name' => 'Fajar Ramadhan', 'phone' => '6281234500008', 'in' => -1, 'out' => 2, 'guests' => 2, 'status' => 'checked_in', 'notes' => null, 'proof' => true],
    ['room' => 'room:cemerlang-1', 'name' => 'Hendra Gunawan', 'phone' => '6281234500009', 'in' => -20, 'out' => -18, 'guests' => 2, 'status' => 'completed', 'notes' => null, 'proof' => true],
    ['room' => 'room:serumpun-family', 'name' => 'Maya Sari', 'phone' => '6281234500010', 'in' => -12, 'out' => -9, 'guests' => 3, 'status' => 'cancelled', 'notes' => 'Batal karena cuaca.', 'proof' => false],
    ['room' => 'room:cemerlang-2', 'name' => 'Yoga Prasetyo', 'phone' => '6281234500011', 'in' => -7, 'out' => -5, 'guests' => 2, 'status' => 'no_show', 'notes' => null, 'proof' => false],
];

$gallery = [
    [unsplash('1582610116397-edb318620f90', 1600), 'Taman Villa Tebing Buluh saat senja'],
    [unsplash('1584132967334-10e028bd69f7', 1600), 'Dek kayu dan kursi santai di area vila'],
    [unsplash('1571003123894-1f0594d2b5d9', 1600), 'Gazebo bambu dengan tirai putih saat langit ungu senja'],
    [unsplash('1566073771259-6a8506099945', 1600), 'Deretan kursi berjemur menghadap matahari terbenam'],
    [unsplash('1552733407-5d5c46c3bb3b', 1600), 'Sungai Amandit di antara pepohonan dekat vila'],
    [unsplash('1611892440504-42a792e24d32', 1600), 'Interior kamar Cemerlang 1 dengan kayu jati hangat'],
    [unsplash('1582719478250-c89cae4dc85b', 1600), 'Kamar Cemerlang 2 dengan jendela menghadap pepohonan'],
    [unsplash('1595576508898-0ad5c879a061', 1600), 'Unit keluarga Serumpun dengan dua tempat tidur'],
    [unsplash('1591088398332-8a7791972843', 1600), 'Sudut duduk kamar Cemerlang 2'],
    [unsplash('1552321554-5fefe8c9ef14', 1600), 'Kamar mandi bersih dengan tanaman gantung'],
    [unsplash('1512918728675-ed5a9ecdebfd', 1600), 'Tempat tidur unit Serumpun dengan cahaya pagi'],
    [unsplash('1559628233-100c798642d4', 1600), 'Pemandangan udara hutan bambu Pegunungan Meratus'],
];

$settings = [
    'whatsapp_number' => '6281234567890',
    'villa_name' => 'Villa Tebing Buluh',
    'address' => 'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282',
    'check_in_time' => '14.00',
    'check_out_time' => '12.00',
    'instagram' => 'villatebingbuluh',
    'qris_image_url' => '',
    'qris_merchant_name' => 'Villa Tebing Buluh',
    'qris_nmid' => 'ID1024xxxxxxxxx',
    'payment_deadline_hours' => '2',
];

function write_demo_proof(string $filename): bool
{
    try {
        $dir = rtrim(config()['private_upload_dir'], '/\\') . DIRECTORY_SEPARATOR . 'payment-proofs';
    } catch (Throwable) {
        return false;
    }
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return false;
    }

    $path = $dir . DIRECTORY_SEPARATOR . $filename;
    if (is_file($path)) {
        return true;
    }

    if (function_exists('imagecreatetruecolor')) {
        $img = imagecreatetruecolor(600, 800);
        $bg = imagecolorallocate($img, 236, 240, 241);
        $ink = imagecolorallocate($img, 44, 62, 80);
        imagefilledrectangle($img, 0, 0, 600, 800, $bg);
        imagestring($img, 5, 40, 60, 'BUKTI TRANSFER (DEMO)', $ink);
        imagestring($img, 4, 40, 120, 'Villa Tebing Buluh', $ink);
        imagestring($img, 4, 40, 150, 'Data hasil seeder, bukan pembayaran nyata', $ink);
        $ok = imagepng($img, $path);
        imagedestroy($img);
        return $ok;
    }

    $png = base64_decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    );
    return file_put_contents($path, $png) !== false;
}

try {
    $counts = db_transaction(function (PDO $pdo) use (
        $fresh, $rooms, $promos, $bookings, $gallery, $settings
    ): array {
        if ($fresh) {
            foreach (['bookings', 'promo_rooms', 'promos', 'room_images', 'rooms', 'gallery_images'] as $table) {
                $pdo->exec("DELETE FROM `$table`");
            }
        }

        foreach ($settings as $key => $value) {
            upsert($pdo, 'settings', ['key' => $key, 'value' => $value]);
        }

        $imageStmt = $pdo->prepare(
            'INSERT INTO room_images (id, room_id, image_url, is_primary, sort_order) VALUES (?, ?, ?, ?, ?)',
        );
        $clearImages = $pdo->prepare('DELETE FROM room_images WHERE room_id = ?');

        foreach ($rooms as $index => $room) {
            upsert($pdo, 'rooms', [
                'id' => $room['id'],
                'name' => $room['name'],
                'slug' => $room['slug'],
                'description' => $room['description'],
                'price_per_night' => $room['price_per_night'],
                'min_nights' => $room['min_nights'],
                'max_guests' => $room['max_guests'],
                'size_sqm' => $room['size_sqm'],
                'bed_count' => $room['bed_count'],
                'bed_type' => $room['bed_type'],
                'amenities' => json_encode($room['amenities'], JSON_UNESCAPED_UNICODE),
                'is_active' => $room['is_active'],
                'created_at' => stamp(-90 + $index),
            ]);

            $clearImages->execute([$room['id']]);
            foreach (array_values($room['images']) as $i => $url) {
                $imageStmt->execute([
                    seed_id('room-image:' . $room['slug'] . ':' . $i),
                    $room['id'],
                    $url,
                    $i === 0 ? 1 : 0,
                    $i,
                ]);
            }
        }

        $clearPromoRooms = $pdo->prepare('DELETE FROM promo_rooms WHERE promo_id = ?');
        $promoRoomStmt = $pdo->prepare('INSERT INTO promo_rooms (promo_id, room_id) VALUES (?, ?)');

        foreach ($promos as $promo) {
            upsert($pdo, 'promos', [
                'id' => $promo['id'],
                'name' => $promo['name'],
                'description' => $promo['description'],
                'discount_type' => $promo['discount_type'],
                'discount_value' => $promo['discount_value'],
                'start_date' => $promo['start_date'],
                'end_date' => $promo['end_date'],
                'applies_to_all' => $promo['applies_to_all'],
                'is_active' => $promo['is_active'],
            ]);

            $clearPromoRooms->execute([$promo['id']]);
            foreach ($promo['room_ids'] as $roomId) {
                $promoRoomStmt->execute([$promo['id'], $roomId]);
            }
        }

        $clearGallery = $pdo->prepare('DELETE FROM gallery_images WHERE id = ?');
        foreach ($gallery as $i => [$url, $alt]) {
            $id = seed_id('gallery:' . $i);
            $clearGallery->execute([$id]);
            upsert($pdo, 'gallery_images', [
                'id' => $id,
                'image_url' => $url,
                'alt' => $alt,
                'sort_order' => $i,
            ]);
        }

        $roomsById = [];
        foreach ($rooms as $room) {
            $roomsById[$room['id']] = $room;
        }

        $proofs = 0;
        foreach ($bookings as $i => $booking) {
            $roomId = seed_id($booking['room']);
            $room = $roomsById[$roomId];
            $checkIn = day($booking['in']);
            $checkOut = day($booking['out']);

            $stay = compute_stay(
                ['id' => $roomId, 'price_per_night' => $room['price_per_night']],
                $checkIn,
                $checkOut,
                $promos,
            );

            $proof = null;
            if ($booking['proof']) {
                $proof = seed_id('proof:' . $i) . '.png';
                if (write_demo_proof($proof)) {
                    $proofs++;
                } else {
                    $proof = null;
                }
            }

            upsert($pdo, 'bookings', [
                'id' => seed_id('booking:' . $i),
                'room_id' => $roomId,
                'guest_name' => $booking['name'],
                'guest_phone' => $booking['phone'],
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'guest_count' => $booking['guests'],
                'status' => $booking['status'],
                'total_price' => $stay['total'],
                'notes' => $booking['notes'],
                'payment_proof_url' => $proof,
                'created_at' => stamp(min($booking['in'] - 4, -1)),
            ]);
        }

        return [
            'rooms' => count($rooms),
            'room_images' => array_sum(array_map(static fn(array $r): int => count($r['images']), $rooms)),
            'promos' => count($promos),
            'promo_rooms' => array_sum(array_map(static fn(array $p): int => count($p['room_ids']), $promos)),
            'gallery_images' => count($gallery),
            'bookings' => count($bookings),
            'settings' => count($settings),
            'payment_proofs' => $proofs,
        ];
    });

    $admin = db_query_one('SELECT id FROM admin_users WHERE email = ?', [SEED_ADMIN_EMAIL]);
    if ($admin === null) {
        db_execute(
            'INSERT INTO admin_users (id, email, password_hash) VALUES (?, ?, ?)',
            [uuid_v4(), SEED_ADMIN_EMAIL, password_hash(SEED_ADMIN_PASSWORD, PASSWORD_BCRYPT)],
        );
        $counts['admin_users'] = 1;
    } else {
        $counts['admin_users'] = 0;
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Seeder gagal: ' . $e->getMessage() . "\n");
    exit(1);
}

echo ($fresh ? "Seeder selesai (mode --fresh).\n" : "Seeder selesai.\n");
foreach ($counts as $table => $n) {
    printf("  %-16s %d\n", $table, $n);
}

if ($counts['admin_users'] === 1) {
    echo "\nAkun admin contoh dibuat: " . SEED_ADMIN_EMAIL . ' / ' . SEED_ADMIN_PASSWORD . "\n";
    echo "Ganti passwordnya lewat npm run create-admin sebelum dipakai di produksi.\n";
} else {
    echo "\nAkun " . SEED_ADMIN_EMAIL . " sudah ada, passwordnya tidak diubah.\n";
}

$bookingCodes = array_map(
    static fn(int $i): string => substr(seed_id('booking:' . $i), 0, 8),
    [0, 1],
);
echo 'Kode cek booking contoh: ' . implode(' / ', $bookingCodes)
    . " (nomor 6281234500001 dan 6281234500002)\n";
