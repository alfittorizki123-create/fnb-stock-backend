const materialRepository = require('../repositories/material.repository');
const redis = require('../config/redis');

class MaterialService {
  /**
   * Mengambil katalog bahan baku dengan strategi Cache-Aside (Redis)
   */
  async getMaterials() {
    const CACHE_KEY = 'cache:materials:all';
    const CACHE_TTL = 60; // Cache berlaku selama 60 detik

    // 1. Cek apakah data sudah ada di Redis Cache (Cache Hit)
    const cachedData = await redis.get(CACHE_KEY);
    if (cachedData) {
      return {
        source: 'CACHE (Redis)',
        materials: JSON.parse(cachedData),
      };
    }

    // 2. Jika belum ada (Cache Miss), ambil dari Database Supabase
    const materials = await materialRepository.getAllWithStock();

    // 3. Simpan ke Redis dengan masa kadaluwarsa (TTL) 60 detik
    await redis.set(CACHE_KEY, JSON.stringify(materials), 'EX', CACHE_TTL);

    return {
      source: 'DATABASE (Postgres)',
      materials,
    };
  }
}

module.exports = new MaterialService();