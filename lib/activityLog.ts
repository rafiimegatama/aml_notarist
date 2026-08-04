import { prisma } from "@/lib/prisma";

/**
 * FR-13 — catat satu baris "apa terjadi kapan" per customer. Bukan bagian
 * kritis dari alur simpan CDD/Risk Assessment/EDD — gagal mencatat log
 * TIDAK boleh menggagalkan aksi utama yang memicunya, jadi selalu try/catch
 * di sini, tidak pernah throw ke pemanggil.
 */
export async function logActivity(
  customerId: string,
  description: string
): Promise<void> {
  try {
    await prisma.activityLogEntry.create({ data: { customerId, description } });
  } catch (err) {
    console.error("FR-13: Gagal mencatat activity log:", err);
  }
}

export async function getActivityLog(customerId: string) {
  return prisma.activityLogEntry.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
  });
}
