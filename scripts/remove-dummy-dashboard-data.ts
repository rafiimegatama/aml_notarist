/**
 * Menghapus semua customer dummy yang dibuat scripts/seed-dummy-dashboard-data.ts
 * (dikenali dari nama yang diawali "[DUMMY]"). Cascade lewat onDelete: Cascade
 * di schema — sekali hapus Customer, seluruh detail/BeneficialOwner/
 * RiskAssessment/NotaryService/ActivityLogEntry terkait ikut terhapus.
 *
 * Jalankan: npx tsx -r dotenv/config scripts/remove-dummy-dashboard-data.ts dotenv_config_path=.env
 */
import "dotenv/config";
import { prisma } from "@/lib/prisma";

const DUMMY_PREFIX = "[DUMMY]";

async function main() {
  const dummyCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { individualDetail: { namaLengkap: { startsWith: DUMMY_PREFIX } } },
        { corporateDetail: { namaKorporasi: { startsWith: DUMMY_PREFIX } } },
        { legalArrangementDetail: { nama: { startsWith: DUMMY_PREFIX } } },
      ],
    },
    select: { id: true },
  });

  if (dummyCustomers.length === 0) {
    console.log("Tidak ada data dummy ditemukan — tidak ada yang dihapus.");
    return;
  }

  await prisma.customer.deleteMany({ where: { id: { in: dummyCustomers.map((c) => c.id) } } });
  console.log(`Dihapus ${dummyCustomers.length} customer dummy (beserta seluruh detail terkait).`);

  const remaining = await prisma.customer.count();
  console.log(`Total customer tersisa di DB: ${remaining}`);
}

main()
  .catch((err) => {
    console.error("Gagal menghapus data dummy:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
