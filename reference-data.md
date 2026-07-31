# Data Referensi — Notary CDD & Risk Assessment WebApp

**Dasar hukum:** PP No. 43 Tahun 2015, Permenkumham No. 9 Tahun 2017 (Formulir CDD), Perpres No. 13 Tahun 2018 & Permenkumham No. 15 Tahun 2019 (Pemilik Manfaat/Beneficial Owner).

**Status dokumen ini:** Sumber kebenaran tunggal (single source of truth) untuk seluruh field form, label, dan tabel skor risiko yang dipakai di aplikasi — diekstrak langsung dari formulir asli. Lihat bagian **9. Known Gaps** untuk data yang belum lengkap. Jangan menebak nilai yang tidak tercantum di sini.

---

## 1. CDD Korporasi

### A. Informasi Dasar Pengguna Jasa
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| A1 | Nama Korporasi | text | wajib |
| A2 | Bentuk Korporasi | text | mis. PT, CV, Yayasan, Koperasi |
| A3 | No. SK Pengesahan | text | |
| A3a | Tanggal SK Pengesahan | date | |
| A4 | No. Ijin Usaha | text | |
| A4a | Tanggal Ijin Usaha | date | |
| A5 | NPWP | text | |
| A6 | Alamat Korporasi sesuai Akta | textarea | |
| A7 | Alamat Lokasi Usaha | textarea | |
| A8 | Nomor Telepon Korporasi | text | |
| A9 | Nomor Faksimili | text | opsional |
| A10 | Bidang Usaha | text | **sama dengan B2 — satu field, jangan duplikat** |
| A11 | No. Akta Pendirian atau Akta Kepengurusan Terakhir | text | |

### B. Informasi Kekayaan Korporasi
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| B1 | Sumber Dana | text | |
| B2 | Bidang Usaha | text | duplikat A10 di form kertas asli — gunakan field yang sama |
| B3 | Pendapatan Rata-Rata per Tahun | text | |
| B4 | Tujuan Transaksi | text | |

### C. Informasi Pemilik Manfaat (Beneficial Owner) — *jika ada, bisa lebih dari satu*
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| C1 | Nama Lengkap | text | wajib jika BO diisi |
| C2 | Nama Alias | text | opsional |
| C3 | Jenis Identitas | enum | KTP / Paspor / SIM |
| C3a | No. Identitas | text | |
| C4 | Tempat Lahir | text | |
| C4a | Tanggal Lahir | date | |
| C5 | Kewarganegaraan | text | |
| C6 | Alamat Tempat Tinggal | textarea | |
| C7 | Alamat di Negara Asal | textarea | tampilkan hanya jika WNA |
| C8 | NPWP | text | opsional |
| C9 | Hubungan antara Korporasi dengan Pemilik Manfaat | text | |

### D. Informasi Kuasa Korporasi
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| D1 | Hubungan Hukum Pengguna Jasa | enum | Direktur Utama / Direktur / Pemegang Saham / Komisaris Utama / Komisaris / Lainnya |
| D2 | No. Surat Kuasa | text | |
| D2a | Tanggal Surat Kuasa | date | |
| D3 | Penandatangan Surat Kuasa | text | |
| D3a | Jabatan Penandatangan | text | |
| D4 | Nama Lengkap Pengguna Jasa | text | |
| D5 | Nama Alias | text | opsional |
| D6 | Jenis Identitas Pengguna Jasa | enum | KTP / Paspor / SIM |
| D6a | No. Identitas Pengguna Jasa | text | |
| D7 | Tempat Lahir | text | |
| D7a | Tanggal Lahir | date | |
| D8 | Kewarganegaraan | text | |
| D9 | Alamat Tempat Tinggal | textarea | |

### E. Informasi Jasa Yang Diberikan
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| E1 | Nama Notaris | text | |
| E2 | Jasa yang Diberikan | text | |

---

## 2. CDD Perorangan

### A. Informasi Dasar Pengguna Jasa
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| A1 | Nama Lengkap | text | wajib |
| A2 | Nama Alias | text | opsional |
| A3 | Jenis Identitas | enum | KTP / Paspor / SIM |
| A3a | No. Identitas | text | |
| A4 | NPWP | text | |
| A5 | Tempat Lahir | text | |
| A5a | Tanggal Lahir | date | |
| A6 | Kewarganegaraan | text | |
| A7 | Alamat Tempat Tinggal | textarea | |
| A8 | Alamat Domisili | textarea | |
| A9 | Alamat di Negara Asal | textarea | tampilkan hanya jika WNA |
| A10 | Nomor Telepon Rumah | text | opsional |
| A10a | Nomor HP | text | |
| A11 | Jenis Kelamin | enum | Laki-Laki / Perempuan |
| A12 | Status Pernikahan | enum | Belum Menikah / Menikah / Lainnya (+ text jika Lainnya) |

