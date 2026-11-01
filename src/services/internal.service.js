const supabase = require('../config/supabase');
const redis = require('../config/redis');
const materialService = require('./material.service');

class InternalService {
  /**
   * 1. KHUSUS AI ENGINEER (Chatbot Gudang Tool Calling)
   * Mengembalikan ringkasan stok bahan cepat & hemat token dari Redis
   */
  async getMaterialsSummary(keyword) {
    // Ambil data bahan (otomatis membaca dari cache Redis)
    const { materials } = await materialService.getMaterials();

    let filtered = materials;
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = materials.filter((m) =>
        m.name.toLowerCase().includes(lowerKeyword)
      );
    }

    // Format ringkas dan ramah untuk AI LLM
    return filtered.map((m) => ({
      name: m.name,
      currentStock: m.currentStock,
      unit: m.unit,
      status: m.isLowStock ? 'LOW_STOCK' : 'SAFE',
    }));
  }

  /**
   * 2. KHUSUS DATA SCIENTIST (Training Data Deret Waktu)
   * Menarik riwayat pergerakan stok selama N hari terakhir
   */
  async getMovementAnalytics(days = 30) {
    const daysLimit = Number(days) || 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysLimit);

    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id,
        quantity_delta,
        movement_type,
        reference_id,
        created_at,
        raw_materials (name, unit)
      `)
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`[DB Error]: ${error.message}`);
    }

    return {
      periodDays: daysLimit,
      totalMovements: data.length,
      movements: data,
    };
  }

  /**
   * 3. KHUSUS DATA SCIENTIST (Ingest Hasil Prediksi Machine Learning)
   * Menyimpan hasil ramalan ke Supabase & Caching ke Redis
   */
  async saveForecast(forecastData) {
    const {
      materialId,
      predictedStockoutDate,
      daysRemaining,
      recommendedReorderQty,
      confidenceScore,
      modelVersion,
    } = forecastData;

    // 1. Simpan ke database Supabase
    const { data, error } = await supabase
      .from('stock_forecasts')
      .insert([
        {
          material_id: materialId,
          predicted_stockout_date: predictedStockoutDate,
          days_remaining: daysRemaining,
          recommended_reorder_qty: recommendedReorderQty,
          confidence_score: confidenceScore,
          model_version: modelVersion || 'v1.0-default',
        },
      ])
      .select()
      .single();

    if (error) {
      throw new Error(`[DB Error]: ${error.message}`);
    }

    // 2. Simpan juga ke cache Redis (TTL 24 jam) agar manajer bisa membacanya instan
    const forecastCacheKey = `cache:forecast:${materialId}`;
    await redis.set(forecastCacheKey, JSON.stringify(data), 'EX', 86400);

    return data;
  }
}

module.exports = new InternalService();