const materialService = require('../services/material.service');
const { successResponse } = require('../utils/response');

class MaterialController {
  async getAll(req, res, next) {
    try {
      const result = await materialService.getMaterials();

      return successResponse(res, {
        statusCode: 200,
        message: 'Data katalog stok bahan berhasil dimuat',
        data: result.materials,
        meta: {
          dataSource: result.source,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MaterialController();