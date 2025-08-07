const Kontak = require('../models/Kontak');
const mongoose = require('mongoose');

// --- UTILITY FUNCTIONS ---
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhoneNumber = (phone) => {
    // Validasi nomor HP Indonesia (08xx, +62xxx, atau 62xxx)
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,11}$/;
    return phoneRegex.test(phone.replace(/[-\s]/g, ''));
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    let normalized = phone.replace(/[-\s]/g, '');
    if (normalized.startsWith('+62')) {
        normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('62')) {
        normalized = '0' + normalized.substring(2);
    }
    return normalized;
};

// --- VALIDATION MIDDLEWARE ---
const validateKontakData = (data, isUpdate = false) => {
    const errors = [];
    
    // Validasi nama
    if (!isUpdate || data.nama !== undefined) {
        if (!data.nama || typeof data.nama !== 'string') {
            errors.push('Nama wajib diisi dan harus berupa teks');
        } else if (data.nama.trim().length < 2) {
            errors.push('Nama minimal 2 karakter');
        } else if (data.nama.trim().length > 50) {
            errors.push('Nama maksimal 50 karakter');
        }
    }
    
    // Validasi email (opsional tapi harus valid jika diisi)
    if (data.email !== undefined && data.email !== '') {
        if (typeof data.email !== 'string') {
            errors.push('Email harus berupa teks');
        } else if (!isValidEmail(data.email)) {
            errors.push('Format email tidak valid');
        } else if (data.email.length > 100) {
            errors.push('Email maksimal 100 karakter');
        }
    }
    
    // Validasi nomor HP
    if (!isUpdate || data.no_hp !== undefined) {
        if (!data.no_hp || typeof data.no_hp !== 'string') {
            errors.push('Nomor HP wajib diisi dan harus berupa teks');
        } else if (!isValidPhoneNumber(data.no_hp)) {
            errors.push('Format nomor HP tidak valid (gunakan format 08xx atau +62xxx)');
        }
    }
    
    // Validasi avatar URL (jika ada)
    if (data.avatar !== undefined && data.avatar !== '') {
        if (typeof data.avatar !== 'string') {
            errors.push('Avatar harus berupa URL teks');
        } else if (data.avatar.length > 500) {
            errors.push('URL avatar terlalu panjang');
        }
    }
    
    // Validasi isFavorite
    if (data.isFavorite !== undefined) {
        if (typeof data.isFavorite !== 'boolean') {
            errors.push('Status favorit harus berupa boolean');
        }
    }
    
    return errors;
};

// --- READ ALL (Membaca semua kontak) ---
exports.getAllKontak = async (req, res) => {
    try {
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
        const { id } = req.params;
        
        // Validasi ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID kontak tidak valid' 
            });
        }
        
        const kontak = await Kontak.findById(id);
        if (!kontak) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kontak tidak ditemukan' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Data kontak berhasil diambil',
            data: kontak 
        });
    } catch (error) {
        console.error('Get Kontak By ID Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
};

// --- CREATE (Membuat kontak baru) ---
exports.createKontak = async (req, res) => {
    try {
        // Sanitize input
        const sanitizedData = {
            nama: sanitizeInput(req.body.nama),
            email: sanitizeInput(req.body.email),
            no_hp: sanitizeInput(req.body.no_hp),
            avatar: sanitizeInput(req.body.avatar),
            isFavorite: req.body.isFavorite
        };
        
        // Validasi data
        const validationErrors = validateKontakData(sanitizedData);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid',
                errors: validationErrors
            });
        }
        
        // Normalize nomor HP
        const normalizedPhone = normalizePhoneNumber(sanitizedData.no_hp);
        
        // Cek duplikasi nomor HP
        const existingContact = await Kontak.findOne({ no_hp: normalizedPhone });
        if (existingContact) {
            return res.status(409).json({
                success: false,
                message: 'Nomor HP sudah terdaftar'
            });
        }
        
        // Cek duplikasi email jika email diisi
        if (sanitizedData.email) {
            const existingEmail = await Kontak.findOne({ 
                email: sanitizedData.email.toLowerCase() 
            });
            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email sudah terdaftar'
                });
            }
        }
        
        // Cek limit favorit jika akan ditambahkan sebagai favorit
        if (sanitizedData.isFavorite) {
            const favoriteCount = await Kontak.countDocuments({ isFavorite: true });
            if (favoriteCount >= 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Batas favorit maksimal 5 kontak'
                });
            }
        }
        
        // Buat kontak baru
        const kontakData = {
            nama: sanitizedData.nama.trim(),
            email: sanitizedData.email ? sanitizedData.email.toLowerCase().trim() : '',
            no_hp: normalizedPhone,
            avatar: sanitizedData.avatar || '',
            isFavorite: sanitizedData.isFavorite || false
        };
        
        const kontakBaru = new Kontak(kontakData);
        const kontakTersimpan = await kontakBaru.save();
        
        res.status(201).json({
            success: true,
            message: 'Kontak berhasil dibuat',
            data: kontakTersimpan
        });
    } catch (error) {
        console.error('Create Kontak Error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validasi gagal',
                errors: messages 
            });
        }
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ 
                success: false, 
                message: `${field === 'email' ? 'Email' : 'Nomor HP'} sudah terdaftar` 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
};

