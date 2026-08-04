<?php

declare(strict_types=1);

function route_upload_room_image(): never
{
    require_auth();
    $filename = store_upload('room-images');
    json_out(['path' => $filename, 'publicUrl' => public_bucket_url('room-images', $filename)]);
}

function route_upload_gallery_image(): never
{
    require_auth();
    $filename = store_upload('gallery-images');
    json_out(['path' => $filename, 'publicUrl' => public_bucket_url('gallery-images', $filename)]);
}

function route_upload_payment_proof(): never
{
    json_out(['path' => store_upload('payment-proofs')]);
}

function route_proof_serve(string $filename): never
{
    $safe = verify_proof_signature($filename, $_GET['exp'] ?? null, $_GET['sig'] ?? null);
    $full = bucket_path('payment-proofs', $safe);

    if (!is_file($full)) {
        json_out(['error' => 'Berkas bukti bayar tidak ditemukan.', 'code' => 'NOT_FOUND'], 404);
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($full) ?: 'application/octet-stream';

    http_response_code(200);
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . filesize($full));
    header('Cache-Control: private, max-age=300');
    header('X-Content-Type-Options: nosniff');
    readfile($full);
    exit;
}
