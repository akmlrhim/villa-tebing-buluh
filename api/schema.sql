
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS admin_users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rooms (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  slug            VARCHAR(150)  NOT NULL UNIQUE,
  description     TEXT          NULL,
  price_per_night DECIMAL(12,2) NOT NULL,
  min_nights      INT           NOT NULL DEFAULT 1,
  max_guests      INT           NOT NULL DEFAULT 2,
  size_sqm        INT           NULL,
  bed_count       INT           NOT NULL DEFAULT 1,
  bed_type        VARCHAR(100)  NULL,
  amenities       JSON          NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rooms_active (is_active),
  INDEX idx_rooms_price (price_per_night)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS room_images (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  room_id    CHAR(36)     NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_images_room (room_id),
  CONSTRAINT fk_room_images_room FOREIGN KEY (room_id)
    REFERENCES rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bookings (
  id                CHAR(36)      NOT NULL PRIMARY KEY,
  room_id           CHAR(36)      NOT NULL,
  guest_name        VARCHAR(100)  NOT NULL,
  guest_phone       VARCHAR(20)   NOT NULL,
  check_in          DATE          NOT NULL,
  check_out         DATE          NOT NULL,
  guest_count       INT           NOT NULL DEFAULT 1,
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending',
  total_price       DECIMAL(12,2) NULL,
  notes             TEXT          NULL,
  payment_proof_url VARCHAR(500)  NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_room (room_id),
  INDEX idx_bookings_dates (room_id, check_in, check_out),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_phone (guest_phone),
  CONSTRAINT fk_bookings_room FOREIGN KEY (room_id)
    REFERENCES rooms (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_images (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  image_url  VARCHAR(500) NOT NULL,
  alt        VARCHAR(255) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gallery_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promos (
  id             CHAR(36)      NOT NULL PRIMARY KEY,
  name           VARCHAR(150)  NOT NULL,
  description    TEXT          NULL,
  discount_type  ENUM('percent','nominal') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12,2) NOT NULL,
  start_date     DATE          NOT NULL,
  end_date       DATE          NOT NULL,
  applies_to_all TINYINT(1)    NOT NULL DEFAULT 1,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promos_active (is_active),
  INDEX idx_promos_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promo_rooms (
  promo_id CHAR(36) NOT NULL,
  room_id  CHAR(36) NOT NULL,
  PRIMARY KEY (promo_id, room_id),
  INDEX idx_promo_rooms_room (room_id),
  CONSTRAINT fk_promo_rooms_promo FOREIGN KEY (promo_id)
    REFERENCES promos (id) ON DELETE CASCADE,
  CONSTRAINT fk_promo_rooms_room FOREIGN KEY (room_id)
    REFERENCES rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  `key`   VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT         NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO settings (`key`, `value`) VALUES
  ('whatsapp_number', '6281234567890'),
  ('villa_name',      'Villa Tebing Buluh'),
  ('address',         'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282');
