# ================================================================
# PROMPT 1 — INITIAL BUILD
# ================================================================

Baca CLAUDE.md terlebih dahulu sebagai konteks proyek ini.
Baca juga reference-data.md — ini SATU-SATUNYA sumber kebenaran untuk semua field, label, dan tabel skor risiko. Jangan menambah, mengubah, atau menghilangkan field yang tidak ada di file tersebut. Jika ragu, tanya saya — jangan menebak.

Kerjakan step demi step sesuai urutan berikut. Setiap step selesai, BERHENTI dan tunggu konfirmasi saya sebelum lanjut ke step berikutnya.

-----
STEP 1 — SCAFFOLD PROJECT
- Inisialisasi Next.js 14+ (App Router, TypeScript, Tailwind CSS).
- Setup Prisma dengan SQLite (`prisma/dev.db`).
- Struktur folder: /app, /components, /lib, /prisma.
- Install dependency tambahan yang diperlukan: form handling (mis. react-hook-form + zod), dan library PDF (mis. @react-pdf/renderer) untuk dipakai di Step 10.
- CLAUDE.md sudah tersedia — jangan ditimpa, hanya update section Riwayat Perubahan di Step 11.
STOP. Tunggu konfirmasi saya.

-----
STEP 2 — PRISMA SCHEMA
Berdasarkan reference-data.md bagian 1–8, desain schema.prisma:
- `Customer` — id, type (enum KORPORASI/PERORANGAN/LEGAL_ARRANGEMENT), status (enum DRAFT/COMPLETE), createdAt, updatedAt
- `CorporateDetail`, `IndividualDetail`, `LegalArrangementDetail` — 1:1 ke Customer, field sesuai Section 1/2/3 bagian A & B
- `BeneficialOwner` — 1:banyak ke Customer, field sesuai Section 1.C
- `PowerOfAttorney` — 1:1 ke Customer, khusus KORPORASI, field sesuai Section 1.D
- `LegalArrangementParty` — 1:banyak ke Customer, khusus LEGAL_ARRANGEMENT, field sesuai Section 3.D
- `NotaryService` — 1:1 ke Customer, field sesuai Section 1.E
- `RiskAssessment` — 1:1 ke Customer, field PEP (Section 4) + FK ke 5 tabel referensi + totalScore (nullable Int) + riskCategory (nullable enum RENDAH/SEDANG/TINGGI)
- `HighRiskAdditionalInfo` — 1:1 ke Customer, nullable, field sesuai Section 7.A
- 5 tabel referensi: `RefUserProfileScore`, `RefBusinessSectorScore`, `RefRegionScore`, `RefCountryScore`, `RefNotaryServiceTypeScore` — masing-masing: id, categoryName (String), score (Int, nullable khusus RefBusinessSectorScore), isActive (Boolean default true)

Field opsional di form kertas ("jika ada", "jika WNA") → nullable di schema.
Tampilkan schema.prisma lengkap sebelum lanjut.
STOP. Tunggu konfirmasi saya.

-----
STEP 3 — MIGRATION + SEED
- Jalankan `prisma migrate dev` untuk membuat database.
- Buat `prisma/seed.ts`:
  - Isi RefUserProfileScore, RefRegionScore, RefCountryScore, RefNotaryServiceTypeScore PERSIS sesuai reference-data.md bagian 5 (Tabel A, C, D, E) — jangan ubah nama kategori atau skornya.
  - RefBusinessSectorScore: buat tabelnya, JANGAN isi baris apapun. Tambahkan komentar di kode: `// BELUM ADA DATA RESMI — lengkapi via halaman Referensi Data sebelum Total Nilai dianggap final. Lihat reference-data.md bagian 9.`
- Jalankan seed. Nyatakan secara eksplisit jumlah baris per tabel referensi, termasuk menyatakan RefBusinessSectorScore = 0 baris.
STOP. Tunggu konfirmasi saya.

