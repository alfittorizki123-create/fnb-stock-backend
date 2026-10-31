const express = require('express');
const orderController = require('../controllers/order.controller');

const router = express.Router();

// POST /api/v1/orders - Memproses order, memotong stok resep (FIFO + Redis Lock)
router.post('/', orderController.createOrder);

module.exports = router;