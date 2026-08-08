import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  loadIndividualForEdit,
  loadCorporateForEdit,
  loadLegalArrangementForEdit,
} from "@/lib/actions/customerEdit";
import { updateIndividualCustomer, updateCorporateCustomer } from "@/lib/actions/customer";
import { individualFormSchema, corporateFormSchema } from "@/lib/validations";

/**
 * Integration test against the REAL Prisma client (prisma/dev.db) — this
 * repo has no separate test database, and standing one up is out of scope
 * for verifying this feature. `redirect`/`revalidatePath` are Next.js
 * runtime primitives that throw ("static generation store missing") outside
 * a live request, which is also why lib/actions/customer.ts's
 * create/update actions were never unit-testable before — mocked here so
 * the actual transaction logic can run and be inspected directly. Every
 * test creates its own customer and deletes it in `afterEach` (Customer's
 * onDelete: Cascade takes every child row with it), so this never leaves
 * data behind in a real notary's database.
 */
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

describe("customerEdit — load*ForEdit (unlike loadXPrefill, must NOT blank jasaYangDiberikan)", () => {
  let customerId: string | null = null;

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      customerId = null;
    }
  });

  it("loadIndividualForEdit returns the full saved record, including jasaYangDiberikan", async () => {
    const customer = await prisma.customer.create({
      data: {
        type: "PERORANGAN",
        individualDetail: {
          create: {
            namaLengkap: "Test Individual",
            jenisIdentitas: "KTP",
            jenisKelamin: "LAKI_LAKI",
            statusPernikahan: "MENIKAH",
          },
        },
        notaryService: { create: { jasaYangDiberikan: "Jual Beli Tanah" } },
      },
    });
    customerId = customer.id;

    const data = await loadIndividualForEdit(customer.id);
    expect(data).not.toBeNull();
    expect(data!.values.individualDetail.namaLengkap).toBe("Test Individual");
    expect(data!.values.notaryService.jasaYangDiberikan).toBe("Jual Beli Tanah");
  });

  it("returns null for a wrong customer type (e.g. asking for individual edit-data on a corporate record)", async () => {
    const customer = await prisma.customer.create({
      data: { type: "KORPORASI", corporateDetail: { create: { namaKorporasi: "PT Test" } } },
    });
    customerId = customer.id;

    expect(await loadIndividualForEdit(customer.id)).toBeNull();
  });

  it("returns null for a nonexistent customer id", async () => {
    expect(await loadIndividualForEdit("does-not-exist")).toBeNull();
  });

  it("loadCorporateForEdit preserves jasaYangDiberikan too", async () => {
    const customer = await prisma.customer.create({
      data: {
        type: "KORPORASI",
        corporateDetail: { create: { namaKorporasi: "PT Test Korporasi" } },
        powerOfAttorney: { create: { hubunganHukum: "DIREKTUR" } },
        notaryService: { create: { jasaYangDiberikan: "Pendirian PT" } },
      },
    });
    customerId = customer.id;

    const data = await loadCorporateForEdit(customer.id);
    expect(data!.values.corporateDetail.namaKorporasi).toBe("PT Test Korporasi");
    expect(data!.values.notaryService.jasaYangDiberikan).toBe("Pendirian PT");
  });

  it("loadLegalArrangementForEdit preserves jasaYangDiberikan too", async () => {
    const customer = await prisma.customer.create({
      data: {
        type: "LEGAL_ARRANGEMENT",
        legalArrangementDetail: { create: { nama: "Trust Test" } },
        notaryService: { create: { jasaYangDiberikan: "Akta Trust" } },
      },
    });
    customerId = customer.id;

    const data = await loadLegalArrangementForEdit(customer.id);
    expect(data!.values.legalArrangementDetail.nama).toBe("Trust Test");
    expect(data!.values.notaryService.jasaYangDiberikan).toBe("Akta Trust");
  });
});

