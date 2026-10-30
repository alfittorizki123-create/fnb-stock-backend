const dotenv = require('dotenv');
const joi = require('joi');

dotenv.config();

// Skema validasi variabel lingkungan wajib
const envSchema = joi.object({
  PORT: joi.number().default(5000),
  NODE_ENV: joi.string().valid('development', 'production', 'test').default('development'),
  SUPABASE_URL: joi.string().uri().required().messages({
    'any.required': 'SUPABASE_URL wajib diisi di .env'
  }),
  SUPABASE_ANON_KEY: joi.string().required().messages({
    'any.required': 'SUPABASE_ANON_KEY wajib diisi di .env'
  }),
  REDIS_HOST: joi.string().default('127.0.0.1'),
  REDIS_PORT: joi.number().default(6379),
  INTERNAL_API_KEY: joi.string().required().messages({
    'any.required': 'INTERNAL_API_KEY wajib diisi di .env untuk komunikasi AI/DS'
  }),
}).unknown(true); // Izinkan variabel sistem bawaan OS lainnya

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`[Config Error] Konfigurasi .env tidak valid: ${error.message}`);
}

module.exports = {
  port: envVars.PORT,
  env: envVars.NODE_ENV,
  supabase: {
    url: envVars.SUPABASE_URL,
    anonKey: envVars.SUPABASE_ANON_KEY,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
  },
  internalApiKey: envVars.INTERNAL_API_KEY,
};