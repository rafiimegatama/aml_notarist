import { prisma } from "../lib/prisma";

// Semua data di bawah diambil PERSIS dari reference-data.md bagian 5.
// Jangan mengubah nama kategori atau skor tanpa lebih dulu update reference-data.md.

// Tabel A — Profil Pengguna Jasa dan/atau BO
const userProfileScores = [
  { categoryName: "Pengusaha/Wiraswasta", score: 8 },
  { categoryName: "Pengurus Parpol", score: 8 },
  { categoryName: "Pegawai Swasta", score: 8 },
  { categoryName: "Pedagang", score: 8 },
  { categoryName: "Pejabat Lembaga Legislatif dan Pemerintah", score: 7 },
  { categoryName: "Pegawai BI/BUMN/BUMD (termasuk Pensiunan)", score: 7 },
  { categoryName: "Bertindak berdasarkan Kuasa", score: 7 },
  { categoryName: "TNI/POLRI (termasuk Pensiunan)", score: 6 },
  { categoryName: "Profesional dan Konsultan", score: 6 },
  { categoryName: "Korporasi Perkumpulan Tidak Badan Hukum", score: 6 },
  { categoryName: "Korporasi Perkumpulan Badan Hukum", score: 6 },
  { categoryName: "Korporasi CV, Firma, dan Maatschap", score: 6 },
  { categoryName: "Pegawai Money Changer", score: 5 },
  { categoryName: "Korporasi Perseroan Terbatas", score: 5 },
  { categoryName: "Korporasi Koperasi", score: 5 },
  { categoryName: "PNS (termasuk Pensiunan)", score: 4 },
  { categoryName: "Pegawai Bank", score: 4 },
  { categoryName: "Petani", score: 3 },
  { categoryName: "Pengajar dan Dosen", score: 3 },
  { categoryName: "Pelajar/Mahasiswa", score: 3 },
  { categoryName: "Korporasi Yayasan", score: 3 },
  { categoryName: "Ibu Rumah Tangga", score: 3 },
  { categoryName: "Lain-Lain", score: 3 },
];

// Tabel C — Profil Wilayah Pengguna Jasa dan/atau BO
const regionScores = [
  { categoryName: "DKI Jakarta", score: 8 },
  { categoryName: "Jawa Barat", score: 7 },
  { categoryName: "Jawa Timur", score: 6 },
  { categoryName: "Bali", score: 5 },
  { categoryName: "Banten", score: 5 },
  { categoryName: "Jawa Tengah", score: 5 },
  { categoryName: "Kalimantan Timur", score: 5 },
  { categoryName: "Kepulauan Riau", score: 5 },
  { categoryName: "Lampung", score: 5 },
  { categoryName: "Riau", score: 5 },
  { categoryName: "Sulawesi Selatan", score: 5 },
  { categoryName: "Sumatera Utara", score: 5 },
  { categoryName: "Aceh", score: 4 },
  { categoryName: "Bangka Belitung", score: 4 },
  { categoryName: "Bengkulu", score: 4 },
  { categoryName: "Kalimantan Barat", score: 4 },
  { categoryName: "Kalimantan Tengah", score: 4 },
  { categoryName: "Maluku Utara", score: 4 },
  { categoryName: "Nusa Tenggara Timur", score: 4 },
  { categoryName: "Papua", score: 4 },
  { categoryName: "Sulawesi Barat", score: 4 },
  { categoryName: "Sulawesi Tengah", score: 4 },
  { categoryName: "Sulawesi Tenggara", score: 4 },
  { categoryName: "Sulawesi Utara", score: 4 },
  { categoryName: "Sumatera Selatan", score: 4 },
  { categoryName: "DI Yogyakarta", score: 3 },
  { categoryName: "Gorontalo", score: 3 },
  { categoryName: "Jambi", score: 3 },
  { categoryName: "Kalimantan Selatan", score: 3 },
  { categoryName: "Kalimantan Utara", score: 3 },
  { categoryName: "Maluku", score: 3 },
  { categoryName: "Nusa Tenggara Barat", score: 3 },
  { categoryName: "Papua Barat", score: 3 },
  { categoryName: "Sumatera Barat", score: 2 },
];

// Tabel D — Profil Negara Asal Pengguna Jasa dan/atau BO
const countryScores = [
  { categoryName: "Tax Haven Country", score: 7 },
  { categoryName: "Amerika", score: 7 },
  { categoryName: "RRT (Tiongkok)", score: 5 },
  { categoryName: "Malaysia", score: 5 },
  { categoryName: "Asia Lainnya", score: 5 },
  { categoryName: "Australia dan Selandia Baru", score: 5 },
  { categoryName: "Eropa", score: 4 },
  { categoryName: "Singapura", score: 3 },
  { categoryName: "Afrika", score: 3 },
];

// Tabel E — Profil Jasa yang Diberikan oleh Notaris
const notaryServiceTypeScores = [
  {
    categoryName:
      "Pengelolaan terhadap Uang, Efek, dan/atau Produk Jasa Keuangan lainnya",
    score: 8,
  },
  { categoryName: "Pengoperasian dan Pengelolaan Perusahaan", score: 8 },
  {
    categoryName:
      "Pengelolaan Rekening Giro, Tabungan, Deposito, dan/atau Efek",
    score: 7,
  },
  { categoryName: "Pembelian dan Penjualan Properti", score: 6 },
  {
    categoryName: "Pengurusan Pembelian dan Penjualan Badan Usaha",
    score: 6,
  },
  {
    categoryName:
      "Penitipan Pembayaran Pajak terkait Pengalihan Properti",
    score: 4,
  },
  { categoryName: "Pengurusan Perizinan Badan Usaha", score: 3 },
  { categoryName: "Lain-lain", score: 2 },
];

// Tabel B — Profil Bisnis Pengguna Jasa dan/atau BO
// BELUM ADA DATA RESMI — lengkapi via halaman Referensi Data sebelum Total Nilai
// dianggap final. Lihat reference-data.md bagian 9.
const businessSectorScores: { categoryName: string; score: number | null }[] =
  [];

async function seedRefTable<T extends { categoryName: string }>(
  label: string,
  rows: T[],
  create: (row: T) => Promise<unknown>
) {
  for (const row of rows) {
    await create(row);
  }
  console.log(`${label}: ${rows.length} baris`);
}

async function main() {
  await seedRefTable("RefUserProfileScore", userProfileScores, (row) =>
    prisma.refUserProfileScore.create({ data: row })
  );
  await seedRefTable("RefRegionScore", regionScores, (row) =>
    prisma.refRegionScore.create({ data: row })
  );
  await seedRefTable("RefCountryScore", countryScores, (row) =>
    prisma.refCountryScore.create({ data: row })
  );
  await seedRefTable(
    "RefNotaryServiceTypeScore",
    notaryServiceTypeScores,
    (row) => prisma.refNotaryServiceTypeScore.create({ data: row })
  );
  await seedRefTable("RefBusinessSectorScore", businessSectorScores, (row) =>
    prisma.refBusinessSectorScore.create({ data: row })
  );

  console.log(
    "RefBusinessSectorScore: 0 baris (BELUM ADA DATA RESMI — lihat reference-data.md bagian 9)"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
