"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { PDF_ARCHIVE_DIR } from "@/lib/storage";
import { CddDocument } from "@/components/pdf/CddDocument";

/**
 * FR-11 — dipanggil dari computeAndPersistStatus (lib/status.ts) tepat saat
 * status berubah ke COMPLETE, supaya notaris tidak perlu mengingat untuk
 * export PDF manual. Fire-and-forget dari sisi caller; fungsi ini sendiri
 * tidak pernah throw — kegagalan (mis. render PDF error) hanya di-log,
 * tidak boleh mengganggu alur penyimpanan CDD/Risk Assessment/EDD yang
 * memicunya.
 */
export async function archiveCddPdf(customerId: string): Promise<void> {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        corporateDetail: true,
        individualDetail: true,
        legalArrangementDetail: true,
        beneficialOwners: true,
        powerOfAttorney: true,
        legalArrangementParties: true,
        notaryService: true,
        riskAssessment: {
          include: {
            userProfileScore: true,
            businessSectorScore: true,
            regionScore: true,
            countryScore: true,
            notaryServiceTypeScore: true,
          },
        },
        highRiskAdditionalInfo: true,
      },
    });
    if (!customer) return;

    const buffer = await renderToBuffer(<CddDocument customer={customer} />);
    const displayName =
      customer.corporateDetail?.namaKorporasi ??
      customer.individualDetail?.namaLengkap ??
      customer.legalArrangementDetail?.nama ??
      "cdd";
    const fileName = `CDD-${displayName.replace(/[^a-zA-Z0-9]+/g, "-")}-${customerId}.pdf`;

    await mkdir(PDF_ARCHIVE_DIR, { recursive: true });
    await writeFile(path.join(PDF_ARCHIVE_DIR, fileName), buffer);
    console.log(`FR-11: PDF diarsipkan otomatis untuk customer ${customerId} (${fileName}).`);
  } catch (err) {
    console.error(`FR-11: Gagal mengarsipkan PDF otomatis untuk customer ${customerId}:`, err);
  }
}
