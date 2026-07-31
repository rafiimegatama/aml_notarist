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

/** Radio "YA"/"TIDAK" → boolean. Dikonversi di sini (bukan di schema zod) agar
 * tipe input/output form persis sama — lihat catatan di lib/validations.ts. */
function yesNoToBoolean(value?: string): boolean | undefined {
  if (value === "YA") return true;
  if (value === "TIDAK") return false;
  return undefined;
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

    await tx.riskAssessment.upsert({
      where: { customerId },
      create: {
        customerId,
        ...rest,
        isPep,
        adaBeritaNegatif,
        totalScore,
        riskCategory,
      },
      update: {
        ...rest,
        isPep,
        adaBeritaNegatif,
        totalScore,
        riskCategory,
      },
    });
  });

  await computeAndPersistStatus(customerId);
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
}
