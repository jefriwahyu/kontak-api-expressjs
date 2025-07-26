const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Impor fungsi-fungsi dari controller
const {
  getAllKontak,
  getKontakById,
  createKontak,
  updateKontak,
  deleteKontak,
  syncKontak,
} = require("../controllers/kontakController");

// Import model Kontak untuk route favorite
const Kontak = require("../models/Kontak");

// --- BAGIAN BARU UNTUK UPLOAD FOTO ---

// Konfigurasi Multer untuk penyimpanan file
const storage = multer.diskStorage({
  destination: "./uploads/", // Folder tujuan penyimpanan
  filename: function (req, file, cb) {
    // Membuat nama file yang unik untuk menghindari duplikat
    cb(null, "avatar-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // Batas ukuran file 1MB (opsional)
}).single("avatar"); // 'avatar' adalah nama field yang akan dikirim dari Flutter

// Endpoint baru untuk upload: POST /api/kontak/upload
router.post("/upload", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "File tidak ditemukan." });
    }

    // Pastikan URL sesuai dengan alamat server Anda
    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    // Kirim respons berisi URL gambar yang berhasil diupload
    res.json({
      success: true,
      message: "Upload berhasil",
      url: fileUrl,
    });
  });
});

// --- AKHIR BAGIAN BARU ---

// Route untuk mendapatkan semua kontak dan membuat kontak baru
router.route("/").get(getAllKontak).post(createKontak);

// Route untuk mendapatkan, memperbarui, dan menghapus satu kontak berdasarkan ID
router.route("/:id").get(getKontakById).put(updateKontak).delete(deleteKontak);

// Route untuk toggle favorite status kontak
// Route untuk toggle favorite status kontak - UPDATED VERSION
router.patch("/:id/favorite", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validasi ID MongoDB
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "ID kontak tidak valid.",
      });
    }

    // Ambil data kontak
    const contact = await Kontak.findById(id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Kontak tidak ditemukan",
      });
    }

    // Toggle status favorite (otomatis kebalikan dari status saat ini)
    const newFavoriteStatus = !contact.isFavorite;

    // Cek limit favorite hanya saat menambah favorite
    if (newFavoriteStatus && !contact.isFavorite) {
      const favoriteCount = await Kontak.countDocuments({ isFavorite: true });
      if (favoriteCount >= 5) {
        return res.status(400).json({
          success: false,
          message: "Batas favorite hanya 5 kontak!",
        });
      }
    }

    // Update status favorite
    contact.isFavorite = newFavoriteStatus;
    await contact.save();

    // PERBAIKAN: Format response agar konsisten dengan expectation Flutter
    return res.json({
      success: true,
      message: `Kontak ${newFavoriteStatus ? "ditambahkan ke" : "dihapus dari"} favorit`,
      data: {
        id: contact._id.toString(), // Pastikan ID dalam format string
        isFavorite: contact.isFavorite // Status favorite yang baru
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/sync", syncKontak);

module.exports = router;
