<?php

declare(strict_types=1);

function base64url_encode(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function base64url_decode(string $text): string|false
{
    return base64_decode(strtr($text, '-_', '+/'), true);
}

function jwt_ttl(): int
{
    return (int) (config()['jwt_ttl'] ?? 12 * 60 * 60);
}

function jwt_sign(array $user): string
{
    $now = time();
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload = [
        'sub' => $user['id'],
        'email' => $user['email'],
        'iat' => $now,
        'exp' => $now + jwt_ttl(),
    ];

    $signingInput = base64url_encode(json_encode($header))
        . '.' . base64url_encode(json_encode($payload));

    $signature = hash_hmac('sha256', $signingInput, config()['jwt_secret'], true);

    return $signingInput . '.' . base64url_encode($signature);
}

function jwt_verify(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }
    [$h, $p, $s] = $parts;

    $expected = hash_hmac('sha256', $h . '.' . $p, config()['jwt_secret'], true);
    $given = base64url_decode($s);
    if ($given === false || !hash_equals($expected, $given)) {
        return null;
    }

    $payloadJson = base64url_decode($p);
    if ($payloadJson === false) {
        return null;
    }
    $payload = json_decode($payloadJson, true);
    if (!is_array($payload)) {
        return null;
    }
    if (!isset($payload['exp']) || (int) $payload['exp'] < time()) {
        return null;
    }

    return $payload;
}

function auth_header(): string
{
    foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $key) {
        if (!empty($_SERVER[$key])) {
            return (string) $_SERVER[$key];
        }
    }
    if (function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $name => $value) {
            if (strcasecmp($name, 'Authorization') === 0) {
                return (string) $value;
            }
        }
    }
    return '';
}

function require_auth(): array
{
    $header = auth_header();
    if (!str_starts_with($header, 'Bearer ')) {
        throw unauthorized('Belum login.');
    }
    $payload = jwt_verify(substr($header, 7));
    if ($payload === null) {
        throw unauthorized();
    }
    return $payload;
}
