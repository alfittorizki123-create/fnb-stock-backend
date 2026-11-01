const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const express = require('express');
const cors = require('cors');
const redis = require('./config/redis');
const { successResponse, errorResponse } = require('./utils/response');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const materialRoutes = require('./routes/material.routes');
const orderRoutes = require('./routes/order.routes');
const internalRoutes = require('./routes/internal.routes');
const internalAuth = require('./middlewares/internalAuth');

const app = express();

// 1. Middleware Global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/swagger.json', (req, res) => res.json(swaggerDocument));

// 2. Endpoint Healthcheck
app.get('/reference', (req, res) => {
  res.send(`
    <!doctype html>
    <html>
      <head>
        <title>F&B Stock API - Scalar Reference</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <script id="api-reference" data-url="/swagger.json"></script>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
      </body>
    </html>
  `);
});
app.get('/health', async (req, res, next) => {
  try {
    const redisStatus = await redis.ping();

    return successResponse(res, {
      statusCode: 200,
      message: 'Sistem F&B Stock Backend beroperasi normal',
      data: {
        status: 'healthy',
        uptime: `${process.uptime().toFixed(2)} detik`,
        redis: redisStatus,
        environment: process.env.NODE_ENV,
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. API Routes v1
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/internal', internalAuth, internalRoutes);

// 4. Fallback Route (404 Not Found)
app.use((req, res) => {
  return errorResponse(res, {
    statusCode: 404,
    code: 'ROUTE_NOT_FOUND',
    message: `Rute '${req.method} ${req.originalUrl}' tidak ditemukan pada server ini`,
  });
});

// 5. Centralized Error Handler (Wajib paling bawah)
app.use(errorHandler);

module.exports = app;