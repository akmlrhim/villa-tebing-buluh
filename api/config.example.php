<?php

declare(strict_types=1);

return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'uXXXXXXXX_villatebingbuluh',
        'user' => 'uXXXXXXXX_villa',
        'pass' => 'ISI_PASSWORD_DATABASE',
    ],

    'jwt_secret' => 'GANTI_DENGAN_STRING_ACAK_MINIMAL_32_KARAKTER',

    'jwt_ttl' => 12 * 60 * 60,

    'public_upload_dir' => __DIR__ . '/../uploads',

    'private_upload_dir' => __DIR__ . '/../../vtb-private/uploads',

    'timezone' => 'Asia/Makassar',
];