-----
STEP 4 — FORM CDD KORPORASI
- Halaman "Buat CDD Baru" dengan pilihan jenis (Korporasi / Perorangan / Legal Arrangement).
- Form CDD Korporasi, field PERSIS sesuai reference-data.md Section 1 (A, B, C — bisa lebih dari satu BO, D, E).
- Gunakan Server Action untuk submit (create Customer + CorporateDetail + BeneficialOwner(s) + PowerOfAttorney + NotaryService dalam satu transaksi Prisma).
- Validasi dasar: field wajib, format tanggal.
- Simpan sebagai draft (status=DRAFT) jika belum lengkap.
Jangan menambah field yang tidak ada di reference-data.md. Jangan menghilangkan field yang ada.
STOP. Tunggu konfirmasi saya.

-----
STEP 5 — FORM CDD PERORANGAN & PERIKATAN LAINNYA
Ulangi pola Step 4 untuk:
1. CDD Perorangan — reference-data.md Section 2
2. CDD Perikatan Lainnya — reference-data.md Section 3 (termasuk LegalArrangementParty, bisa lebih dari satu pihak)
STOP. Tunggu konfirmasi saya.

-----
STEP 6 — MODUL RISK ASSESSMENT
Halaman lanjutan setelah CDD dasar tersimpan (terhubung ke Customer yang sama):
- Section PEP Screening — reference-data.md Section 4.
- 5 dropdown, masing-masing dari tabel referensi terkait — tampilkan categoryName sebagai label, simpan FK ke row referensi.
- Auto-calculate Total Nilai secara real-time saat user memilih (reference-data.md bagian 6).
- Jika kategori Bisnis belum bisa dipilih (RefBusinessSectorScore kosong): tampilkan warning jelas ("Skor Bisnis belum tersedia — Total Nilai belum final") dan JANGAN izinkan Customer berstatus COMPLETE sampai ini terisi.
- Kategori Risiko read-only, computed otomatis sesuai reference-data.md bagian 6.
- Jika Tinggi: tampilkan notifikasi bahwa Step 7 wajib diisi sebelum CDD dianggap lengkap.
STOP. Tunggu konfirmasi saya.

-----
STEP 7 — FORM INFORMASI TAMBAHAN (HIGH RISK / EDD)
- Form sesuai reference-data.md Section 7.A, muncul HANYA jika Kategori Risiko = Tinggi DAN Customer.type = PERORANGAN.
- Jika Customer.type = KORPORASI atau LEGAL_ARRANGEMENT DAN Kategori Risiko = Tinggi: tampilkan notice "Form EDD Korporasi/Institusi belum tersedia (lihat reference-data.md bagian 9) — proses manual diperlukan" dan biarkan status tetap DRAFT/perlu-review, jangan memblokir aplikasi.
STOP. Tunggu konfirmasi saya.

-----
STEP 8 — HALAMAN ADMIN / REFERENSI DATA
Halaman pengaturan untuk mengelola 5 tabel referensi (tambah/edit/nonaktifkan baris).
Beri penanda visual jelas pada RefBusinessSectorScore selama masih kosong ("Perlu Dilengkapi").
STOP. Tunggu konfirmasi saya.

-----
STEP 9 — DASHBOARD, PENCARIAN, DETAIL
- Dashboard: daftar semua CDD, filter (tipe/kategori risiko/status/tanggal), cari berdasarkan nama.
- Halaman detail: tampilan lengkap read-only satu CDD (semua section + risk assessment + EDD jika ada).
STOP. Tunggu konfirmasi saya.

-----
STEP 10 — EXPORT PDF
Tombol export/print di halaman detail → hasilkan PDF rapi dan lengkap untuk arsip (tidak wajib meniru layout formulir kertas persis, cukup jelas dan lengkap).
STOP. Tunggu konfirmasi saya.

-----
STEP 11 — VALIDASI AKHIR
- Cross-check SETIAP field di reference-data.md sudah terwakili di schema.prisma DAN di form/halaman terkait.
- Nyatakan secara eksplisit: "Divalidasi [N] field dari reference-data.md. [N] ditemukan di schema+UI. Gap tersisa: [list, minimal sebutkan RefBusinessSectorScore & EDD Korporasi]."
- Update CLAUDE.md bagian Riwayat Perubahan (baris v1, isi tanggal selesai).
STOP. Selesai — tunggu instruksi saya untuk langkah selanjutnya.

# ================================================================
# PROMPT 2 — UPDATE: TAMBAH FIELD/SCREEN BARU
# ================================================================

Baca CLAUDE.md dan reference-data.md terlebih dahulu. Perhatikan Riwayat Perubahan dan Known Gaps.

