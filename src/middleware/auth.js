const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'utsmart_dev_secret';

/** Membuat JWT untuk user yang berhasil login. */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/** Memverifikasi token; menaruh payload di req.user. */
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan, silakan login' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    // Tandai user sebagai "online" (best-effort, tidak menunggu/blocking request)
    pool.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [req.user.id]).catch(() => {});
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau kadaluarsa' });
  }
}

/** Memastikan user adalah admin. Harus dipasang setelah authRequired. */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses khusus admin' });
  }
  next();
}

module.exports = { signToken, authRequired, adminOnly, JWT_SECRET };
