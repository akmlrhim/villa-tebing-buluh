<?php

declare(strict_types=1);

function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $file = __DIR__ . '/../config.php';
    if (!is_file($file)) {
        error_log('[api] api/config.php tidak ditemukan — salin dari config.example.php');
        throw new HttpError(500, 'Server belum dikonfigurasi.', 'NO_CONFIG');
    }

    $config = require $file;

    $secret = (string) ($config['jwt_secret'] ?? '');
    if (strlen($secret) < 32 || str_contains($secret, 'GANTI_DENGAN')) {
        error_log('[api] jwt_secret di api/config.php belum diisi (minimal 32 karakter acak)');
        throw new HttpError(500, 'Server belum dikonfigurasi.', 'NO_CONFIG');
    }

    date_default_timezone_set((string) ($config['timezone'] ?? 'Asia/Makassar'));

    return $config;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $c = config()['db'];
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $c['host'],
        (int) ($c['port'] ?? 3306),
        $c['name'],
    );

    try {
        $pdo = new PDO($dsn, $c['user'], $c['pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_STRINGIFY_FETCHES => false,
        ]);
    } catch (PDOException $e) {
        error_log('[api] koneksi database gagal: ' . $e->getMessage());
        throw new HttpError(503, 'Database sedang tidak bisa dihubungi.', 'DB_UNAVAILABLE');
    }

    $offset = (new DateTimeImmutable('now'))->format('P');
    $pdo->prepare('SET time_zone = ?')->execute([$offset]);

    return $pdo;
}

function db_query(string $sql, array $params = []): array
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function db_query_one(string $sql, array $params = []): ?array
{
    $rows = db_query($sql, $params);
    return $rows[0] ?? null;
}

function db_execute(string $sql, array $params = []): int
{
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt->rowCount();
}

function db_transaction(callable $fn): mixed
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $result = $fn($pdo);
        $pdo->commit();
        return $result;
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        throw $e;
    }
}

function to_bool(mixed $v): bool
{
    return (bool) $v;
}

function to_float(mixed $v): ?float
{
    return $v === null ? null : (float) $v;
}
