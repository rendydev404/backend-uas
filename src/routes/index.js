const express = require('express');
const router = express.Router();

const { authRequired, adminOnly } = require('../middleware/auth');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const adminController = require('../controllers/adminController');

// ---- Auth ----
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authRequired, authController.me);

// ---- Products ----
router.get('/products', productController.getAll);
router.get('/products/meta/categories', productController.categories);
router.get('/products/:id', productController.getById);
router.post('/products', authRequired, adminOnly, productController.create);
router.put('/products/:id', authRequired, adminOnly, productController.update);
router.delete('/products/:id', authRequired, adminOnly, productController.remove);

// ---- Checkout & Orders ----
router.post('/checkout', authRequired, orderController.checkout);
router.get('/orders', authRequired, orderController.getAll);
router.get('/orders/:id', authRequired, orderController.getById);
router.put('/orders/:id/status', authRequired, adminOnly, orderController.updateStatus);

// ---- Admin ----
router.get('/admin/stats', authRequired, adminOnly, adminController.stats);
router.get('/admin/users', authRequired, adminOnly, adminController.listUsers);

module.exports = router;
