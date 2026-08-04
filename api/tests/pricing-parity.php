<?php

declare(strict_types=1);

require __DIR__ . '/../lib/http.php';
require __DIR__ . '/../lib/pricing.php';

$casesFile = __DIR__ . '/pricing-cases.json';
$cases = json_decode(file_get_contents($casesFile), true);
if (!is_array($cases)) {
    fwrite(STDERR, "Tidak bisa membaca pricing-cases.json\n");
    exit(1);
}

$php = [];
foreach ($cases as $case) {
    $stay = compute_stay($case['room'], $case['checkIn'], $case['checkOut'], $case['promos']);
    $php[] = [
        'nights' => $stay['nights'],
        'baseTotal' => $stay['baseTotal'],
        'total' => $stay['total'],
        'discount' => $stay['discount'],
        'applied' => array_column($stay['applied'], 'id'),
        'lines' => array_map(static fn(array $l): array => [
            'date' => $l['date'],
            'price' => $l['price'],
            'promo' => $l['promo']['id'] ?? null,
        ], $stay['lines']),
    ];
}

$runner = __DIR__ . '/pricing-parity.mjs';
$descriptors = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
$proc = proc_open(['node', $runner], $descriptors, $pipes);
if (!is_resource($proc)) {
    fwrite(STDERR, "Gagal menjalankan node. Pastikan Node.js terpasang (hanya untuk uji ini).\n");
    exit(1);
}
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
foreach ($pipes as $pipe) {
    fclose($pipe);
}
if (proc_close($proc) !== 0) {
    fwrite(STDERR, "Runner Node gagal:\n$stderr\n");
    exit(1);
}

$js = json_decode($stdout, true);
if (!is_array($js)) {
    fwrite(STDERR, "Keluaran runner Node tidak bisa dibaca:\n$stdout\n");
    exit(1);
}

$normalize = static function (array $result): string {
    array_walk_recursive($result, static function (&$v): void {
        if (is_int($v) || is_float($v)) {
            $v = 0.0 + $v;
        }
    });
    return json_encode($result);
};

$pass = 0;
$fail = 0;

foreach ($cases as $i => $case) {
    $a = $normalize($php[$i]);
    $b = $normalize($js[$i] ?? []);

    if ($a === $b) {
        $pass++;
        printf("  COCOK   %s (total %s)\n", $case['name'], number_format($php[$i]['total'], 0, ',', '.'));
        continue;
    }

    $fail++;
    printf("  BEDA    %s\n", $case['name']);
    printf("      PHP : %s\n", $a);
    printf("      JS  : %s\n", $b);
}

printf("\n===== %d cocok, %d berbeda =====\n", $pass, $fail);

if ($fail > 0) {
    fwrite(STDERR, "\napi/lib/pricing.php dan shared/pricing.js TIDAK sinkron. Perbaiki sebelum deploy.\n");
    exit(1);
}
exit(0);