### B. Informasi Pekerjaan dan Sumber Pendapatan
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| B1 | Sumber Pendapatan/Kekayaan | enum | Pekerjaan (Gaji, Bonus, Pensiun, Saham) / Profesi (Pengacara, Dokter, Akuntan, dll) / Kepemilikan Usaha / Lainnya (+ text) |
| B2 | Bidang Usaha | text | |
| B3 | Nama Kantor | text | |
| B3a | Alamat Kantor | textarea | |
| B3b | Nomor Telepon Kantor | text | |
| B3c | Jabatan | text | |
| B4 | Pendapatan Rata-Rata per Tahun | enum | ≤12 juta / >12 juta–120 juta / >120 juta–1,2 M / >1,2 M |
| B5 | Tujuan Transaksi | text | |

### C. Informasi Pemilik Manfaat (Beneficial Owner)
*(field identik dengan Section 1.C — pakai model `BeneficialOwner` yang sama)*

### D. Informasi Jasa Yang Diberikan
*(identik dengan Section 1.E)*

---

## 3. CDD Perikatan Lainnya (Legal Arrangement)

### A. Informasi Dasar Pengguna Jasa
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| A1 | Nama | text | |
| A2 | Jenis Identitas | enum | KTP / Paspor / SIM |
| A2a | No. Identitas | text | |
| A3 | No. SK Pengesahan | text | isi jika Korporasi |
| A3a | Tanggal SK Pengesahan | date | |
| A4 | No. Ijin Usaha | text | isi jika Korporasi |
| A4a | Tanggal Ijin Usaha | date | |
| A5 | NPWP | text | |
| A6 | Alamat | textarea | |
| A7 | Nomor Telepon | text | |
| A8 | Nomor Faksimili | text | opsional |
| A9 | Bidang Usaha | text | isi jika Korporasi |
| A10 | No. Akta Pendirian atau Akta Kepengurusan Terakhir | text | isi jika Korporasi |

*(Catatan: penomoran form asli meloncat dari 6 ke 8 — nomor 7 memang tidak ada di dokumen sumber, kemungkinan human numbering error pada formulir asli, bukan field yang hilang dari upload.)*

### B. Informasi Kekayaan
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| B1 | Sumber Dana | text | |
| B2 | Bidang Usaha | text | |
| B3 | Pendapatan Rata-Rata per Tahun | text | |
| B4 | Tujuan Transaksi | text | |

### C. Informasi Pemilik Manfaat (Beneficial Owner)
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| C1–C8 | *(identik dengan Section 1.C item 1–8)* | | |
| C9 | Informasi Pemilik Manfaat atas Perikatan Lainnya | enum | Pemilik Manfaat / Penerima Manfaat / Pengelola Harta Kekayaan / Penjamin / Lainnya (+ text) |

*(Catatan: item C9 di form ini BERBEDA dari C9 di form Korporasi/Perorangan — di sini pilihan peran, bukan teks bebas. Saran: simpan sebagai text field yang sama di semua tipe, tapi untuk Legal Arrangement tampilkan pilihan di atas sebagai quick-select yang mengisi field tsb.)*

### D. Informasi Pihak dalam Legal Arrangement
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| D1 | Nama Lengkap | text | |
| D2 | Nama Alias | text | opsional |
| D3 | Jenis Identitas | enum | KTP / Paspor / SIM |
| D3a | No. Identitas | text | |
| D4 | Tempat Lahir | text | |
| D4a | Tanggal Lahir | date | |
| D5 | Kewarganegaraan | text | |
| D6 | Alamat Tempat Tinggal | textarea | |
| D7 | Hubungan Hukum Pengguna Jasa | text | |
| D8 | No. Perjanjian | text | |
| D8a | Tanggal Perjanjian | date | |
| D9 | Penandatanganan Perjanjian | text | |

### E. Informasi Jasa Yang Diberikan
*(identik dengan Section 1.E)*

---

## 4. Risk Assessment — Analisa PEP (Politically Exposed Person)
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| P1 | Apakah Pengguna Jasa adalah PEP? | boolean | Ya / Tidak |
| P2 | Nama Lengkap PEP | text | isi jika P1 = Ya |
| P3 | PEP Lokal atau Asing | enum | Lokal / Asing |
| P4 | Warga Negara PEP | text | |
| P5 | Apakah terdapat berita negatif terkait PEP | boolean | Ya (lampirkan berita) / Tidak |
| P6 | Jabatan PEP | enum | Eksekutif / Yudikatif / Legislatif / Negara asing atau yurisdiksi asing / Organisasi internasional |
| P7 | Hubungan Pengguna Jasa dengan PEP | enum | Klien sendiri / Anggota keluarga sampai derajat kedua / Pihak terkait atau Close Associate dari PEP |

