const bcrypt = require('bcryptjs');
const pool = require('../config/db');

/** User dianggap "online" jika last_seen dalam N menit terakhir. */
const ONLINE_WINDOW_MINUTES = 5;

/** GET /api/admin/stats — ringkasan untuk dashboard admin */
async function stats(req, res, next) {
  try {
    const [[users]] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'user'");
    const [[allUsers]] = await pool.query('SELECT COUNT(*) AS total FROM users');
    const [[orders]] = await pool.query('SELECT COUNT(*) AS total FROM orders');
    const [[products]] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [[revenue]] = await pool.query("SELECT COALESCE(SUM(total),0) AS total FROM orders WHERE status <> 'Cancelled'");
    const [[online]] = await pool.query(
      'SELECT COUNT(*) AS total FROM users WHERE last_seen >= DATE_SUB(NOW(), INTERVAL ? MINUTE)',
      [ONLINE_WINDOW_MINUTES]
    );

    return res.json({
      success: true,
      data: {
        totalUsers: users.total,
        totalUsersIncludingAdmin: allUsers.total,
        totalOrders: orders.total,
        totalProducts: products.total,
        totalRevenue: Number(revenue.total),
        onlineUsers: online.total,
      },
    });
  } catch (err) {
    next(err);
  }
}

function withOnlineStatus(row) {
  const isOnline =
    !!row.last_seen &&
    Date.now() - new Date(row.last_seen).getTime() <= ONLINE_WINDOW_MINUTES * 60 * 1000;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    last_seen: row.last_seen,
    isOnline,
  };
}

/** GET /api/admin/users — daftar user (tanpa password) + status online/offline */
async function listUsers(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, last_seen, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json({ success: true, count: rows.length, data: rows.map(withOnlineStatus) });
  } catch (err) {
    next(err);
  }
}

/** POST /api/admin/users — admin membuat user baru */
async function createUser(req, res, next) {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
    }
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Role harus 'user' atau 'admin'" });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const id = Date.now().toString();
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashed, role]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, role, last_seen, created_at FROM users WHERE id = ?',
      [id]
    );
    return res.status(201).json({ success: true, message: 'Pengguna dibuat', data: withOnlineStatus(rows[0]) });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/admin/users/:id — admin mengedit user (nama/email/role/password opsional) */
async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const cur = existing[0];
    const { name, email, role, password } = req.body;

    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: "Role harus 'user' atau 'admin'" });
    }

    if (email && email !== cur.email) {
      const [dupe] = await pool.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, id]);
      if (dupe.length > 0) {
        return res.status(409).json({ success: false, message: 'Email sudah dipakai pengguna lain' });
      }
    }

    const nextPassword = password ? await bcrypt.hash(password, 10) : cur.password;

    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?',
      [name ?? cur.name, email ?? cur.email, role ?? cur.role, nextPassword, id]
    );

    const [rows] = await pool.query(
      'SELECT id, name, email, role, last_seen, created_at FROM users WHERE id = ?',
      [id]
    );
    return res.json({ success: true, message: 'Pengguna diperbarui', data: withOnlineStatus(rows[0]) });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/admin/users/:id — admin menghapus user */
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri' });
    }

    const [targetUsers] = await pool.query('SELECT name, email FROM users WHERE id = ?', [id]);
    if (targetUsers.length === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const targetUser = targetUsers[0];
    if (targetUser.name.toLowerCase().includes('rendy') || targetUser.email.toLowerCase().includes('rendy') || targetUser.email === 'admin@utsmart.com') {
      return res.status(403).json({ success: false, message: 'lawak lu mau apus akun developernya?' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.json({ success: true, message: 'Pengguna dihapus' });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats, listUsers, createUser, updateUser, deleteUser };
