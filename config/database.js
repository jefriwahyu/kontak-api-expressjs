// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('MongoDB Connected'))
// .catch(err => console.error('MongoDB connection error:', err));

// // Simple test route
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Server berjalan dengan baik!',
//     mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
//   });
// });

// app.listen(PORT, () => {
//   console.log(`Server berjalan di http://localhost:${PORT}`);
// });

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