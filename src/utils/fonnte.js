const axios = require('axios');

/**
 * Mengirim pesan WhatsApp ke owner via Fonnte (https://fonnte.com).
 *
 * Membutuhkan env:
 *   - FONNTE_TOKEN     : token device dari dashboard Fonnte
 *   - OWNER_WA_NUMBER  : nomor WA owner (format 62xxxx, tanpa +)
 *
 * Jika kedua env belum di-set, fungsi tidak melempar error melainkan
 * mengembalikan { sent:false } dan mencetak pesan ke log, agar checkout
 * tetap berhasil walau gateway belum dikonfigurasi.
 */
async function sendOrderNotification(order) {
  const token = process.env.FONNTE_TOKEN;
  const target = process.env.OWNER_WA_NUMBER;
  const message = buildOrderMessage(order);

  if (!token || !target) {
    console.warn('[fonnte] FONNTE_TOKEN / OWNER_WA_NUMBER belum di-set. Notif WA dilewati.');
    console.log('[fonnte] Preview pesan notif:\n' + message);
    return { sent: false, reason: 'not_configured', preview: message };
  }

  try {
    const res = await axios.post(
      'https://api.fonnte.com/send',
      { target, message },
      { headers: { Authorization: token }, timeout: 15000 }
    );
    console.log('[fonnte] Notif terkirim ke owner:', res.data);
    return { sent: true, response: res.data };
  } catch (err) {
    const detail = err.response ? err.response.data : err.message;
    console.error('[fonnte] Gagal kirim notif:', detail);
    return { sent: false, reason: 'request_failed', detail };
  }
}

/** Menyusun isi pesan notifikasi orderan. */
function buildOrderMessage(order) {
  const rupiah = (n) =>
    'Rp ' + Number(n || 0).toLocaleString('id-ID');

  const items = (order.items || [])
    .map((it, i) => `${i + 1}. ${it.name} x${it.quantity} = ${rupiah(it.price * it.quantity)}`)
    .join('\n');

  return (
    `🛒 *ORDERAN BARU MASUK - UTSmart*\n\n` +
    `🆔 Order ID : ${order.id}\n` +
    `👤 Nama     : ${order.customer_name}\n` +
    `📱 No. HP   : ${order.phone}\n` +
    `📧 Email    : ${order.user_email || '-'}\n` +
    `🏠 Alamat   : ${order.address}\n` +
    `💳 Pembayaran: ${order.payment_method}\n\n` +
    `*Detail Pesanan:*\n${items}\n\n` +
    `Subtotal : ${rupiah(order.subtotal)}\n` +
    `Diskon   : -${rupiah(order.discount)}\n` +
    `*TOTAL   : ${rupiah(order.total)}*\n\n` +
    `Status   : ${order.status}\n` +
    `Waktu    : ${new Date(order.created_at || Date.now()).toLocaleString('id-ID')}`
  );
}

module.exports = { sendOrderNotification, buildOrderMessage };
