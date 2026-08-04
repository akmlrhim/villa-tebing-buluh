<?php

declare(strict_types=1);

function attach_promo_rooms(array $promos): array
{
    if (count($promos) === 0) {
        return [];
    }
    $ids = array_column($promos, 'id');
    $links = db_query(
        'SELECT promo_id, room_id FROM promo_rooms
          WHERE promo_id IN (' . placeholders(count($ids)) . ')',
        $ids,
    );

    $byPromo = [];
    foreach ($links as $link) {
        $byPromo[$link['promo_id']][] = $link['room_id'];
    }

    return array_map(static function (array $promo) use ($byPromo): array {
        $promo['is_active'] = to_bool($promo['is_active']);
        $promo['applies_to_all'] = to_bool($promo['applies_to_all']);
        $promo['discount_value'] = to_float($promo['discount_value']);
        $promo['room_ids'] = $byPromo[$promo['id']] ?? [];
        if (array_key_exists('created_at', $promo)) {
            $promo['created_at'] = iso_timestamp($promo['created_at']);
        }
        return $promo;
    }, $promos);
}

function route_promos_active(): never
{
    $promos = db_query(
        'SELECT id, name, description, discount_type, discount_value,
                start_date, end_date, applies_to_all, is_active
           FROM promos
          WHERE is_active = 1 AND end_date >= ?
          ORDER BY start_date ASC',
        [today_iso()],
    );
    json_out(attach_promo_rooms($promos));
}

function route_promos_list(): never
{
    require_auth();
    $promos = db_query('SELECT * FROM promos ORDER BY start_date DESC, created_at DESC');
    json_out(attach_promo_rooms($promos));
}

function promo_fields(array $body): array
{
    $name = trim((string) ($body['name'] ?? ''));
    $discountType = (string) ($body['discount_type'] ?? '');
    $discountValue = filter_var($body['discount_value'] ?? null, FILTER_VALIDATE_FLOAT);
    $startDate = (string) ($body['start_date'] ?? '');
    $endDate = (string) ($body['end_date'] ?? '');
    $appliesToAll = ($body['applies_to_all'] ?? true) !== false;
    $description = trim((string) ($body['description'] ?? ''));

    if ($name === '') {
        throw bad_request('Nama promo wajib diisi.', 'INVALID_NAME');
    }
    if (mb_strlen($name) > 150) {
        throw bad_request('Nama promo maksimal 150 karakter.', 'INVALID_NAME');
    }
    if (!in_array($discountType, PROMO_TYPES, true)) {
        throw bad_request('Tipe diskon tidak dikenal.', 'INVALID_DISCOUNT_TYPE');
    }
    if ($discountValue === false || $discountValue <= 0) {
        throw bad_request('Nilai diskon wajib diisi.', 'INVALID_DISCOUNT_VALUE');
    }
    if ($discountType === 'percent' && $discountValue >= 100) {
        throw bad_request('Diskon persen harus di bawah 100%.', 'INVALID_DISCOUNT_VALUE');
    }
    if ($discountType === 'nominal' && $discountValue != floor($discountValue)) {
        throw bad_request('Potongan rupiah harus bilangan bulat.', 'INVALID_DISCOUNT_VALUE');
    }
    if (!preg_match(ISO_DATE_RE, $startDate) || !preg_match(ISO_DATE_RE, $endDate)) {
        throw bad_request('Tanggal promo tidak valid.', 'INVALID_DATES');
    }
    if ($endDate < $startDate) {
        throw bad_request('Tanggal berakhir tidak boleh sebelum tanggal mulai.', 'INVALID_DATE_RANGE');
    }

    return [
        'name' => $name,
        'description' => $description === '' ? null : $description,
        'discount_type' => $discountType,
        'discount_value' => $discountValue,
        'start_date' => $startDate,
        'end_date' => $endDate,
        'applies_to_all' => $appliesToAll ? 1 : 0,
        'is_active' => ($body['is_active'] ?? true) === false ? 0 : 1,
    ];
}

