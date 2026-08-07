"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { CaseStatus } from "@/lib/generated/prisma/enums";
import { logActivity } from "@/lib/activityLog";

/**
 * Setiap Customer yang baru menjadi berisiko Tinggi otomatis dijadikan Case
 * — dipanggil dari DALAM transaksi saveRiskAssessment (lib/actions/
 * riskAssessment.ts), TEPAT SETELAH riskCategory dihitung. Ini TIDAK
 * mengubah cara riskCategory dihitung sama sekali (lihat lib/scoring.ts,
 * tidak disentuh) — murni efek samping tambahan, pola yang sama dengan
 * computeAndPersistStatus/logActivity yang sudah dipanggil di titik yang
 * sama. Idempotent: kalau Case sudah ada (mis. sempat turun ke Sedang lalu
 * naik lagi ke Tinggi), tidak dibuat ulang/di-reset — status existing case
 * dibiarkan apa adanya, itu keputusan reviewer untuk ditindaklanjuti manual.
 */
export async function ensureCaseForHighRisk(
  tx: Prisma.TransactionClient,
  customerId: string
): Promise<void> {
  const existing = await tx.case.findUnique({ where: { customerId }, select: { id: true } });
  if (existing) return;
  await tx.case.create({
    data: {
      customerId,
      status: CaseStatus.EDD_REQUIRED,
      checklist: { create: {} },
    },
  });
}

/**
 * Dipanggil dari saveHighRiskAdditionalInfo setelah form EDD tersimpan —
 * memindahkan Case dari EDD_REQUIRED/EDD_IN_PROGRESS ke
 * WAITING_MANUAL_REVIEW. Tidak melakukan apa pun kalau Case sudah di status
 * lanjutan (APPROVED/REJECTED/ARCHIVED) — EDD yang diedit ulang pada case
 * yang sudah diputuskan tidak boleh diam-diam membuka kembali alurnya.
 */
export async function advanceCaseAfterEdd(customerId: string): Promise<void> {
  const kase = await prisma.case.findUnique({ where: { customerId }, select: { id: true, status: true } });
  if (!kase) return;
  if (kase.status === CaseStatus.EDD_REQUIRED || kase.status === CaseStatus.EDD_IN_PROGRESS) {
    await prisma.case.update({
      where: { id: kase.id },
      data: { status: CaseStatus.WAITING_MANUAL_REVIEW },
    });
  }
}

const CASE_DETAIL_INCLUDE = {
  checklist: true,
  decision: true,
  aiFindings: { orderBy: { createdAt: "desc" as const } },
  duplicateChecks: { orderBy: { createdAt: "desc" as const } },
  customer: {
    include: {
      corporateDetail: true,
      individualDetail: true,
      legalArrangementDetail: true,
      riskAssessment: true,
      highRiskAdditionalInfo: true,
      documents: { orderBy: { createdAt: "desc" as const } },
      activityLog: { orderBy: { createdAt: "desc" as const } },
    },
  },
} satisfies Prisma.CaseInclude;

export async function getCaseById(id: string) {
  return prisma.case.findUnique({ where: { id }, include: CASE_DETAIL_INCLUDE });
}

export async function getCaseByCustomerId(customerId: string) {
  return prisma.case.findUnique({ where: { customerId }, include: CASE_DETAIL_INCLUDE });
}

/** Nama tampilan kandidat duplikat — dipanggil dari halaman Case untuk render CaseDuplicateCheck.candidateCustomerId. */
export async function resolveCustomerDisplayNames(customerIds: string[]): Promise<Record<string, string>> {
  if (customerIds.length === 0) return {};
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      corporateDetail: { select: { namaKorporasi: true } },
      individualDetail: { select: { namaLengkap: true } },
      legalArrangementDetail: { select: { nama: true } },
    },
  });
  const map: Record<string, string> = {};
  for (const c of customers) {
    map[c.id] =
      c.corporateDetail?.namaKorporasi ?? c.individualDetail?.namaLengkap ?? c.legalArrangementDetail?.nama ?? "(tanpa nama)";
  }
  return map;
}

export async function listCases(status?: CaseStatus) {
  return prisma.case.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      customer: {
        select: {
          type: true,
          corporateDetail: { select: { namaKorporasi: true } },
          individualDetail: { select: { namaLengkap: true } },
          legalArrangementDetail: { select: { nama: true } },
          riskAssessment: { select: { riskCategory: true } },
        },
      },
    },
  });
}

