const supabase = require('../config/supabase');
const redis = require('../config/redis');

class OrderService {
  /**
   * Memproses pesanan menu makanan dengan proteksi Redis Distributed Lock & FIFO
   */
  async processOrder({ menuItemId, quantity = 1, referenceId = `INV-${Date.now()}` }) {
    const lockKey = `lock:menu:${menuItemId}`;
    const lockTTL = 5; // Kunci bertahan maksimal 5 detik

    // 1. ACQUIRE LOCK (Redis Atomic Lock)
    const lockAcquired = await redis.set(lockKey, 'LOCKED', 'NX', 'EX', lockTTL);
    if (!lockAcquired) {
      const error = new Error('Stok menu ini sedang diproses oleh transaksi lain. Silakan coba sesaat lagi.');
      error.statusCode = 409;
      error.code = 'CONCURRENT_TRANSACTION_CONFLICT';
      throw error;
    }

    try {
      // 2. Ambil data menu dan resep komposisinya
      const { data: menuItem, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          price,
          menu_recipes (
            material_id,
            quantity_required,
            raw_materials (name, unit)
          )
        `)
        .eq('id', menuItemId)
        .single();

      if (menuError || !menuItem) {
        const error = new Error('Menu makanan tidak ditemukan');
        error.statusCode = 404;
        error.code = 'MENU_NOT_FOUND';
        throw error;
      }

      // 3. Validasi: Apakah semua bahan baku mencukupi sebelum dipotong?
      const deductions = [];

      for (const recipe of menuItem.menu_recipes) {
        const totalNeeded = Number(recipe.quantity_required) * quantity;
        const materialId = recipe.material_id;

        // Ambil semua batch aktif yang belum habis (urutkan FIFO: expiry_date paling dekat duluan)
        const { data: batches, error: batchError } = await supabase
          .from('stock_batches')
          .select('id, batch_number, current_quantity, expiry_date')
          .eq('material_id', materialId)
          .gt('current_quantity', 0)
          .order('expiry_date', { ascending: true });

        if (batchError) throw batchError;

        const totalAvailable = batches.reduce((sum, b) => sum + Number(b.current_quantity), 0);
        if (totalAvailable < totalNeeded) {
          const error = new Error(
            `Stok bahan '${recipe.raw_materials.name}' tidak mencukupi! Butuh ${totalNeeded} ${recipe.raw_materials.unit}, sisa ${totalAvailable} ${recipe.raw_materials.unit}`
          );
          error.statusCode = 400;
          error.code = 'INSUFFICIENT_STOCK';
          throw error;
        }

        deductions.push({
          materialId,
          materialName: recipe.raw_materials.name,
          unit: recipe.raw_materials.unit,
          totalNeeded,
          batches,
        });
      }

      // 4. EKSEKUSI PENGURANGAN STOK FIFO & CATAT AUDIT TRAIL DATA SCIENTIST
      const movementRecords = [];

      for (const item of deductions) {
        let remainingToDeduct = item.totalNeeded;

        for (const batch of item.batches) {
          if (remainingToDeduct <= 0) break;

          const batchQty = Number(batch.current_quantity);
          const deductAmount = Math.min(batchQty, remainingToDeduct);
          const newBatchQty = batchQty - deductAmount;

          // Update kuantitas batch di database
          const { error: updateError } = await supabase
            .from('stock_batches')
            .update({ current_quantity: newBatchQty })
            .eq('id', batch.id);

          if (updateError) throw updateError;

          // Catat riwayat mutasi untuk pelatihan model Data Scientist
          movementRecords.push({
            material_id: item.materialId,
            batch_id: batch.id,
            quantity_delta: -deductAmount, // Nilai minus menandakan bahan keluar
            movement_type: 'SALE_ORDER',
            reference_id: referenceId,
          });

          remainingToDeduct -= deductAmount;
        }
      }

      // Simpan seluruh jejak audit ke tabel stock_movements
      if (movementRecords.length > 0) {
        const { error: moveError } = await supabase
          .from('stock_movements')
          .insert(movementRecords);

        if (moveError) console.error('Gagal mencatat audit movement:', moveError.message);
      }

      // 5. CACHE INVALIDATION: Hapus cache Redis agar katalog stok langsung terupdate
      await redis.del('cache:materials:all');

      return {
        orderId: referenceId,
        menuName: menuItem.name,
        quantityOrdered: quantity,
        totalPrice: Number(menuItem.price) * quantity,
        materialsDeducted: deductions.map((d) => ({
          material: d.materialName,
          amountDeducted: `${d.totalNeeded} ${d.unit}`,
        })),
      };
    } finally {
      // 6. RELEASE LOCK: Selalu buka gembok gembok kembali
      await redis.del(lockKey);
    }
  }
}

module.exports = new OrderService();