function promo_selected_rooms(array $body, bool $appliesToAll): array
{
    if ($appliesToAll) {
        return [];
    }
    $ids = is_array($body['room_ids'] ?? null) ? array_map('strval', $body['room_ids']) : [];
    if (count($ids) === 0) {
        throw bad_request('Pilih minimal satu kamar untuk promo ini.', 'NO_ROOMS_SELECTED');
    }
    return array_values(array_unique($ids));
}

function write_promo_rooms(PDO $pdo, string $promoId, array $roomIds): void
{
    $pdo->prepare('DELETE FROM promo_rooms WHERE promo_id = ?')->execute([$promoId]);
    $stmt = $pdo->prepare('INSERT INTO promo_rooms (promo_id, room_id) VALUES (?, ?)');
    foreach ($roomIds as $roomId) {
        $stmt->execute([$promoId, $roomId]);
    }
}

function translate_promo_fk_error(PDOException $e): Throwable
{
    if (($e->errorInfo[1] ?? 0) === 1452) {
        return bad_request(
            'Ada kamar terpilih yang sudah tidak tersedia. Muat ulang halaman lalu pilih ulang kamarnya.',
            'ROOM_NOT_FOUND',
        );
    }
    return $e;
}

function route_promos_create(): never
{
    require_auth();
    $body = request_body();
    $fields = promo_fields($body);
    $roomIds = promo_selected_rooms($body, $fields['applies_to_all'] === 1);
    $id = uuid_v4();
    $cols = array_keys($fields);

    try {
        db_transaction(function (PDO $pdo) use ($id, $cols, $fields, $roomIds): void {
            $pdo->prepare(
                'INSERT INTO promos (id, ' . implode(', ', $cols) . ')
                 VALUES (?, ' . placeholders(count($cols)) . ')',
            )->execute([$id, ...array_values($fields)]);
            write_promo_rooms($pdo, $id, $roomIds);
        });
    } catch (PDOException $e) {
        throw translate_promo_fk_error($e);
    }

    json_out(['id' => $id], 201);
}

function route_promos_update(string $id): never
{
    require_auth();
    $body = request_body();
    $fields = promo_fields($body);
    $roomIds = promo_selected_rooms($body, $fields['applies_to_all'] === 1);
    $cols = array_keys($fields);

    try {
        db_transaction(function (PDO $pdo) use ($id, $cols, $fields, $roomIds): void {
            $set = implode(', ', array_map(static fn(string $c): string => "$c = ?", $cols));
            $stmt = $pdo->prepare("UPDATE promos SET $set WHERE id = ?");
            $stmt->execute([...array_values($fields), $id]);
            if ($stmt->rowCount() === 0) {
                $exists = $pdo->prepare('SELECT 1 FROM promos WHERE id = ?');
                $exists->execute([$id]);
                if ($exists->fetchColumn() === false) {
                    throw not_found('Promo tidak ditemukan.');
                }
            }
            write_promo_rooms($pdo, $id, $roomIds);
        });
    } catch (PDOException $e) {
        throw translate_promo_fk_error($e);
    }

    json_out(['id' => $id]);
}

function route_promos_toggle_active(string $id): never
{
    require_auth();
    $isActive = !empty(request_body()['is_active']) ? 1 : 0;
    $affected = db_execute('UPDATE promos SET is_active = ? WHERE id = ?', [$isActive, $id]);
    if ($affected === 0 && db_query_one('SELECT 1 AS x FROM promos WHERE id = ?', [$id]) === null) {
        throw not_found('Promo tidak ditemukan.');
    }
    json_out(['id' => $id, 'is_active' => (bool) $isActive]);
}

function route_promos_delete(string $id): never
{
    require_auth();
    assert_affected(db_execute('DELETE FROM promos WHERE id = ?', [$id]), 'Promo tidak ditemukan.');
    json_out(['deleted' => 1]);
}

function route_promos_bulk_delete(): never
{
    require_auth();
    $ids = require_id_list(request_body()['ids'] ?? null);
    $affected = db_execute(
        'DELETE FROM promos WHERE id IN (' . placeholders(count($ids)) . ')',
        $ids,
    );
    assert_affected($affected, 'Promo tidak ditemukan.');
    json_out(['deleted' => $affected]);
}
