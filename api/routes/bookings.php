<?php

declare(strict_types=1);

const BLOCKING_STATUS = ['pending', 'confirmed', 'checked_in'];
const ALL_STATUS = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];

const ISO_DATE_RE = '/^\d{4}-\d{2}-\d{2}$/';

function normalize_booking(array $row): array
{
    $row['rooms'] = isset($row['room_name'])
        ? ['name' => $row['room_name'], 'slug' => $row['room_slug']]
        : null;
    unset($row['room_name'], $row['room_slug']);

    $row['total_price'] = to_float($row['total_price'] ?? null);
    $row['created_at'] = iso_timestamp($row['created_at'] ?? null);
    return $row;
}

function load_promos_for_stay(PDO $pdo, string $roomId, string $checkIn, string $checkOut): array
{
    $stmt = $pdo->prepare(
        'SELECT id, name, discount_type, discount_value, start_date, end_date,
                applies_to_all, is_active
           FROM promos
          WHERE is_active = 1
            AND start_date < ?
            AND end_date >= ?
            AND (applies_to_all = 1
                 OR EXISTS (SELECT 1 FROM promo_rooms pr
                             WHERE pr.promo_id = promos.id AND pr.room_id = ?))',
    );
    $stmt->execute([$checkOut, $checkIn, $roomId]);

    return array_map(static function (array $row) use ($roomId): array {
        $row['is_active'] = to_bool($row['is_active']);
        $row['applies_to_all'] = to_bool($row['applies_to_all']);
        $row['discount_value'] = to_float($row['discount_value']);
        $row['room_ids'] = [$roomId];
        return $row;
    }, $stmt->fetchAll());
}

function route_bookings_availability(): never
{
    json_out(db_query(
        'SELECT room_id, check_in, check_out, status
           FROM bookings
          WHERE status IN (' . placeholders(count(BLOCKING_STATUS)) . ')',
        BLOCKING_STATUS,
    ));
}

function route_bookings_public_create(): never
{
    $b = request_body();
    $roomId = (string) ($b['room_id'] ?? '');
    $guestName = trim((string) ($b['guest_name'] ?? ''));
    $guestPhone = (string) ($b['guest_phone'] ?? '');
    $checkIn = (string) ($b['check_in'] ?? '');
    $checkOut = (string) ($b['check_out'] ?? '');
    $notes = trim((string) ($b['notes'] ?? ''));
    $proof = (string) ($b['payment_proof_path'] ?? '');

    $room = db_query_one('SELECT * FROM rooms WHERE id = ? AND is_active = 1', [$roomId]);
    if ($room === null) {
        throw not_found('Kamar tidak ditemukan atau sedang tidak tersedia.');
    }
    $room['price_per_night'] = to_float($room['price_per_night']);

    if (!preg_match(ISO_DATE_RE, $checkIn) || !preg_match(ISO_DATE_RE, $checkOut)) {
        throw bad_request('Tanggal tidak valid.', 'INVALID_DATES');
    }
    if ($checkIn < today_iso()) {
        throw bad_request('Tanggal check-in sudah lewat.', 'CHECKIN_IN_PAST');
    }
    if ($checkOut <= $checkIn) {
        throw bad_request('Tanggal check-out harus setelah check-in.', 'INVALID_DATE_RANGE');
    }

    $maxDate = (new DateTimeImmutable('now'))->modify('+1 year')->format('Y-m-d');
    if ($checkOut > $maxDate) {
        throw bad_request('Tanggal terlalu jauh ke depan (maksimal 1 tahun).', 'DATE_TOO_FAR');
    }

    $nights = nights_between($checkIn, $checkOut);
    $guestCount = filter_var($b['guest_count'] ?? null, FILTER_VALIDATE_INT);

    if ($guestCount === false || $guestCount < 1 || $guestCount > (int) $room['max_guests']) {
        throw bad_request(
            "Jumlah tamu harus antara 1 dan {$room['max_guests']}.",
            'INVALID_GUEST_COUNT',
        );
    }
    if ($nights < (int) $room['min_nights']) {
        throw bad_request(
            "Menginap minimal {$room['min_nights']} malam di kamar ini.",
            'BELOW_MIN_NIGHTS',
        );
    }
    $nameLen = mb_strlen($guestName);
    if ($nameLen < 3 || $nameLen > 100) {
        throw bad_request('Nama tamu harus 3-100 karakter.', 'INVALID_NAME');
    }
    if (!preg_match('/^62\d{8,13}$/', $guestPhone)) {
        throw bad_request('Nomor WhatsApp tidak valid.', 'INVALID_PHONE');
    }
    if ($notes !== '' && mb_strlen($notes) > 500) {
        throw bad_request('Catatan maksimal 500 karakter.', 'NOTES_TOO_LONG');
    }
    if (!preg_match('/^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$/', $proof)) {
        throw bad_request('Bukti pembayaran wajib diunggah.', 'INVALID_PROOF');
    }

    $id = uuid_v4();

    db_transaction(function (PDO $pdo) use (
        $id, $room, $roomId, $guestName, $guestPhone, $checkIn, $checkOut, $guestCount, $notes, $proof
    ): void {
        $taken = $pdo->prepare(
            'SELECT id FROM bookings
              WHERE room_id = ?
                AND status IN (' . placeholders(count(BLOCKING_STATUS)) . ')
                AND check_in < ? AND check_out > ?
              FOR UPDATE',
        );
        $taken->execute([$roomId, ...BLOCKING_STATUS, $checkOut, $checkIn]);
        if ($taken->fetch() !== false) {
            throw conflict('Tanggal tersebut sudah dipesan orang lain.', 'DATE_TAKEN');
        }

        $dupe = $pdo->prepare(
            "SELECT id FROM bookings
              WHERE room_id = ? AND guest_phone = ? AND check_in = ? AND status = 'pending'
              FOR UPDATE",
        );
        $dupe->execute([$roomId, $guestPhone, $checkIn]);
        if ($dupe->fetch() !== false) {
            throw conflict(
                'Sudah ada pesanan menunggu konfirmasi dengan nomor dan tanggal yang sama.',
                'DUPLICATE_PENDING',
            );
        }

        $promos = load_promos_for_stay($pdo, $roomId, $checkIn, $checkOut);
        $stay = compute_stay($room, $checkIn, $checkOut, $promos);

        $pdo->prepare(
            "INSERT INTO bookings
               (id, room_id, guest_name, guest_phone, check_in, check_out,
                guest_count, status, total_price, notes, payment_proof_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)",
        )->execute([
            $id, $roomId, $guestName, $guestPhone, $checkIn, $checkOut,
            $guestCount, $stay['total'], $notes === '' ? null : $notes, $proof,
        ]);
    });

    json_out(['id' => $id], 201);
}

