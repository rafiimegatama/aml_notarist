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

  await prisma.highRiskAdditionalInfo.upsert({
    where: { customerId },
    create: {
      customerId,
      ...data,
      tanggalLahir: toDate(data.tanggalLahir),
    },
    update: {
      ...data,
      tanggalLahir: toDate(data.tanggalLahir),
    },
  });

  await computeAndPersistStatus(customerId);
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
}