// --- UPDATE (Memperbarui kontak berdasarkan ID) ---
exports.updateKontak = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validasi ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID kontak tidak valid' 
            });
        }
        
        // Sanitize input
        const sanitizedData = {};
        if (req.body.nama !== undefined) sanitizedData.nama = sanitizeInput(req.body.nama);
        if (req.body.email !== undefined) sanitizedData.email = sanitizeInput(req.body.email);
        if (req.body.no_hp !== undefined) sanitizedData.no_hp = sanitizeInput(req.body.no_hp);
        if (req.body.avatar !== undefined) sanitizedData.avatar = sanitizeInput(req.body.avatar);
        if (req.body.isFavorite !== undefined) sanitizedData.isFavorite = req.body.isFavorite;
        
        // Validasi data yang akan diupdate
        const validationErrors = validateKontakData(sanitizedData, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak valid',
                errors: validationErrors
            });
        }
        
        // Cek apakah kontak exists
        const existingContact = await Kontak.findById(id);
        if (!existingContact) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kontak tidak ditemukan' 
            });
        }
        
        // Prepare update data
        const updateData = {};
        
        if (sanitizedData.nama) updateData.nama = sanitizedData.nama.trim();
        if (sanitizedData.email !== undefined) {
            updateData.email = sanitizedData.email ? sanitizedData.email.toLowerCase().trim() : '';
        }
        if (sanitizedData.avatar !== undefined) updateData.avatar = sanitizedData.avatar;
        
        // Handle nomor HP update
        if (sanitizedData.no_hp) {
            const normalizedPhone = normalizePhoneNumber(sanitizedData.no_hp);
            
            // Cek duplikasi nomor HP (kecuali untuk kontak yang sedang diupdate)
            const duplicatePhone = await Kontak.findOne({ 
                no_hp: normalizedPhone,
                _id: { $ne: id }
            });
            if (duplicatePhone) {
                return res.status(409).json({
                    success: false,
                    message: 'Nomor HP sudah digunakan kontak lain'
                });
            }
            updateData.no_hp = normalizedPhone;
        }
        
        // Handle email update
        if (sanitizedData.email && sanitizedData.email !== '') {
            const duplicateEmail = await Kontak.findOne({ 
                email: sanitizedData.email.toLowerCase(),
                _id: { $ne: id }
            });
            if (duplicateEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email sudah digunakan kontak lain'
                });
            }
        }
        
        // Handle favorite update
        if (sanitizedData.isFavorite !== undefined) {
            if (sanitizedData.isFavorite && !existingContact.isFavorite) {
                // Cek limit favorit
                const favoriteCount = await Kontak.countDocuments({ 
                    isFavorite: true,
                    _id: { $ne: id }
                });
                if (favoriteCount >= 5) {
                    return res.status(400).json({
                        success: false,
                        message: 'Batas favorit maksimal 5 kontak'
                    });
                }
            }
            updateData.isFavorite = sanitizedData.isFavorite;
        }
        
        // Update kontak
        const kontak = await Kontak.findByIdAndUpdate(
            id, 
            updateData,
            {
                new: true,
                runValidators: true
            }
        );
        
        res.status(200).json({
            success: true,
            message: 'Kontak berhasil diperbarui',
            data: kontak
        });
    } catch (error) {
        console.error('Update Kontak Error:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validasi gagal',
                errors: messages 
            });
        }
        
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({ 
                success: false, 
                message: `${field === 'email' ? 'Email' : 'Nomor HP'} sudah terdaftar` 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
};

// --- DELETE (Menghapus kontak berdasarkan ID) ---
exports.deleteKontak = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validasi ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: 'ID kontak tidak valid' 
            });
        }
        
        const kontak = await Kontak.findByIdAndDelete(id);
        if (!kontak) {
            return res.status(404).json({ 
                success: false, 
                message: 'Kontak tidak ditemukan' 
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Kontak berhasil dihapus',
            data: { id: kontak._id, nama: kontak.nama }
        });
    } catch (error) {
        console.error('Delete Kontak Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server' 
        });
    }
};

