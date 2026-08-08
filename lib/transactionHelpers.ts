import type { Prisma } from "@/lib/generated/prisma/client";
import { CaseStatus } from "@/lib/generated/prisma/enums";

/**
 * Transaction-scoped helpers called from INSIDE another action's
 * prisma.$transaction() callback (never on their own). Deliberately kept in
 * a plain module, not a "use server" file — Next.js gives every exported
 * function in a "use server" file a public Server Action ID regardless of
 * intent, and a Prisma.TransactionClient can't be sent over that wire (any
 * direct POST would just throw), but keeping tx-taking helpers out of
 * "use server" files entirely is the same defense-in-depth fix applied to
 * the real vulnerability found in lib/actions/backup.ts this session —
 * belt-and-suspenders, not a reaction to an actual exploit here.
 */

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
 * Dipanggil di dalam $transaction createXCustomer setelah Customer dibuat,
 * untuk menautkan dokumen scan (kalau ada) ke record yang baru dibuat.
 * updateMany + guard customerId:null dipakai supaya idempotent & tidak
 * throw kalau draftUploadId sudah tidak valid/sudah pernah dipakai.
 */
export async function attachDraftDocument(
  tx: Prisma.TransactionClient,
  draftUploadId: string | undefined,
  customerId: string
): Promise<void> {
  if (!draftUploadId) return;
  await tx.customerDocument.updateMany({
    where: { id: draftUploadId, customerId: null },
    data: { customerId },
  });
}
