/**
 * Membuat link "click-to-chat" WhatsApp (wa.me) berisi detail pesanan.
 *
 * Alur: setelah checkout, customer diarahkan ke WhatsApp owner dengan pesan
 * pesanan yang sudah terisi otomatis (dinamis), tinggal tekan kirim.
 *
 * Env:
 *   - OWNER_WA_NUMBER : nomor WA owner (format internasional tanpa +, mis. 6281234567890)
 */

/** Menyusun isi pesan pesanan yang dinamis. */
function buildOrderMessage(order) {
  const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const items = (order.items || [])
    .map((it, i) => `${i + 1}. ${it.name} x${it.quantity} = ${rupiah(it.price * it.quantity)}`)
    .join('\n');

  return (
    `Halo Admin UTSmart, saya mau konfirmasi pesanan:\n\n` +
    `🆔 Order ID : ${order.id}\n` +
    `👤 Nama     : ${order.customer_name}\n` +
    `📱 No. HP   : ${order.phone}\n` +
    `🏠 Alamat   : ${order.address}\n` +
    `💳 Pembayaran: ${order.payment_method}\n\n` +
    `🛒 Detail Pesanan:\n${items}\n\n` +
    `Subtotal : ${rupiah(order.subtotal)}\n` +
    `Diskon   : -${rupiah(order.discount)}\n` +
    `TOTAL    : ${rupiah(order.total)}\n\n` +
    `Mohon diproses ya, terima kasih 🙏`
  );
}

/**
 * Mengembalikan URL wa.me lengkap dengan pesan ter-encode.
 * Jika OWNER_WA_NUMBER belum di-set, kembalikan null + preview pesan.
 */
function buildWhatsappUrl(order) {
  const owner = (process.env.OWNER_WA_NUMBER || '').replace(/[^0-9]/g, '');
  const message = buildOrderMessage(order);

  if (!owner) {
    console.warn('[whatsapp] OWNER_WA_NUMBER belum di-set. URL WA tidak dibuat.');
    return { url: null, message };
  }

  const url = `https://wa.me/${owner}?text=${encodeURIComponent(message)}`;
  return { url, message };
}

module.exports = { buildOrderMessage, buildWhatsappUrl };
