-- =====================================================================
--  UTSmart Online Store - Database Schema & Seed
--  Tugas UAS - Backend API (Node.js + Express + MySQL)
--
--  Cara import (lokal):
--    mysql -u root -p < database/database.sql
--  Atau buat database dulu lalu:
--    mysql -u root -p utsmart < database/database.sql
--
--  Catatan: Aplikasi juga otomatis membuat tabel & seed saat start
--  (lihat src/config/initDb.js), jadi import manual ini opsional.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS utsmart
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE utsmart;

-- ---------- Tabel users ----------
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id           VARCHAR(40)  PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  email        VARCHAR(160) NOT NULL UNIQUE,
  password     VARCHAR(200) NOT NULL,
  role         ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Tabel products ----------
CREATE TABLE products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  price         BIGINT NOT NULL DEFAULT 0,
  image         TEXT,
  description   TEXT,
  category      VARCHAR(100),
  rating        DECIMAL(2,1) NOT NULL DEFAULT 0,
  review_count  INT NOT NULL DEFAULT 0,
  stock         INT NOT NULL DEFAULT 0,
  badge         VARCHAR(60) DEFAULT '',
  discount      INT NOT NULL DEFAULT 0,
  brand         VARCHAR(100) DEFAULT '',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Tabel orders ----------
