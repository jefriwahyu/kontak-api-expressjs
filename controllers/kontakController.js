const Kontak = require('../models/Kontak');
const mongoose = require('mongoose');

// --- READ ALL (Membaca semua kontak) ---
exports.getAllKontak = async (req, res) => {
    try {
        // Mengambil semua kontak dan mengurutkannya berdasarkan nama A-Z
        const kontakList = await Kontak.find().sort({ nama: 1 });
        res.status(200).json({
            success: true,
            message: 'Semua data kontak berhasil diambil.',
            count: kontakList.length,
            data: kontakList,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- READ ONE (Membaca satu kontak berdasarkan ID) ---
exports.getKontakById = async (req, res) => {
    try {
        // Cek apakah ID valid formatnya
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID kontak tidak valid.' });
        }

        const kontak = await Kontak.findById(req.params.id);

        if (!kontak) {
            return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan.' });
        }

        res.status(200).json({ success: true, data: kontak });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- CREATE (Membuat kontak baru) ---
exports.createKontak = async (req, res) => {
    try {
        const kontakBaru = new Kontak(req.body);
        const kontakTersimpan = await kontakBaru.save();
        res.status(201).json({
            success: true,
            message: 'Kontak baru berhasil dibuat.',
            data: kontakTersimpan,
        });
    } catch (error) {
        // Error handling untuk validasi atau email duplikat
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        if (error.code === 11000) { // Kode untuk duplicate key
             return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- UPDATE (Memperbarui kontak berdasarkan ID) ---
exports.updateKontak = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID kontak tidak valid.' });
        }

        const kontak = await Kontak.findByIdAndUpdate(req.params.id, req.body, {
            new: true, // Mengembalikan dokumen yang sudah diupdate
            runValidators: true, // Menjalankan validasi Mongoose saat update
        });

        if (!kontak) {
            return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan.' });
        }

        res.status(200).json({
            success: true,
            message: 'Kontak berhasil diperbarui.',
            data: kontak,
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        if (error.code === 11000) {
             return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// --- DELETE (Menghapus kontak berdasarkan ID) ---
exports.deleteKontak = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: 'ID kontak tidak valid.' });
        }

        const kontak = await Kontak.findByIdAndDelete(req.params.id);

        if (!kontak) {
            return res.status(404).json({ success: false, message: 'Kontak tidak ditemukan.' });
        }

        res.status(200).json({
            success: true,
            message: 'Kontak berhasil dihapus.',
            data: kontak // Mengembalikan data yang dihapus
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};