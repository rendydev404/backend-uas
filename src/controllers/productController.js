const pool = require('../config/db');
const { serializeProduct } = require('../utils/serialize');

/** GET /api/products  — mendukung query: search, category, sort, minPrice, maxPrice */
async function getAll(req, res, next) {
  try {
    const { search, category, sort, minPrice, maxPrice } = req.query;
    const where = [];
    const params = [];

    if (search) {
      where.push('name LIKE ?');
      params.push(`%${search}%`);
    }
    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (minPrice) {
      where.push('price >= ?');
      params.push(Number(minPrice));
    }
    if (maxPrice) {
      where.push('price <= ?');
      params.push(Number(maxPrice));
    }

    let sql = 'SELECT * FROM products';
    if (where.length) sql += ' WHERE ' + where.join(' AND ');

    const sortMap = {
      'price-low': 'price ASC',
      'price-high': 'price DESC',
      rating: 'rating DESC',
      newest: 'created_at DESC',
    };
    sql += ' ORDER BY ' + (sortMap[sort] || 'id ASC');

    const [rows] = await pool.query(sql, params);
    return res.json({ success: true, count: rows.length, data: rows.map(serializeProduct) });
  } catch (err) {
    next(err);
  }
}

/** GET /api/products/:id */
async function getById(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ? LIMIT 1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    return res.json({ success: true, data: serializeProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/products  (admin) */
async function create(req, res, next) {
  try {
    const {
      name, price, image, description, category,
      rating = 0, reviewCount = 0, stock = 0, badge = '', discount = 0, brand = '',
    } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ success: false, message: 'Nama dan harga produk wajib diisi' });
    }

    const [result] = await pool.query(
      `INSERT INTO products
        (name, price, image, description, category, rating, review_count, stock, badge, discount, brand)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, price, image, description, category, rating, reviewCount, stock, badge, discount, brand]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [result.insertId]);
    return res.status(201).json({ success: true, message: 'Produk dibuat', data: serializeProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/products/:id  (admin) */
async function update(req, res, next) {
  try {
    const [existing] = await pool.query('SELECT * FROM products WHERE id = ? LIMIT 1', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }

    const cur = existing[0];
    const b = req.body;
    const next_ = {
      name: b.name ?? cur.name,
      price: b.price ?? cur.price,
      image: b.image ?? cur.image,
      description: b.description ?? cur.description,
      category: b.category ?? cur.category,
      rating: b.rating ?? cur.rating,
      review_count: b.reviewCount ?? cur.review_count,
      stock: b.stock ?? cur.stock,
      badge: b.badge ?? cur.badge,
      discount: b.discount ?? cur.discount,
      brand: b.brand ?? cur.brand,
    };

    await pool.query(
      `UPDATE products SET
        name=?, price=?, image=?, description=?, category=?,
        rating=?, review_count=?, stock=?, badge=?, discount=?, brand=?
       WHERE id=?`,
      [
        next_.name, next_.price, next_.image, next_.description, next_.category,
        next_.rating, next_.review_count, next_.stock, next_.badge, next_.discount, next_.brand,
        req.params.id,
      ]
    );

    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    return res.json({ success: true, message: 'Produk diperbarui', data: serializeProduct(rows[0]) });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/products/:id  (admin) */
async function remove(req, res, next) {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Produk dihapus' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/products/meta/categories — daftar kategori unik */
async function categories(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category'
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, create, update, remove, categories };
