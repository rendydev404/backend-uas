const pool = require('../config/db');
const { serializeOrder } = require('../utils/serialize');
const { sendOrderNotification } = require('../utils/fonnte');

/** Membuat ID transaksi: TRX-YYYYMMDD-XXXXX */
function generateTransactionId() {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `TRX-${ymd}-${rand}`;
}

/**
 * POST /api/checkout  (butuh login)
 * Body: { items:[{id, quantity}], shipping:{name, phone, address}, paymentMethod }
 * Harga & diskon dihitung ulang dari DB (anti manipulasi), stok dikurangi,
 * lalu notif dikirim ke WA owner via Fonnte.
 */
async function checkout(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { items, shipping, paymentMethod } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Keranjang kosong' });
    }
    if (!shipping || !shipping.name || !shipping.phone || !shipping.address) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Data pengiriman (nama, no HP, alamat) wajib diisi' });
    }

    await conn.beginTransaction();

    // Ambil produk dari DB & hitung ulang total
    const lineItems = [];
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of items) {
      const [rows] = await conn.query('SELECT * FROM products WHERE id = ? LIMIT 1 FOR UPDATE', [item.id]);
      if (rows.length === 0) {
        throw httpError(404, `Produk id ${item.id} tidak ditemukan`);
      }
      const product = rows[0];
      const qty = Number(item.quantity) || 1;

      if (product.stock < qty) {
        throw httpError(400, `Stok "${product.name}" tidak mencukupi (sisa ${product.stock})`);
      }

      const lineTotal = Number(product.price) * qty;
      subtotal += lineTotal;
      if (product.discount > 0) {
        discountTotal += lineTotal * (product.discount / 100);
      }

      lineItems.push({
        product_id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image,
        quantity: qty,
        discount: product.discount || 0,
      });

      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [qty, product.id]);
    }

    subtotal = Math.round(subtotal);
    discountTotal = Math.round(discountTotal);
    const total = subtotal - discountTotal;

    const orderId = generateTransactionId();
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : null;

    await conn.query(
      `INSERT INTO orders
        (id, user_id, user_email, customer_name, phone, address, payment_method, subtotal, discount, total, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing')`,
      [orderId, userId, userEmail, shipping.name, shipping.phone, shipping.address,
       paymentMethod || 'Bank Transfer', subtotal, discountTotal, total]
    );

    for (const li of lineItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, name, price, image, quantity, discount)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, li.product_id, li.name, li.price, li.image, li.quantity, li.discount]
      );
    }

    await conn.commit();
    conn.release();

    const orderForNotif = {
      id: orderId,
      user_email: userEmail,
      customer_name: shipping.name,
      phone: shipping.phone,
      address: shipping.address,
      payment_method: paymentMethod || 'Bank Transfer',
      subtotal, discount: discountTotal, total,
      status: 'Processing',
      created_at: new Date(),
      items: lineItems,
    };

    // Kirim notif WA owner (tidak memblokir keberhasilan order)
    const notif = await sendOrderNotification(orderForNotif);

    return res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat',
      orderId,
      whatsappNotification: notif,
      data: serializeOrder(
        { ...orderForNotif, user_id: userId },
        lineItems
      ),
    });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

/** GET /api/orders  — admin: semua order; user biasa: order miliknya */
async function getAll(req, res, next) {
  try {
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (req.user.role !== 'admin') {
      sql += ' WHERE user_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY created_at DESC';

    const [orders] = await pool.query(sql, params);
    const result = [];
    for (const o of orders) {
      const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      result.push(serializeOrder(o, items));
    }
    return res.json({ success: true, count: result.length, data: result });
  } catch (err) {
    next(err);
  }
}

/** GET /api/orders/:id */
async function getById(req, res, next) {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    const order = orders[0];
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tidak boleh mengakses order ini' });
    }
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    return res.json({ success: true, data: serializeOrder(order, items) });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/orders/:id/status  (admin) */
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowed = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Status harus salah satu dari: ${allowed.join(', ')}` });
    }
    const [result] = await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Order tidak ditemukan' });
    }
    return res.json({ success: true, message: `Status order diubah menjadi ${status}` });
  } catch (err) {
    next(err);
  }
}

function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

module.exports = { checkout, getAll, getById, updateStatus };
