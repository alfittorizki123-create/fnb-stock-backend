const express = require('express');
const materialController = require('../controllers/material.controller');

const router = express.Router();

// GET /api/v1/materials - Mengambil semua bahan baku & total stok (Cache-Aside Redis)
router.get('/', materialController.getAll);

module.exports = router;