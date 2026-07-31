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