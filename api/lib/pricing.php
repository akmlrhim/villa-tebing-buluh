<?php

declare(strict_types=1);

const PROMO_TYPES = ['percent', 'nominal'];

function stay_nights(string $checkIn, string $checkOut): array
{
    $out = [];
    $cursor = new DateTimeImmutable($checkIn . ' 00:00:00', new DateTimeZone('UTC'));
    $step = new DateInterval('P1D');

    while (true) {
        $iso = $cursor->format('Y-m-d');
        if ($iso >= $checkOut) {
            break;
        }
        $out[] = $iso;
        $cursor = $cursor->add($step);
    }
    return $out;
}

function promo_applies_to(array $promo, string $roomId, string $nightISO): bool
{
    if (empty($promo['is_active'])) {
        return false;
    }
    if ($nightISO < $promo['start_date'] || $nightISO > $promo['end_date']) {
        return false;
    }
    if (!empty($promo['applies_to_all'])) {
        return true;
    }
    return is_array($promo['room_ids'] ?? null) && in_array($roomId, $promo['room_ids'], true);
}

function promo_night_price(float $basePrice, array $promo): float
{
    $value = (float) $promo['discount_value'];
    if ($promo['discount_type'] === 'percent') {
        return round($basePrice * (1 - $value / 100));
    }
    return max(0.0, round($basePrice - $value));
}

function price_for_night(float $basePrice, string $roomId, string $nightISO, array $promos = []): array
{
    $best = ['price' => $basePrice, 'promo' => null];
    foreach ($promos as $promo) {
        if (!promo_applies_to($promo, $roomId, $nightISO)) {
            continue;
        }
        $price = promo_night_price($basePrice, $promo);
        if ($price < $best['price']) {
            $best = ['price' => $price, 'promo' => $promo];
        }
    }
    return $best;
}

function compute_stay(array $room, string $checkIn, string $checkOut, array $promos = []): array
{
    $basePrice = (float) ($room['price_per_night'] ?? 0);
    $dates = stay_nights($checkIn, $checkOut);

    $lines = [];
    foreach ($dates as $date) {
        $best = price_for_night($basePrice, (string) $room['id'], $date, $promos);
        $lines[] = [
            'date' => $date,
            'price' => $best['price'],
            'basePrice' => $basePrice,
            'promo' => $best['promo'],
        ];
    }

    $baseTotal = $basePrice * count($dates);
    $total = array_sum(array_column($lines, 'price'));

    $applied = [];
    $seen = [];
    foreach ($lines as $line) {
        $promo = $line['promo'];
        if ($promo !== null && !isset($seen[$promo['id']])) {
            $seen[$promo['id']] = true;
            $applied[] = $promo;
        }
    }

    return [
        'nights' => count($dates),
        'lines' => $lines,
        'baseTotal' => $baseTotal,
        'total' => $total,
        'discount' => $baseTotal - $total,
        'applied' => $applied,
    ];
}
