// server.js (Versi Baru yang Bersih dan Terstruktur)

// 1. Impor semua library yang dibutuhkan
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');
const mongoose = require('mongoose'); // Diperlukan untuk cek status koneksi

// 2. Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Hubungkan ke Database MongoDB
// Fungsi ini akan menjalankan koneksi dan menghentikan server jika gagal.
connectDB();

// 4. Pengaturan Middleware
app.use(cors()); // Middleware untuk mengizinkan Cross-Origin Resource Sharing (Penting untuk Flutter)
app.use(express.json()); // Middleware untuk mem-parsing request body dalam format JSON
app.use('/uploads', express.static('uploads')); // Middleware untuk menyajikan file statis dari folder 'uploads'
app.use(express.urlencoded({ extended: true })); // Middleware untuk mem-parsing form data
app.use(express.static(path.join(__dirname, 'public'))); // Menyajikan file statis dari folder public

// --- BAGIAN UTAMA: PENGATURAN ROUTE ---
// Impor file route yang sudah kita buat untuk kontak
const kontakRoutes = require('./routes/kontakRoutes');

// Memberi tahu Express: setiap request yang datang ke '/api/kontak'
// harus ditangani oleh 'kontakRoutes'.
app.use('/api/kontak', kontakRoutes);
// -----------------------------------------

// --- Route Tambahan untuk Pengecekan Status ---
app.get('/api/status', (req, res) => {
    res.json({
        message: 'API Kontak - Berjalan dengan Baik',
        mongodb: mongoose.connection.readyState === 1 ? 'Terhubung' : 'Terputus',
    });
});

// 5. Error Handling Middleware
// Middleware ini harus ditempatkan setelah semua route.

// Handle untuk endpoint yang tidak ditemukan (404 Not Found)
app.use((req, res, next) => {
    // Hanya kirim response JSON 404 jika request ditujukan untuk path API
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
    }
    // Jika tidak, biarkan default (mungkin akan ditangani oleh frontend jika ada)
    // Atau bisa juga redirect ke halaman utama
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle untuk error server universal (500 Internal Server Error)
app.use((err, req, res, next) => {
    console.error(err.stack); // Log error ke konsol untuk debugging
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server.'
    });
});

// 6. Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`API Kontak tersedia di http://localhost:${PORT}/api/kontak`);
});
