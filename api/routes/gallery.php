<?php

declare(strict_types=1);

function route_gallery_list(): never
{
    $rows = db_query('SELECT * FROM gallery_images ORDER BY sort_order ASC');
    json_out(array_map(static function (array $row): array {
        if (array_key_exists('created_at', $row)) {
            $row['created_at'] = iso_timestamp($row['created_at']);
        }
        return $row;
    }, $rows));
}

function route_gallery_create(): never
{
    require_auth();
    $body = request_body();
    $urls = $body['urls'] ?? null;
    if (!is_array($urls) || count($urls) === 0) {
        throw bad_request('Tidak ada foto untuk ditambahkan.', 'NO_IMAGES');
    }
    $alt = trim((string) ($body['alt'] ?? ''));

    db_transaction(function (PDO $pdo) use ($urls, $alt): void {
        $next = (int) $pdo
            ->query('SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM gallery_images')
            ->fetchColumn();

        $stmt = $pdo->prepare(
            'INSERT INTO gallery_images (id, image_url, alt, sort_order) VALUES (?, ?, ?, ?)',
        );
        foreach (array_values($urls) as $i => $url) {
            $stmt->execute([uuid_v4(), (string) $url, $alt === '' ? null : $alt, $next + $i]);
        }
    });

    json_out(['added' => count($urls)], 201);
}

function route_gallery_delete(string $id): never
{
    require_auth();
    assert_affected(
        db_execute('DELETE FROM gallery_images WHERE id = ?', [$id]),
        'Foto tidak ditemukan.',
    );
    json_out(['deleted' => 1]);
}

function route_gallery_bulk_delete(): never
{
    require_auth();
    $ids = require_id_list(request_body()['ids'] ?? null);
    $affected = db_execute(
        'DELETE FROM gallery_images WHERE id IN (' . placeholders(count($ids)) . ')',
        $ids,
    );
    assert_affected($affected, 'Foto tidak ditemukan.');
    json_out(['deleted' => $affected]);
}
