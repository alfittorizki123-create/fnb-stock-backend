const joi = require('joi');
const internalService = require('../services/internal.service');
const { successResponse } = require('../utils/response');

// Skema validasi ketat untuk payload prediksi dari Data Scientist
const forecastSchema = joi.object({
  materialId: joi.string().uuid().required().messages({
    'string.guid': 'materialId harus berupa UUID valid',
    'any.required': 'materialId wajib disertakan',
  }),
  predictedStockoutDate: joi.date().iso().required().messages({
    'date.format': 'predictedStockoutDate harus berformat tanggal ISO (YYYY-MM-DDTHH:mm:ssZ)',
    'any.required': 'predictedStockoutDate wajib disertakan',
  }),
  daysRemaining: joi.number().min(0).required().messages({
    'number.min': 'daysRemaining tidak boleh bernilai negatif',
    'any.required': 'daysRemaining wajib disertakan',
  }),
  recommendedReorderQty: joi.number().min(1).required().messages({
    'number.min': 'recommendedReorderQty minimal bernilai 1',
    'any.required': 'recommendedReorderQty wajib disertakan',
  }),
  confidenceScore: joi.number().min(0).max(1).required().messages({
    'number.min': 'confidenceScore minimal 0.0 (0%)',
    'number.max': 'confidenceScore maksimal 1.0 (100%)',
    'any.required': 'confidenceScore wajib disertakan',
  }),
  modelVersion: joi.string().default('v1.0-default'),
});

class InternalController {
  /**
   * Endpoint AI Chatbot: Ringkasan stok cepat
   */
  async getSummary(req, res, next) {
    try {
      const { keyword } = req.query;
      const data = await internalService.getMaterialsSummary(keyword);

      return successResponse(res, {
        statusCode: 200,
        message: 'Ringkasan stok bahan untuk agen AI berhasil dimuat',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Endpoint Data Scientist: Tarik data pergerakan stok time-series
   */
  async getMovements(req, res, next) {
    try {
      const { days } = req.query;
      const data = await internalService.getMovementAnalytics(days);

      return successResponse(res, {
        statusCode: 200,
        message: 'Data pergerakan stok untuk analitik model berhasil dimuat',
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Endpoint Data Scientist: Setor hasil prediksi habis stok
   */
  async createForecast(req, res, next) {
    try {
      // 1. Validasi input via Joi
      const { error, value } = forecastSchema.validate(req.body);
      if (error) {
        error.isJoi = true; // Tandai agar ditangkap rapi oleh errorHandler
        return next(error);
      }

      // 2. Simpan ke database & cache Redis
      const savedData = await internalService.saveForecast(value);

      return successResponse(res, {
        statusCode: 201,
        message: 'Hasil ramalan prediksi stok berhasil disimpan dan di-cache ke Redis',
        data: savedData,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InternalController();