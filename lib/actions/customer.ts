"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";
import { toDate, nullifyEmpty, flattenZodError } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import { attachDraftDocument } from "@/lib/actions/document";
import { logActivity } from "@/lib/activityLog";
import {
  corporateFormSchema,
  type CorporateFormOutput,
  individualFormSchema,
  type IndividualFormOutput,
  legalArrangementFormSchema,
  type LegalArrangementFormOutput,
} from "@/lib/validations";

export async function createCorporateCustomer(
  input: CorporateFormOutput,
  draftUploadId?: string,
  prefillSourceLabel?: string
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

    await attachDraftDocument(tx, draftUploadId, customer.id);

    return customer;
  });

  await computeAndPersistStatus(customer.id);
  await logActivity(
    customer.id,
    prefillSourceLabel
      ? `CDD Korporasi dibuat (data awal dari klien terdaftar: ${prefillSourceLabel})`
      : "CDD Korporasi dibuat"
  );
  revalidatePath("/");
  redirect(`/cdd/${customer.id}`);
}

export async function createIndividualCustomer(
  input: IndividualFormOutput,
  draftUploadId?: string,
  prefillSourceLabel?: string
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

    await attachDraftDocument(tx, draftUploadId, customer.id);

    return customer;
  });

  await computeAndPersistStatus(customer.id);
  await logActivity(
    customer.id,
    prefillSourceLabel
      ? `CDD Perorangan dibuat (data awal dari klien terdaftar: ${prefillSourceLabel})`
      : "CDD Perorangan dibuat"
  );
  revalidatePath("/");
  redirect(`/cdd/${customer.id}`);
}

export async function createLegalArrangementCustomer(
  input: LegalArrangementFormOutput,
  draftUploadId?: string,
  prefillSourceLabel?: string
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

    await attachDraftDocument(tx, draftUploadId, customer.id);

    return customer;
  });

  await computeAndPersistStatus(customer.id);
  await logActivity(
    customer.id,
    prefillSourceLabel
      ? `CDD Perikatan Lainnya dibuat (data awal dari klien terdaftar: ${prefillSourceLabel})`
      : "CDD Perikatan Lainnya dibuat"
  );
  revalidatePath("/");
  redirect(`/cdd/${customer.id}`);
}
