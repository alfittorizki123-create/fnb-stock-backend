const config = require('../config/env');
const { errorResponse } = require('../utils/response');

/**
 * Middleware untuk mengamankan komunikasi internal (Service-to-Service)
 * Digunakan khusus untuk request dari AI Engineer (FastAPI) dan Data Scientist (Python)
 */
const internalAuth = (req, res, next) => {
  const incomingSecret = req.headers['x-internal-secret'];

  // Cek apakah header rahasia disertakan dan cocok dengan konfigurasi .env
  if (!incomingSecret || incomingSecret !== config.internalApiKey) {
    return errorResponse(res, {
      statusCode: 401,
      code: 'UNAUTHORIZED_INTERNAL_ACCESS',
      message: 'Akses ditolak: Header X-Internal-Secret tidak valid atau tidak disertakan',
    });
  }

  // Jika kunci cocok, izinkan request melanjutkan ke controller
  next();
};

module.exports = internalAuth;