function route_bookings_status(): never
{
    $body = request_body();
    $code = strtolower(trim((string) ($body['code'] ?? '')));
    $phone = (string) ($body['phone'] ?? '');

    if (!preg_match('/^[0-9a-f]{8}$/', $code) || !preg_match('/^62\d{8,13}$/', $phone)) {
        json_out(['found' => false]);
    }

    $row = db_query_one(
        "SELECT b.id, b.guest_name, b.status, r.name AS room_name,
                b.check_in, b.check_out, b.guest_count, b.total_price,
                b.notes, b.created_at,
                (b.payment_proof_url IS NOT NULL) AS has_proof
           FROM bookings b
           JOIN rooms r ON r.id = b.room_id
          WHERE LOWER(b.id) LIKE CONCAT(?, '-%') AND b.guest_phone = ?
          LIMIT 1",
        [$code, $phone],
    );

    if ($row === null) {
        json_out(['found' => false]);
    }

    $row['has_proof'] = to_bool($row['has_proof']);
    $row['total_price'] = to_float($row['total_price']);
    $row['created_at'] = iso_timestamp($row['created_at']);
    json_out(['found' => true, 'booking' => $row]);
}

function route_bookings_list(): never
{
    require_auth();
    $rows = db_query(
        'SELECT b.*, r.name AS room_name, r.slug AS room_slug
           FROM bookings b
           LEFT JOIN rooms r ON r.id = b.room_id
          ORDER BY b.check_in DESC',
    );
    json_out(array_map('normalize_booking', $rows));
}

function route_bookings_get(string $id): never
{
    require_auth();
    $row = db_query_one(
        'SELECT b.*, r.name AS room_name, r.slug AS room_slug
           FROM bookings b
           LEFT JOIN rooms r ON r.id = b.room_id
          WHERE b.id = ?',
        [$id],
    );
    if ($row === null) {
        throw not_found('Booking tidak ditemukan.');
    }
    json_out(normalize_booking($row));
}

function route_bookings_proof_url(string $id): never
{
    require_auth();
    $row = db_query_one('SELECT payment_proof_url FROM bookings WHERE id = ?', [$id]);
    if ($row === null) {
        throw not_found('Booking tidak ditemukan.');
    }
    if (empty($row['payment_proof_url'])) {
        json_out(['url' => '']);
    }
    json_out(['url' => sign_proof_url($row['payment_proof_url'])]);
}

function booking_fields(array $body): array
{
    $roomId = (string) ($body['room_id'] ?? '');
    $guestName = trim((string) ($body['guest_name'] ?? ''));
    $guestPhone = trim((string) ($body['guest_phone'] ?? ''));
    $checkIn = (string) ($body['check_in'] ?? '');
    $checkOut = (string) ($body['check_out'] ?? '');
    $status = (string) ($body['status'] ?? 'pending');
    $notes = trim((string) ($body['notes'] ?? ''));

    if ($roomId === '' || $guestName === '' || $guestPhone === '') {
        throw bad_request('Kamar, nama tamu, dan nomor WA wajib diisi.', 'MISSING_FIELDS');
    }
    if (!preg_match(ISO_DATE_RE, $checkIn) || !preg_match(ISO_DATE_RE, $checkOut)) {
        throw bad_request('Tanggal tidak valid.', 'INVALID_DATES');
    }
    if ($checkOut <= $checkIn) {
        throw bad_request('Tanggal check-out harus setelah check-in.', 'INVALID_DATE_RANGE');
    }
    if (!in_array($status, ALL_STATUS, true)) {
        throw bad_request('Status booking tidak dikenal.', 'INVALID_STATUS');
    }

    return [
        'room_id' => $roomId,
        'guest_name' => $guestName,
        'guest_phone' => $guestPhone,
        'check_in' => $checkIn,
        'check_out' => $checkOut,
        'guest_count' => max(1, (int) ($body['guest_count'] ?? 1)),
        'status' => $status,
        'total_price' => empty($body['total_price']) ? null : (float) $body['total_price'],
        'notes' => $notes === '' ? null : $notes,
    ];
}

