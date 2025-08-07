const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Impor semua fungsi yang diperlukan dari controller
const {
    getAllKontak,
    getKontakById,
    createKontak,
    updateKontak,
    deleteKontak,
    syncKontak,
    uploadAvatar,  
    toggleFavorite,  
} = require("../controllers/kontakController");

// --- Konfigurasi Multer untuk penyimpanan file ---
// Konfigurasi ini tetap di sini karena berhubungan langsung dengan middleware rute.
const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: function (req, file, cb) {
        cb(null, "avatar-" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // Batas ukuran file 1MB
}).single("avatar");

// --- DEFINISI RUTE ---

// Endpoint untuk upload: Menjalankan middleware 'upload', lalu fungsi 'uploadAvatar' dari controller
router.post("/upload", upload, uploadAvatar);

// Route untuk mendapatkan semua kontak dan membuat kontak baru
router.route("/").get(getAllKontak).post(createKontak);

// Route untuk mendapatkan, memperbarui, dan menghapus satu kontak berdasarkan ID
router.route("/:id").get(getKontakById).put(updateKontak).delete(deleteKontak);

// Route untuk toggle favorite status kontak
router.patch("/:id/favorite", toggleFavorite); // <-- Logika dipindahkan ke controller

// Route untuk sinkronisasi kontak
router.post("/sync", syncKontak);

module.exports = router;