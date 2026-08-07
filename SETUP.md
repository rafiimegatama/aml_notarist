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

### Lupa PIN — reset lewat Google Sign-In

Halaman `/lock` punya tautan "Lupa PIN?" yang mengarah ke `/lock/forgot`.
Alurnya: notaris login dengan Google → server memverifikasi identitas Google
itu (signature id_token, bukan sekadar percaya redirect) → HANYA kalau email
akun yang login cocok persis dengan `PIN_RECOVERY_GOOGLE_EMAIL` di `.env`,
notaris diizinkan mengatur PIN baru, langsung berlaku (tanpa restart —
tersimpan di tabel `AppSetting`, bukan menimpa `.env`).

Ini BUKAN integrasi Gmail (baca email) — scope OAuth yang diminta cuma
`openid email`, murni untuk membuktikan "akun Google mana yang login", bukan
akses ke isi akun tersebut. Beda dari Service Account yang dipakai fitur
Google Sheets/Drive (autentikasi mesin-ke-mesin, lihat bagian di bawah) — ini
memakai layar consent asli Google, jadi aplikasi ini akan muncul di daftar
"Aplikasi pihak ketiga dengan akses akun" pada akun Google yang login.

**Cara mengaktifkan (butuh Google Cloud Console, sekali saja):**

