"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";
import {
  highRiskAdditionalInfoSchema,
  type HighRiskAdditionalInfoOutput,
} from "@/lib/validations";
import { toDate, nullifyEmpty, flattenZodError } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import { logActivity } from "@/lib/activityLog";

/** nullifyEmpty() turns "" into undefined so a bare `create` uses the column
 * default (null) — but this object is also spread into upsert's `update`
 * branch, where an explicit `undefined` means "leave the previous value
 * untouched" instead of "clear it" (same class of bug previously found+fixed
 * in lib/actions/ltkm.ts). Coalesce back to explicit null so clearing an
 * already-filled EDD field (e.g. blanking "Metode Pembayaran" or the date of
 * birth) actually persists. Safe for `create` too since these are all
 * nullable columns with no @default. */
function nullToClear<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key in out) {
    if (out[key] === undefined) out[key] = null as never;
  }
  return out;
}

export async function saveHighRiskAdditionalInfo(
  customerId: string,
  input: HighRiskAdditionalInfoOutput
): Promise<ActionResult> {
  // Section 7.A hanya berlaku untuk PERORANGAN berkategori Tinggi — dijaga
  // ulang di server (bukan hanya di UI) supaya tidak bisa dilewati.
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { riskAssessment: true },
  });
  if (!customer) {
    return {
      success: false,
      formError: "Data CDD tidak ditemukan. Muat ulang halaman.",
      fieldErrors: {},
    };
  }
  if (
    customer.type !== "PERORANGAN" ||
    customer.riskAssessment?.riskCategory !== "TINGGI"
  ) {
    return {
      success: false,
      formError:
        "Form ini hanya berlaku untuk pengguna jasa Perorangan berkategori risiko Tinggi.",
      fieldErrors: {},
    };
  }

  const parsed = highRiskAdditionalInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = nullifyEmpty(parsed.data);
  const clearedData = nullToClear(data);
  const existed = await prisma.highRiskAdditionalInfo.findUnique({
    where: { customerId },
    select: { id: true },
  });

  await prisma.highRiskAdditionalInfo.upsert({
    where: { customerId },
    create: {
      customerId,
      ...clearedData,
      tanggalLahir: toDate(data.tanggalLahir) ?? null,
    },
    update: {
      ...clearedData,
      tanggalLahir: toDate(data.tanggalLahir) ?? null,
    },
  });

  await computeAndPersistStatus(customerId);
  await logActivity(
    customerId,
    existed ? "Informasi Tambahan (EDD) diperbarui" : "Informasi Tambahan (EDD) disimpan"
  );
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
}
