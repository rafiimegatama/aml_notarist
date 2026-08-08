"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { computeAndPersistStatus } from "@/lib/status";
import { toDate, nullifyEmpty, flattenZodError } from "@/lib/actions/shared";
import type { ActionResult } from "@/lib/actions/shared";
import { attachDraftDocument } from "@/lib/transactionHelpers";
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

/**
 * Koreksi data CDD Korporasi yang sudah tersimpan (mis. salah ketik saat
 * input manual) — dipanggil dari halaman "Edit Data CDD"
 * (app/cdd/[id]/edit). Beneficial Owner di-replace penuh (hapus semua lalu
 * buat ulang dari array yang disubmit) alih-alih di-diff satu per satu —
 * field form-nya memang tidak menyimpan id baris per Beneficial Owner, dan
 * tidak ada model lain yang mereferensikan BeneficialOwner.id (lihat
 * prisma/schema.prisma), jadi aman. computeAndPersistStatus dipanggil ulang
 * persis seperti create — status DRAFT/COMPLETE bisa berubah kalau koreksi
 * membuat field wajib jadi kosong/terisi.
 */
export async function updateCorporateCustomer(
  customerId: string,
  input: CorporateFormOutput
): Promise<ActionResult> {
  const parsed = corporateFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (existing.type !== "KORPORASI") {
      throw new Error("Tipe customer tidak cocok.");
    }

    await tx.corporateDetail.update({
      where: { customerId },
      data: {
        ...nullifyEmpty(data.corporateDetail),
        tanggalSkPengesahan: toDate(data.corporateDetail.tanggalSkPengesahan),
        tanggalIjinUsaha: toDate(data.corporateDetail.tanggalIjinUsaha),
      },
    });

    await tx.beneficialOwner.deleteMany({ where: { customerId } });
    if (data.beneficialOwners.length > 0) {
      await tx.beneficialOwner.createMany({
        data: data.beneficialOwners.map((bo) => ({
          customerId,
          ...nullifyEmpty(bo),
          tanggalLahir: toDate(bo.tanggalLahir),
        })),
      });
    }

    await tx.powerOfAttorney.update({
      where: { customerId },
      data: {
        ...nullifyEmpty(data.powerOfAttorney),
        tanggalSuratKuasa: toDate(data.powerOfAttorney.tanggalSuratKuasa),
        tanggalLahir: toDate(data.powerOfAttorney.tanggalLahir),
      },
    });

    await tx.notaryService.update({
      where: { customerId },
      data: nullifyEmpty(data.notaryService),
    });
  });

  await computeAndPersistStatus(customerId);
  await logActivity(customerId, "Data CDD Korporasi diperbarui (koreksi manual)");
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
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

/** Koreksi data CDD Perorangan yang sudah tersimpan — lihat catatan lengkap di updateCorporateCustomer. */
export async function updateIndividualCustomer(
  customerId: string,
  input: IndividualFormOutput
): Promise<ActionResult> {
  const parsed = individualFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (existing.type !== "PERORANGAN") {
      throw new Error("Tipe customer tidak cocok.");
    }

    await tx.individualDetail.update({
      where: { customerId },
      data: {
        ...nullifyEmpty(data.individualDetail),
        tanggalLahir: toDate(data.individualDetail.tanggalLahir),
      },
    });

    await tx.beneficialOwner.deleteMany({ where: { customerId } });
    if (data.beneficialOwners.length > 0) {
      await tx.beneficialOwner.createMany({
        data: data.beneficialOwners.map((bo) => ({
          customerId,
          ...nullifyEmpty(bo),
          tanggalLahir: toDate(bo.tanggalLahir),
        })),
      });
    }

    await tx.notaryService.update({
      where: { customerId },
      data: nullifyEmpty(data.notaryService),
    });
  });

  await computeAndPersistStatus(customerId);
  await logActivity(customerId, "Data CDD Perorangan diperbarui (koreksi manual)");
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
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

/** Koreksi data CDD Perikatan Lainnya yang sudah tersimpan — lihat catatan lengkap di updateCorporateCustomer. */
export async function updateLegalArrangementCustomer(
  customerId: string,
  input: LegalArrangementFormOutput
): Promise<ActionResult> {
  const parsed = legalArrangementFormSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, fieldErrors: flattenZodError(parsed.error) };
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUniqueOrThrow({ where: { id: customerId } });
    if (existing.type !== "LEGAL_ARRANGEMENT") {
      throw new Error("Tipe customer tidak cocok.");
    }

    await tx.legalArrangementDetail.update({
      where: { customerId },
      data: {
        ...nullifyEmpty(data.legalArrangementDetail),
        tanggalSkPengesahan: toDate(data.legalArrangementDetail.tanggalSkPengesahan),
        tanggalIjinUsaha: toDate(data.legalArrangementDetail.tanggalIjinUsaha),
      },
    });

    await tx.beneficialOwner.deleteMany({ where: { customerId } });
    if (data.beneficialOwners.length > 0) {
      await tx.beneficialOwner.createMany({
        data: data.beneficialOwners.map((bo) => ({
          customerId,
          ...nullifyEmpty(bo),
          tanggalLahir: toDate(bo.tanggalLahir),
        })),
      });
    }

    await tx.legalArrangementParty.deleteMany({ where: { customerId } });
    if (data.parties.length > 0) {
      await tx.legalArrangementParty.createMany({
        data: data.parties.map((party) => ({
          customerId,
          ...nullifyEmpty(party),
          tanggalLahir: toDate(party.tanggalLahir),
          tanggalPerjanjian: toDate(party.tanggalPerjanjian),
        })),
      });
    }

    await tx.notaryService.update({
      where: { customerId },
      data: nullifyEmpty(data.notaryService),
    });
  });

  await computeAndPersistStatus(customerId);
  await logActivity(customerId, "Data CDD Perikatan Lainnya diperbarui (koreksi manual)");
  revalidatePath("/");
  revalidatePath(`/cdd/${customerId}`);
  redirect(`/cdd/${customerId}`);
}
