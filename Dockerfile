# 1. Gunakan base image resmi Node.js versi 24 berbasis Alpine Linux yang super ringan
FROM node:24-alpine

# 2. Tentukan direktori kerja di dalam kontainer
WORKDIR /app

# 3. Salin manifest dependensi terlebih dahulu (memanfaatkan Docker Layer Caching)
COPY package*.json ./

# 4. Pasang hanya dependensi produksi (tanpa nodemon agar image tetap ramping)
RUN npm install --omit=dev

# 5. Salin seluruh kode sumber aplikasi
COPY . .

# 6. Buka port 5000 untuk lalu lintas HTTP
EXPOSE 5000

# 7. Jalankan server menggunakan mode produksi
CMD ["npm", "start"]