---

## 5. Risk Assessment — Tabel Referensi Skor

Total Nilai risiko dihitung dari 5 faktor. Setiap faktor punya tabel referensi skor tetap (lookup table). Seed data di bawah WAJIB dipakai persis — jangan dibulatkan, diubah, atau ditambah kategori baru tanpa update dokumen ini dulu.

### Tabel A — Profil Pengguna Jasa dan/atau BO
| Kategori | Skor |
|----------|:----:|
| Pengusaha/Wiraswasta | 8 |
| Pengurus Parpol | 8 |
| Pegawai Swasta | 8 |
| Pedagang | 8 |
| Pejabat Lembaga Legislatif dan Pemerintah | 7 |
| Pegawai BI/BUMN/BUMD (termasuk Pensiunan) | 7 |
| Bertindak berdasarkan Kuasa | 7 |
| TNI/POLRI (termasuk Pensiunan) | 6 |
| Profesional dan Konsultan | 6 |
| Korporasi Perkumpulan Tidak Badan Hukum | 6 |
| Korporasi Perkumpulan Badan Hukum | 6 |
| Korporasi CV, Firma, dan Maatschap | 6 |
| Pegawai Money Changer | 5 |
| Korporasi Perseroan Terbatas | 5 |
| Korporasi Koperasi | 5 |
| PNS (termasuk Pensiunan) | 4 |
| Pegawai Bank | 4 |
| Petani | 3 |
| Pengajar dan Dosen | 3 |
| Pelajar/Mahasiswa | 3 |
| Korporasi Yayasan | 3 |
| Ibu Rumah Tangga | 3 |
| Lain-Lain | 3 |

### Tabel B — Profil Bisnis Pengguna Jasa dan/atau BO
**⚠️ TIDAK TERSEDIA.** Tabel ini ada di dokumen sumber asli (disebut eksplisit di ringkasan skoring sebagai "Bisnis pengguna jasa"), tapi halamannya tidak ikut ter-upload — urutan gambar meloncat langsung dari akhir Tabel A ke Tabel C. Buat struktur tabel di database, tapi **kosongkan datanya**. Lihat bagian 9 (Known Gaps).

### Tabel C — Profil Wilayah Pengguna Jasa dan/atau BO
| Kategori | Skor |
|----------|:----:|
| DKI Jakarta | 8 |
| Jawa Barat | 7 |
| Jawa Timur | 6 |
| Bali | 5 |
| Banten | 5 |
| Jawa Tengah | 5 |
| Kalimantan Timur | 5 |
| Kepulauan Riau | 5 |
| Lampung | 5 |
| Riau | 5 |
| Sulawesi Selatan | 5 |
| Sumatera Utara | 5 |
| Aceh | 4 |
| Bangka Belitung | 4 |
| Bengkulu | 4 |
| Kalimantan Barat | 4 |
| Kalimantan Tengah | 4 |
| Maluku Utara | 4 |
| Nusa Tenggara Timur | 4 |
| Papua | 4 |
| Sulawesi Barat | 4 |
| Sulawesi Tengah | 4 |
| Sulawesi Tenggara | 4 |
| Sulawesi Utara | 4 |
| Sumatera Selatan | 4 |
| DI Yogyakarta | 3 |
| Gorontalo | 3 |
| Jambi | 3 |
| Kalimantan Selatan | 3 |
| Kalimantan Utara | 3 |
| Maluku | 3 |
| Nusa Tenggara Barat | 3 |
| Papua Barat | 3 |
| Sumatera Barat | 2 |

### Tabel D — Profil Negara Asal Pengguna Jasa dan/atau BO
| Kategori | Skor |
|----------|:----:|
| Tax Haven Country | 7 |
| Amerika | 7 |
| RRT (Tiongkok) | 5 |
| Malaysia | 5 |
| Asia Lainnya | 5 |
| Australia dan Selandia Baru | 5 |
| Eropa | 4 |
| Singapura | 3 |
| Afrika | 3 |

### Tabel E — Profil Jasa yang Diberikan oleh Notaris
| Kategori | Skor |
|----------|:----:|
| Pengelolaan terhadap Uang, Efek, dan/atau Produk Jasa Keuangan lainnya | 8 |
| Pengoperasian dan Pengelolaan Perusahaan | 8 |
| Pengelolaan Rekening Giro, Tabungan, Deposito, dan/atau Efek | 7 |
| Pembelian dan Penjualan Properti | 6 |
| Pengurusan Pembelian dan Penjualan Badan Usaha | 6 |
| Penitipan Pembayaran Pajak terkait Pengalihan Properti | 4 |
| Pengurusan Perizinan Badan Usaha | 3 |
| Lain-lain | 2 |

