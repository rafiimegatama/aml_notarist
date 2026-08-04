import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { CustomerStatus, RiskCategory } from "@/lib/generated/prisma/enums";
import { exportCustomerToSheet } from "@/lib/actions/sheetsExport";
import { archiveCddPdf } from "@/lib/actions/pdfArchive";

export const STATUS_QUERY_INCLUDE = {
  corporateDetail: true,
  individualDetail: true,
  legalArrangementDetail: true,
  powerOfAttorney: true,
  notaryService: true,
  beneficialOwners: true,
  riskAssessment: true,
  highRiskAdditionalInfo: true,
} satisfies Prisma.CustomerInclude;

export type CustomerForStatus = Prisma.CustomerGetPayload<{
  include: typeof STATUS_QUERY_INCLUDE;
}>;

// FR-4 — state granular per section, dipakai widget checklist (app/cdd/[id])
// dan tooltip dashboard (app/page.tsx). "not_applicable" dikeluarkan dari
// rasio completed/total; beneficialOwnerCount murni informasional (0 valid).
export type CompletionBreakdown = {
  cddDasar: "filled" | "not_filled";
  powerOfAttorney: "filled" | "not_filled" | "not_applicable";
  beneficialOwnerCount: number;
  notaryService: "filled" | "not_filled";
  riskAssessment: "not_started" | "pep_only" | "scored";
  riskCategory: RiskCategory | null;
  edd: "not_applicable" | "required_not_filled" | "filled" | "manual_required";
  completed: number;
  total: number;
  overallComplete: boolean;
};

/**
 * Satu-satunya tempat yang menentukan "lengkap atau belum" per bagian —
 * computeAndPersistStatus() dan getCompletionBreakdown() sama-sama memanggil
 * ini, supaya checklist di UI tidak pernah berbeda dari Customer.status yang
 * sebenarnya tersimpan (lihat acceptance criteria FR-4).
 */
function deriveCompletionBreakdown(
  customer: CustomerForStatus
): CompletionBreakdown {
  let cddDasar: CompletionBreakdown["cddDasar"];
  if (customer.type === "KORPORASI") {
    cddDasar = customer.corporateDetail ? "filled" : "not_filled";
  } else if (customer.type === "PERORANGAN") {
    cddDasar = customer.individualDetail ? "filled" : "not_filled";
  } else {
    cddDasar = customer.legalArrangementDetail ? "filled" : "not_filled";
  }

  // Section 1.D (Kuasa) wajib untuk Korporasi — lihat catatan di lib/validations.ts
  const powerOfAttorney: CompletionBreakdown["powerOfAttorney"] =
    customer.type !== "KORPORASI"
      ? "not_applicable"
      : customer.powerOfAttorney
        ? "filled"
        : "not_filled";

  const notaryService: CompletionBreakdown["notaryService"] = customer
    .notaryService
    ? "filled"
    : "not_filled";

  const ra = customer.riskAssessment;
  const riskComplete =
    !!ra && ra.totalScore !== null && ra.riskCategory !== null;
  let riskAssessment: CompletionBreakdown["riskAssessment"];
  if (riskComplete) {
    riskAssessment = "scored";
  } else if (ra && (ra.isPep !== null || ra.adaBeritaNegatif !== null)) {
    riskAssessment = "pep_only";
  } else {
    riskAssessment = "not_started";
  }

  let eddOk = true;
  let edd: CompletionBreakdown["edd"] = "not_applicable";
  if (riskComplete && ra!.riskCategory === "TINGGI") {
    // Section 7.A hanya tersedia untuk PERORANGAN (lihat Known Gaps #2 di reference-data.md).
    // Korporasi/Legal Arrangement berisiko Tinggi TIDAK PERNAH otomatis COMPLETE —
    // wajib proses manual sampai form EDD Korporasi tersedia.
    if (customer.type === "PERORANGAN") {
      eddOk = !!customer.highRiskAdditionalInfo;
      edd = customer.highRiskAdditionalInfo ? "filled" : "required_not_filled";
    } else {
      eddOk = false;
      edd = "manual_required";
    }
  }

  const cddComplete = cddDasar === "filled" && powerOfAttorney !== "not_filled";
  const overallComplete = cddComplete && riskComplete && eddOk;

  const rows: Array<{ applicable: boolean; complete: boolean }> = [
    { applicable: true, complete: cddDasar === "filled" },
    {
      applicable: powerOfAttorney !== "not_applicable",
      complete: powerOfAttorney === "filled",
    },
    { applicable: true, complete: notaryService === "filled" },
    { applicable: true, complete: riskAssessment === "scored" },
    { applicable: edd !== "not_applicable", complete: edd === "filled" },
  ];
  const applicableRows = rows.filter((r) => r.applicable);

  return {
    cddDasar,
    powerOfAttorney,
    beneficialOwnerCount: customer.beneficialOwners.length,
    notaryService,
    riskAssessment,
    riskCategory: ra?.riskCategory ?? null,
    edd,
    completed: applicableRows.filter((r) => r.complete).length,
    total: applicableRows.length,
    overallComplete,
  };
}

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
    include: STATUS_QUERY_INCLUDE,
  });

  const breakdown = deriveCompletionBreakdown(customer);
  const newStatus: CustomerStatus = breakdown.overallComplete
    ? "COMPLETE"
    : "DRAFT";
  const isNewlyComplete = customer.status !== "COMPLETE" && newStatus === "COMPLETE";

  if (customer.status !== newStatus) {
    await prisma.customer.update({
      where: { id: customerId },
      data: { status: newStatus },
    });
  }

  if (isNewlyComplete) {
    // FR-1.3 & FR-11 — fire-and-forget: keduanya sudah menangani error/log
    // sendiri (tidak throw), jadi tidak perlu ditunggu di sini supaya server
    // action yang memicu transisi ini (create/risk-assessment/EDD) tidak
    // tertunda menunggu Google Sheets API atau render PDF selesai.
    void exportCustomerToSheet(customerId);
    void archiveCddPdf(customerId);
  }

  return newStatus;
}

/** FR-4 — dipakai app/cdd/[id]/page.tsx untuk widget checklist. */
export async function getCompletionBreakdown(
  customerId: string
): Promise<CompletionBreakdown> {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    include: STATUS_QUERY_INCLUDE,
  });
  return deriveCompletionBreakdown(customer);
}

/** FR-4 — dipakai app/page.tsx (dashboard) dari data yang sudah di-fetch, supaya tidak perlu query tambahan per baris. */
export function computeCompletionBreakdown(
  customer: CustomerForStatus
): CompletionBreakdown {
  return deriveCompletionBreakdown(customer);
}
