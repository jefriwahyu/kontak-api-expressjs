const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Impor fungsi-fungsi dari controller
const {
    getAllKontak,
    getKontakById,
    createKontak,
    updateKontak,
    deleteKontak
} = require('../controllers/kontakController');


// --- BAGIAN BARU UNTUK UPLOAD FOTO ---

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
  destination: './uploads/', // Folder tujuan penyimpanan
  filename: function (req, file, cb) {
    // Membuat nama file yang unik untuk menghindari duplikat
    cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 } // Batas ukuran file 1MB (opsional)
}).single('avatar'); // 'avatar' adalah nama field yang akan dikirim dari Flutter

// Endpoint baru untuk upload: POST /api/kontak/upload
router.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan.' });
    }
    
    // Pastikan URL sesuai dengan alamat server Anda
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Kirim respons berisi URL gambar yang berhasil diupload
    res.json({
      success: true,
      message: 'Upload berhasil',
      url: fileUrl
    });
  });
});

// --- AKHIR BAGIAN BARU ---


// Route untuk mendapatkan semua kontak dan membuat kontak baru
router.route('/')
    .get(getAllKontak)
    .post(createKontak);

// Route untuk mendapatkan, memperbarui, dan menghapus satu kontak berdasarkan ID
router.route('/:id')
    .get(getKontakById)
    .put(updateKontak)
    .delete(deleteKontak);

module.exports = router;