# CLAUDE.md — Notary CDD & Risk Assessment WebApp

## Ringkasan Proyek
Aplikasi web lokal untuk kantor notaris di Indonesia. Digunakan untuk:
1. Mengisi Formulir Customer Due Diligence (CDD) — 3 jenis: Korporasi, Perorangan, dan Perikatan Lainnya (Legal Arrangement)
2. Melakukan Penilaian Tingkat Risiko pengguna jasa secara otomatis (skoring berbasis tabel referensi)
3. Mengisi Informasi Tambahan untuk pengguna jasa berisiko Tinggi (Enhanced Due Diligence)

Dasar hukum: PP No. 43 Tahun 2015, Permenkumham No. 9 Tahun 2017 (Formulir CDD), Perpres No. 13 Tahun 2018, dan Permenkumham No. 15 Tahun 2019 (Pemilik Manfaat/Beneficial Owner).

## Tech Stack
- **Frontend + Backend:** Next.js 14+ (App Router, TypeScript, Tailwind CSS) — satu project, satu proses
- **Database:** SQLite (file lokal), diakses via Prisma ORM
- **Mutasi data:** Server Actions Next.js (bukan REST API terpisah)
- **Deployment:** Lokal saja — `npm run dev`, satu kantor notaris, tanpa hosting/cloud

## Sumber Kebenaran (Source of Truth)
Semua field form, label, dan tabel skor risiko WAJIB mengacu ke `reference-data.md`. File itu adalah satu-satunya sumber kebenaran untuk domain data. Jangan menambah, mengubah, atau menghilangkan field tanpa terlebih dahulu mengupdate file tersebut.

## Known Gaps (per inisialisasi proyek)
1. **Tabel Referensi "Profil Bisnis" (RefBusinessSectorScore)** — kategori dan skor resmi belum tersedia dari dokumen sumber. Tabel dibuat kosong. Total Nilai risiko TIDAK dianggap final sampai tabel ini terisi.
2. **Form EDD Korporasi/Institusi** — dokumen sumber (halaman 15/29) hanya menyertakan section Perorangan. Form EDD untuk Korporasi/Legal Arrangement belum ada.

Detail lengkap ada di `reference-data.md` bagian 9 (Known Gaps). Ketika data ini tersedia, gunakan PROMPT 3 di `claude-code-prompt.md`.

## Asumsi v1
- Single user / satu notaris, tanpa login-autentikasi (bisa ditambahkan sebagai update terpisah)
- Data tersimpan lokal (file SQLite), tidak ada sinkronisasi cloud
- Export PDF/print disertakan sebagai fitur dasar untuk kebutuhan arsip fisik

## Riwayat Perubahan
| Versi | Tanggal | Perubahan | File Terdampak | Keterangan |
|-------|---------|-----------|-----------------|------------|
| v1 | 2026-08-01 | Initial build | Semua file | Scaffold project, schema, seed data, 3 form CDD, modul risk assessment, form EDD, halaman admin referensi, dashboard, export PDF. Validasi akhir: 121 field dari reference-data.md, 121 ditemukan di schema+UI. Gap tersisa: RefBusinessSectorScore (Tabel B) kosong, form EDD Korporasi/Institusi belum tersedia — keduanya Known Gap terdokumentasi, bukan kesalahan implementasi. |
| v2-fase1 | 2026-08-04 | Phase 2 PRD — Fase 1: akses & safety net | `package.json`, `proxy.ts` (baru), `lib/auth.ts` (baru), `lib/actions/auth.ts` (baru), `app/lock/`, `components/auth/PinForm.tsx` (baru), `.env.example` (baru), `scripts/hash-pin.ts` (baru), `SETUP.md` (baru), `lib/storage.ts`, `lib/actions/backup.ts` (baru), `app/api/backup/[filename]/route.ts` (baru), `app/admin/backup/`, `components/admin/BackupPanel.tsx` (baru), `app/layout.tsx`, `.gitignore` | FR-6A (bind 127.0.0.1), FR-6B (PIN gate via Proxy — nama baru untuk middleware di Next.js 16 — dengan lockout 3x/5 menit, sesi 10 jam), FR-1.1 (backup manual: zip dev.db+uploads, diunduh via route terpisah). Diverifikasi end-to-end lewat HTTP (bukan cuma unit test): PIN salah, lockout, PIN benar → cookie sesi, akses ke `/api/documents/[id]` dan `/api/backup/[filename]` tanpa sesi ter-redirect ke /lock. Dua bug ditemukan+diperbaiki saat verifikasi: signature token sesi tidak menolak string yang ditempeli karakter di ujungnya (Buffer.from("hex") diam-diam membuang sisa ganjil), dan regex nama file backup menolak filename aslinya sendiri (kurang karakter "Z" dari ISO timestamp). Belum dikerjakan (Fase 2+): FR-1.2/1.3/1.4 (HDD/Sheets/Drive), FR-2B interim banner, FR-4 checklist, FR-11 auto-archive PDF. |
| v2-fase2 | 2026-08-04 | Phase 2 PRD — Fase 2: data flow & compliance UX | `instrumentation.ts` (baru), `lib/hddSync.ts` (baru), `lib/googleDrive/client.ts` (baru), `lib/actions/driveBackup.ts` (baru), `lib/actions/pdfArchive.tsx` (baru), `lib/actions/backupStatus.ts` (baru), `lib/status.ts` (breakdown FR-4 + trigger FR-1.3/FR-11), `lib/actions/document.ts`, `lib/storage.ts`, `components/detail/CompletionChecklist.tsx` (baru), `components/detail/DetailPrimitives.tsx`, `app/cdd/[id]/page.tsx`, `app/page.tsx`, `app/admin/backup/`, `.env.example`, `.gitignore` | FR-1.2 (sinkron HDD eksternal saat app start, via `instrumentation.ts`), FR-1.3 (export Google Sheets otomatis saat status jadi COMPLETE), FR-1.4 (backup scan ke Google Drive, fire-and-forget, tidak menunda OCR), FR-2B (banner interim Korporasi/LA — sudah ada dari v1, kata-kata diperjelas + anchor `#edd`), FR-4 (`getCompletionBreakdown()`/`computeCompletionBreakdown()` sebagai satu-satunya sumber breakdown, dipakai widget checklist di halaman detail dan tooltip "Menunggu: ..." di baris DRAFT dashboard), FR-11 (auto-archive PDF ke `storage/archive/` tepat saat transisi DRAFT→COMPLETE, titik pemicu tunggal di `computeAndPersistStatus`). Diverifikasi lewat skrip yang membuat customer uji, memicu transisi status, dan mengecek breakdown + file PDF hasil arsip secara langsung (bukan cuma type-check) — juga verifikasi UI sungguhan via HTTP: tooltip dashboard dan widget checklist di halaman detail. |