1. Buka [Google Cloud Console](https://console.cloud.google.com/) → pilih
   project yang sama dengan Service Account Sheets/Drive (atau project baru
   kalau belum punya).
2. **APIs & Services → OAuth consent screen** — pilih tipe **External**,
   status **Testing** cukup (tidak perlu verifikasi Google karena hanya satu
   pengguna). Tambahkan email di `PIN_RECOVERY_GOOGLE_EMAIL` sebagai **Test
   user** — WAJIB, kalau tidak Google akan menolak login untuk akun itu.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   — tipe **Web application**.
4. Di **Authorized redirect URIs**, tambahkan persis:
   `http://127.0.0.1:4001/api/auth/google/callback`
   (`4001` adalah port standar aplikasi ini — lihat `PORT` di `.env.example`
   dan bagian "Port & Host Standar" di bawah; kalau pernah diubah, daftarkan
   URI tambahan yang sesuai supaya login Google tidak gagal).
5. Salin **Client ID** dan **Client secret** yang muncul ke `.env`:
   ```
   GOOGLE_OAUTH_CLIENT_ID="....apps.googleusercontent.com"
   GOOGLE_OAUTH_CLIENT_SECRET="..."
   PIN_RECOVERY_GOOGLE_EMAIL="akun-notaris@gmail.com"
   ```
6. Restart aplikasi. Kalau salah satu dari ketiga variabel di atas kosong,
   `/lock/forgot` otomatis menampilkan pesan "belum dikonfigurasi" alih-alih
   tombol Google — fallback manual di bawah tetap selalu bisa dipakai.

### Reset manual (fallback, tanpa Google)

Selalu tersedia, tidak butuh apa pun di atas:

1. Buka file `.env` di komputer tempat aplikasi berjalan.
2. Ulangi langkah "Mengatur PIN pertama kali" di atas dengan PIN baru.
3. Restart aplikasi. Sesi yang sedang login tidak perlu login ulang sampai
   sesi tersebut habis (default 10 jam). PIN hasil reset lewat Google (kalau
   pernah dipakai) tersimpan di `AppSetting`/DB dan **menang atas** `PIN_HASH`
   di `.env` — kalau reset manual lewat `.env` sepertinya tidak berlaku, itu
   sebabnya; hapus baris `pin_hash` di tabel `AppSetting` (mis. lewat Prisma
   Studio) untuk kembali sepenuhnya ke sumber `.env`.

### Percobaan salah / terkunci

Setelah 3 kali PIN salah berurutan, percobaan berikutnya diblokir selama 5
menit (lihat konstanta `LOCKOUT_THRESHOLD` dan `LOCKOUT_DURATION_MINUTES` di
`lib/auth.ts`). Ini juga mereset otomatis begitu aplikasi (proses `next
dev`/`next start`) di-restart.

## Port & Host Standar

Aplikasi ini SELALU jalan di `http://127.0.0.1:4001` — persis sama di semua
mode (`npm run dev`, `npm run start`, dan `npm run up` lewat PM2). Port
di-hardcode `-p 4001` di setiap script `package.json` (bukan cuma default
yang bisa ketiban env var lain secara tidak sengaja), dan `ecosystem.config.js`
memakai default yang sama. Kalau perlu ganti port, ubah di SEMUA tempat
sekaligus: keempat script di `package.json`, `ecosystem.config.js`, dan
redirect URI OAuth "Lupa PIN" di Google Cloud Console (lihat bagian PIN Akses
di atas) — port yang tidak konsisten di salah satu tempat ini akan membuat
login Google gagal atau (untuk `npm run dev`/`start`) app jalan di port yang
tidak diharapkan.

Host tetap `127.0.0.1` (bukan `localhost` sebagai string) — FR-6A sengaja
mengikat ke alamat IP eksplisit ini, bukan hostname, supaya resolusi jaringan
tidak ambigu (`localhost` bisa resolve ke `::1` IPv6 tergantung konfigurasi
OS) dan supaya jelas app TIDAK diekspos ke jaringan (`*:lan` variants
memakai `0.0.0.0` secara sadar, terpisah, kalau memang dibutuhkan).

## Menjalankan App Selalu Aktif (PM2)

`npm run dev`/`npm run start` biasa mati begitu jendela terminal/cmd yang
menjalankannya ditutup. Untuk pemakaian sehari-hari di kantor — supaya app
tetap jalan meski terminal ditutup, dan otomatis pulih sendiri kalau proses
sempat crash — pakai [PM2](https://pm2.keymetrics.io/) (process supervisor
untuk Node.js), sudah termasuk sebagai dev dependency di `package.json`.

**Lingkup:** ini crash-recovery (proses otomatis restart kalau tiba-tiba
mati), BUKAN auto-start setelah Windows di-restart. Setelah komputer
dinyalakan ulang, jalankan sekali lagi perintah di bawah — app tidak otomatis
hidup sendiri sebelum itu.

### Perintah (satu baris, sama persis di cmd.exe maupun bash/git-bash)

```
npm install       # sekali saja / setelah pull perubahan baru — install semua dependency termasuk PM2
npm run up        # build production + jalankan di bawah PM2, tetap hidup walau terminal ditutup
```

`npm run up` melakukan `next build` (build production terbaru) lalu
menjalankan/reload PM2 (`ecosystem.config.js`) — aman dijalankan berulang
kali (idempotent): kalau app belum jalan, PM2 menyalakannya; kalau sudah
jalan, PM2 me-reload dengan build terbaru tanpa downtime berarti.

Perintah lain:

| Perintah | Fungsi |
|----------|--------|
| `npm run status` | Cek apakah app sedang `online` (dan sudah berapa lama, berapa kali restart) |
| `npm run logs` | Tail log app (`Ctrl+C` untuk keluar dari tail — app TETAP jalan di background) |
| `npm run restart` | Restart manual (mis. setelah ganti `.env`) |
| `npm run down` | Matikan app sepenuhnya |

Cek cepat lewat browser/`curl` tanpa perlu login PIN dulu:
`http://127.0.0.1:4001/api/health` — harus balas `{"status":"ok",...}` kalau
server hidup.

**Kenapa PM2, bukan sekadar `next start` di terminal:** `next start` biasa
adalah proses foreground biasa — begitu terminal ditutup (atau laptop
sleep/logout), proses ikut mati, dan kalau app crash karena bug tidak ada
yang menyalakannya lagi sampai ada orang sadar dan menjalankan ulang manual.
PM2 menjalankan app sebagai proses daemon terpisah dari terminal yang
memanggilnya (`pm2 startOrReload` lalu keluar — app tetap hidup), dan
memantau proses tsb: kalau exit tak terduga, PM2 otomatis start ulang
(dibatasi `max_restarts`/`min_uptime` di `ecosystem.config.js` supaya tidak
restart-loop tanpa henti kalau penyebabnya bug yang butuh perbaikan manual,
bukan gangguan sesaat). Ini pola standar untuk menjaga proses Node.js/Next.js
tetap hidup di satu mesin lokal tanpa perlu masuk ke kerumitan container atau
Windows Service (yang butuh install sebagai administrator dan baru relevan
kalau app juga harus otomatis hidup setelah restart Windows — bukan
kebutuhan saat ini).

`-H 127.0.0.1 -p 4001` tetap dipertahankan di `ecosystem.config.js` (sama
seperti `npm run start` biasa) — app tetap terikat ke localhost saja di port
standar yang sama, tidak diekspos ke jaringan (FR-6A), walau dijalankan
lewat PM2.

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

## AI Processing Engine (provider-agnostic)

`lib/ai/` berisi lapisan abstraksi AI yang tidak terikat ke satu provider —
lihat `lib/ai/provider.ts` untuk kontrak `AIProvider` yang diimplementasikan
tiap provider (`lib/ai/providers/ollama-provider.ts`,
`lib/ai/providers/gemini-provider.ts`). Business logic/UI HANYA boleh
memanggil `AIProcessingService` (`lib/ai/services/ai-processing.ts`) atau
wrapper kapabilitasnya (`lib/ai/services/{ocr,vision,chat,risk}.ts`) — tidak
pernah memanggil provider secara langsung.

**Penting — cakupan saat ini:** engine ini dibangun lengkap (provider Ollama
+ Gemini, mode Local/Cloud/Hybrid dengan failover otomatis, halaman
pengaturan di Admin > AI Processing, log request di `AiRequestLog`) tapi
**belum disambungkan** ke fitur mana pun. Alur OCR formulir cetak yang sudah
ada (`components/upload/ScanUploadPanel.tsx` → `lib/actions/document.ts` →
`lib/ocr/runOcr.ts`, Tesseract.js lokal) dan Risk Assessment deterministik
(`lib/actions/riskAssessment.ts`) TIDAK diubah dan TIDAK memakai engine ini
— keduanya sengaja dibiarkan berjalan seperti sebelumnya. Menyambungkan
salah satu fitur ke `AIProcessingService` adalah pekerjaan terpisah di masa
depan, bukan bagian dari perubahan ini.

**Menambah provider baru** (mis. Claude/OpenAI/Azure OpenAI/OpenRouter/
Groq/Mistral): buat satu file baru di `lib/ai/providers/` yang
mengimplementasikan `AIProvider`, lalu daftarkan satu baris di
`PROVIDER_REGISTRY` (`lib/ai/provider-factory.ts`) dan tambahkan id-nya ke
union `ProviderId` (`lib/ai/provider.ts`). Tidak ada file lain yang perlu
diubah.

**Keamanan:** API key cloud (mis. Gemini) disimpan terenkripsi (AES-256-GCM,
kunci diturunkan dari `SESSION_SECRET` — lihat `lib/ai/crypto.ts`) di tabel
`AppSetting`, bukan `GEMINI_API_KEY` di `.env` yang cuma jadi nilai bootstrap
awal. Halaman Settings tidak pernah menampilkan key utuh, hanya 4 digit
terakhir. Prompt/isi permintaan AI tidak pernah dicatat ke log — yang
dicatat di `AiRequestLog` hanya metadata (provider, model, sukses/gagal,
latency, token usage, estimasi biaya).
