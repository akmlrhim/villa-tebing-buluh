<?php

declare(strict_types=1);

const UPLOAD_BUCKETS = [
    'room-images' => ['public' => true, 'maxBytes' => 8 * 1024 * 1024],
    'gallery-images' => ['public' => true, 'maxBytes' => 8 * 1024 * 1024],
    'payment-proofs' => ['public' => false, 'maxBytes' => 5 * 1024 * 1024],
];

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

function ini_size_bytes(string|false $value): int
{
    $value = trim((string) $value);
    if ($value === '') {
        return 0;
    }
    $number = (int) $value;
    return match (strtolower(substr($value, -1))) {
        'g' => $number * 1024 * 1024 * 1024,
        'm' => $number * 1024 * 1024,
        'k' => $number * 1024,
        default => $number,
    };
}

function bucket_dir(string $bucket): string
{
    if (!isset(UPLOAD_BUCKETS[$bucket])) {
        throw bad_request('Bucket tidak dikenal.', 'UNKNOWN_BUCKET');
    }
    $root = UPLOAD_BUCKETS[$bucket]['public']
        ? config()['public_upload_dir']
        : config()['private_upload_dir'];
    return rtrim($root, '/\\') . DIRECTORY_SEPARATOR . $bucket;
}

function ensure_bucket_dir(string $bucket): string
{
    $dir = bucket_dir($bucket);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        error_log('[api] gagal membuat folder unggahan: ' . $dir);
        throw new HttpError(500, 'Folder unggahan tidak bisa dibuat di server.', 'UPLOAD_DIR');
    }
    return $dir;
}

function random_filename(): string
{
    return uuid_v4() . '.webp';
}

function safe_filename(mixed $name): string
{
    $name = (string) $name;
    if ($name === '' || !preg_match('/^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$/', $name)) {
        throw bad_request('Nama berkas tidak valid.', 'INVALID_FILENAME');
    }
    return $name;
}

function bucket_path(string $bucket, string $filename): string
{
    return bucket_dir($bucket) . DIRECTORY_SEPARATOR . safe_filename($filename);
}

function public_bucket_url(string $bucket, string $filename): string
{
    return "/uploads/$bucket/$filename";
}

function store_upload(string $bucket): string
{
    $limit = UPLOAD_BUCKETS[$bucket]['maxBytes'];

    $postMax = ini_size_bytes(ini_get('post_max_size'));
    $sent = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if (empty($_FILES) && $postMax > 0 && $sent > $postMax) {
        throw bad_request(
            'Ukuran berkas melebihi batas unggah server. Coba gambar yang lebih kecil.',
            'FILE_TOO_LARGE',
        );
    }

    $file = $_FILES['file'] ?? null;
    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        throw bad_request('Tidak ada berkas yang dikirim.', 'NO_FILE');
    }
    if (in_array($file['error'], [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true)) {
        throw bad_request('Ukuran berkas melebihi batas yang diizinkan.', 'FILE_TOO_LARGE');
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        error_log('[api] unggah gagal, kode PHP: ' . $file['error']);
        throw bad_request('Berkas gagal diunggah. Coba lagi.', 'UPLOAD_FAILED');
    }
    if ((int) $file['size'] > $limit) {
        throw bad_request('Ukuran berkas melebihi batas yang diizinkan.', 'FILE_TOO_LARGE');
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        throw bad_request('Berkas tidak valid.', 'INVALID_UPLOAD');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']) ?: '';
    if (!in_array($mime, ALLOWED_MIME, true)) {
        throw bad_request('Hanya berkas JPG, PNG, atau WebP yang diperbolehkan.', 'INVALID_MIME');
    }

    $dir = ensure_bucket_dir($bucket);
    $filename = random_filename();
    compress_to_webp($file['tmp_name'], $mime, $dir . DIRECTORY_SEPARATOR . $filename);

    return $filename;
}

function parse_upload_ref(mixed $value, ?string $bareBucket = null): ?array
{
    if (!is_string($value)) {
        return null;
    }

    $value = trim($value);
    if ($value === '') {
        return null;
    }

    if (preg_match('#^/uploads/([a-z0-9-]+)/([0-9a-fA-F-]{36}\.[a-zA-Z0-9]+)$#', $value, $m)) {
        [$bucket, $filename] = [$m[1], $m[2]];
    } elseif ($bareBucket !== null && preg_match('/^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$/', $value)) {
        [$bucket, $filename] = [$bareBucket, $value];
    } else {
        return null;
    }

    return isset(UPLOAD_BUCKETS[$bucket]) ? [$bucket, $filename] : null;
}

function collect_upload_refs(array $values, ?string $bareBucket = null): array
{
    $refs = [];
    foreach ($values as $value) {
        $ref = parse_upload_ref($value, $bareBucket);
        if ($ref !== null) {
            $refs[] = $ref;
        }
    }
    return $refs;
}

function upload_ref_in_use(string $bucket, string $filename): bool
{
    $url = public_bucket_url($bucket, $filename);

    $checks = [
        ['SELECT 1 FROM room_images WHERE image_url = ? LIMIT 1', [$url]],
        ['SELECT 1 FROM gallery_images WHERE image_url = ? LIMIT 1', [$url]],
        ['SELECT 1 FROM settings WHERE `key` = ? AND `value` = ? LIMIT 1', ['qris_image_url', $url]],
        ['SELECT 1 FROM bookings WHERE payment_proof_url = ? LIMIT 1', [$filename]],
    ];

    foreach ($checks as [$sql, $params]) {
        if (db_query_one($sql, $params) !== null) {
            return true;
        }
    }

    return false;
}

function delete_upload_refs(array $refs): int
{
    $deleted = 0;
    $seen = [];

    foreach ($refs as [$bucket, $filename]) {
        $key = "$bucket/$filename";
        if (isset($seen[$key])) {
            continue;
        }
        $seen[$key] = true;

        if (upload_ref_in_use($bucket, $filename)) {
            continue;
        }

        $path = bucket_dir($bucket) . DIRECTORY_SEPARATOR . $filename;
        if (!is_file($path)) {
            continue;
        }

        if (@unlink($path)) {
            $deleted += 1;
        } else {
            error_log('[api] gagal menghapus berkas unggahan: ' . $path);
        }
    }

    return $deleted;
}

function proof_signature(string $filename, int $exp): string
{
    return hash_hmac('sha256', "$filename:$exp", config()['jwt_secret']);
}

function sign_proof_url(string $filename, int $expiresIn = 3600): string
{
    $safe = safe_filename($filename);
    $exp = time() + $expiresIn;
    return "/api/proofs/$safe?exp=$exp&sig=" . proof_signature($safe, $exp);
}

function verify_proof_signature(string $filename, mixed $exp, mixed $sig): string
{
    $safe = safe_filename($filename);
    $expNum = filter_var($exp, FILTER_VALIDATE_INT);
    if ($expNum === false || $expNum < time()) {
        throw unauthorized('Tautan bukti bayar sudah kedaluwarsa. Muat ulang halaman.');
    }
    if (!hash_equals(proof_signature($safe, $expNum), (string) $sig)) {
        throw unauthorized('Tautan bukti bayar tidak sah.');
    }
    return $safe;
}
