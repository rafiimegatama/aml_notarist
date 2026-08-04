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

## Keamanan Data — Rekomendasi Enkripsi (FR-5)

Aplikasi ini menyimpan data pribadi sensitif (scan KTP/NIK, data penghasilan)
yang tunduk pada UU No. 27/2022 (UU PDP) — Pasal 39 ayat (1) mewajibkan
"langkah teknis dan organisasi yang memadai" untuk melindungi data pribadi.
Rekomendasi di bawah ini **didokumentasikan, bukan diimplementasikan** di
codebase — enkripsi disk/OS di luar jangkauan aplikasi Next.js ini, dan
keputusan mana yang dijalankan ada di tangan notaris/kantor, bukan default
otomatis dari kode.

1. **Lantai (wajib, murah, langsung bisa dilakukan hari ini):** aktifkan
   BitLocker (Windows) full-disk encryption di PC tempat aplikasi ini
   berjalan. Ini melindungi `prisma/dev.db` dan `storage/uploads/` kalau PC
   atau harddisknya dicuri/hilang.
2. **Lebih baik (opsional, butuh kerja tambahan):** enkripsi level-aplikasi
   khusus untuk `storage/uploads/` — enkripsi saat file ditulis di
   `uploadAndExtractDocument` (`lib/actions/document.ts`), dekripsi saat
   dibaca di `app/api/documents/[id]/route.ts`. Belum dikerjakan di fase ini
   — kalau mau dibangun, ini kandidat Fase berikutnya.
3. **Backup ikut kewajiban yang sama.** Begitu FR-1.2/1.3/1.4 (HDD/Sheets/
   Drive) aktif, foto KTP yang tidak terenkripsi yang tersimpan di Google
   Drive pribadi berpotensi jadi celah kebocoran yang LEBIH besar daripada
   file aslinya. Pakai akun Google khusus (bukan akun pribadi notaris)
   untuk backup, kunci akses sharing-nya, dan pertimbangkan enkripsi
   sebelum upload.
4. **Retensi vs. penghapusan.** Data CDD terstruktur (nama, No. Identitas,
   tanggal) kemungkinan besar yang benar-benar wajib disimpan sesuai
   ketentuan retensi (lihat `lib/retention.ts`) — apakah foto scan asli
   perlu masa retensi yang sama atau bisa dihapus lebih cepat setelah
   datanya terverifikasi & tersimpan, adalah pertanyaan untuk penasihat
   hukum, bukan asumsi default aplikasi ini.

Sumber: PRD-Notary-CDD-Phase2-Improvements.md Bagian 4 (FR-5) & Lampiran B —
ini komentar sekunder atas regulasi, bukan teks primer; verifikasi ke sumber
primer/penasihat hukum sebelum dijadikan kebijakan final.