---

## 6. Formula Skoring & Kategori Risiko

```
Total Nilai = Skor(A) + Skor(B) + Skor(C) + Skor(D) + Skor(E)
```

| Kategori Risiko | Range Total Nilai |
|------------------|:------------------:|
| Rendah | 12 – 21 |
| Sedang | 22 – 31 |
| Tinggi | 32 – 40 |

**Catatan penting:** selama Tabel B kosong (lihat bagian 9), Total Nilai TIDAK BOLEH ditandai final/lengkap. Tampilkan sebagai draft dengan warning sampai Tabel B terisi datanya.

---

## 7. Informasi Tambahan — Pengguna Jasa Berisiko Tinggi (Enhanced Due Diligence)

*Wajib diisi hanya jika Kategori Risiko = Tinggi.*

### A. Perorangan/Pribadi
| # | Field | Tipe | Catatan |
|---|-------|------|---------|
| H1 | Nama Lengkap | text | |
| H2 | Jenis Identitas | enum | KTP / SIM / Paspor / KITAS |
| H3 | Nomor Identitas | text | |
| H4 | Tempat/Tanggal Lahir | text + date | |
| H5 | Alamat Sesuai Identitas | textarea | |
| H6 | Jenis High Risk Customer | enum | PEP / Pihak Terkait PEP / Transaksi Negara High Risk / Berdasar Penilaian Risiko |
| H7 | Metode Pembayaran | text | |
| H8 | Tujuan Transaksi | enum | Digunakan Sendiri / Lain-lain (+ text) |
| H9 | Sumber Kekayaan | enum | Gaji/Upah / Lain-lain (+ text) |
| H10 | Nama Perusahaan Tempat Bekerja | text | |
| H11 | Jumlah Penghasilan per Bulan | enum | 3–25 juta / 25–50 juta / 50–100 juta / ≥100 juta |

**⚠️ Section B (Korporasi/Institusi) tidak tersedia** — dokumen sumber menunjukkan angka halaman 15 dari total 29 halaman, dan hanya Section A (Perorangan) yang ter-upload. Untuk v1: jika customer Korporasi/Legal Arrangement masuk Kategori Tinggi, tampilkan notice bahwa form EDD korporasi belum tersedia dan proses harus ditangani manual sampai ditambahkan.

---

## 8. Model Data yang Disarankan (ringkas — untuk konteks Step 2 build)
- `Customer` (inti: type KORPORASI/PERORANGAN/LEGAL_ARRANGEMENT, status DRAFT/COMPLETE)
- `CorporateDetail`, `IndividualDetail`, `LegalArrangementDetail` (1:1, sesuai type)
- `BeneficialOwner` (1:banyak, dipakai 3 tipe)
- `PowerOfAttorney` (1:1, khusus Korporasi)
- `LegalArrangementParty` (1:banyak, khusus Legal Arrangement)
- `NotaryService` (1:1, semua tipe)
- `RiskAssessment` (1:1) — field PEP + FK ke 5 tabel referensi + totalScore + riskCategory
- `HighRiskAdditionalInfo` (1:1, nullable)
- `RefUserProfileScore`, `RefBusinessSectorScore`, `RefRegionScore`, `RefCountryScore`, `RefNotaryServiceTypeScore` (lookup, seed data di bagian 5)

Keputusan struktur detail (nullability, index, tipe kolom persis) dilakukan Claude Code di Step 2 prompt build, mengacu dokumen ini.

---

## 9. Known Gaps (per dokumen yang diupload)

1. **Tabel B — Profil Bisnis** (bagian 5): kategori dan skor resmi tidak tersedia dari gambar yang diupload. Tabel dibuat kosong sampai data resmi didapat.
2. **EDD Section B — Korporasi/Institusi** (bagian 7): tidak tersedia dari dokumen sumber (halaman 15/29, hanya section Perorangan yang ter-upload).
3. Field "Bidang Usaha" muncul dua kali di form kertas asli (Section A & Section B pada CDD Korporasi dan CDD Perikatan Lainnya) — diperlakukan sebagai satu field yang sama di aplikasi, bukan dua field terpisah.
4. Item C9 (hubungan dengan Pemilik Manfaat) berbeda format antara form Korporasi/Perorangan (teks bebas) vs Legal Arrangement (pilihan peran) — lihat catatan di bagian 3.C.

Ketika data untuk gap #1 atau #2 tersedia, gunakan **PROMPT 3** di `claude-code-prompt.md` untuk mengupdate tanpa mengubah bagian lain aplikasi.