const CHECKLIST_KEYS = [
  "identityVerified",
  "sourceOfFundsReviewed",
  "sourceOfWealthReviewed",
  "beneficialOwnerConfirmed",
  "documentsVerified",
  "aiRecommendationReviewed",
  "regulationReviewed",
] as const;
export type ChecklistKey = (typeof CHECKLIST_KEYS)[number];

export type CaseActionResult = { success: true } | { success: false; error: string };

export async function toggleChecklistItem(
  caseId: string,
  key: ChecklistKey,
  value: boolean
): Promise<CaseActionResult> {
  if (!CHECKLIST_KEYS.includes(key)) {
    return { success: false, error: "Item checklist tidak dikenal." };
  }
  const kase = await prisma.case.findUnique({ where: { id: caseId }, select: { customerId: true } });
  if (!kase) return { success: false, error: "Case tidak ditemukan." };

  await prisma.caseChecklist.upsert({
    where: { caseId },
    create: { caseId, [key]: value },
    update: { [key]: value },
  });
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

/** "Mulai EDD" — transisi manual EDD_REQUIRED -> EDD_IN_PROGRESS, murni penanda progres untuk reviewer lain. */
export async function markCaseInProgress(caseId: string): Promise<CaseActionResult> {
  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase) return { success: false, error: "Case tidak ditemukan." };
  if (kase.status !== CaseStatus.EDD_REQUIRED) {
    return { success: false, error: "Case sudah tidak dalam status menunggu EDD." };
  }
  await prisma.case.update({ where: { id: caseId }, data: { status: CaseStatus.EDD_IN_PROGRESS } });
  await logActivity(kase.customerId, "Case: EDD mulai dikerjakan");
  revalidatePath(`/cases/${caseId}`);
  return { success: true };
}

const FINAL_OUTCOMES_REQUIRE_CHECKLIST = new Set(["APPROVED", "REJECTED"]);
const OUTCOME_TO_STATUS: Record<string, CaseStatus> = {
  APPROVED: CaseStatus.APPROVED,
  REJECTED: CaseStatus.REJECTED,
  NEED_MORE_DOCUMENTS: CaseStatus.EDD_IN_PROGRESS,
  ARCHIVED: CaseStatus.ARCHIVED,
};

/**
 * Keputusan akhir — SATU-SATUNYA jalur yang mengubah Case ke status
 * terminal (APPROVED/REJECTED) atau ARCHIVED. Dipanggil HANYA dari UI aksi
 * manual reviewer (tidak pernah dari lib/ai/*). Approve/Reject mewajibkan
 * seluruh 7 item CaseChecklist sudah dicentang — ditegakkan di sini, bukan
 * di skema, karena SQLite/Prisma tidak punya cross-table CHECK constraint
 * yang praktis untuk kasus ini.
 */
export async function decideCase(
  caseId: string,
  outcome: "APPROVED" | "REJECTED" | "NEED_MORE_DOCUMENTS" | "ARCHIVED",
  notes: string
): Promise<CaseActionResult> {
  const kase = await prisma.case.findUnique({
    where: { id: caseId },
    include: { checklist: true },
  });
  if (!kase) return { success: false, error: "Case tidak ditemukan." };

  if (FINAL_OUTCOMES_REQUIRE_CHECKLIST.has(outcome)) {
    const checklist = kase.checklist;
    const allChecked = checklist ? CHECKLIST_KEYS.every((k) => checklist[k]) : false;
    if (!allChecked) {
      return {
        success: false,
        error: "Semua item Manual Review Checklist wajib dicentang sebelum Approve/Reject.",
      };
    }
  }

  await prisma.caseDecision.upsert({
    where: { caseId },
    create: { caseId, outcome, notes: notes || null },
    update: { outcome, notes: notes || null, decidedAt: new Date() },
  });
  await prisma.case.update({ where: { id: caseId }, data: { status: OUTCOME_TO_STATUS[outcome] } });
  await logActivity(kase.customerId, `Case: keputusan "${outcome}" dicatat`);
  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return { success: true };
}

export async function dismissAiFinding(findingId: string): Promise<CaseActionResult> {
  const finding = await prisma.caseAiFinding.update({
    where: { id: findingId },
    data: { dismissed: true },
  }).catch(() => null);
  if (!finding) return { success: false, error: "Temuan tidak ditemukan." };
  revalidatePath(`/cases/${finding.caseId}`);
  return { success: true };
}
