const Redis = require('ioredis');
const config = require('./env');

// Inisialisasi klien Redis ke Docker Container
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  retryStrategy(times) {
    // Coba koneksi ulang otomatis dengan batas maksimal jeda 2 detik
    const delay = Math.min(times * 100, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('🔌 [Redis] Mencoba terhubung ke server...');
});

redis.on('ready', () => {
  console.log(`✅ [Redis] Berhasil terhubung ke kontainer (${config.redis.host}:${config.redis.port})`);
});

redis.on('error', (err) => {
  console.error('❌ [Redis Error]:', err.message);
});

module.exports = redis;