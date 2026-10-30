const { errorResponse } = require('../utils/response');

/**
 * Middleware penanganan error terpusat (Zero-Crash Policy)
 */
const errorHandler = (err, req, res, next) => {
  console.error(`💥 [Error ${req.method} ${req.url}]:`, err.message);

  // 1. Tangani Error Validasi Joi
  if (err.isJoi) {
    const details = err.details.map((item) => ({
      field: item.context?.key || item.path.join('.'),
      message: item.message.replace(/['"]/g, ''),
    }));

    return errorResponse(res, {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Format data input tidak valid',
      details,
    });
  }

  // 2. Tangani Custom App Error (jika controller melempar statusCode spesifik)
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'Terjadi kesalahan internal pada server';

  return errorResponse(res, {
    statusCode,
    code,
    message,
    details: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
};

module.exports = errorHandler;