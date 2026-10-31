const orderService = require('../services/order.service');
const { successResponse } = require('../utils/response');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const { menuItemId, quantity, referenceId } = req.body;

      const orderResult = await orderService.processOrder({
        menuItemId,
        quantity: quantity || 1,
        referenceId,
      });

      return successResponse(res, {
        statusCode: 201,
        message: 'Pesanan berhasil diproses dan stok bahan telah dipotong via FIFO',
        data: orderResult,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();