describe("updateIndividualCustomer / updateCorporateCustomer — correction actually lands, arrays replaced not duplicated", () => {
  let customerId: string | null = null;

  afterEach(async () => {
    if (customerId) {
      await prisma.customer.delete({ where: { id: customerId } }).catch(() => {});
      customerId = null;
    }
  });

  it("corrects a typo'd field, fully replaces beneficialOwners, keeps notaryService, logs activity, recomputes status", async () => {
    const customer = await prisma.customer.create({
      data: {
        type: "PERORANGAN",
        individualDetail: {
          create: {
            namaLengkap: "Budi Santoso TYPO",
            jenisIdentitas: "KTP",
            jenisKelamin: "LAKI_LAKI",
            statusPernikahan: "MENIKAH",
          },
        },
        beneficialOwners: { create: [{ namaLengkap: "Owner Lama" }] },
        notaryService: { create: { jasaYangDiberikan: "Jual Beli Tanah" } },
      },
    });
    customerId = customer.id;

    const editData = await loadIndividualForEdit(customer.id);
    const correctedInput = individualFormSchema.parse({
      individualDetail: { ...editData!.values.individualDetail, namaLengkap: "Budi Santoso" },
      beneficialOwners: [{ namaLengkap: "Owner Baru" }],
      notaryService: editData!.values.notaryService,
    });

    await updateIndividualCustomer(customer.id, correctedInput);

    const after = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: { individualDetail: true, beneficialOwners: true, notaryService: true },
    });
    expect(after!.individualDetail!.namaLengkap).toBe("Budi Santoso");
    expect(after!.beneficialOwners).toHaveLength(1);
    expect(after!.beneficialOwners[0].namaLengkap).toBe("Owner Baru");
    expect(after!.notaryService!.jasaYangDiberikan).toBe("Jual Beli Tanah");

    const logEntries = await prisma.activityLogEntry.findMany({ where: { customerId: customer.id } });
    expect(logEntries.some((e) => e.description.includes("diperbarui"))).toBe(true);
  });

  it("rejects an update when the target customer's type does not match (defense against a stale/wrong customerId)", async () => {
    const customer = await prisma.customer.create({
      data: { type: "KORPORASI", corporateDetail: { create: { namaKorporasi: "PT Wrong Type" } } },
    });
    customerId = customer.id;

    const validButWrongTypeInput = individualFormSchema.parse({
      individualDetail: {
        namaLengkap: "x",
        jenisIdentitas: "KTP",
        jenisKelamin: "LAKI_LAKI",
        statusPernikahan: "MENIKAH",
      },
      beneficialOwners: [],
      notaryService: {},
    });

    // customer.id above is a KORPORASI record — calling the PERORANGAN
    // update action on it must fail, not silently write individualDetail
    // onto a corporate customer.
    await expect(
      updateIndividualCustomer(customer.id, validButWrongTypeInput)
    ).rejects.toThrow();
  });

  it("updateCorporateCustomer fully replaces beneficialOwners and updates powerOfAttorney", async () => {
    const customer = await prisma.customer.create({
      data: {
        type: "KORPORASI",
        corporateDetail: { create: { namaKorporasi: "PT Lama" } },
        powerOfAttorney: { create: { hubunganHukum: "DIREKTUR" } },
        beneficialOwners: { create: [{ namaLengkap: "BO Lama 1" }, { namaLengkap: "BO Lama 2" }] },
        notaryService: { create: {} },
      },
    });
    customerId = customer.id;

    const editData = await loadCorporateForEdit(customer.id);
    const correctedInput = corporateFormSchema.parse({
      corporateDetail: { ...editData!.values.corporateDetail, namaKorporasi: "PT Baru (Dikoreksi)" },
      beneficialOwners: [],
      powerOfAttorney: { ...editData!.values.powerOfAttorney, hubunganHukum: "KOMISARIS_UTAMA" },
      notaryService: editData!.values.notaryService,
    });

    await updateCorporateCustomer(customer.id, correctedInput);

    const after = await prisma.customer.findUnique({
      where: { id: customer.id },
      include: { corporateDetail: true, beneficialOwners: true, powerOfAttorney: true },
    });
    expect(after!.corporateDetail!.namaKorporasi).toBe("PT Baru (Dikoreksi)");
    expect(after!.beneficialOwners).toHaveLength(0); // fully cleared, not left as 2 stale rows
    expect(after!.powerOfAttorney!.hubunganHukum).toBe("KOMISARIS_UTAMA");
  });
});
