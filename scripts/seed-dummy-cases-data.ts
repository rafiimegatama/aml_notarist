/**
 * Data dummy untuk menu Case (AML Case Management) — dibangun DI ATAS
 * customer dummy dari scripts/seed-dummy-dashboard-data.ts (jalankan itu
 * dulu). Mengambil semua customer "[DUMMY]" berisiko TINGGI, lalu membuat
 * Case untuk masing-masing dengan status/checklist/keputusan/temuan AI yang
 * BERAGAM supaya UI Case (list + detail) kelihatan lengkap — bukan cuma
 * satu status EDD_REQUIRED yang sama semua.
 *
 * Ditambah SATU customer baru "[DUMMY] Rina Kartika (uji reject)" khusus
 * untuk skenario REJECTED (belum ada di seed CDD sebelumnya).
 *
 * Jalankan: npx tsx -r dotenv/config scripts/seed-dummy-cases-data.ts dotenv_config_path=.env
 * Hapus: sudah otomatis ikut terhapus oleh scripts/remove-dummy-dashboard-data.ts
 * (semua customer di sini tetap diawali "[DUMMY]", Case ikut ter-cascade).
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";
import { logActivity } from "@/lib/activityLog";

const DUMMY_PREFIX = "[DUMMY]";
const SCORE_TINGGI = 36;

async function ensureCase(customerId: string) {
  const existing = await prisma.case.findUnique({ where: { customerId } });
  if (existing) return existing;
  return prisma.case.create({
    data: { customerId, status: "EDD_REQUIRED", checklist: { create: {} } },
  });
}

async function main() {
  // Pastikan seed CDD dasar sudah ada dulu.
  const tinggiCustomers = await prisma.customer.findMany({
    where: {
      AND: [
        {
          OR: [
            { individualDetail: { namaLengkap: { startsWith: DUMMY_PREFIX } } },
            { corporateDetail: { namaKorporasi: { startsWith: DUMMY_PREFIX } } },
            { legalArrangementDetail: { nama: { startsWith: DUMMY_PREFIX } } },
          ],
        },
        { riskAssessment: { riskCategory: "TINGGI" } },
      ],
    },
    include: { individualDetail: true, corporateDetail: true, legalArrangementDetail: true },
  });

  if (tinggiCustomers.length === 0) {
    console.log("Belum ada customer dummy berisiko TINGGI — jalankan scripts/seed-dummy-dashboard-data.ts dulu.");
    return;
  }

  const alreadyHasCases = await prisma.case.count({
    where: { customerId: { in: tinggiCustomers.map((c) => c.id) } },
  });
  if (alreadyHasCases >= tinggiCustomers.length) {
    console.log("Case dummy sudah ada untuk semua customer TINGGI dummy — tidak membuat ulang.");
    console.log("(Kalau mau reset total: scripts/remove-dummy-dashboard-data.ts lalu jalankan ulang kedua skrip seed.)");
    return;
  }

  function nameOf(c: (typeof tinggiCustomers)[number]) {
    return c.corporateDetail?.namaKorporasi ?? c.individualDetail?.namaLengkap ?? c.legalArrangementDetail?.nama ?? "?";
  }

  const byName = new Map(tinggiCustomers.map((c) => [nameOf(c), c]));
  const mayaSari = [...byName.entries()].find(([n]) => n.includes("Maya Sari"))?.[1];
  const hendraKusuma = [...byName.entries()].find(([n]) => n.includes("Hendra Kusuma"))?.[1];
  const ptGlobalNusantara = [...byName.entries()].find(([n]) => n.includes("PT Global Nusantara"))?.[1];
  const trustWarisan = [...byName.entries()].find(([n]) => n.includes("Trust Warisan Nusantara"))?.[1];

  console.log("Membuat Case dummy...\n");

  // 1. EDD_REQUIRED (default, belum disentuh) — Maya Sari, kalau ada.
  if (mayaSari) {
    const kase = await ensureCase(mayaSari.id);
    await prisma.caseAiFinding.createMany({
      data: [
        {
          caseId: kase.id,
          kind: "missing_document",
          content: "Dokumen bukti sumber kekayaan belum dilampirkan untuk klien berisiko Tinggi ini.",
          confidence: "HIGH",
        },
        {
          caseId: kase.id,
          kind: "edd_question",
          content: "Apakah klien memiliki hubungan dengan Politically Exposed Person (PEP)? Belum terjawab di Risk Assessment.",
          confidence: "MEDIUM",
        },
      ],
    });
    console.log(`- ${nameOf(mayaSari)}: Case EDD_REQUIRED + 2 temuan AI`);
  }

  // 2. EDD_IN_PROGRESS + checklist sebagian — Hendra Kusuma.
  if (hendraKusuma) {
    const kase = await ensureCase(hendraKusuma.id);
    await prisma.case.update({ where: { id: kase.id }, data: { status: "EDD_IN_PROGRESS" } });
    await prisma.caseChecklist.upsert({
      where: { caseId: kase.id },
      create: { caseId: kase.id, identityVerified: true, documentsVerified: true },
      update: { identityVerified: true, documentsVerified: true },
    });
    await prisma.caseAiFinding.createMany({
      data: [
        {
          caseId: kase.id,
          kind: "inconsistency",
          content: "Alamat di formulir CDD tidak sama persis dengan alamat di dokumen identitas terlampir — cek ulang.",
          confidence: "MEDIUM",
        },
        {
          caseId: kase.id,
          kind: "summary",
          content: "Klien perorangan, sumber pendapatan dari pekerjaan tetap, belum ada indikasi PEP atau berita negatif.",
          confidence: "HIGH",
        },
      ],
    });
    await logActivity(hendraKusuma.id, "Case: EDD mulai dikerjakan");
    console.log(`- ${nameOf(hendraKusuma)}: Case EDD_IN_PROGRESS + checklist sebagian + 2 temuan AI`);
  }

  // 3. WAITING_MANUAL_REVIEW + duplicate check — PT Global Nusantara.
  if (ptGlobalNusantara) {
    const kase = await ensureCase(ptGlobalNusantara.id);
    await prisma.case.update({ where: { id: kase.id }, data: { status: "WAITING_MANUAL_REVIEW" } });
    await prisma.caseChecklist.upsert({
      where: { caseId: kase.id },
      create: {
        caseId: kase.id,
        identityVerified: true,
        sourceOfFundsReviewed: true,
        sourceOfWealthReviewed: true,
        beneficialOwnerConfirmed: true,
        documentsVerified: true,
      },
      update: {
        identityVerified: true,
        sourceOfFundsReviewed: true,
        sourceOfWealthReviewed: true,
        beneficialOwnerConfirmed: true,
        documentsVerified: true,
      },
    });
    // referensi ke customer dummy lain sebagai "kandidat duplikat" — cuma demo, confidence sedang.
    const otherCustomer = tinggiCustomers.find((c) => c.id !== ptGlobalNusantara.id);
    if (otherCustomer) {
      await prisma.caseDuplicateCheck.create({
        data: {
          caseId: kase.id,
          candidateCustomerId: otherCustomer.id,
          matchedFields: JSON.stringify(["Nomor Telepon"]),
          confidencePercent: 42,
          stage: "fuzzy",
          recommendation: "Kemiripan rendah, kemungkinan besar bukan klien yang sama — tinjau manual kalau perlu.",
        },
      });
    }
    await prisma.caseAiFinding.create({
      data: {
        caseId: kase.id,
        kind: "regulation_answer",
        content: "Berdasarkan Permenkumham No. 9/2017, korporasi berisiko Tinggi wajib EDD manual sampai form resmi tersedia (Known Gap #2).",
        confidence: "HIGH",
      },
    });
    await logActivity(ptGlobalNusantara.id, "Case: EDD selesai, menunggu tinjauan manual");
    console.log(`- ${nameOf(ptGlobalNusantara)}: Case WAITING_MANUAL_REVIEW + duplicate check + 1 temuan AI`);
  }

  // 4. APPROVED, checklist penuh + keputusan — Trust Warisan Nusantara.
  if (trustWarisan) {
    const kase = await ensureCase(trustWarisan.id);
    await prisma.caseChecklist.upsert({
      where: { caseId: kase.id },
      create: {
        caseId: kase.id,
        identityVerified: true,
        sourceOfFundsReviewed: true,
        sourceOfWealthReviewed: true,
        beneficialOwnerConfirmed: true,
        documentsVerified: true,
        aiRecommendationReviewed: true,
        regulationReviewed: true,
      },
      update: {
        identityVerified: true,
        sourceOfFundsReviewed: true,
        sourceOfWealthReviewed: true,
        beneficialOwnerConfirmed: true,
        documentsVerified: true,
        aiRecommendationReviewed: true,
        regulationReviewed: true,
      },
    });
    await prisma.caseDecision.upsert({
      where: { caseId: kase.id },
      create: { caseId: kase.id, outcome: "APPROVED", notes: "Seluruh dokumen lengkap, tidak ada indikasi mencurigakan. Disetujui." },
      update: { outcome: "APPROVED", notes: "Seluruh dokumen lengkap, tidak ada indikasi mencurigakan. Disetujui." },
    });
    await prisma.case.update({ where: { id: kase.id }, data: { status: "APPROVED" } });
    await logActivity(trustWarisan.id, 'Case: keputusan "APPROVED" dicatat');
    console.log(`- ${nameOf(trustWarisan)}: Case APPROVED (checklist penuh + keputusan)`);
  }

  // 5. REJECTED — customer baru khusus demo (belum ada di seed CDD).
  const rejectExisting = await prisma.customer.findFirst({
    where: { individualDetail: { namaLengkap: { startsWith: `${DUMMY_PREFIX} Rina Kartika` } } },
  });
  if (!rejectExisting) {
    const rina = await prisma.customer.create({
      data: {
        type: "PERORANGAN",
        individualDetail: {
          create: {
            namaLengkap: `${DUMMY_PREFIX} Rina Kartika (uji reject)`,
            jenisIdentitas: "KTP",
            noIdentitas: "3201081234560008",
            jenisKelamin: "PEREMPUAN",
            statusPernikahan: "BELUM_MENIKAH",
            nomorHp: "081298765432",
            alamatTempatTinggal: "Jl. Contoh Dummy No. 4, Jakarta",
          },
        },
        notaryService: { create: { namaNotaris: "Notaris Uji Coba", jasaYangDiberikan: "Jual Beli" } },
        riskAssessment: {
          create: { totalScore: SCORE_TINGGI, riskCategory: "TINGGI", isPep: true, adaBeritaNegatif: false },
        },
      },
    });
    await computeAndPersistStatus(rina.id);
    const kase = await ensureCase(rina.id);
    await prisma.caseChecklist.upsert({
      where: { caseId: kase.id },
      create: {
        caseId: kase.id,
        identityVerified: true,
        sourceOfFundsReviewed: true,
        sourceOfWealthReviewed: true,
        beneficialOwnerConfirmed: true,
        documentsVerified: true,
        aiRecommendationReviewed: true,
        regulationReviewed: true,
      },
      update: {},
    });
    await prisma.caseAiFinding.create({
      data: {
        caseId: kase.id,
        kind: "edd_question",
        content: "Klien teridentifikasi sebagai PEP (Politically Exposed Person) — risiko pencucian uang meningkat signifikan.",
        confidence: "HIGH",
      },
    });
    await prisma.caseDecision.upsert({
      where: { caseId: kase.id },
      create: { caseId: kase.id, outcome: "REJECTED", notes: "Klien PEP tanpa penjelasan sumber kekayaan yang memadai — ditolak sesuai kebijakan internal." },
      update: {},
    });
    await prisma.case.update({ where: { id: kase.id }, data: { status: "REJECTED" } });
    await logActivity(rina.id, 'Case: keputusan "REJECTED" dicatat');
    console.log(`- ${DUMMY_PREFIX} Rina Kartika (uji reject): customer BARU + Case REJECTED (checklist penuh + keputusan + temuan PEP)`);
  } else {
    console.log("- Rina Kartika (demo reject) sudah ada, dilewati.");
  }

  const totalCases = await prisma.case.count();
  console.log(`\n✅ Total Case di DB sekarang: ${totalCases}`);
  console.log("Lihat di /cases (semua status) atau /cases?status=WAITING_MANUAL_REVIEW dst.");
}

main()
  .catch((err) => {
    console.error("Gagal membuat data dummy Case:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
