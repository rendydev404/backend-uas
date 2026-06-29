/** POST /api/upload — admin upload gambar, mengembalikan URL publik file. */
function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File gambar tidak ditemukan' });
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.get('host');
  const url = `${protocol}://${host}/uploads/${req.file.filename}`;

  return res.status(201).json({ success: true, message: 'Upload berhasil', url });
}

module.exports = { uploadImage };
