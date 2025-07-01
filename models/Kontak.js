const mongoose = require('mongoose');

const kontakSchema = new mongoose.Schema({
    nama: {
        type: String,
        required: [true, 'Nama kontak wajib diisi.'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email wajib diisi.'],
        unique: true, // Pastikan tidak ada email yang sama
        trim: true,
        lowercase: true, // Simpan email dalam format huruf kecil
        match: [/\S+@\S+\.\S+/, 'Format email tidak valid.'],
    },
    no_hp: {
        type: String,
        required: [true, 'Nomor HP wajib diisi.'],
        trim: true,
        match: [/^(?:\+62|0)[2-9]\d{7,11}$/, 'Format nomor HP tidak valid.'],
    },
    alamat: {
        type: String,
        trim: true,
        default: '' // Alamat bersifat opsional
    },
    // Field avatar untuk menyimpan URL gambar profil
    avatar: {
        type: String,
        trim: true,
    }
}, {
    // Menambahkan field createdAt dan updatedAt secara otomatis
    timestamps: true,
});

// PRE-SAVE MIDDLEWARE: Membuat URL avatar default sebelum menyimpan jika kosong
kontakSchema.pre('save', function(next) {
    if (!this.avatar) {
        // Menggunakan layanan ui-avatars.com untuk membuat avatar dari inisial nama
        const formattedName = this.nama.split(' ').join('+');
        this.avatar = `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff`;
    }
    next();
});

module.exports = mongoose.model('Kontak', kontakSchema);