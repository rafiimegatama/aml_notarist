# Setup — Konfigurasi Lokal

## PIN Akses (FR-6B)

Aplikasi ini dikunci dengan satu PIN bersama (bukan akun per-orang). PIN
disimpan sebagai hash (SHA-256), bukan teks biasa, di variabel lingkungan
`PIN_HASH` pada file `.env`.

### Mengatur PIN pertama kali

1. Pilih PIN 4-6 digit.
2. Jalankan: `npx tsx scripts/hash-pin.ts <PIN-PILIHAN-ANDA>`
3. Salin baris `PIN_HASH="..."` yang muncul ke file `.env`.
4. Pastikan `SESSION_SECRET` di `.env` juga sudah diisi (lihat `.env.example`).
5. Restart aplikasi (`npm run dev` / `npm run start`).

### Lupa PIN (reset manual)

Tidak ada flow "lupa PIN" otomatis — karena hanya ada satu PIN bersama, tidak
ada akun/email untuk memverifikasi identitas siapa yang me-reset. Cara reset:

1. Buka file `.env` di komputer tempat aplikasi berjalan.
2. Ulangi langkah "Mengatur PIN pertama kali" di atas dengan PIN baru.
3. Restart aplikasi. Sesi yang sedang login tidak perlu login ulang sampai
   sesi tersebut habis (default 10 jam) — tapi PIN lama langsung tidak
   berlaku untuk login baru begitu `.env` disimpan dan aplikasi di-restart.

### Percobaan salah / terkunci

Setelah 3 kali PIN salah berurutan, percobaan berikutnya diblokir selama 5
menit (lihat konstanta `LOCKOUT_THRESHOLD` dan `LOCKOUT_DURATION_MINUTES` di
`lib/auth.ts`). Ini juga mereset otomatis begitu aplikasi (proses `next
dev`/`next start`) di-restart.
