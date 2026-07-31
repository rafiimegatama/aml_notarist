import { prisma } from "@/lib/prisma";
import { CustomerStatus } from "@/lib/generated/prisma/enums";

/**
 * Customer.status merangkum kelengkapan SELURUH alur: CDD dasar (Step 4/5),
 * Risk Assessment (Step 6), dan EDD jika berisiko Tinggi (Step 7).
 * Dipanggil ulang di akhir setiap server action yang mengubah salah satu
 * bagian tsb, supaya status selalu konsisten dengan kondisi data terbaru.
 */
export async function computeAndPersistStatus(
  customerId: string
): Promise<CustomerStatus> {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
      powerOfAttorney: true,
      riskAssessment: true,
      highRiskAdditionalInfo: true,
    },
  });

  let cddComplete: boolean;
  if (customer.type === "KORPORASI") {
    // Section 1.D (Kuasa) wajib untuk Korporasi — lihat catatan di lib/validations.ts
    cddComplete = !!customer.corporateDetail && !!customer.powerOfAttorney;
  } else if (customer.type === "PERORANGAN") {
    cddComplete = !!customer.individualDetail;
  } else {
    cddComplete = !!customer.legalArrangementDetail;
  }

  const riskComplete =
    !!customer.riskAssessment &&
    customer.riskAssessment.totalScore !== null &&
    customer.riskAssessment.riskCategory !== null;

  let eddOk = true;
  if (riskComplete && customer.riskAssessment!.riskCategory === "TINGGI") {
    // Section 7.A hanya tersedia untuk PERORANGAN (lihat Known Gaps #2 di reference-data.md).
    // Korporasi/Legal Arrangement berisiko Tinggi TIDAK PERNAH otomatis COMPLETE —
    // wajib proses manual sampai form EDD Korporasi tersedia.
    eddOk =
      customer.type === "PERORANGAN"
        ? !!customer.highRiskAdditionalInfo
        : false;
  }

  const overallComplete = cddComplete && riskComplete && eddOk;
  const newStatus: CustomerStatus = overallComplete ? "COMPLETE" : "DRAFT";

  if (customer.status !== newStatus) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: newStatus },
    });
  }

  return newStatus;
}
