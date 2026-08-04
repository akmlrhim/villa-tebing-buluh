<?php

declare(strict_types=1);

final class HttpError extends RuntimeException
{
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly ?string $errorCode = null,
    ) {
        parent::__construct($message);
    }
}

function bad_request(string $message, ?string $code = null): HttpError
{
    return new HttpError(400, $message, $code);
}

function unauthorized(
    string $message = 'Sesi tidak valid atau sudah berakhir. Silakan login lagi.',
): HttpError {
    return new HttpError(401, $message, 'UNAUTHORIZED');
}

function not_found(string $message = 'Data tidak ditemukan.'): HttpError
{
    return new HttpError(404, $message, 'NOT_FOUND');
}

function conflict(string $message, ?string $code = null): HttpError
{
    return new HttpError(409, $message, $code);
}

function json_out(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_body(): array
{
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return $cached = [];
    }
    $parsed = json_decode($raw, true);
    return $cached = is_array($parsed) ? $parsed : [];
}

function placeholders(int $n): string
{
    return implode(', ', array_fill(0, max($n, 1), '?'));
}

function require_id_list(mixed $ids): array
{
    if (!is_array($ids) || count($ids) === 0) {
        throw bad_request('Tidak ada data yang dipilih.', 'EMPTY_SELECTION');
    }
    if (count($ids) > 200) {
        throw bad_request('Terlalu banyak data dipilih sekaligus (maks 200).', 'TOO_MANY');
    }
    return array_values(array_map('strval', $ids));
}

function assert_affected(int $rowCount, string $message = 'Data tidak ditemukan atau sudah dihapus.'): void
{
    if ($rowCount === 0) {
        throw not_found($message);
    }
}

function today_iso(): string
{
    return (new DateTimeImmutable('now'))->format('Y-m-d');
}

function iso_timestamp(?string $value): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    try {
        return (new DateTimeImmutable($value))->format('c');
    } catch (Exception) {
        return $value;
    }
}

function nights_between(string $from, string $to): int
{
    $a = new DateTimeImmutable($from . ' 00:00:00', new DateTimeZone('UTC'));
    $b = new DateTimeImmutable($to . ' 00:00:00', new DateTimeZone('UTC'));
    return (int) round(($b->getTimestamp() - $a->getTimestamp()) / 86400);
}

function uuid_v4(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}
