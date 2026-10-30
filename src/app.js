const express = require('express');
const cors = require('cors');
const redis = require('./config/redis');
const { successResponse, errorResponse } = require('./utils/response');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// 1. Middleware Global
app.use(cors()); // Mengizinkan akses dari Frontend React (Cross-Origin Resource Sharing)
app.use(express.json()); // Parsing payload body berformat application/json
app.use(express.urlencoded({ extended: true }));

// 2. Endpoint Healthcheck (Pemeriksaan Kesehatan Server & Redis)
app.get('/health', async (req, res, next) => {
  try {
    // Uji apakah Redis merespons
    const redisStatus = await redis.ping();

    return successResponse(res, {
      statusCode: 200,
      message: 'Sistem F&B Stock Backend beroperasi normal',
      data: {
        status: 'healthy',
        uptime: `${process.uptime().toFixed(2)} detik`,
        redis: redisStatus, // Harusnya 'PONG'
        environment: process.env.NODE_ENV,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Fallback Route: Menangani Rute yang Tidak Terdaftar (404 Not Found)
app.use((req, res) => {
  return errorResponse(res, {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan pada server ini`,
  });
});

// 4. Centralized Error Handler (Wajib paling bawah)
app.use(errorHandler);

module.exports = app;