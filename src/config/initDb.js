const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('./db');

/**
 * Membuat tabel-tabel yang dibutuhkan jika belum ada, lalu seed data awal
 * (admin default + daftar produk). Dipanggil sekali saat server start sehingga
 * deploy ke Railway tidak perlu import SQL manual.
 */
async function initDb() {
  await createTables();
  await seedAdmin();
  await seedProducts();
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           VARCHAR(40)  PRIMARY KEY,
      name         VARCHAR(120) NOT NULL,
      email        VARCHAR(160) NOT NULL UNIQUE,
      password     VARCHAR(200) NOT NULL,
      role         ENUM('user','admin') NOT NULL DEFAULT 'user',
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
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
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
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
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
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
  `);
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@utsmart.com';
  const [rows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (rows.length > 0) return;

  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await pool.query(
    'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
    ['admin', process.env.ADMIN_NAME || 'Administrator', email, hashed, 'admin']
  );
  console.log(`[seed] Admin default dibuat: ${email}`);
}

async function seedProducts() {
  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM products');
  if (rows[0].count > 0) return;

  const seedPath = path.join(__dirname, '..', 'data', 'products.seed.json');
  const products = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

  for (const p of products) {
    await pool.query(
      `INSERT INTO products
        (id, name, price, image, description, category, rating, review_count, stock, badge, discount, brand)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.id,
        p.name,
        p.price,
        p.image,
        p.description,
        p.category,
        p.rating,
        p.reviewCount || 0,
        p.stock || 0,
        p.badge || '',
        p.discount || 0,
        p.brand || '',
      ]
    );
  }
  console.log(`[seed] ${products.length} produk berhasil di-seed`);
}

module.exports = initDb;
