const mongoose = require("mongoose");

const kontakSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, "Nama kontak wajib diisi."],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Format email tidak valid."],
      default: "",
    },
    no_hp: {
      type: String,
      required: [true, "Nomor HP wajib diisi."],
      trim: true,
    },
    alamat: {
      type: String,
      trim: true,
      default: "", // Alamat bersifat opsional
    },
    // Field avatar untuk menyimpan URL gambar profil
    avatar: {
      type: String,
      trim: true,
    },
    grup: {
      type: String,
      // Hanya izinkan nilai ini atau string kosong
      enum: ['Keluarga', 'Teman', 'Kerja', ''], 
      default: ''
    },
    // Field untuk menandai kontak sebagai favorit
    isFavorite: {
      type: Boolean,
      default: false
    },
  },
  {
    // Menambahkan field createdAt dan updatedAt secara otomatis
    timestamps: true,
  }
);

// PRE-SAVE MIDDLEWARE: Membuat URL avatar default sebelum menyimpan jika kosong
kontakSchema.pre("save", function (next) {
  if (!this.avatar) {
    // Menggunakan layanan ui-avatars.com untuk membuat avatar dari inisial nama
    const formattedName = this.nama.split(" ").join("+");
    this.avatar = `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff`;
  }
  next();
});

module.exports = mongoose.model("Kontak", kontakSchema);