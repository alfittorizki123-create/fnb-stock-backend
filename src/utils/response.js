/**
 * Helper untuk menyeragamkan format JSON respons sukses
 */
const successResponse = (res, { statusCode = 200, message = 'Operasi berhasil', data = null, meta = null }) => {
  const responseBody = {
    success: true,
    message,
    data,
  };

  if (meta) {
    responseBody.meta = {
      ...meta,
      timestamp: new Date().toISOString(),
    };
  } else {
    responseBody.meta = {
      timestamp: new Date().toISOString(),
    };
  }

  return res.status(statusCode).json(responseBody);
};

/**
 * Helper untuk menyeragamkan format JSON respons gagal
 */
const errorResponse = (res, { statusCode = 500, code = 'INTERNAL_SERVER_ERROR', message = 'Terjadi kesalahan pada server', details = null }) => {
  const responseBody = {
    success: false,
    error: {
      code,
      message,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  if (details) {
    responseBody.error.details = details;
  }

  return res.status(statusCode).json(responseBody);
};

module.exports = {
  successResponse,
  errorResponse,
};