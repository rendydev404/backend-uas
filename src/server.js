require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const apiRoutes = require('./routes');
const initDb = require('./config/initDb');

const { UPLOAD_DIR } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Diperlukan agar req.protocol terbaca benar (https) di belakang proxy Railway
app.set('trust proxy', 1);

// ---- CORS ----
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : '*',
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

// ---- Health & root ----
app.get('/', (req, res) => {
  res.json({
    name: 'UTSmart API',
    status: 'online',
    docs: '/api',
    health: '/health',
  });
});

app.get('/health', (req, res) => res.json({ success: true, status: 'healthy', uptime: process.uptime() }));

// Ringkasan daftar endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'UTSmart REST API',
    endpoints: {
      auth: ['POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me'],
      products: [
        'GET /api/products',
        'GET /api/products/:id',
        'GET /api/products/meta/categories',
        'POST /api/products (admin)',
        'PUT /api/products/:id (admin)',
        'DELETE /api/products/:id (admin)',
      ],
      checkout: ['POST /api/checkout'],
      orders: [
        'GET /api/orders',
        'GET /api/orders/:id',
        'PUT /api/orders/:id/status (admin)',
      ],
      admin: ['GET /api/admin/stats (admin)', 'GET /api/admin/users (admin)'],
    },
  });
});

// ---- API ----
app.use('/api', apiRoutes);

// ---- 404 ----
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}` });
});

// ---- Error handler ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Ukuran gambar maksimal 5MB' });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server',
  });
});

// ---- Start ----
async function start() {
  try {
    await initDb();
    console.log('[db] Inisialisasi database selesai');
  } catch (err) {
    console.error('[db] Gagal inisialisasi database:', err.message);
    console.error('     Pastikan MySQL berjalan & kredensial di .env benar.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 UTSmart API berjalan di http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
