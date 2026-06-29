/**
 * Mengubah baris produk dari DB (snake_case) ke bentuk yang dipakai frontend
 * (camelCase: reviewCount), sehama dengan data/products.json lama.
 */
function serializeProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    image: row.image,
    description: row.description,
    category: row.category,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    stock: row.stock,
    badge: row.badge || '',
    discount: row.discount || 0,
    brand: row.brand || '',
  };
}

/** Menyusun objek order lengkap dengan items untuk respons API. */
function serializeOrder(orderRow, items = []) {
  if (!orderRow) return null;
  return {
    id: orderRow.id,
    userId: orderRow.user_id,
    userEmail: orderRow.user_email,
    customerName: orderRow.customer_name,
    phone: orderRow.phone,
    address: orderRow.address,
    paymentMethod: orderRow.payment_method,
    subtotal: Number(orderRow.subtotal),
    discount: Number(orderRow.discount),
    total: Number(orderRow.total),
    status: orderRow.status,
    date: orderRow.created_at,
    items: items.map((it) => ({
      id: it.product_id,
      name: it.name,
      price: Number(it.price),
      image: it.image,
      quantity: it.quantity,
      discount: it.discount || 0,
    })),
  };
}

module.exports = { serializeProduct, serializeOrder };
