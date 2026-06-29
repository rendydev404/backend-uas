# UTSmart Backend API — Tugas UAS

Backend REST API untuk online store **UTSmart** (lanjutan dari project frontend UTS).
Dibangun dengan **Node.js + Express + MySQL**, lengkap dengan **CRUD Produk**, **Auth (JWT)**,
**Checkout** yang mengirim **notifikasi WhatsApp ke owner via Fonnte**, dan **dashboard admin**.

## ✨ Fitur

- 🔐 **Auth**: register, login (user & admin), JWT, password di-hash (bcrypt)
- 📦 **Produk**: CRUD penuh + search, filter kategori, sorting
- 🛒 **Checkout**: validasi stok, hitung total server-side, kurangi stok (transaksi MySQL)
- 📲 **Notif WhatsApp**: setiap orderan masuk otomatis dikirim ke WA owner (Fonnte API)
- 📊 **Admin**: statistik dashboard, kelola pesanan & status, daftar user
- 🌱 **Auto-seed**: tabel & data awal (admin + 24 produk) dibuat otomatis saat start

## 🧱 Tech Stack

Express • mysql2 • jsonwebtoken • bcryptjs • axios (Fonnte) • cors • dotenv

## 📁 Struktur

```
src/
  server.js              # entry point + middleware + error handler
  config/db.js           # pool MySQL (support Railway & lokal)
  config/initDb.js       # auto create tables + seed
  middleware/auth.js     # JWT sign / verify / adminOnly
  controllers/           # auth, product, order, admin
  routes/index.js        # definisi semua route /api/*
  utils/fonnte.js        # kirim notif WhatsApp
  utils/serialize.js     # map row DB -> bentuk frontend
  data/products.seed.json
database/database.sql     # schema + seed (untuk import manual)
postman/UTSmart_API.postman_collection.json
```

## 🚀 Menjalankan Lokal

1. Pastikan **MySQL** berjalan, lalu salin env:
   ```bash
   cp .env.example .env
   ```
   Isi `DB_*`, `JWT_SECRET`, dan (opsional) `FONNTE_TOKEN` + `OWNER_WA_NUMBER`.

2. Install & jalankan:
   ```bash
   npm install
   npm run dev     # atau: npm start
   ```
   Saat start, tabel & data awal dibuat otomatis. Server: `http://localhost:5000`.

3. (Opsional) import SQL manual: `mysql -u root -p < database/database.sql`

## 🔑 Akun Default

| Role  | Email                | Password   |
|-------|----------------------|------------|
| Admin | admin@utsmart.com    | admin123   |

## 📲 Konfigurasi Notifikasi WhatsApp (Fonnte)

1. Daftar di [fonnte.com](https://fonnte.com), sambungkan device WhatsApp, salin **token**.
2. Isi di `.env`:
   ```
   FONNTE_TOKEN=xxxxxxxxxxxx
   OWNER_WA_NUMBER=6281234567890   # nomor owner, format 62xxx tanpa +
   ```
3. Setiap `POST /api/checkout` berhasil, owner menerima notif orderan di WhatsApp.
   > Jika token belum di-set, checkout tetap sukses dan preview pesan dicetak di log server.

## 📚 Daftar Endpoint

Base URL lokal: `http://localhost:5000` — saat deploy ganti ke URL Railway.

### Auth
| Method | Endpoint              | Akses  | Keterangan          |
|--------|-----------------------|--------|---------------------|
| POST   | `/api/auth/register`  | publik | Daftar user baru    |
| POST   | `/api/auth/login`     | publik | Login → dapat token |
| GET    | `/api/auth/me`        | token  | Profil user login   |

### Produk
| Method | Endpoint                        | Akses | Keterangan                     |
|--------|---------------------------------|-------|--------------------------------|
| GET    | `/api/products`                 | publik| List + `?search=&category=&sort=&minPrice=&maxPrice=` |
| GET    | `/api/products/:id`             | publik| Detail produk                  |
| GET    | `/api/products/meta/categories` | publik| Daftar kategori                |
| POST   | `/api/products`                 | admin | Tambah produk                  |
| PUT    | `/api/products/:id`             | admin | Edit produk                    |
| DELETE | `/api/products/:id`             | admin | Hapus produk                   |

### Checkout & Orders
| Method | Endpoint                  | Akses | Keterangan                              |
|--------|---------------------------|-------|-----------------------------------------|
| POST   | `/api/checkout`           | token | Buat order + notif WA owner             |
| GET    | `/api/orders`             | token | Order milik user (admin: semua order)   |
| GET    | `/api/orders/:id`         | token | Detail order                            |
| PUT    | `/api/orders/:id/status`  | admin | Ubah status (Processing/Shipped/Delivered/Cancelled) |

### Admin
| Method | Endpoint            | Akses | Keterangan          |
|--------|---------------------|-------|---------------------|
| GET    | `/api/admin/stats`  | admin | Statistik dashboard |
| GET    | `/api/admin/users`  | admin | Daftar user         |

Sertakan header `Authorization: Bearer <token>` untuk endpoint yang butuh login.

## ☁️ Deploy ke Railway

1. Push repo ini ke GitHub.
2. Di [railway.app](https://railway.app): **New Project → Deploy from GitHub repo** (pilih repo ini).
3. Tambahkan plugin **MySQL** (New → Database → MySQL). Railway otomatis menyuntik
   variabel koneksi (`MYSQL_URL`, dst) — kode sudah membacanya otomatis.
4. Set **Variables** pada service Node: `JWT_SECRET`, `FONNTE_TOKEN`, `OWNER_WA_NUMBER`,
   dan (opsional) `CORS_ORIGIN` = URL frontend.
5. Deploy. Saat start, tabel & seed dibuat otomatis. Salin domain publik (Settings → Networking)
   sebagai **Base URL** untuk frontend.

## 🧪 Testing dengan Postman

Import `postman/UTSmart_API.postman_collection.json`. Jalankan **Login (admin)** dulu —
token tersimpan otomatis ke variable `{{token}}` dan dipakai request lain. Ubah variable
`baseUrl` ke URL Railway saat menguji versi deploy.
