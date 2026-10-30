const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

// Inisialisasi Supabase Client untuk backend
const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
  auth: {
    persistSession: false, // Di lingkungan backend Node.js, tidak perlu menyimpan session di browser storage
  },
});

module.exports = supabase;