const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { signToken } = require('../middleware/auth');

/** POST /api/auth/register */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const id = Date.now().toString();
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, hashed, 'user']
    );

    const user = { id, name, email, role: 'user' };
    const token = signToken(user);
    return res.status(201).json({ success: true, message: 'Registrasi berhasil', token, user });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const dbUser = rows[0];
    const match = await bcrypt.compare(password, dbUser.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
    const token = signToken(user);
    return res.json({
      success: true,
      message: 'Login berhasil',
      isAdmin: user.role === 'admin',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me  (butuh token) */
async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
