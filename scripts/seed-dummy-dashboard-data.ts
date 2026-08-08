/**
 * Data dummy untuk menguji:
 * 1. Auto-detect NPWP/No. Identitas di form CDD (lib/hooks/useDuplicateFieldMatch.ts)
 * 2. Chart baru "Komposisi Risiko per Jenis Customer" di dashboard (RiskByTypeChart)
 *
 * SEMUA nama diawali "[DUMMY]" supaya tidak pernah tertukar dengan data
 * klien asli. Aman dijalankan berulang — cek dulu apakah data dummy sudah
 * ada (lewat namaLengkap/namaKorporasi/nama yang diawali "[DUMMY]"), skip
 * kalau sudah, tidak pernah membuat duplikat.
 *
 * Jalankan: npx tsx -r dotenv/config scripts/seed-dummy-dashboard-data.ts dotenv_config_path=.env
 * Hapus lagi kapan saja: npx tsx -r dotenv/config scripts/remove-dummy-dashboard-data.ts dotenv_config_path=.env
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";

const DUMMY_PREFIX = "[DUMMY]";

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// totalScore dalam rentang resmi (reference-data.md bagian 6): RENDAH 12-21,
// SEDANG 22-31, TINGGI 32-40.
const SCORE_BY_CATEGORY = { RENDAH: 15, SEDANG: 26, TINGGI: 36 } as const;

type RiskCat = keyof typeof SCORE_BY_CATEGORY;

async function main() {
  const already = await prisma.customer.findFirst({
    where: {
      OR: [
        { individualDetail: { namaLengkap: { startsWith: DUMMY_PREFIX } } },
        { corporateDetail: { namaKorporasi: { startsWith: DUMMY_PREFIX } } },
        { legalArrangementDetail: { nama: { startsWith: DUMMY_PREFIX } } },
      ],
    },
  });
  if (already) {
    console.log("Data dummy sudah ada (ditemukan customer dummy) — tidak membuat ulang.");
    console.log("Jalankan scripts/remove-dummy-dashboard-data.ts dulu kalau mau reset.");
    return;
  }

  let createdAtCursor = 55; // sebar mundur ~55 hari supaya RiskChart (rentang 90 hari) juga kelihatan variatif

  async function createIndividual(nama: string, nik: string, category: RiskCat) {
    const createdAt = daysAgo(createdAtCursor);
    createdAtCursor -= Math.floor(Math.random() * 6) + 2;
    const customer = await prisma.customer.create({
      data: {
        type: "PERORANGAN",
        createdAt,
        individualDetail: {
          create: {
            namaLengkap: nama,
            jenisIdentitas: "KTP",
            noIdentitas: nik,
            jenisKelamin: "LAKI_LAKI",
            statusPernikahan: "MENIKAH",
            nomorHp: "0812" + String(Math.floor(10000000 + Math.random() * 89999999)),
            alamatTempatTinggal: "Jl. Contoh Dummy No. 1, Jakarta",
            kewarganegaraan: "Indonesia",
          },
        },
        notaryService: { create: { namaNotaris: "Notaris Uji Coba", jasaYangDiberikan: "Jual Beli" } },
        riskAssessment: {
          create: { totalScore: SCORE_BY_CATEGORY[category], riskCategory: category, isPep: false, adaBeritaNegatif: false },
        },
      },
    });
    await computeAndPersistStatus(customer.id);
    return customer;
  }

  async function createCorporate(nama: string, npwp: string, category: RiskCat) {
    const createdAt = daysAgo(createdAtCursor);
    createdAtCursor -= Math.floor(Math.random() * 6) + 2;
    const customer = await prisma.customer.create({
      data: {
        type: "KORPORASI",
        createdAt,
        corporateDetail: {
          create: {
            namaKorporasi: nama,
            bentukKorporasi: "PT",
            npwp,
            alamatSesuaiAkta: "Jl. Contoh Dummy No. 2, Jakarta",
          },
        },
        powerOfAttorney: { create: { hubunganHukum: "DIREKTUR_UTAMA" } },
        notaryService: { create: { namaNotaris: "Notaris Uji Coba", jasaYangDiberikan: "Pendirian PT" } },
        riskAssessment: {
          create: { totalScore: SCORE_BY_CATEGORY[category], riskCategory: category, isPep: false, adaBeritaNegatif: false },
        },
      },
    });
    await computeAndPersistStatus(customer.id);
    return customer;
  }

  async function createLegalArrangement(nama: string, category: RiskCat) {
    const createdAt = daysAgo(createdAtCursor);
    createdAtCursor -= Math.floor(Math.random() * 6) + 2;
    const customer = await prisma.customer.create({
      data: {
        type: "LEGAL_ARRANGEMENT",
        createdAt,
        legalArrangementDetail: { create: { nama, alamat: "Jl. Contoh Dummy No. 3, Jakarta" } },
        notaryService: { create: { namaNotaris: "Notaris Uji Coba", jasaYangDiberikan: "Akta Trust" } },
        riskAssessment: {
          create: { totalScore: SCORE_BY_CATEGORY[category], riskCategory: category, isPep: false, adaBeritaNegatif: false },
        },
      },
    });
    await computeAndPersistStatus(customer.id);
    return customer;
  }

  console.log("Membuat data dummy...\n");

  // PERORANGAN — 3 RENDAH, 2 SEDANG, 2 TINGGI
  const testIndividual = await createIndividual(`${DUMMY_PREFIX} Budi Santoso (uji auto-detect)`, "3201011234560001", "RENDAH");
  await createIndividual(`${DUMMY_PREFIX} Siti Aminah`, "3201021234560002", "RENDAH");
  await createIndividual(`${DUMMY_PREFIX} Agus Wijaya`, "3201031234560003", "RENDAH");
  await createIndividual(`${DUMMY_PREFIX} Dewi Lestari`, "3201041234560004", "SEDANG");
  await createIndividual(`${DUMMY_PREFIX} Rudi Hartono`, "3201051234560005", "SEDANG");
  await createIndividual(`${DUMMY_PREFIX} Maya Sari`, "3201061234560006", "TINGGI");
  await createIndividual(`${DUMMY_PREFIX} Hendra Kusuma`, "3201071234560007", "TINGGI");

  // KORPORASI — 2 RENDAH, 2 SEDANG, 1 TINGGI
  const testCorporate = await createCorporate(`${DUMMY_PREFIX} PT Contoh Sejahtera (uji auto-detect)`, "012345678901234", "RENDAH");
  await createCorporate(`${DUMMY_PREFIX} PT Maju Bersama`, "012345678901235", "RENDAH");
  await createCorporate(`${DUMMY_PREFIX} PT Sumber Rejeki`, "012345678901236", "SEDANG");
  await createCorporate(`${DUMMY_PREFIX} CV Karya Mandiri`, "012345678901237", "SEDANG");
  await createCorporate(`${DUMMY_PREFIX} PT Global Nusantara`, "012345678901238", "TINGGI");

  // LEGAL_ARRANGEMENT — 1 RENDAH, 1 SEDANG, 1 TINGGI
  await createLegalArrangement(`${DUMMY_PREFIX} Trust Keluarga Wijaya`, "RENDAH");
  await createLegalArrangement(`${DUMMY_PREFIX} Yayasan Contoh Peduli`, "SEDANG");
  await createLegalArrangement(`${DUMMY_PREFIX} Trust Warisan Nusantara`, "TINGGI");

  const total = await prisma.customer.count({
    where: { OR: [
      { individualDetail: { namaLengkap: { startsWith: DUMMY_PREFIX } } },
      { corporateDetail: { namaKorporasi: { startsWith: DUMMY_PREFIX } } },
      { legalArrangementDetail: { nama: { startsWith: DUMMY_PREFIX } } },
    ]},
  });

  console.log(`\n✅ ${total} customer dummy dibuat (id contoh: ${testIndividual.id}, ${testCorporate.id}).\n`);
  console.log("Untuk menguji auto-detect NPWP/No. Identitas:");
  console.log("  1. Buka /cdd/new/perorangan, ketik No. Identitas: 3201011234560001");
  console.log(`     -> harus muncul banner "Ditemukan klien terdaftar: ${DUMMY_PREFIX} Budi Santoso..."`);
  console.log("  2. Buka /cdd/new/korporasi, ketik NPWP: 012345678901234");
  console.log(`     -> harus muncul banner "Ditemukan klien terdaftar: ${DUMMY_PREFIX} PT Contoh Sejahtera..."`);
  console.log("\nLihat komposisi risiko per jenis customer di dashboard (/) — chart baru 'Komposisi Risiko per Jenis Customer'.");
  console.log("\nUntuk menghapus semua data dummy ini nanti: npx tsx -r dotenv/config scripts/remove-dummy-dashboard-data.ts dotenv_config_path=.env");
}

main()
  .catch((err) => {
    console.error("Gagal membuat data dummy:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
