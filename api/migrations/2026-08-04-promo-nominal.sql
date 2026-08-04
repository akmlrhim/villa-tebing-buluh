-- Promo: tipe `fixed_price` (harga jadi per malam) diganti `nominal` (potongan rupiah per malam).
-- Jalankan sekali pada database yang sudah berisi data promo lama.
-- Kolom di-longgarkan dulu supaya baris `fixed_price` lama tidak ditolak ENUM.
--
-- Konversinya perkiraan: potongan dihitung dari kamar TERMURAH yang kena promo,
-- jadi kamar yang lebih mahal jadi tidak semurah harga tetap yang lama.
-- Periksa ulang nilai promo di /admin/promo setelah migrasi ini dijalankan.

ALTER TABLE promos MODIFY discount_type VARCHAR(20) NOT NULL DEFAULT 'percent';

UPDATE promos p
  JOIN (
    SELECT pr.id, MIN(r.price_per_night) AS base
      FROM promos pr
      JOIN rooms r
        ON pr.applies_to_all = 1
        OR r.id IN (SELECT room_id FROM promo_rooms WHERE promo_id = pr.id)
     WHERE pr.discount_type = 'fixed_price'
     GROUP BY pr.id
  ) x ON x.id = p.id
   SET p.discount_value = GREATEST(0, x.base - p.discount_value),
       p.discount_type  = 'nominal'
 WHERE p.discount_type = 'fixed_price';

UPDATE promos SET discount_type = 'nominal', discount_value = 0
 WHERE discount_type = 'fixed_price';

ALTER TABLE promos
  MODIFY discount_type ENUM('percent','nominal') NOT NULL DEFAULT 'percent';
