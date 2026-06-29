const mysql = require('mysql2/promise');

/**
 * Membuat connection pool MySQL.
 *
 * Mendukung dua mode konfigurasi:
 *  1. Railway  -> memakai connection string (MYSQL_URL / DATABASE_URL) yang
 *     otomatis disuntikkan oleh Railway saat plugin MySQL ditambahkan.
 *  2. Lokal    -> memakai variabel terpisah DB_HOST, DB_PORT, dst.
 */
function buildPool() {
  const connectionString =
    process.env.MYSQL_URL ||
    process.env.DATABASE_URL ||
    process.env.MYSQL_PUBLIC_URL;

  const baseOptions = {
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    namedPlaceholders: true,
  };

  if (connectionString) {
    return mysql.createPool({ uri: connectionString, ...baseOptions });
  }

  return mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'utsmart',
    ...baseOptions,
  });
}

const pool = buildPool();

module.exports = pool;