CREATE TABLE orders (
  id              VARCHAR(40) PRIMARY KEY,
  user_id         VARCHAR(40),
  user_email      VARCHAR(160),
  customer_name   VARCHAR(160) NOT NULL,
  phone           VARCHAR(40)  NOT NULL,
  address         TEXT         NOT NULL,
  payment_method  VARCHAR(60)  NOT NULL,
  subtotal        BIGINT NOT NULL DEFAULT 0,
  discount        BIGINT NOT NULL DEFAULT 0,
  total           BIGINT NOT NULL DEFAULT 0,
  status          ENUM('Processing','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Processing',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Tabel order_items ----------
CREATE TABLE order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    VARCHAR(40) NOT NULL,
  product_id  INT,
  name        VARCHAR(200) NOT NULL,
  price       BIGINT NOT NULL DEFAULT 0,
  image       TEXT,
  quantity    INT NOT NULL DEFAULT 1,
  discount    INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =====================================================================
--  SEED DATA
-- =====================================================================

-- Admin default (email: admin@utsmart.com / password: admin123)
INSERT INTO users (id, name, email, password, role) VALUES
('admin', 'Administrator', 'admin@utsmart.com', '$2a$10$r0MRtey3TzWsZ1rMPsbb9eITGWac4AM0bwGq9ZGgFFrpfE5hwjYu.', 'admin');

-- Produk
INSERT INTO products (id, name, price, image, description, category, rating, review_count, stock, badge, discount, brand) VALUES
(1, 'Wireless Headphones Pro', 1299000, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop&auto=format', 'Premium wireless headphones dengan active noise cancellation, driver 40mm, dan baterai tahan hingga 30 jam. Cocok untuk musik, gaming, dan meeting.', 'Electronics', 4.8, 124, 15, 'Best Seller', 10, 'SoundMax'),
(2, 'Bluetooth Speaker Mini', 499000, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&auto=format', 'Speaker bluetooth portable dengan suara 360° stereo, waterproof IPX7, dan baterai 12 jam. Desain compact dan stylish.', 'Electronics', 4.5, 89, 23, '', 0, 'BassBox'),
(3, 'USB-C Hub Adapter 7-in-1', 349000, 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400&h=400&fit=crop&auto=format', 'Hub adapter USB-C dengan 7 port: HDMI 4K, USB 3.0 x3, SD card, microSD, dan USB-C PD charging. Kompatibel dengan semua laptop.', 'Electronics', 4.3, 56, 30, 'New', 0, 'TechLink'),
(4, 'Oversized Cotton Hoodie', 289000, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop&auto=format', 'Hoodie oversized dari 100% cotton premium, soft inside fleece, cocok untuk daily wear. Tersedia dalam berbagai warna.', 'Fashion', 4.7, 203, 45, 'Best Seller', 15, 'UrbanFit'),
(5, 'Slim Fit Chino Pants', 359000, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop&auto=format', 'Celana chino slim fit dengan bahan stretch yang nyaman. Cocok untuk casual maupun semi-formal. Warna timeless.', 'Fashion', 4.4, 78, 35, '', 0, 'ClassicWear'),
(6, 'Graphic Print T-Shirt', 149000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&auto=format', 'T-shirt dengan desain grafis modern, bahan cotton combed 30s yang adem dan nyaman untuk aktivitas sehari-hari.', 'Fashion', 4.2, 156, 60, '', 20, 'StreetVibe'),
(7, 'Minimalist Desk Lamp', 425000, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcT6JpLVcQ5uk4uH_a6BLpjXoS0INH9wC2MPNPrC6_OqFihXRL1VLbQkmhKlCyZU7ZZK345V8sUpbcUW2DvIvdQhx5kBFUNiy8D0zxD1ecAFfTm7RflYgqhvyQ&usqp=CAc', 'Lampu meja LED minimalis dengan 3 level brightness dan color temperature adjustable. Desain elegant untuk workspace modern.', 'Home & Living', 4.6, 67, 18, 'New', 0, 'LumiHome'),
(8, 'Ceramic Planter Set', 189000, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop&auto=format', 'Set 3 pot tanaman keramik dengan desain minimalis. Cocok untuk succulent dan tanaman hias kecil. Dilengkapi drainage hole.', 'Home & Living', 4.5, 92, 25, '', 0, 'GreenSpace'),
(9, 'Scented Soy Candle', 129000, 'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=400&h=400&fit=crop&auto=format', 'Lilin aromaterapi dari soy wax natural dengan wangi lavender yang menenangkan. Burn time hingga 45 jam.', 'Home & Living', 4.8, 145, 40, 'Best Seller', 0, 'CalmScent'),
(10, 'Leather Card Wallet', 249000, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop&auto=format', 'Dompet kartu dari genuine leather dengan 6 slot kartu dan 1 slot uang. Slim design, cocok untuk minimalis.', 'Accessories', 4.6, 88, 20, '', 0, 'LeatherCo'),
(11, 'Classic Analog Watch', 899000, 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=400&fit=crop&auto=format', 'Jam tangan analog classic dengan movement Jepang, case stainless steel, dan strap kulit genuine. Water resistant 30m.', 'Accessories', 4.9, 201, 8, 'Best Seller', 5, 'TimeKeeper'),
(12, 'Polarized Sunglasses', 379000, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop&auto=format', 'Kacamata hitam polarized UV400 dengan frame titanium ringan. Lensa anti-glare untuk kenyamanan maksimal.', 'Accessories', 4.4, 63, 22, 'New', 0, 'ShadeOn'),
(13, 'Smart Fitness Tracker', 599000, 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&h=400&fit=crop&auto=format', 'Fitness tracker dengan heart rate monitor, sleep tracking, step counter, dan notifikasi smartphone. Baterai 7 hari.', 'Gadgets', 4.5, 176, 28, '', 10, 'FitBit'),
(14, 'Portable Power Bank 10000mAh', 299000, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&h=400&fit=crop&auto=format', 'Power bank 10000mAh dengan dual USB output dan USB-C input. Fast charging 18W, compact design untuk travel.', 'Gadgets', 4.3, 134, 50, '', 0, 'ChargePlus'),
(15, 'Wireless Charging Pad', 199000, 'https://m.media-amazon.com/images/I/61oIAKY9s1L.jpg', 'Wireless charger Qi-compatible 15W fast charge. Anti-slip surface, LED indicator, compatible dengan semua smartphone.', 'Gadgets', 4.2, 98, 35, 'New', 0, 'ChargePlus'),
(16, 'Canvas Sneakers Classic', 459000, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&h=400&fit=crop&auto=format', 'Sneakers canvas classic dengan sol rubber vulcanized yang tahan lama. Desain timeless cocok untuk segala occasion.', 'Footwear', 4.6, 189, 30, '', 0, 'StepUp'),
(17, 'Leather Loafers Premium', 789000, 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=400&fit=crop&auto=format', 'Loafers premium dari genuine leather dengan craftsmanship detail. Nyaman dipakai seharian, cocok untuk formal dan casual.', 'Footwear', 4.7, 72, 12, '', 10, 'GentleStep'),
(18, 'Running Shoes Ultra', 699000, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format', 'Sepatu lari ultralight dengan cushioning foam responsif dan mesh breathable. Grip outsole untuk berbagai medan.', 'Footwear', 4.8, 215, 19, 'Best Seller', 0, 'RunFast'),
(19, 'RGB Mechanical Keyboard', 849000, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop&auto=format', 'Keyboard mekanikal RGB dengan switch tactile, hot-swappable, dan PBT keycaps. Full anti-ghosting untuk gaming dan typing.', 'Gaming', 4.7, 167, 14, '', 15, 'KeyMaster'),
(20, 'Gaming Mouse Wireless', 549000, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop&auto=format', 'Mouse gaming wireless dengan sensor 25000 DPI, 6 tombol programmable, dan baterai rechargeable 70 jam.', 'Gaming', 4.5, 143, 21, 'New', 0, 'ClickPro'),
(21, 'Gaming Mousepad XL', 179000, 'https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&h=400&fit=crop&auto=format', 'Mousepad gaming XL (800x300mm) dengan permukaan micro-texture dan base anti-slip rubber. Cocok untuk low-sense gaming.', 'Gaming', 4.3, 76, 40, '', 0, 'ClickPro'),
(22, 'The Art of Clean Code', 159000, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop&auto=format', 'Buku panduan menulis kode yang bersih, readable, dan maintainable. Wajib baca untuk setiap developer.', 'Books', 4.9, 312, 55, 'Best Seller', 0, 'TechBooks'),
(23, 'Design Patterns Handbook', 219000, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&auto=format', 'Panduan lengkap design patterns dalam software engineering. Dilengkapi contoh implementasi praktis dalam berbagai bahasa.', 'Books', 4.6, 89, 30, '', 10, 'TechBooks'),
(24, 'JavaScript: The Good Parts', 189000, 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&h=400&fit=crop&auto=format', 'Eksplorasi mendalam fitur-fitur terbaik JavaScript. Buku klasik yang tetap relevan untuk developer modern.', 'Books', 4.7, 245, 38, '', 0, 'TechBooks');
