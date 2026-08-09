# SECURITY.md — Notary CDD & Risk Assessment WebApp

Dokumen ini menjelaskan model keamanan aplikasi ini apa adanya: apa yang
sudah dilindungi, apa yang sengaja TIDAK dilindungi (dan kenapa), dan
prosedur operasional (kunci, backup, migrasi) untuk notaris/admin yang
menjalankan aplikasi ini. Ditulis untuk deployment **lokal/intranet
satu-kantor** — bukan aplikasi multi-tenant, bukan SaaS, bukan cloud.

Tidak ada klaim "100% aman", "fully compliant", atau "disertifikasi
regulator" di dokumen ini — lihat bagian **Keterbatasan yang Diketahui**
untuk risiko yang secara sadar belum/tidak ditangani.

---

## 1. Model Ancaman & Asumsi Dasar

- **Single-office, shared-PIN.** Semua staf notaris berbagi satu PIN akses
  (lihat `lib/auth.ts`). Tidak ada identitas per-user — "otorisasi" di
  aplikasi ini berarti "sesi PIN valid", bukan "user X boleh, user Y tidak".
- **Deployment lokal/intranet**, terikat ke `127.0.0.1` (atau intranet HTTPS
  lewat reverse proxy). Aplikasi ini TIDAK dirancang untuk diekspos ke
  internet publik.
- **Ancaman yang DITANGANI:** pencurian laptop/disk (BitLocker + enkripsi
  aplikasi), salinan folder `storage/`/`prisma/dev.db` tanpa akses penuh ke
  mesin, tamper terhadap data terenkripsi (AES-GCM auth tag), brute-force
  PIN online (lockout), sesi kedaluwarsa/logout tidak konsisten, upload file
  berbahaya, kebocoran lewat log, AI mengubah keputusan kepatuhan tanpa
  sepengetahuan notaris.
- **Ancaman yang TIDAK ditangani (out of scope):** akses fisik penuh +
  login Windows yang sudah ter-unlock, malware/keylogger di PC yang sama,
  serangan multi-tenant/privilege-escalation (aplikasi ini memang tidak
  punya konsep role), serangan jaringan publik (aplikasi tidak boleh
  diekspos ke internet).

---

## 2. Arsitektur Enkripsi

### 2.1 Sebelum hardening pass ini (v1, legacy — MASIH didukung untuk baca)

Satu root secret (`SESSION_SECRET`) dipakai untuk DUA hal sekaligus lewat
derivasi SHA-256 berlabel berbeda:
- HMAC penandatanganan token sesi (`lib/auth.ts`)
- Kunci AES-256-GCM untuk file upload DAN field OCR/terstruktur
  (`lib/documentEncryption.ts`, label `document-encryption:`)

Ini bukan reuse mentah (kunci turunannya beda byte), tapi tetap satu ROOT
secret — kalau `SESSION_SECRET` bocor, sesi bisa dipalsukan DAN semua
dokumen/OCR bisa didekripsi sekaligus.

### 2.2 Setelah hardening pass ini (v2 — dedicated keys)

```
SESSION_SECRET            -> HANYA autentikasi/tanda tangan sesi
DATA_ENCRYPTION_KEY       -> field OCR/terstruktur di database
                              (ocrRawText, fieldGuesses)
DOCUMENT_ENCRYPTION_KEY   -> file scan di storage/uploads/
```

Ketiganya independen — kompromi salah satu TIDAK otomatis membuka yang
lain. Rotasi `SESSION_SECRET` tidak lagi merusak dokumen/OCR yang sudah
dimigrasikan ke v2 (lihat CRYPTO-006 di test suite,
`lib/documentEncryption.test.ts`).

**Format ciphertext (versioned, per `lib/documentEncryption.ts`):**

| Data | v1 (legacy) | v2 (dedicated key) |
|---|---|---|
| File (storage/uploads/) | `[iv(12)][authTag(16)][ciphertext]` — tanpa marker | `NTRDENC2` + `[iv(12)][authTag(16)][ciphertext]` |
| String/JSON (ocrRawText, fieldGuesses) | `$enc$v1$<base64>` | `$enc$v2$<base64>` |

