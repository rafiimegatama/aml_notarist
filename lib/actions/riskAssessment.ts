"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";
import { computeRiskCategory } from "@/lib/scoring";
import {
  riskAssessmentSchema,
  type RiskAssessmentOutput,
} from "@/lib/validations";
import { nullifyEmpty, flattenZodError } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import { logActivity } from "@/lib/activityLog";
import { ensureCaseForHighRisk } from "@/lib/transactionHelpers";

/** Radio "YA"/"TIDAK" → boolean. Dikonversi di sini (bukan di schema zod) agar
 * tipe input/output form persis sama — lihat catatan di lib/validations.ts. */
function yesNoToBoolean(value?: string): boolean | undefined {
  if (value === "YA") return true;
  if (value === "TIDAK") return false;
  return undefined;
}

/** nullifyEmpty() turns "" into undefined so a bare `create` uses the column
 * default (null). But this object is also spread into upsert's `update`
 * branch, where an explicit `undefined` means "leave the previous value
 * untouched" instead of "clear it" — same class of bug previously found+
 * fixed in lib/actions/ltkm.ts. Coalesce back to explicit null so clearing a
 * previously-filled PEP/score field (e.g. blanking "Warga Negara PEP", or
 * resetting a score dropdown to unselected) actually persists. Safe for
 * `create` too since these are all nullable columns with no @default. */
function nullToClear<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key in out) {
    if (out[key] === undefined) out[key] = null as never;
  }
  return out;
}

export async function saveRiskAssessment(
  customerId: string,
  input: RiskAssessmentOutput
): Promise<ActionResult> {
  const parsed = riskAssessmentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = nullifyEmpty(parsed.data);
  const existed = await prisma.riskAssessment.findUnique({
    where: { customerId },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    // Total Nilai HANYA final jika kelima kategori terpilih DAN masing-masing
    // punya skor (RefBusinessSectorScore.score bisa null selama data belum
    // dilengkapi di halaman Referensi Data — lihat reference-data.md bagian 9).
    let totalScore: number | null = null;
    if (
      data.userProfileScoreId &&
      data.businessSectorScoreId &&
      data.regionScoreId &&
      data.countryScoreId &&
      data.notaryServiceTypeScoreId
    ) {
      const [userProfile, businessSector, region, country, notaryService] =
        await Promise.all([
          tx.refUserProfileScore.findUnique({
            where: { id: data.userProfileScoreId },
          }),
          tx.refBusinessSectorScore.findUnique({
            where: { id: data.businessSectorScoreId },
          }),
          tx.refRegionScore.findUnique({ where: { id: data.regionScoreId } }),
          tx.refCountryScore.findUnique({
            where: { id: data.countryScoreId },
          }),
          tx.refNotaryServiceTypeScore.findUnique({
            where: { id: data.notaryServiceTypeScoreId },
          }),
        ]);

      const scores = [
        userProfile?.score,
        businessSector?.score,
        region?.score,
        country?.score,
        notaryService?.score,
      ];
      if (scores.every((s) => typeof s === "number")) {
        totalScore = scores.reduce((sum, s) => sum + (s as number), 0);
      }
    }

    const riskCategory =
      totalScore !== null ? computeRiskCategory(totalScore) : null;

    const { isPep: isPepRaw, adaBeritaNegatif: adaBeritaNegatifRaw, ...rest } =
      data;
    const isPep = yesNoToBoolean(isPepRaw);
    const adaBeritaNegatif = yesNoToBoolean(adaBeritaNegatifRaw);
    const clearedRest = nullToClear(rest);

    await tx.riskAssessment.upsert({
      where: { customerId },
      create: {
        customerId,
        ...clearedRest,
        isPep,
        adaBeritaNegatif,
        totalScore,
        riskCategory,
      },
      update: {
        ...clearedRest,
        isPep,
        adaBeritaNegatif,
        totalScore,
        riskCategory,
      },
    });

    // Efek samping tambahan, sama seperti computeAndPersistStatus/logActivity
    // di bawah — lihat komentar ensureCaseForHighRisk. TIDAK memengaruhi
    // riskCategory/totalScore yang baru saja dihitung di atas.
    if (riskCategory === "TINGGI") {
      await ensureCaseForHighRisk(tx, customerId);
    }
  });

  await computeAndPersistStatus(customerId);
  await logActivity(
    customerId,
    existed ? "Risk Assessment diperbarui" : "Risk Assessment disimpan"
  );
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
}
