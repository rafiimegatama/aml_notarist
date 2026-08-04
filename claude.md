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