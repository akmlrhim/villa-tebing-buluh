<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit("Not found\n");
}

require __DIR__ . '/../lib/http.php';
require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/uploads.php';
require __DIR__ . '/../lib/images.php';

if (!gd_available()) {
    fwrite(STDERR, "Ekstensi GD dengan dukungan WebP tidak tersedia.\n");
    exit(1);
}

function sweep(string $dir): array
{
    if (!is_dir($dir)) {
        return [0, 0, 0];
    }

    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS));
    $touched = 0;
    $failed = 0;
    $saved = 0;

    foreach ($files as $file) {
        if (!$file->isFile()) {
            continue;
        }

        $path = $file->getPathname();
        $result = recompress_in_place($path);

        if ($result['status'] === 'ok') {
            $touched += 1;
            $saved += $result['before'] - $result['after'];
            printf(
                "  %-44s %7.1fKB -> %7.1fKB\n",
                basename($path),
                $result['before'] / 1024,
                $result['after'] / 1024,
            );
        } elseif ($result['status'] !== 'skipped') {
            $failed += 1;
            printf("  %-44s %7.1fKB  GAGAL (%s)\n", basename($path), $result['before'] / 1024, $result['status']);
        }
    }

    return [$touched, $failed, $saved];
}

$total = 0;
$totalFailed = 0;
$totalSaved = 0;

foreach ([config()['public_upload_dir'], config()['private_upload_dir']] as $root) {
    echo rtrim($root, '/\\') . "\n";
    [$touched, $failed, $saved] = sweep($root);
    $total += $touched;
    $totalFailed += $failed;
    $totalSaved += $saved;
}

printf("\n%d berkas dikompres, %d gagal, hemat %.1f KB.\n", $total, $totalFailed, $totalSaved / 1024);

if ($totalFailed > 0) {
    exit(1);
}
