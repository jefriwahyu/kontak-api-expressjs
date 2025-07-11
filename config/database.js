
// database.js
require('dotenv').config(); // Pastikan dotenv dimuat di sini juga untuk MONGODB_URI

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        // Anda bisa mengembalikan instance koneksi jika perlu,
        // tapi mongoose secara global sudah menyimpan koneksi.
        return conn;
    } catch (error) {
        console.error('Error koneksi MongoDB:', error.message);
        process.exit(1); // Keluar dari aplikasi jika koneksi gagal
    }
};

module.exports = connectDB; // Export fungsi koneksi