<?php

declare(strict_types=1);

const IMAGE_MAX_BYTES = 50 * 1024;

const IMAGE_MAX_EDGE = 1600;

const IMAGE_MIN_EDGE = 320;

const IMAGE_MAX_PIXELS = 40_000_000;

function gd_available(): bool
{
    return function_exists('imagewebp') && function_exists('imagecreatetruecolor');
}

function load_image(string $path, string $mime): \GdImage
{
    $image = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($path),
        'image/png' => @imagecreatefrompng($path),
        'image/webp' => @imagecreatefromwebp($path),
        default => false,
    };

    if (!$image instanceof \GdImage) {
        throw bad_request('Berkas gambar tidak bisa dibaca.', 'DECODE_FAILED');
    }

    return $image;
}

function orient_image(\GdImage $image, string $path, string $mime): \GdImage
{
    if ($mime !== 'image/jpeg' || !function_exists('exif_read_data')) {
        return $image;
    }

    $exif = @exif_read_data($path);
    $orientation = (int) ($exif['Orientation'] ?? 1);
    if ($orientation <= 1) {
        return $image;
    }

    $rotated = match ($orientation) {
        3, 4 => imagerotate($image, 180, 0),
        5, 6 => imagerotate($image, -90, 0),
        7, 8 => imagerotate($image, 90, 0),
        default => null,
    };

    if ($rotated instanceof \GdImage) {
        imagedestroy($image);
        $image = $rotated;
    }

    if (in_array($orientation, [2, 4, 5, 7], true)) {
        imageflip($image, IMG_FLIP_HORIZONTAL);
    }

    return $image;
}

function scale_image(\GdImage $image, int $maxEdge): \GdImage
{
    $width = imagesx($image);
    $height = imagesy($image);
    $longest = max($width, $height);

    if ($longest <= $maxEdge) {
        return $image;
    }

    $ratio = $maxEdge / $longest;
    $newWidth = max(1, (int) round($width * $ratio));
    $newHeight = max(1, (int) round($height * $ratio));

    $resized = imagecreatetruecolor($newWidth, $newHeight);
    imagealphablending($resized, false);
    imagesavealpha($resized, true);
    imagecopyresampled($resized, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
    imagedestroy($image);

    return $resized;
}

function encode_webp(\GdImage $image, int $quality): string
{
    ob_start();
    imagewebp($image, null, $quality);
    return (string) ob_get_clean();
}

function best_webp_under(\GdImage $image, int $maxBytes): ?string
{
    $low = 1;
    $high = 92;
    $best = null;

    while ($low <= $high) {
        $mid = intdiv($low + $high, 2);
        $encoded = encode_webp($image, $mid);
        if (strlen($encoded) <= $maxBytes) {
            $best = $encoded;
            $low = $mid + 1;
        } else {
            $high = $mid - 1;
        }
    }

    $graphicLike = $best !== null && strlen($best) < intdiv($maxBytes * 3, 5);

    if ($graphicLike && defined('IMG_WEBP_LOSSLESS')) {
        $lossless = encode_webp($image, IMG_WEBP_LOSSLESS);
        if (strlen($lossless) <= $maxBytes && strlen($lossless) < strlen($best)) {
            return $lossless;
        }
    }

    return $best;
}

function compress_to_webp(string $sourcePath, string $mime, string $destPath): void
{
    if (!gd_available()) {
        error_log('[api] ekstensi GD/WebP tidak tersedia, gambar disimpan apa adanya');
        if (!copy($sourcePath, $destPath)) {
            throw new HttpError(500, 'Berkas gagal disimpan di server.', 'SAVE_FAILED');
        }
        return;
    }

    $size = @getimagesize($sourcePath);
    if (is_array($size) && $size[0] * $size[1] > IMAGE_MAX_PIXELS) {
        throw bad_request(
            'Resolusi gambar terlalu besar. Kecilkan dulu sebelum diunggah.',
            'IMAGE_TOO_LARGE',
        );
    }

    if (function_exists('set_time_limit')) {
        @set_time_limit(120);
    }

    $image = load_image($sourcePath, $mime);
    $image = orient_image($image, $sourcePath, $mime);
    imagealphablending($image, false);
    imagesavealpha($image, true);

    $maxEdge = IMAGE_MAX_EDGE;
    $encoded = null;

    while ($maxEdge >= IMAGE_MIN_EDGE) {
        $image = scale_image($image, $maxEdge);
        $encoded = best_webp_under($image, IMAGE_MAX_BYTES);
        if ($encoded !== null) {
            break;
        }
        $maxEdge = (int) round($maxEdge * 0.8);
    }

    if ($encoded === null) {
        $encoded = encode_webp($image, 1);
    }

    imagedestroy($image);

    if (file_put_contents($destPath, $encoded) === false) {
        error_log('[api] gagal menulis gambar terkompresi ke ' . $destPath);
        throw new HttpError(500, 'Berkas gagal disimpan di server.', 'SAVE_FAILED');
    }
}

function encode_same_format(\GdImage $image, string $mime, int $quality): string
{
    ob_start();
    match ($mime) {
        'image/jpeg' => imagejpeg($image, null, $quality),
        'image/png' => imagepng($image, null, 9),
        default => imagewebp($image, null, $quality),
    };
    return (string) ob_get_clean();
}

function best_lossy_under(\GdImage $image, string $mime, int $maxBytes): ?string
{
    $low = 1;
    $high = 92;
    $best = null;

    while ($low <= $high) {
        $mid = intdiv($low + $high, 2);
        $encoded = encode_same_format($image, $mime, $mid);
        if (strlen($encoded) <= $maxBytes) {
            $best = $encoded;
            $low = $mid + 1;
        } else {
            $high = $mid - 1;
        }
    }

    return $best;
}

function recompress_in_place(string $path): array
{
    $before = (int) filesize($path);
    $result = ['status' => 'skipped', 'before' => $before, 'after' => $before];

    if ($before <= IMAGE_MAX_BYTES || !gd_available()) {
        return $result;
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($path) ?: '';
    if (!in_array($mime, ALLOWED_MIME, true)) {
        return $result;
    }

    $size = @getimagesize($path);
    if (is_array($size) && $size[0] * $size[1] > IMAGE_MAX_PIXELS) {
        return ['status' => 'terlalu-besar', 'before' => $before, 'after' => $before];
    }

    $image = load_image($path, $mime);
    $image = orient_image($image, $path, $mime);
    imagealphablending($image, false);
    imagesavealpha($image, true);

    $maxEdge = IMAGE_MAX_EDGE;
    $encoded = null;

    while ($maxEdge >= IMAGE_MIN_EDGE) {
        $image = scale_image($image, $maxEdge);
        $encoded = $mime === 'image/png'
            ? (strlen($png = encode_same_format($image, $mime, 9)) <= IMAGE_MAX_BYTES ? $png : null)
            : best_lossy_under($image, $mime, IMAGE_MAX_BYTES);
        if ($encoded !== null) {
            break;
        }
        $maxEdge = (int) round($maxEdge * 0.8);
    }

    imagedestroy($image);

    if ($encoded === null) {
        return ['status' => 'gagal', 'before' => $before, 'after' => $before];
    }

    $temp = $path . '.tmp';
    if (file_put_contents($temp, $encoded) === false || !rename($temp, $path)) {
        @unlink($temp);
        return ['status' => 'gagal', 'before' => $before, 'after' => $before];
    }

    clearstatcache(true, $path);

    return ['status' => 'ok', 'before' => $before, 'after' => (int) filesize($path)];
}
