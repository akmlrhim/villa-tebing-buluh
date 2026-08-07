<?php

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/lib/http.php';
require __DIR__ . '/lib/db.php';
require __DIR__ . '/lib/auth.php';
require __DIR__ . '/lib/uploads.php';
require __DIR__ . '/lib/images.php';
require __DIR__ . '/lib/pricing.php';
require __DIR__ . '/routes/auth.php';
require __DIR__ . '/routes/rooms.php';
require __DIR__ . '/routes/bookings.php';
require __DIR__ . '/routes/promos.php';
require __DIR__ . '/routes/gallery.php';
require __DIR__ . '/routes/settings.php';
require __DIR__ . '/routes/upload.php';

header_remove('X-Powered-By');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: DENY');
if (
    ($_SERVER['HTTPS'] ?? '') === 'on'
    || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
) {
    header('Strict-Transport-Security: max-age=63072000; includeSubDomains; preload');
}

const ROUTES = [
    ['POST', '/auth/login', 'route_auth_login'],
    ['GET', '/auth/me', 'route_auth_me'],

    ['GET', '/rooms', 'route_rooms_list'],
    ['GET', '/rooms/admin', 'route_rooms_admin_list'],
    ['POST', '/rooms/bulk-delete', 'route_rooms_bulk_delete'],
    ['POST', '/rooms', 'route_rooms_create'],
    ['PUT', '/rooms/{id}', 'route_rooms_update'],
    ['PATCH', '/rooms/{id}/active', 'route_rooms_toggle_active'],
    ['DELETE', '/rooms/{id}', 'route_rooms_delete'],

    ['GET', '/bookings/availability', 'route_bookings_availability'],
    ['POST', '/bookings/public', 'route_bookings_public_create'],
    ['POST', '/bookings/status', 'route_bookings_status'],
    ['POST', '/bookings/bulk-delete', 'route_bookings_bulk_delete'],
    ['GET', '/bookings', 'route_bookings_list'],
    ['POST', '/bookings', 'route_bookings_create'],
    ['GET', '/bookings/{id}/proof-url', 'route_bookings_proof_url'],
    ['PATCH', '/bookings/{id}/status', 'route_bookings_update_status'],
    ['GET', '/bookings/{id}', 'route_bookings_get'],
    ['PUT', '/bookings/{id}', 'route_bookings_update'],
    ['DELETE', '/bookings/{id}', 'route_bookings_delete'],

    ['GET', '/promos/active', 'route_promos_active'],
    ['POST', '/promos/bulk-delete', 'route_promos_bulk_delete'],
    ['GET', '/promos', 'route_promos_list'],
    ['POST', '/promos', 'route_promos_create'],
    ['PATCH', '/promos/{id}/active', 'route_promos_toggle_active'],
    ['PUT', '/promos/{id}', 'route_promos_update'],
    ['DELETE', '/promos/{id}', 'route_promos_delete'],

    ['GET', '/gallery', 'route_gallery_list'],
    ['POST', '/gallery/bulk-delete', 'route_gallery_bulk_delete'],
    ['POST', '/gallery', 'route_gallery_create'],
    ['DELETE', '/gallery/{id}', 'route_gallery_delete'],

    ['GET', '/settings', 'route_settings_list'],
    ['PUT', '/settings', 'route_settings_save'],

    ['POST', '/upload/room-image', 'route_upload_room_image'],
    ['POST', '/upload/gallery-image', 'route_upload_gallery_image'],
    ['POST', '/upload/payment-proof', 'route_upload_payment_proof'],

    ['GET', '/proofs/{filename}', 'route_proof_serve'],
];

function route_path(): string
{
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    if ($base !== '' && str_starts_with($uri, $base)) {
        $uri = substr($uri, strlen($base));
    }
    return '/' . trim($uri, '/');
}

function match_route(string $pattern, string $path): ?array
{
    $quoted = str_replace(['\{', '\}'], ['{', '}'], preg_quote($pattern, '#'));
    $regex = '#^' . preg_replace('/\{[a-z_]+\}/', '([^/]+)', $quoted) . '$#';

    if (!preg_match($regex, $path, $m)) {
        return null;
    }
    array_shift($m);
    return array_map('rawurldecode', $m);
}

try {
    config();

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $path = route_path();

    if ($path === '/health') {
        db()->query('SELECT 1');
        json_out(['ok' => true]);
    }

    $pathExists = false;
    foreach (ROUTES as [$routeMethod, $pattern, $handler]) {
        $params = match_route($pattern, $path);
        if ($params === null) {
            continue;
        }
        $pathExists = true;
        if ($routeMethod === $method) {
            $handler(...$params);
        }
    }

    if ($pathExists) {
        json_out(['error' => 'Metode tidak diizinkan untuk alamat ini.', 'code' => 'METHOD_NOT_ALLOWED'], 405);
    }
    json_out(['error' => 'Endpoint tidak ditemukan.', 'code' => 'NOT_FOUND'], 404);
} catch (HttpError $e) {
    json_out(['error' => $e->getMessage(), 'code' => $e->errorCode], $e->status);
} catch (Throwable $e) {
    error_log(sprintf(
        '[api] %s %s -> %s: %s @ %s:%d',
        $_SERVER['REQUEST_METHOD'] ?? '?',
        $_SERVER['REQUEST_URI'] ?? '?',
        $e::class,
        $e->getMessage(),
        $e->getFile(),
        $e->getLine(),
    ));
    json_out(['error' => 'Terjadi kesalahan di server. Coba lagi.', 'code' => 'INTERNAL'], 500);
}
