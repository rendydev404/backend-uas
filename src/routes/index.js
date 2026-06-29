const express = require('express');
const router = express.Router();

const { authRequired, adminOnly } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const adminController = require('../controllers/adminController');
const uploadController = require('../controllers/uploadController');

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

// ---- Upload ----
router.post('/upload', authRequired, adminOnly, upload.single('image'), uploadController.uploadImage);

// ---- Admin ----
router.get('/admin/stats', authRequired, adminOnly, adminController.stats);
router.get('/admin/users', authRequired, adminOnly, adminController.listUsers);
router.post('/admin/users', authRequired, adminOnly, adminController.createUser);
router.put('/admin/users/:id', authRequired, adminOnly, adminController.updateUser);
router.delete('/admin/users/:id', authRequired, adminOnly, adminController.deleteUser);

module.exports = router;
