require('dotenv').config();
const initDb = require('../config/initDb');

(async () => {
  try {
    await initDb();
    console.log('✅ Seeding selesai (tabel dibuat + admin & produk default).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal seeding:', err);
    process.exit(1);
  }
})();
