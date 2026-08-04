<?php

declare(strict_types=1);

function route_auth_login(): never
{
    $body = request_body();
    $email = strtolower(trim((string) ($body['email'] ?? '')));
    $password = (string) ($body['password'] ?? '');

    $user = $email !== ''
        ? db_query_one('SELECT id, email, password_hash FROM admin_users WHERE email = ?', [$email])
        : null;

    $hash = $user['password_hash']
        ?? '$2y$10$.vGA1O9wmRjrwAVXD98HNOgsNpDczlqm3Jq7KnEd1rVAGv3Fykk1a';

    $ok = password_verify($password, $hash);

    if ($user === null || !$ok) {
        throw new HttpError(401, 'Email atau password salah.', 'INVALID_CREDENTIALS');
    }

    json_out([
        'token' => jwt_sign($user),
        'user' => ['id' => $user['id'], 'email' => $user['email']],
        'expiresIn' => jwt_ttl(),
    ]);
}

function route_auth_me(): never
{
    $claims = require_auth();
    $user = db_query_one('SELECT id, email FROM admin_users WHERE id = ?', [$claims['sub']]);
    if ($user === null) {
        throw new HttpError(401, 'Akun sudah tidak ada.', 'UNAUTHORIZED');
    }
    json_out(['user' => $user]);
}
