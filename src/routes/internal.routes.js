const express = require('express');
const internalController = require('../controllers/internal.controller');

const router = express.Router();

// 1. Jalur AI Engineer: Ringkasan stok cepat untuk Chatbot Gudang
router.get('/materials/summary', internalController.getSummary);

// 2. Jalur Data Scientist: Tarik riwayat mutasi stok (time-series training data)
router.get('/analytics/movements', internalController.getMovements);

// 3. Jalur Data Scientist: Setor hasil prediksi masa depan ke Supabase & Redis
router.post('/forecasts', internalController.createForecast);

module.exports = router;