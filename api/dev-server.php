<?php

declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$root = __DIR__ . '/..';

if (str_starts_with($path, '/uploads/')) {
    $file = realpath($root . $path);
    $base = realpath($root . '/uploads');
    if ($file !== false && $base !== false && str_starts_with($file, $base) && is_file($file)) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        header('Content-Type: ' . ($finfo->file($file) ?: 'application/octet-stream'));
        readfile($file);
        return true;
    }
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Berkas tidak ditemukan.', 'code' => 'NOT_FOUND']);
    return true;
}

if (str_starts_with($path, '/api')) {
    $_SERVER['SCRIPT_NAME'] = '/api/index.php';
    require __DIR__ . '/index.php';
    return true;
}

http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'Endpoint tidak ditemukan.', 'code' => 'NOT_FOUND']);
return true;
