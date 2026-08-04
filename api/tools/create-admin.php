<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit("Not found\n");
}

require __DIR__ . '/../lib/http.php';
require __DIR__ . '/../lib/db.php';

$email = $argv[1] ?? null;
$password = $argv[2] ?? null;

if ($email === null || $password === null) {
    fwrite(STDERR, "Pemakaian: php api/tools/create-admin.php <email> <password>\n");
    exit(1);
}
if (strlen($password) < 8) {
    fwrite(STDERR, "Password minimal 8 karakter.\n");
    exit(1);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Format email tidak valid.\n");
    exit(1);
}

$normalized = strtolower(trim($email));
$hash = password_hash($password, PASSWORD_BCRYPT);

try {
    $existing = db_query_one('SELECT id FROM admin_users WHERE email = ?', [$normalized]);
    if ($existing !== null) {
        db_execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [$hash, $existing['id']]);
        echo "Password untuk $normalized berhasil diperbarui.\n";
    } else {
        db_execute(
            'INSERT INTO admin_users (id, email, password_hash) VALUES (?, ?, ?)',
            [uuid_v4(), $normalized, $hash],
        );
        echo "Akun admin $normalized berhasil dibuat.\n";
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'Gagal: ' . $e->getMessage() . "\n");
    exit(1);
}
