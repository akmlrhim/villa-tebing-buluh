<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit("Not found\n");
}

require __DIR__ . '/../lib/http.php';
require __DIR__ . '/../lib/db.php';
require __DIR__ . '/../lib/uploads.php';

$args = array_slice($argv, 1);
$apply = in_array('--yes', $args, true);

foreach ($args as $arg) {
    if (!in_array($arg, ['--yes'], true)) {
        fwrite(STDERR, "Opsi tidak dikenal: $arg\n");
        fwrite(STDERR, "Pemakaian: php api/tools/prune-uploads.php [--yes]\n");
        exit(1);
    }
}

if (!$apply) {
    echo "MODE UJI COBA - tidak ada berkas yang dihapus.\n";
    echo "Tambahkan --yes untuk benar-benar menghapus.\n\n";
}

$totalFiles = 0;
$orphans = 0;
$bytes = 0;

foreach (array_keys(UPLOAD_BUCKETS) as $bucket) {
    $dir = bucket_dir($bucket);
    if (!is_dir($dir)) {
        continue;
    }

    echo "$bucket/\n";

    foreach (scandir($dir) ?: [] as $entry) {
        $path = $dir . DIRECTORY_SEPARATOR . $entry;
        if ($entry === '.' || $entry === '..' || !is_file($path)) {
            continue;
        }

        $totalFiles += 1;

        if (parse_upload_ref($entry, $bucket) === null) {
            printf("  %-44s DILEWATI (nama tidak dikenal)\n", $entry);
            continue;
        }

        if (upload_ref_in_use($bucket, $entry)) {
            continue;
        }

        $size = (int) filesize($path);
        $orphans += 1;
        $bytes += $size;

        if ($apply && @unlink($path)) {
            printf("  %-44s %7.1fKB dihapus\n", $entry, $size / 1024);
        } elseif ($apply) {
            printf("  %-44s %7.1fKB GAGAL dihapus\n", $entry, $size / 1024);
        } else {
            printf("  %-44s %7.1fKB yatim\n", $entry, $size / 1024);
        }
    }
}

printf(
    "\n%d berkas diperiksa, %d yatim (%.1f KB)%s\n",
    $totalFiles,
    $orphans,
    $bytes / 1024,
    $apply ? ' dihapus.' : '. Jalankan ulang dengan --yes untuk menghapus.',
);
