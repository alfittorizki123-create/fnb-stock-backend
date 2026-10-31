const supabase = require('../config/supabase');

class MaterialRepository {
  /**
   * Mengambil semua bahan baku beserta total stok dari seluruh batch aktif
   */
  async getAllWithStock() {
    const { data, error } = await supabase
      .from('raw_materials')
      .select(`
        id,
        name,
        category,
        unit,
        minimum_stock,
        stock_batches (
          current_quantity,
          expiry_date
        )
      `);

    if (error) {
      throw new Error(`[DB Error]: ${error.message}`);
    }

    // Hitung total stok aktual dari batch yang belum kadaluwarsa
    return data.map((material) => {
      const totalStock = material.stock_batches.reduce(
        (sum, batch) => sum + Number(batch.current_quantity),
        0
      );

      return {
        id: material.id,
        name: material.name,
        category: material.category,
        unit: material.unit,
        minimumStock: Number(material.minimum_stock),
        currentStock: totalStock,
        isLowStock: totalStock <= Number(material.minimum_stock),
      };
    });
  }
}

module.exports = new MaterialRepository();