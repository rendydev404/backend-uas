const fs = require('fs');
const path = require('path');
const multer = require('multer');

/**
 * Direktori penyimpanan gambar upload.
 * Di Railway, di-mount ke volume persisten (/app/uploads) lewat env UPLOAD_DIR
 * agar file tidak hilang saat redeploy. Default lokal: ./uploads di root project.
 */
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error('Format gambar harus JPG, PNG, WEBP, atau GIF'));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_DIR };
