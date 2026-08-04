<?php

declare(strict_types=1);

function attach_room_images(array $rooms, bool $includeId = false): array
{
    if (count($rooms) === 0) {
        return [];
    }
    $ids = array_column($rooms, 'id');
    $images = db_query(
        'SELECT id, room_id, image_url, is_primary, sort_order
           FROM room_images
          WHERE room_id IN (' . placeholders(count($ids)) . ')
          ORDER BY is_primary DESC, sort_order ASC',
        $ids,
    );

    $byRoom = [];
    foreach ($images as $img) {
        $byRoom[$img['room_id']][] = $img;
    }

    $out = [];
    foreach ($rooms as $room) {
        $room['is_active'] = to_bool($room['is_active']);
        $room['price_per_night'] = to_float($room['price_per_night']);
        $decoded = $room['amenities'] === null ? null : json_decode($room['amenities'], true);
        $room['amenities'] = is_array($decoded) ? $decoded : [];

        $room['images'] = array_map(
            function (array $img) use ($room, $includeId): array {
                $entry = [
                    'url' => $img['image_url'],
                    'alt' => 'Foto kamar ' . $room['name'],
                    'is_primary' => to_bool($img['is_primary']),
                ];
                return $includeId ? ['id' => $img['id']] + $entry : $entry;
            },
            $byRoom[$room['id']] ?? [],
        );

        if (array_key_exists('created_at', $room)) {
            $room['created_at'] = iso_timestamp($room['created_at']);
        }
        $out[] = $room;
    }
    return $out;
}

function route_rooms_list(): never
{
    $rooms = db_query('SELECT * FROM rooms WHERE is_active = 1 ORDER BY price_per_night ASC');
    json_out(attach_room_images($rooms));
}

function route_rooms_admin_list(): never
{
    require_auth();
    $rooms = db_query('SELECT * FROM rooms ORDER BY created_at ASC');
    json_out(attach_room_images($rooms, true));
}

function room_fields(array $body): array
{
    $name = trim((string) ($body['name'] ?? ''));
    $slug = trim((string) ($body['slug'] ?? ''));
    $price = filter_var($body['price_per_night'] ?? null, FILTER_VALIDATE_FLOAT);

    if ($name === '') {
        throw bad_request('Nama kamar wajib diisi.', 'INVALID_NAME');
    }
    if ($slug === '') {
        throw bad_request('Slug kamar wajib diisi.', 'INVALID_SLUG');
    }
    if ($price === false || $price <= 0) {
        throw bad_request('Harga per malam wajib diisi.', 'INVALID_PRICE');
    }

    $description = trim((string) ($body['description'] ?? ''));
    $bedType = trim((string) ($body['bed_type'] ?? ''));
    $sizeSqm = $body['size_sqm'] ?? null;

    return [
        'name' => $name,
        'slug' => $slug,
        'description' => $description === '' ? null : $description,
        'price_per_night' => $price,
        'min_nights' => max(1, (int) ($body['min_nights'] ?? 1)),
        'max_guests' => max(1, (int) ($body['max_guests'] ?? 1)),
        'size_sqm' => ($sizeSqm === null || $sizeSqm === '') ? null : (int) $sizeSqm,
        'bed_count' => max(1, (int) ($body['bed_count'] ?? 1)),
        'bed_type' => $bedType === '' ? null : $bedType,
        'amenities' => json_encode(
            is_array($body['amenities'] ?? null) ? array_values($body['amenities']) : [],
            JSON_UNESCAPED_UNICODE,
        ),
        'is_active' => ($body['is_active'] ?? true) === false ? 0 : 1,
    ];
}

function write_room_images(PDO $pdo, string $roomId, mixed $images): void
{
    $pdo->prepare('DELETE FROM room_images WHERE room_id = ?')->execute([$roomId]);
    $list = is_array($images) ? array_values($images) : [];
    $stmt = $pdo->prepare(
        'INSERT INTO room_images (id, room_id, image_url, is_primary, sort_order)
         VALUES (?, ?, ?, ?, ?)',
    );
    foreach ($list as $i => $img) {
        $isPrimary = array_key_exists('is_primary', $img) ? $img['is_primary'] : ($i === 0);
        $stmt->execute([uuid_v4(), $roomId, (string) $img['url'], $isPrimary ? 1 : 0, $i]);
    }
}

function route_rooms_create(): never
{
    require_auth();
    $body = request_body();
    $fields = room_fields($body);
    $id = uuid_v4();
    $cols = array_keys($fields);

    db_transaction(function (PDO $pdo) use ($id, $cols, $fields, $body): void {
        $pdo->prepare(
            'INSERT INTO rooms (id, ' . implode(', ', $cols) . ')
             VALUES (?, ' . placeholders(count($cols)) . ')',
        )->execute([$id, ...array_values($fields)]);
        write_room_images($pdo, $id, $body['images'] ?? null);
    });

    json_out(['id' => $id], 201);
}

function route_rooms_update(string $id): never
{
    require_auth();
    $body = request_body();
    $fields = room_fields($body);
    $cols = array_keys($fields);

    db_transaction(function (PDO $pdo) use ($id, $cols, $fields, $body): void {
        $set = implode(', ', array_map(static fn(string $c): string => "$c = ?", $cols));
        $stmt = $pdo->prepare("UPDATE rooms SET $set WHERE id = ?");
        $stmt->execute([...array_values($fields), $id]);
        if ($stmt->rowCount() === 0) {
            $exists = $pdo->prepare('SELECT 1 FROM rooms WHERE id = ?');
            $exists->execute([$id]);
            if ($exists->fetchColumn() === false) {
                throw not_found('Kamar tidak ditemukan.');
            }
        }
        write_room_images($pdo, $id, $body['images'] ?? null);
    });

    json_out(['id' => $id]);
}

function route_rooms_toggle_active(string $id): never
{
    require_auth();
    $isActive = !empty(request_body()['is_active']) ? 1 : 0;
    $affected = db_execute('UPDATE rooms SET is_active = ? WHERE id = ?', [$isActive, $id]);
    if ($affected === 0 && db_query_one('SELECT 1 AS x FROM rooms WHERE id = ?', [$id]) === null) {
        throw not_found('Kamar tidak ditemukan.');
    }
    json_out(['id' => $id, 'is_active' => (bool) $isActive]);
}

function translate_room_fk_error(PDOException $e): Throwable
{
    if (($e->errorInfo[1] ?? 0) === 1451) {
        return bad_request(
            'Kamar ini masih punya riwayat booking, jadi tidak bisa dihapus. Nonaktifkan saja supaya tidak muncul di situs.',
            'ROOM_HAS_BOOKINGS',
        );
    }
    return $e;
}

function route_rooms_delete(string $id): never
{
    require_auth();
    try {
        assert_affected(db_execute('DELETE FROM rooms WHERE id = ?', [$id]), 'Kamar tidak ditemukan.');
    } catch (PDOException $e) {
        throw translate_room_fk_error($e);
    }
    json_out(['deleted' => 1]);
}

function route_rooms_bulk_delete(): never
{
    require_auth();
    $ids = require_id_list(request_body()['ids'] ?? null);
    try {
        $affected = db_execute(
            'DELETE FROM rooms WHERE id IN (' . placeholders(count($ids)) . ')',
            $ids,
        );
    } catch (PDOException $e) {
        throw translate_room_fk_error($e);
    }
    assert_affected($affected, 'Kamar tidak ditemukan.');
    json_out(['deleted' => $affected]);
}
