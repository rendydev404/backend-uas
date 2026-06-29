const pool = require('../config/db');

/** GET /api/admin/stats — ringkasan untuk dashboard admin */
async function stats(req, res, next) {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'user'");
    const [[allUsers]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [[orders]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
    const [[products]] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [[revenue]] = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status <> 'Cancelled'");

    return res.json({
      success: true,
      data: {
        totalUsers: users.total,
        totalUsersIncludingAdmin: allUsers.total,
        totalOrders: orders.total,
        totalProducts: products.total,
        totalRevenue: Number(revenue.total),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/admin/users — daftar user (tanpa password) */
async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, listUsers };
