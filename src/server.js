const app = require('./app');
const config = require('./config/env');
const redis = require('./config/redis');

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 Server F&B Backend aktif di: http://localhost:${PORT}`);
  console.log(`🛠️  Environment: ${config.env}`);
  console.log(`=================================================\n`);
});

// Graceful Shutdown (Menutup koneksi Redis secara rapi saat server dimatikan)
process.on('SIGINT', async () => {
  console.log('\n🛑 Mematikan server secara aman (Graceful Shutdown)...');
  await redis.quit();
  server.close(() => {
    console.log('✅ Server HTTP dan koneksi Redis ditutup bersih.');
    process.exit(0);
  });
});