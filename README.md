# 🎓 BIOS - Binusmaya Integrated Orchestrator Service (Frontend)

BIOS adalah asisten virtual berbasis WhatsApp Bot yang dirancang khusus untuk mengotomatisasi dan mempermudah operasional akademik mahasiswa BINUS University. 

Bot ini bertindak sebagai *frontend* (antarmuka pengguna) yang berinteraksi langsung dengan mahasiswa melalui WhatsApp, dan meneruskan perintah komputasi berat (seperti *scraping* dan automasi *browser*) ke [BIOS Backend API](#).

## ✨ Fitur Utama

**🔑 Sistem Autentikasi**
- Login menggunakan akun Microsoft Binusmaya secara aman.
- Penyimpanan sesi pengguna secara terisolasi (satu file JSON per pengguna).

**📚 Akademik & Perkuliahan**
- Cek jadwal kuliah lengkap dengan lokasi dan status kelas.
- **Auto-Attendance:** Melakukan absensi otomatis (Check-in) ke Binusmaya tanpa perlu membuka browser.

**🐝 Beelingua Automation**
- Memantau progres *Course* dan *Journey* secara detail.
- **Auto-Solve:** Menyelesaikan materi Beelingua secara otomatis di *background*.
- Sistem *real-time polling* untuk menginformasikan progres pengerjaan via WhatsApp.
- Sistem Token/Saldo untuk membatasi penggunaan automasi.

## 🛠️ Tech Stack
- **Language:** TypeScript
- **Library WhatsApp:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
- **Database:** Local JSON File System (menyimpan profil *user* di folder `accounts/`)
- **Linting:** ESLint (Flat Config + Type-Aware Linting)

---

## 🚀 Panduan Instalasi (Development)

### 1. Prasyarat
- Node.js versi 20 atau terbaru.
- Pastikan [BIOS Backend API](#) sudah berjalan karena bot ini membutuhkan API tersebut untuk melakukan *fetching* jadwal dan menjalankan Playwright.

### 2. Clone & Install
```bash
git clone https://github.com/fzrilsh/bios-whatsapp-bot.git
cd bios-whatsapp-bot
npm install
```

### 3. Konfigurasi Environment (`.env`)
Buat file `.env` di *root folder* proyek dan isi sesuai `.env.example`

### 4. Menjalankan Bot
Untuk proses *development*, kamu bisa menggunakan *script* berikut agar bot otomatis me-*restart* saat ada perubahan kode:
```bash
npm run dev
```

Saat pertama kali dijalankan, akan muncul QR Code di terminal. *Scan* QR Code tersebut menggunakan aplikasi WhatsApp di HP kamu (Tautkan Perangkat).

Untuk *build* ke tahap *production*:
```bash
npm run build
npm start
```

---

## 📜 Daftar Perintah (Commands)

| Command | Alias | Deskripsi |
| :--- | :--- | :--- |
| `.login` | - | Autentikasi akun Microsoft Binusmaya. |
| `.logout` | - | Menghapus data sesi dari sistem. |
| `.jadwal` | `.sc` | Menampilkan daftar jadwal kuliah dan mengeksekusi absensi. |
| `.beelingua`| `.bl` | Menampilkan menu dan jumlah token Beelingua saat ini. |
| `.bl info` | - | Menampilkan daftar Journey Beelingua. |
| `.bl solve` | - | Memulai automasi pengerjaan course di *background*. |
| `.bl buy` | - | Instruksi pembayaran token automasi. |

**Fitur Khusus Admin (Owner):**

| Command | Deskripsi |
| :--- | :--- |
| `.bl report` | Menampilkan statistik pengguna, pemakaian token, dan *revenue*. |
| `.bl add-token [no] [jumlah]` | Menambahkan saldo token ke nomor pengguna tertentu. |
| `.bl remove-token [no] [jumlah]`| Mengurangi saldo token dari nomor pengguna tertentu. |

---

## 🔒 Keamanan
- Data kredensial pengguna tidak disimpan secara *plaintext* di dalam *frontend*, melainkan dikelola oleh sistem autentikasi Microsoft.