// --- SYNC (Mensinkronkan kontak dengan lokal) ---
exports.syncKontak = async (req, res) => {
    try {
        const { contacts } = req.body;
        
        // Validasi input
        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Data kontak harus berupa array' 
            });
        }
        
        if (contacts.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Data kontak tidak boleh kosong' 
            });
        }
        
        if (contacts.length > 1000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Maksimal 1000 kontak per sinkronisasi' 
            });
        }
        
        let newContactsAdded = 0;
        let skippedContacts = 0;
        const errors = [];
        
        for (let i = 0; i < contacts.length; i++) {
            try {
                const contact = contacts[i];
                
                // Validasi setiap kontak
                if (!contact || typeof contact !== 'object') {
                    skippedContacts++;
                    errors.push(`Kontak index ${i}: format tidak valid`);
                    continue;
                }
                
                // Sanitize data
                const sanitizedContact = {
                    nama: sanitizeInput(contact.nama),
                    email: sanitizeInput(contact.email),
                    no_hp: sanitizeInput(contact.no_hp)
                };
                
                const normalizedPhone = normalizePhoneNumber(sanitizedContact.no_hp);
                
                // Skip jika nama atau nomor HP kosong
                if (!sanitizedContact.nama || !normalizedPhone) {
                    skippedContacts++;
                    errors.push(`Kontak index ${i}: nama atau nomor HP kosong`);
                    continue;
                }
                
                // Validasi nomor HP
                if (!isValidPhoneNumber(normalizedPhone)) {
                    skippedContacts++;
                    errors.push(`Kontak index ${i}: format nomor HP tidak valid`);
                    continue;
                }
                
                // Validasi email jika ada
                if (sanitizedContact.email && !isValidEmail(sanitizedContact.email)) {
                    skippedContacts++;
                    errors.push(`Kontak index ${i}: format email tidak valid`);
                    continue;
                }
                
                // Cek apakah kontak sudah ada
                const existingContact = await Kontak.findOne({ no_hp: normalizedPhone });
                if (!existingContact) {
                    const newContact = new Kontak({
                        nama: sanitizedContact.nama.trim(),
                        email: sanitizedContact.email ? sanitizedContact.email.toLowerCase().trim() : '',
                        no_hp: normalizedPhone,
                        isFavorite: false
                    });
                    
                    await newContact.save();
                    newContactsAdded++;
                }
            } catch (contactError) {
                skippedContacts++;
                errors.push(`Kontak index ${i}: ${contactError.message}`);
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Sinkronisasi selesai. ${newContactsAdded} kontak baru ditambahkan, ${skippedContacts} kontak dilewati`,
            data: {
                processed: contacts.length,
                added: newContactsAdded,
                skipped: skippedContacts,
                errors: errors.slice(0, 10) // Batasi error yang ditampilkan
            }
        });
    } catch (error) {
        console.error('Sync Kontak Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server saat sinkronisasi' 
        });
    }
};

// --- UPLOAD AVATAR ---
exports.uploadAvatar = (req, res) => {
    try {
        // Validasi file
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: "File avatar tidak ditemukan" 
            });
        }
        
        // Validasi tipe file
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({ 
                success: false, 
                message: "Tipe file tidak didukung. Gunakan JPEG, JPG, PNG, atau GIF" 
            });
        }
        
        // Validasi ukuran file (maksimal 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
            return res.status(400).json({ 
                success: false, 
                message: "Ukuran file terlalu besar. Maksimal 5MB" 
            });
        }
        
        // Validasi nama file
        if (!req.file.filename) {
            return res.status(400).json({ 
                success: false, 
                message: "Nama file tidak valid" 
            });
        }
        
        const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        
        res.status(200).json({
            success: true,
            message: "Avatar berhasil diupload",
            data: {
                url: fileUrl,
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });
    } catch (error) {
        console.error('Upload Avatar Error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Terjadi kesalahan server saat upload' 
        });
    }
};

// --- TOGGLE FAVORITE ---
exports.toggleFavorite = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validasi ID
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false, 
                message: "ID kontak tidak valid" 
            });
        }
        
        const contact = await Kontak.findById(id);
        if (!contact) {
            return res.status(404).json({ 
                success: false, 
                message: "Kontak tidak ditemukan" 
            });
        }
        
        const newFavoriteStatus = !contact.isFavorite;
        
        // Cek limit hanya saat akan menambahkan ke favorit
        if (newFavoriteStatus) {
            const favoriteCount = await Kontak.countDocuments({ 
                isFavorite: true,
                _id: { $ne: id }
            });
            if (favoriteCount >= 5) {
                return res.status(400).json({
                    success: false,
                    message: "Batas favorit maksimal 5 kontak"
                });
            }
        }
        
        contact.isFavorite = newFavoriteStatus;
        await contact.save();
        
        res.status(200).json({
            success: true,
            message: `Kontak ${newFavoriteStatus ? "ditambahkan ke" : "dihapus dari"} favorit`,
            data: {
                id: contact._id.toString(),
                nama: contact.nama,
                isFavorite: contact.isFavorite
            }
        });
    } catch (error) {
        console.error('Toggle Favorite Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
};