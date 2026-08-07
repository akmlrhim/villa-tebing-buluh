<?php

declare(strict_types=1);

const ALLOWED_SETTING_KEYS = [
    'whatsapp_number',
    'villa_name',
    'address',
    'check_in_time',
    'check_out_time',
    'instagram',
    'qris_image_url',
    'qris_merchant_name',
    'qris_nmid',
    'payment_deadline_hours',
];

function route_settings_list(): never
{
    $rows = db_query('SELECT `key`, `value` FROM settings');
    $out = [];
    foreach ($rows as $row) {
        $out[$row['key']] = $row['value'];
    }
    json_out((object) $out);
}

function route_settings_save(): never
{
    require_auth();
    $patch = request_body();

    if (count($patch) === 0) {
        throw bad_request('Tidak ada pengaturan untuk disimpan.', 'EMPTY_PATCH');
    }

    $unknown = array_diff(array_keys($patch), ALLOWED_SETTING_KEYS);
    if (count($unknown) > 0) {
        throw bad_request(
            'Pengaturan tidak dikenal: ' . implode(', ', $unknown) . '.',
            'UNKNOWN_SETTING',
        );
    }

    $oldQris = array_key_exists('qris_image_url', $patch)
        ? db_query_one('SELECT `value` FROM settings WHERE `key` = ?', ['qris_image_url'])
        : null;

    db_transaction(function (PDO $pdo) use ($patch): void {
        $stmt = $pdo->prepare(
            'INSERT INTO settings (`key`, `value`) VALUES (?, ?)
             ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
        );
        foreach ($patch as $key => $value) {
            $stmt->execute([$key, $value === null ? '' : (string) $value]);
        }
    });

    if ($oldQris !== null) {
        delete_upload_refs(collect_upload_refs([$oldQris['value'] ?? null]));
    }

    json_out(['saved' => count($patch)]);
}