Semua enkripsi pakai **AES-256-GCM** (authenticated encryption): IV/nonce
acak per operasi (`crypto.randomBytes(12)`), auth tag 16-byte diverifikasi
saat dekripsi (`decipher.setAuthTag()` + `.final()` — melempar exception
kalau ciphertext dimanipulasi atau kunci salah, tidak pernah diam-diam
mengembalikan data rusak).

**Perilaku baca (backward-compatible secara default):**
- Kalau `DATA_ENCRYPTION_KEY`/`DOCUMENT_ENCRYPTION_KEY` **belum diisi**:
  aplikasi tetap berjalan normal memakai skema v1 (SESSION_SECRET) —
  TIDAK ADA breaking change untuk deployment yang sudah berjalan.
  Mengisi **hanya salah satu** dari dua env var ini dianggap kesalahan
  konfigurasi dan aplikasi menolak start (`lib/encryptionKeyGuard.ts`).
- Kalau **kedua** env var **sudah diisi**: SEMUA tulisan baru (upload baru,
  OCR baru) otomatis pakai v2. Data v1 lama tetap terbaca otomatis lewat
  `SESSION_SECRET` sampai dimigrasikan.

### 2.3 Migrasi (v1 -> v2)

```
npm run security:migrate-encryption
```

(`scripts/migrate-encryption.ts`, logika inti di `lib/encryptionMigration.ts`)

Alur per record: **DECRYPT** (kunci lama) -> **VERIFY PLAINTEXT** (untuk
file: cocokkan magic bytes terhadap MIME type tersimpan) -> **ENCRYPT**
(kunci baru) -> **VERIFY CIPHERTEXT BARU** (round-trip: dekripsi ulang,
bandingkan persis dengan plaintext asli) -> **PERSIST**.

Sifat migrasi:
- **Idempotent** — record yang sudah v2 dilewati (dideteksi dari
  prefix/marker), aman dijalankan berulang kali.
- **Resumable** — tiap record diproses+disimpan satu per satu (bukan satu
  transaksi raksasa untuk semua data). Kalau proses terhenti di tengah
  jalan, record yang sudah v2 tetap v2, sisanya tetap v1 (kedua state valid
  dan tetap bisa dibaca aplikasi) — jalankan lagi untuk melanjutkan.
- **Tidak pernah menulis plaintext ke disk atau log** — semua
  dekripsi/enkripsi ulang terjadi di memori; file baru ditulis ke path
  sementara (`<nama>.migrating`) lalu di-rename (atomic) menimpa file asli,
  supaya proses yang terhenti di tengah write tidak merusak file asli.
- **Record yang gagal TIDAK dihapus/dilewati diam-diam** — dihitung
  terpisah (`failed`), dilaporkan di akhir dengan id record, file/kolom
  ASLI tidak tersentuh. Jalankan ulang skrip setelah masalah diperbaiki.
- Skrip menulis `storage/encryption-migration-status.json` (ringkasan
  jumlah + timestamp) setelah selesai — dipakai `lib/encryptionKeyGuard.ts`
  untuk fail-closed check saat boot berikutnya (lihat 2.4).

Migrasi **TIDAK** berjalan otomatis saat start aplikasi — harus dijalankan
manual/eksplisit oleh admin, sesuai instruksi hardening pass ini.

### 2.4 Fail-closed, bukan auto-generate kunci

Aplikasi **tidak pernah** membuat `DATA_ENCRYPTION_KEY`/
`DOCUMENT_ENCRYPTION_KEY` secara otomatis. Kalau migrasi sudah pernah
dijalankan (`storage/encryption-migration-status.json` ada) tapi salah satu
kunci hilang dari `.env` saat start berikutnya, aplikasi **menolak start**
(`lib/encryptionKeyGuard.ts`, dipanggil dari `instrumentation.ts`) — lebih
baik downtime yang jelas daripada berjalan dan gagal dekripsi diam-diam
satu per satu saat notaris membuka dokumen.

