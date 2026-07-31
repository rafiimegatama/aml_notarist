"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";
import {
  corporateFormSchema,
  type CorporateFormOutput,
  individualFormSchema,
  type IndividualFormOutput,
  legalArrangementFormSchema,
  type LegalArrangementFormOutput,
} from "@/lib/validations";

export type ActionResult =
  | { success: true }
  | { success: false; formError?: string; fieldErrors: Record<string, string> };

function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

/** "" dari input HTML kosong diperlakukan setara "tidak diisi" (undefined) di level Prisma. */
function nullifyEmpty<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const key in out) {
    if (out[key] === "") out[key] = undefined as never;
  }
  return out;
}

function flattenZodError(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createCorporateCustomer(
  input: CorporateFormOutput
): Promise<ActionResult> {
  const parsed = corporateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  const customer = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: { type: "KORPORASI", status: "DRAFT" },
    });

    await tx.corporateDetail.create({
      data: {
        customerId: customer.id,
        ...nullifyEmpty(data.corporateDetail),
        tanggalSkPengesahan: toDate(data.corporateDetail.tanggalSkPengesahan),
        tanggalIjinUsaha: toDate(data.corporateDetail.tanggalIjinUsaha),
      },
    });

    if (data.beneficialOwners.length > 0) {
      await tx.beneficialOwner.createMany({
        data: data.beneficialOwners.map((bo) => ({
          customerId: customer.id,
          ...nullifyEmpty(bo),
          tanggalLahir: toDate(bo.tanggalLahir),
        })),
      });
    }

    await tx.powerOfAttorney.create({
      data: {
        customerId: customer.id,
        ...nullifyEmpty(data.powerOfAttorney),
        tanggalSuratKuasa: toDate(data.powerOfAttorney.tanggalSuratKuasa),
        tanggalLahir: toDate(data.powerOfAttorney.tanggalLahir),
      },
    });

    await tx.notaryService.create({
      data: { customerId: customer.id, ...nullifyEmpty(data.notaryService) },
    });

    return customer;
  });

  await computeAndPersistStatus(customer.id);
  revalidatePath("/");
  redirect(`/cdd/${customer.id}`);
}

export async function createIndividualCustomer(
  input: IndividualFormOutput
): Promise<ActionResult> {
  const parsed = individualFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  const customer = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: { type: "PERORANGAN", status: "DRAFT" },
    });

    await tx.individualDetail.create({
      data: {
        customerId: customer.id,
        ...nullifyEmpty(data.individualDetail),
        tanggalLahir: toDate(data.individualDetail.tanggalLahir),
      },
    });

    if (data.beneficialOwners.length > 0) {
      await tx.beneficialOwner.createMany({
        data: data.beneficialOwners.map((bo) => ({
          customerId: customer.id,
          ...nullifyEmpty(bo),
          tanggalLahir: toDate(bo.tanggalLahir),
        })),
      });
    }

    await tx.notaryService.create({
      data: { customerId: customer.id, ...nullifyEmpty(data.notaryService) },
    });

    return customer;
  });

  await computeAndPersistStatus(customer.id);
  revalidatePath("/");
  redirect(`/cdd/${customer.id}`);
}

export async function createLegalArrangementCustomer(
  input: LegalArrangementFormOutput
): Promise<ActionResult> {
  const parsed = legalArrangementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  const customer = await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.create({
      data: { type: "LEGAL_ARRANGEMENT", status: "DRAFT" },
    });

    await tx.legalArrangementDetail.create({
      data: {
        customerId: customer.id,
        ...nullifyEmpty(data.legalArrangementDetail),
        tanggalSkPengesahan: toDate(
          data.legalArrangementDetail.tanggalSkPengesahan
        ),
        tanggalIjinUsaha: toDate(data.legalArrangementDetail.tanggalIjinUsaha),
      },
    });

    if (data.beneficialOwners.length > 0) {
      await tx.beneficialOwner.createMany({
        data: data.beneficialOwners.map((bo) => ({
          customerId: customer.id,
          ...nullifyEmpty(bo),
          tanggalLahir: toDate(bo.tanggalLahir),
        })),
      });
    }

    if (data.parties.length > 0) {
      await tx.legalArrangementParty.createMany({
        data: data.parties.map((party) => ({
          customerId: customer.id,
          ...nullifyEmpty(party),
          tanggalLahir: toDate(party.tanggalLahir),
          tanggalPerjanjian: toDate(party.tanggalPerjanjian),
        })),
      });
    }

    await tx.notaryService.create({
      data: { customerId: customer.id, ...nullifyEmpty(data.notaryService) },
    });

    return customer;
  });

  await computeAndPersistStatus(customer.id);
  revalidatePath("/");
  redirect(`/cdd/${customer.id}`);
}
