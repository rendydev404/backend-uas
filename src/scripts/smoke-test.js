/**
 * Smoke test end-to-end untuk API UTSmart.
 * Jalankan setelah deploy (atau lokal) untuk memastikan semua endpoint utama jalan.
 *
 * Pakai:
 *   BASE_URL=https://xxxx.up.railway.app node src/scripts/smoke-test.js
 *   (default BASE_URL = http://localhost:5000)
 *
 * Butuh Node 18+ (global fetch).
 */
const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@utsmart.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function req(method, path, body, token) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

(async () => {
  console.log(`\n🔎 Smoke test → ${BASE}\n`);

  // Health
  const health = await req('GET', '/health');
  check('GET /health', health.status === 200 && health.data.success);

  // Products
  const products = await req('GET', '/api/products');
  check('GET /api/products', products.status === 200 && Array.isArray(products.data.data));
  const firstId = products.data.data && products.data.data[0] && products.data.data[0].id;
  check('produk ter-seed (>0)', products.data.count > 0, `count=${products.data.count}`);

  // Product detail
  if (firstId) {
    const detail = await req('GET', `/api/products/${firstId}`);
    check('GET /api/products/:id', detail.status === 200 && detail.data.data.id === firstId);
  }

  // Register user baru (email unik)
  const email = `smoke_${Date.now()}@example.com`;
  const reg = await req('POST', '/api/auth/register', { name: 'Smoke User', email, password: 'password123' });
  check('POST /api/auth/register', reg.status === 201 && reg.data.token);
  const userToken = reg.data.token;

  // Login admin
  const login = await req('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check('POST /api/auth/login (admin)', login.status === 200 && login.data.isAdmin === true);
  const adminToken = login.data.token;

  // Admin stats
  const stats = await req('GET', '/api/admin/stats', null, adminToken);
  check('GET /api/admin/stats (admin)', stats.status === 200 && typeof stats.data.data.totalProducts === 'number');

  // Create product (admin)
  const created = await req('POST', '/api/products', {
    name: 'Smoke Product', price: 12345, stock: 7, category: 'Test',
  }, adminToken);
  check('POST /api/products (admin)', created.status === 201 && created.data.data.id);
  const newProdId = created.data.data.id;

  // Update product
  const updated = await req('PUT', `/api/products/${newProdId}`, { price: 99999 }, adminToken);
  check('PUT /api/products/:id (admin)', updated.status === 200 && Number(updated.data.data.price) === 99999);

  // Forbidden tanpa admin
  const forbidden = await req('POST', '/api/products', { name: 'x', price: 1 }, userToken);
  check('POST /api/products ditolak utk non-admin', forbidden.status === 403);

  // Checkout (user)
  if (firstId) {
    const checkout = await req('POST', '/api/checkout', {
      items: [{ id: firstId, quantity: 1 }],
      shipping: { name: 'Smoke User', phone: '081200001111', address: 'Jl. Test 1' },
      paymentMethod: 'COD',
    }, userToken);
    check('POST /api/checkout', checkout.status === 201 && checkout.data.orderId, `status=${checkout.status}`);
    check('checkout mengembalikan whatsappUrl/message', !!checkout.data.whatsappMessage);

    // Orders milik user
    const orders = await req('GET', '/api/orders', null, userToken);
    check('GET /api/orders (user)', orders.status === 200 && orders.data.count >= 1);
  }

  // Cleanup: hapus produk smoke
  if (newProdId) {
    const del = await req('DELETE', `/api/products/${newProdId}`, null, adminToken);
    check('DELETE /api/products/:id (admin)', del.status === 200);
  }

  console.log(`\n📊 Hasil: ${passed} lulus, ${failed} gagal\n`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke test error:', err.message);
  process.exit(1);
});