### 2.5 Key lifecycle — pembuatan, penyimpanan, backup, rotasi

- **Pembuatan:** `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  untuk masing-masing `DATA_ENCRYPTION_KEY`/`DOCUMENT_ENCRYPTION_KEY`/
  `SESSION_SECRET`. Harus BEDA satu sama lain.
- **Penyimpanan:** hanya di `.env` (tidak pernah di database, tidak pernah
  di kode, tidak pernah di log). `.env` tidak di-commit ke git
  (`.gitignore`).
- **Backup kunci:** WAJIB disimpan di tempat terpisah dari server (mis.
  password manager kantor, bukan di folder `storage/` yang sama dengan data
  terenkripsi) — kalau `.env` hilang bersamaan dengan disk, kunci ikut
  hilang.
- **Rotasi:** mengganti `SESSION_SECRET` kapan saja aman untuk sesi (logout
  semua orang) dan aman untuk data v2 (tidak bergantung padanya). Mengganti
  `DATA_ENCRYPTION_KEY`/`DOCUMENT_ENCRYPTION_KEY` TANPA migrasi ulang akan
  membuat semua data v2 yang sudah ada tidak bisa dibaca — belum ada skrip
  rotasi v2->v2' otomatis di pass ini (di luar cakupan; desain versioned
  ciphertext di atas membuatnya mungkin ditambahkan nanti tanpa perubahan
  arsitektur).
- **Kehilangan kunci:** **TIDAK BISA DIPULIHKAN oleh siapa pun**, termasuk
  developer aplikasi ini. AES-256-GCM tidak punya backdoor. Ini alasan
  utama kenapa backup kunci di tempat terpisah adalah prosedur wajib, bukan
  saran.

---

## 3. Backup & Restore

- **Buat backup:** tombol "Backup Now" (`/admin/backup`) ->
  `createBackup()` (`lib/actions/backup.ts`) -> `buildBackupZip()`
  (`lib/backupArchive.ts`) — zip berisi `dev.db` + `storage/uploads/*` +
  `manifest.json` (SHA-256 per file) + `meta.json` (SHA-256 seluruh zip,
  timestamp, nama file).
- **Verifikasi restore (BARU, hardening pass ini):** tombol "Verifikasi
  Restore" -> `verifyLastBackup()` -> `verifyBackupRestore()`
  (`lib/backupArchive.ts`). Sebelumnya "verifikasi" cuma menghitung ulang
  SHA-256 zip (`verifyBackupChecksum`) — TIDAK PERNAH benar-benar membuka
  isinya. Sekarang alur sungguhan:

  ```
  EXTRACT (direktori sementara terisolasi)
    -> MANIFEST + FILE CHECKSUM (per file)
    -> SQLITE INTEGRITY CHECK (PRAGMA integrity_check)
    -> FOREIGN KEY CHECK (PRAGMA foreign_key_check)
    -> PRISMA TABLE READ (Customer, CustomerDocument, RiskAssessment,
       ActivityLogEntry via Prisma client SUNGGUHAN terhadap DB hasil ekstrak)
    -> DECRYPT SAMPLE DOCUMENT (kunci LIVE aplikasi, bukan apa pun dari
       dalam backup — backup tidak pernah berisi kunci)
    -> DECRYPT SAMPLE OCR FIELD
    -> CLEANUP direktori sementara (selalu, bahkan kalau gagal)
  ```

  Status akhir: **CREATED** (baru dibuat, belum diverifikasi) vs
  **VERIFIED** (semua pemeriksaan lolos) vs **FAILED** (ada yang gagal,
  detail per-pemeriksaan ditampilkan). Hasil disimpan di `meta.json`
  (`restoreStatus`/`restoreVerifiedAt`/`restoreChecks`).
- **Tidak pernah menyentuh produksi.** Semua path dalam
  `verifyBackupRestore()` adalah direktori sementara (`os.tmpdir()`) —
  `prisma/dev.db` dan `storage/uploads/` asli hanya pernah DIBACA (untuk
  membuat backup), tidak pernah ditulis oleh proses verifikasi. Dibuktikan
  lewat test `BACKUP-004` (`lib/actions/backup.test.ts`).
- **Restore manual (memasang kembali backup):** aplikasi ini TIDAK
  menyediakan tombol "Restore" satu-klik (sengaja — restore adalah operasi
  destruktif terhadap data produksi, di luar cakupan hardening pass ini
  yang eksplisit dilarang menghapus/reset database produksi). Prosedur
  manual: hentikan aplikasi (`npm run down`), ekstrak zip, salin `dev.db`
  ke `prisma/dev.db` dan isi `uploads/` ke `storage/uploads/`, jalankan
  ulang (`npm run up`). Selalu backup keadaan SEKARANG dulu sebelum
  menimpa.

---

## 4. Otorisasi

Model: **AUTHENTICATE -> AUTHORIZE OBJECT -> FETCH -> DECRYPT -> RETURN**
(bukan authenticate -> decrypt -> authorize).

`app/api/documents/[id]/route.ts` (endpoint yang mengembalikan BYTE
DOKUMEN TERDEKRIPSI langsung) sebelumnya hanya mengandalkan `proxy.ts`
(gate PIN global) — tidak ada pemeriksaan di dalam route itu sendiri.
Sekarang memanggil `authorizeDocumentAccess()` (`lib/authorization.ts`)
LEBIH DULU, yang:
1. Memvalidasi ULANG token sesi di dalam route (defense-in-depth —
   tidak bergantung semata pada `proxy.ts`).
2. Memastikan dokumen memang ada di database.

**Baru setelah kedua langkah itu lolos**, kode lanjut membaca file dari
disk dan memanggil `decryptDocumentBuffer()`. Dibuktikan lewat test
`AUTHZ-003` (`lib/authorization.test.ts`) bahwa permintaan tanpa sesi
ditolak SEBELUM sampai ke langkah dekripsi, walau id dokumennya valid.

**Keterbatasan yang jujur:** aplikasi ini shared-PIN, satu kantor, tanpa
identitas per-user (lihat Bagian 1) — jadi "otorisasi" di sini TIDAK BISA
berarti "customer A hanya boleh diakses staf tertentu". Yang bisa
dijamin: sesi valid + objek benar-benar ada. Ini keputusan desain yang
didokumentasikan, bukan RBAC yang setengah jadi.

---

## 5. Tata Kelola AI (AI Governance)

**AI BOLEH:** menyarankan, mengekstrak (OCR), mengklasifikasi, meringkas,
mengidentifikasi indikator risiko.

**AI TIDAK BOLEH (dan secara struktural TIDAK BISA):** memfinalisasi
risiko, menyetujui/menolak kasus, memfinalisasi EDD, mengubah skor risiko
otoritatif, menandai checklist wajib selesai, melewati aturan
deterministik.

Ini bukan sekadar aturan UI — diverifikasi di level server:
- `riskAssessmentSchema`/`highRiskAdditionalInfoSchema`
  (`lib/validations.ts`) **tidak punya field** `riskCategory`/`approved`/
  `eddOk`/`eddComplete` sama sekali. Zod `z.object()` di codebase ini tidak
  pernah pakai `.passthrough()` — field asing dari client (termasuk yang
  dikirim AI atau klien jahat) otomatis DIBUANG saat parse, tidak pernah
  sampai ke database. Dibuktikan test `AI-001`/`AI-002`/`AI-003`
  (`lib/aiBoundary.test.ts`).
- `computeRiskCategory()` (`lib/scoring.ts`) murni fungsi dari
  `totalScore` numerik (dihitung server-side dari tabel referensi skor) —
  tidak menerima kategori langsung dari input mana pun.
- `computeAndPersistStatus()`/`computeCompletionBreakdown()`
  (`lib/status.ts`) menghitung status COMPLETE/EDD-ok murni dari state DB
  hasil query fresh, bukan dari parameter yang bisa dipengaruhi client.
- Layanan AI (`lib/ai/services/{chat,ocr,risk,vision}.ts`) sengaja **belum
  terhubung ke fitur apa pun** yang menulis ke tabel Customer/
  RiskAssessment/HighRiskAdditionalInfo — infrastruktur disiapkan lebih
  dulu (arsitektur additive-only), bukan tech debt.
- Satu-satunya fitur AI yang benar-benar aktif (`lib/ai/services/
  compliance.ts` -> `CaseAiPanel.tsx`) hanya menulis ke tabel terpisah
  `CaseAiFinding` (temuan/rekomendasi, bukan keputusan), dengan disclaimer
  eksplisit di UI: *"Hanya rekomendasi — tidak pernah memutuskan, mengubah
  data, atau menghapus dokumen. Keputusan akhir tetap di tangan Anda."*
- Saran OCR mengisi form lewat pola tiga-state (Kosong/Disarankan/
  Dikonfirmasi, `components/forms/fields.tsx` +`OcrReviewGate.tsx`) — nilai
  dari OCR ditandai visual berbeda dan wajib melalui gerbang review
  eksplisit sebelum submit, tidak pernah otomatis dianggap final.

---

## 6. Keamanan Upload

- **Nama file tersimpan SELALU server-generated** (`generateStoredFilename()`,
  `lib/uploadSafety.ts`) — fungsi ini bahkan tidak menerima parameter nama
  file dari client sama sekali, hanya MIME type (untuk memilih ekstensi
  dari allowlist tetap: jpg/png/webp). Nama asli dari notaris (`file.name`)
  hanya disimpan sebagai metadata tampilan (`fileName` di DB), TIDAK PERNAH
  dipakai untuk membangun path di disk — path traversal lewat nama file
  secara struktural tidak mungkin, bukan cuma difilter.
- **Validasi berlapis sebelum file ditulis ke disk:** allowlist MIME
  (`file.type`) -> ukuran maksimal 15MB -> **magic bytes/file signature**
  (`matchesFileSignature()`, `lib/fileSignature.ts`) yang membandingkan
  byte pertama file terhadap MIME yang diklaim — `file.type` dari browser
  bisa dipalsukan, magic bytes tidak (semudah itu). File yang lolos
  allowlist MIME tapi isinya bukan gambar sungguhan (mis. HTML/executable
  diberi ekstensi .jpg) ditolak sebelum sempat disimpan.
- **SVG dan HTML tidak pernah diterima** — allowlist hanya JPEG/PNG/WEBP,
  jadi tidak ada risiko SVG berisi script atau HTML ter-render oleh
  browser saat dokumen diunduh kembali.
- **Download:** `Content-Type` diambil dari MIME tersimpan (bukan
  di-sniff), `Content-Disposition: inline` dengan nama ter-encode,
  `X-Content-Type-Options: nosniff` (header global, `next.config.ts`)
  mencegah browser salah men-sniff konten yang diserve.

---

## 7. Header Keamanan & Deployment Intranet

- Header aktif (`next.config.ts`): `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  `Permissions-Policy` (kunci semua akses kamera/mikrofon/geolokasi — app
  ini memang tidak pernah memakainya, upload lewat `<input type=file>`
  native), `Cross-Origin-Opener-Policy: same-origin`,
  `X-DNS-Prefetch-Control: off`, `Content-Security-Policy` minimal
  (`object-src`/`frame-ancestors`/`base-uri` — tidak menyentuh
  `script-src`/`style-src` supaya tidak berisiko mematahkan Next.js/
  Tailwind).
- **Strict-Transport-Security (BARU, hardening pass ini):** hanya aktif
  kalau `APP_BASE_URL` diawali `https://` (sinyal yang sama dipakai untuk
  `Secure` cookie flag, `isSecureDeployment()` di `lib/auth.ts`).
  **Sengaja TIDAK diaktifkan tanpa syarat** — kalau HSTS dipaksa aktif
  untuk deployment default `http://127.0.0.1`, browser akan mengunci host
  itu ke "hanya-HTTPS" padahal tidak pernah punya sertifikat, mengunci
  notaris keluar dari aplikasinya sendiri.
- **Pemisahan dev/production:** `npm run dev`/`dev:lan` sekarang punya
  guard (`scripts/guard-not-production.js`, dipasang via npm `predev`/
  `predev:lan` hook) yang menolak start kalau `NODE_ENV=production`
  terdeteksi di environment — mencegah shell yang masih membawa
  `NODE_ENV=production` dari sesi `npm run up` sebelumnya secara tidak
  sengaja menjalankan dev server (unminified, bind `0.0.0.0` untuk
  `dev:lan`) di mesin yang sebenarnya sedang dipakai produksi.
  `start`/`start:lan`/`up` (lewat PM2, `ecosystem.config.js`) TIDAK
  di-guard — `NODE_ENV=production` di situ memang benar dan diharapkan.
- Aplikasi ini **TIDAK dirancang untuk internet publik** — tidak ada DNS
  publik, tidak ada port forwarding, tidak butuh koneksi internet untuk
  operasi inti (integrasi Google Sheets/Drive/AI cloud semuanya opsional).

---

## 8. Logging

- `storage/security.log` (NDJSON, append-only, `lib/securityLog.ts`) mencatat
  8 jenis event (LOGIN_SUCCESS/FAILED, LOCKOUT_TRIGGERED, LOGOUT,
  SESSION_EXTENDED, PIN_RESET, BACKUP_CREATED, BACKUP_VERIFIED,
  CUSTOMER_DELETED) — field `detail` selalu string bebas-PII (mis. nama
  file backup, BUKAN pernah nilai PIN/token/kunci). Diverifikasi lewat
  audit sumber statis (`LOG-001`, `lib/securityLog.test.ts`) bahwa
  `verifyPin()` tidak pernah mengoper variabel `pin` ke `logSecurityEvent`.
- `console.log`/`console.error` di seluruh kode: diaudit menyeluruh (Phase
  0 hardening pass ini) — tidak ditemukan PIN, token sesi, kunci enkripsi,
  NIK/NPWP, atau isi OCR yang ter-log. `customerId` yang muncul di beberapa
  log hanya cuid opaque, bukan PII.
- **Pesan error ke client (BARU, hardening pass ini):** error konektivitas
  provider AI (Ollama/Gemini) yang sebelumnya meneruskan `err.message`
  mentah ke client sekarang disaring lewat `toSafeErrorMessage()`
  (`lib/safeError.ts`) — menghapus path absolut Windows/POSIX yang kadang
  ikut ter-embed di error Node (`ENOENT`, dsb.) dan membatasi panjang;
  detail lengkap tetap di-`console.error` server-side untuk diagnosis.
  Halaman `app/error.tsx`/`app/global-error.tsx` tidak pernah merender
  `error.message`/`error.stack` ke pengguna.

---

## 9. Keterbatasan yang Diketahui (jujur, tidak disembunyikan)

1. **Bukan multi-user.** Satu PIN bersama satu kantor — tidak ada audit
   trail "siapa" mengubah apa, hanya "apa yang terjadi kapan"
   (`ActivityLogEntry`).
2. **Kunci enkripsi hidup di disk yang sama dengan datanya** (`.env` di PC
   yang sama). BitLocker/full-disk encryption tetap WAJIB — enkripsi
   level-aplikasi ini menaikkan standar terhadap "salin folder
   storage/tanpa akses penuh ke mesin", bukan terhadap "akses penuh ke PC
   yang sudah menyala & login".
3. **Belum ada rotasi otomatis untuk `DATA_ENCRYPTION_KEY`/
   `DOCUMENT_ENCRYPTION_KEY`** — mengganti kunci ini butuh migrasi manual
   ulang (skrip yang ada hari ini hanya menangani v1->v2, bukan v2->v2
   baru). Desain versioned ciphertext membuat ini bisa ditambahkan nanti
   tanpa mengubah arsitektur, tapi belum diimplementasikan.
4. **Tidak ada restore satu-klik** — restore manual (lihat Bagian 3),
   sengaja, karena timpa database produksi adalah operasi berisiko tinggi
   yang sebaiknya tidak dipermudah jadi satu tombol.
5. **`npm audit` melaporkan 2 kerentanan tersisa** (js-yaml, via `pm2`).
   Diaudit sampai ke titik reachability sesungguhnya (bukan cuma severity
   npm audit): `pm2` cuma memanggil `js-yaml.load()` saat file config
   berekstensi `.yaml`/`.yml` (`node_modules/pm2/lib/Common.js`,
   `Common.parseConfig`) — `ecosystem.config.js` di repo ini adalah `.js`,
   jadi jalur itu TIDAK PERNAH tereksekusi. Upgrade pm2 5.x->7.x adalah
   breaking-version sungguhan (skip major 6) untuk kerentanan yang tidak
   reachable — sengaja DITUNDA, bukan diabaikan tanpa alasan. Tiga
   kerentanan lain (postcss, sharp, dan `next` itu sendiri) SUDAH
   diperbaiki dengan meng-upgrade `next` 16.2.12 -> 16.3.0 (dikonfirmasi
   BUKAN semver-major, `npm audit`'s `fixAvailable.isSemVerMajor: false`)
   — verifikasi tambahan sebelum upgrade: `/_next/image` (dipakai sharp
   untuk optimasi gambar) dites langsung lewat HTTP sungguhan sebelum
   upgrade — reachable tanpa sesi PIN (dikecualikan `proxy.ts` matcher
   seperti aset `_next/*` lain), TAPI menolak URL eksternal (400 "url
   parameter is not allowed" — Next tidak mengizinkan optimasi domain
   eksternal tanpa `images.remotePatterns`, yang tidak dikonfigurasi di
   repo ini) DAN gagal saat mencoba memuat route yang dilindungi PIN
   gate (`/api/hero-image` lewat `/_next/image` balas 400 "bukan gambar
   valid" — fetch internal-nya tetap kena redirect `/lock`, tidak bisa
   dipakai untuk bypass), jadi tidak ada input attacker-controlled yang
   pernah sampai ke sharp/libvips lewat rute ini di aplikasi ini.
   `nanoid` (kerentanan sebelumnya) sudah diperbaiki (`npm audit fix`,
   non-breaking).
6. **HTTPS bergantung konfigurasi manual reverse proxy** (Caddy,
   `docs/intranet-deployment-id.md`) — aplikasi sendiri tetap bind
   `127.0.0.1` plaintext HTTP secara default; kalau reverse proxy salah
   konfigurasi, HSTS/Secure cookie tidak otomatis menyelamatkan.
7. **Backup ke Google Drive (FR-1.4, kalau diaktifkan) menyimpan file
   TIDAK terenkripsi di Drive** (didekripsi dulu supaya bisa dibuka sebagai
   gambar biasa) — ini celah kebocoran yang lebih besar dari disk lokal,
   sudah didokumentasikan sejak Phase 3, bukan temuan baru.
8. **Lockout PIN in-memory, reset saat proses restart** — dianggap wajar
   untuk aplikasi single-process lokal ini, tapi bukan proteksi terhadap
   penyerang yang bisa memicu restart proses.

---

## 10. Referensi Silang

- Prosedur setup lengkap (PIN, port, PM2, testing, AI, deployment
  intranet): `SETUP.md`
- Sumber kebenaran skema data/field form: `reference-data.md`
- Riwayat perubahan per fase: `CLAUDE.md` bagian "Riwayat Perubahan"