Perubahan yang diminta:
- Form/halaman terdampak: [ISI]
- Field baru: [ISI NAMA + TIPE + WAJIB/OPSIONAL]
- Konteks/alasan: [ISI]

Sebelum mulai:
1. Tambahkan baris baru di CLAUDE.md Riwayat Perubahan:
   | v[N] | [TANGGAL] | Tambah field/screen baru | [file terdampak] | [keterangan] |
2. Update reference-data.md dengan field baru ini di section yang sesuai — SEBELUM mengubah kode apapun.

Kerjakan berurutan, tampilkan DIFF tiap perubahan, tunggu konfirmasi tiap step:

STEP A — Update reference-data.md. Tampilkan bagian yang berubah.
STOP. Tunggu konfirmasi.

STEP B — Update schema.prisma via migration (ADD kolom, jangan drop/recreate tabel existing). Jika perlu tabel referensi baru, buat + seed jika datanya sudah ada.
STOP. Tunggu konfirmasi.

STEP C — Update form/halaman terkait, termasuk validasi.
STOP. Tunggu konfirmasi.

STEP D — Update Server Action & halaman detail agar field baru ikut tersimpan dan tampil.
STOP. Tunggu konfirmasi.

STEP E — Nyatakan: "Field [nama] sudah ada di reference-data.md, schema, form, dan detail view."
STOP.

# ================================================================
# PROMPT 3 — UPDATE: TABEL REFERENSI / SKOR RISIKO BERUBAH
# ================================================================

Baca CLAUDE.md dan reference-data.md terlebih dahulu. Perhatikan Riwayat Perubahan dan Known Gaps.
(Pakai prompt ini juga saat Tabel B "Profil Bisnis" atau EDD Korporasi akhirnya tersedia.)

Perubahan yang diminta:
- Tabel referensi: [ISI: RefUserProfileScore / RefBusinessSectorScore / RefRegionScore / RefCountryScore / RefNotaryServiceTypeScore]
- Kategori ditambah/diubah/dinonaktifkan: [ISI]
- Sumber perubahan (mis. Tabel Profil Bisnis akhirnya tersedia, atau regulasi baru): [ISI]

Sebelum mulai, tambahkan baris baru di CLAUDE.md Riwayat Perubahan:
| v[N] | [TANGGAL] | Update tabel referensi [nama] | [file terdampak] | [keterangan] |

Kerjakan berurutan, tampilkan DIFF, tunggu konfirmasi tiap step:

STEP A — Update reference-data.md dengan nilai baru. Jika ini pertama kali mengisi RefBusinessSectorScore, hapus catatan terkait dari bagian 9 Known Gaps.
STOP. Tunggu konfirmasi.

STEP B — Update prisma/seed.ts sesuai perubahan.
PENTING: JANGAN mengubah totalScore/riskCategory yang SUDAH tersimpan di CDD berstatus COMPLETE — itu snapshot historis pada saat penilaian dilakukan. Skor baru hanya berlaku untuk penilaian baru ke depan.
STOP. Tunggu konfirmasi.

STEP C — Re-run seed. Tampilkan jumlah baris aktif per tabel referensi setelah update.
STOP. Tunggu konfirmasi.

STEP D — Update halaman Admin/Referensi Data jika ada perubahan struktur kolom.
STOP. Tunggu konfirmasi.

STEP E — Nyatakan: "Tabel referensi [nama] diupdate, [N] baris aktif. CDD historis tidak berubah skornya."
STOP.

# ================================================================
# PROMPT 4 — UPDATE: KEDUANYA (FIELD BARU + TABEL REFERENSI BERUBAH)
# ================================================================

Baca CLAUDE.md dan reference-data.md terlebih dahulu.

PERUBAHAN FIELD/SCREEN: [ISI, format sama seperti PROMPT 2]
PERUBAHAN TABEL REFERENSI: [ISI, format sama seperti PROMPT 3]

Tambahkan baris baru di CLAUDE.md Riwayat Perubahan, lalu kerjakan seluruh step PROMPT 2 (A–E) dan PROMPT 3 (A–E) berurutan, gabungkan step yang overlap (mis. migration bisa satu langkah untuk keduanya). Tampilkan DIFF tiap perubahan, tunggu konfirmasi tiap step.