function find_booking_conflict(PDO $pdo, array $f, ?string $ignoreId): ?array
{
    $stmt = $pdo->prepare(
        'SELECT id, guest_name FROM bookings
          WHERE room_id = ?
            AND status IN (' . placeholders(count(BLOCKING_STATUS)) . ')
            AND check_in < ? AND check_out > ?
            AND (? IS NULL OR id <> ?)
          LIMIT 1
          FOR UPDATE',
    );
    $stmt->execute([
        $f['room_id'], ...BLOCKING_STATUS, $f['check_out'], $f['check_in'], $ignoreId, $ignoreId,
    ]);
    $row = $stmt->fetch();
    return $row === false ? null : $row;
}

function assert_no_conflict(PDO $pdo, array $fields, ?string $ignoreId): void
{
    if (!in_array($fields['status'], BLOCKING_STATUS, true)) {
        return;
    }
    $c = find_booking_conflict($pdo, $fields, $ignoreId);
    if ($c !== null) {
        $who = $c['guest_name'] ?? 'tamu';
        throw conflict("Tanggal bentrok dengan booking lain ($who) di kamar ini.", 'DATE_TAKEN');
    }
}

function route_bookings_create(): never
{
    require_auth();
    $fields = booking_fields(request_body());
    $id = uuid_v4();
    $cols = array_keys($fields);

    db_transaction(function (PDO $pdo) use ($id, $cols, $fields): void {
        assert_no_conflict($pdo, $fields, null);
        $pdo->prepare(
            'INSERT INTO bookings (id, ' . implode(', ', $cols) . ')
             VALUES (?, ' . placeholders(count($cols)) . ')',
        )->execute([$id, ...array_values($fields)]);
    });

    json_out(['id' => $id], 201);
}

function route_bookings_update(string $id): never
{
    require_auth();
    $fields = booking_fields(request_body());
    $cols = array_keys($fields);

    db_transaction(function (PDO $pdo) use ($id, $cols, $fields): void {
        assert_no_conflict($pdo, $fields, $id);
        $set = implode(', ', array_map(static fn(string $c): string => "$c = ?", $cols));
        $stmt = $pdo->prepare("UPDATE bookings SET $set WHERE id = ?");
        $stmt->execute([...array_values($fields), $id]);
        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT 1 FROM bookings WHERE id = ?');
            $exists->execute([$id]);
            if ($exists->fetchColumn() === false) {
                throw not_found('Booking tidak ditemukan.');
            }
        }
    });

    json_out(['id' => $id]);
}

function route_bookings_update_status(string $id): never
{
    require_auth();
    $status = (string) (request_body()['status'] ?? '');
    if (!in_array($status, ALL_STATUS, true)) {
        throw bad_request('Status booking tidak dikenal.', 'INVALID_STATUS');
    }
    $affected = db_execute('UPDATE bookings SET status = ? WHERE id = ?', [$status, $id]);
    if ($affected === 0 && db_query_one('SELECT 1 AS x FROM bookings WHERE id = ?', [$id]) === null) {
        throw not_found('Booking tidak ditemukan.');
    }
    json_out(['id' => $id, 'status' => $status]);
}

function route_bookings_delete(string $id): never
{
    require_auth();
    $row = db_query_one('SELECT payment_proof_url FROM bookings WHERE id = ?', [$id]);
    assert_affected(
        db_execute('DELETE FROM bookings WHERE id = ?', [$id]),
        'Booking tidak ditemukan.',
    );
    delete_upload_refs(
        collect_upload_refs([$row['payment_proof_url'] ?? null], 'payment-proofs'),
    );
    json_out(['deleted' => 1]);
}

function route_bookings_bulk_delete(): never
{
    require_auth();
    $ids = require_id_list(request_body()['ids'] ?? null);
    $proofs = array_column(
        db_query(
            'SELECT payment_proof_url FROM bookings WHERE id IN (' . placeholders(count($ids)) . ')',
            $ids,
        ),
        'payment_proof_url',
    );
    $affected = db_execute(
        'DELETE FROM bookings WHERE id IN (' . placeholders(count($ids)) . ')',
        $ids,
    );
    assert_affected($affected, 'Booking tidak ditemukan.');
    delete_upload_refs(collect_upload_refs($proofs, 'payment-proofs'));
    json_out(['deleted' => $affected]);
}
