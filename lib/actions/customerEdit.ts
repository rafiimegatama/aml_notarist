"use server";

import { prisma } from "@/lib/prisma";
import { toDateInputValue, mapBeneficialOwner } from "@/lib/customerFormMapping";
import type {
  IndividualFormValues,
  CorporateFormValues,
  LegalArrangementFormValues,
} from "@/lib/validations";

/**
 * Loader per tipe untuk halaman "Edit Data CDD" (app/cdd/[id]/edit) — beda
 * dari loadXPrefill (lib/actions/duplicateLookup.ts) yang dipakai untuk
 * MENGISI AWAL customer BARU dari data klien lama: di sana jasaYangDiberikan
 * sengaja dikosongkan (melekat ke transaksi baru), di sini SEMUA field
 * termasuk jasaYangDiberikan dibawa apa adanya karena ini mengedit record
 * yang sama, bukan membuat yang baru. Gagal diam-diam ke null (bukan error)
 * kalau id tidak ada/tipe tidak cocok — pola sama dengan loadDraftDocument.
 */

export type IndividualEditData = {
  displayName: string;
  values: Pick<IndividualFormValues, "individualDetail" | "beneficialOwners" | "notaryService">;
};

export async function loadIndividualForEdit(
  customerId: string
): Promise<IndividualEditData | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { individualDetail: true, beneficialOwners: true, notaryService: true },
  });
  if (!customer || customer.type !== "PERORANGAN" || !customer.individualDetail) {
    return null;
  }
  const d = customer.individualDetail;
  return {
    displayName: d.namaLengkap,
    values: {
      individualDetail: {
        namaLengkap: d.namaLengkap,
        namaAlias: d.namaAlias ?? "",
        jenisIdentitas: d.jenisIdentitas,
        noIdentitas: d.noIdentitas ?? "",
        npwp: d.npwp ?? "",
        tempatLahir: d.tempatLahir ?? "",
        tanggalLahir: toDateInputValue(d.tanggalLahir),
        kewarganegaraan: d.kewarganegaraan ?? "",
        alamatTempatTinggal: d.alamatTempatTinggal ?? "",
        alamatDomisili: d.alamatDomisili ?? "",
        alamatNegaraAsal: d.alamatNegaraAsal ?? "",
        nomorTeleponRumah: d.nomorTeleponRumah ?? "",
        nomorHp: d.nomorHp ?? "",
        jenisKelamin: d.jenisKelamin,
        statusPernikahan: d.statusPernikahan,
        statusPernikahanLainnya: d.statusPernikahanLainnya ?? "",
        sumberPendapatan: d.sumberPendapatan ?? "",
        sumberPendapatanLainnya: d.sumberPendapatanLainnya ?? "",
        bidangUsaha: d.bidangUsaha ?? "",
        namaKantor: d.namaKantor ?? "",
        alamatKantor: d.alamatKantor ?? "",
        nomorTeleponKantor: d.nomorTeleponKantor ?? "",
        jabatan: d.jabatan ?? "",
        pendapatanRataRata: d.pendapatanRataRata ?? "",
        tujuanTransaksi: d.tujuanTransaksi ?? "",
      },
      beneficialOwners: customer.beneficialOwners.map(mapBeneficialOwner),
      notaryService: {
        namaNotaris: customer.notaryService?.namaNotaris ?? "",
        jasaYangDiberikan: customer.notaryService?.jasaYangDiberikan ?? "",
      },
    },
  };
}

export type CorporateEditData = {
  displayName: string;
  values: Pick<
    CorporateFormValues,
    "corporateDetail" | "beneficialOwners" | "powerOfAttorney" | "notaryService"
  >;
};

export async function loadCorporateForEdit(
  customerId: string
): Promise<CorporateEditData | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      corporateDetail: true,
      beneficialOwners: true,
      powerOfAttorney: true,
      notaryService: true,
    },
  });
  if (!customer || customer.type !== "KORPORASI" || !customer.corporateDetail) {
    return null;
  }
  const d = customer.corporateDetail;
  const poa = customer.powerOfAttorney;
  return {
    displayName: d.namaKorporasi,
    values: {
      corporateDetail: {
        namaKorporasi: d.namaKorporasi,
        bentukKorporasi: d.bentukKorporasi ?? "",
        noSkPengesahan: d.noSkPengesahan ?? "",
        tanggalSkPengesahan: toDateInputValue(d.tanggalSkPengesahan),
        noIjinUsaha: d.noIjinUsaha ?? "",
        tanggalIjinUsaha: toDateInputValue(d.tanggalIjinUsaha),
        npwp: d.npwp ?? "",
        alamatSesuaiAkta: d.alamatSesuaiAkta ?? "",
        alamatLokasiUsaha: d.alamatLokasiUsaha ?? "",
        nomorTelepon: d.nomorTelepon ?? "",
        nomorFaksimili: d.nomorFaksimili ?? "",
        bidangUsaha: d.bidangUsaha ?? "",
        noAktaPendirian: d.noAktaPendirian ?? "",
        sumberDana: d.sumberDana ?? "",
        pendapatanRataRata: d.pendapatanRataRata ?? "",
        tujuanTransaksi: d.tujuanTransaksi ?? "",
      },
      beneficialOwners: customer.beneficialOwners.map(mapBeneficialOwner),
      powerOfAttorney: {
        hubunganHukum: poa?.hubunganHukum ?? "",
        noSuratKuasa: poa?.noSuratKuasa ?? "",
        tanggalSuratKuasa: toDateInputValue(poa?.tanggalSuratKuasa ?? null),
        penandatanganSuratKuasa: poa?.penandatanganSuratKuasa ?? "",
        jabatanPenandatangan: poa?.jabatanPenandatangan ?? "",
        namaLengkapPenggunaJasa: poa?.namaLengkapPenggunaJasa ?? "",
        namaAlias: poa?.namaAlias ?? "",
        jenisIdentitasPenggunaJasa: poa?.jenisIdentitasPenggunaJasa ?? "",
        noIdentitasPenggunaJasa: poa?.noIdentitasPenggunaJasa ?? "",
        tempatLahir: poa?.tempatLahir ?? "",
        tanggalLahir: toDateInputValue(poa?.tanggalLahir ?? null),
        kewarganegaraan: poa?.kewarganegaraan ?? "",
        alamatTempatTinggal: poa?.alamatTempatTinggal ?? "",
      },
      notaryService: {
        namaNotaris: customer.notaryService?.namaNotaris ?? "",
        jasaYangDiberikan: customer.notaryService?.jasaYangDiberikan ?? "",
      },
    },
  };
}

export type LegalArrangementEditData = {
  displayName: string;
  values: Pick<
    LegalArrangementFormValues,
    "legalArrangementDetail" | "beneficialOwners" | "parties" | "notaryService"
  >;
};

export async function loadLegalArrangementForEdit(
  customerId: string
): Promise<LegalArrangementEditData | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      legalArrangementDetail: true,
      beneficialOwners: true,
      legalArrangementParties: true,
      notaryService: true,
    },
  });
  if (
    !customer ||
    customer.type !== "LEGAL_ARRANGEMENT" ||
    !customer.legalArrangementDetail
  ) {
    return null;
  }
  const d = customer.legalArrangementDetail;
  return {
    displayName: d.nama,
    values: {
      legalArrangementDetail: {
        nama: d.nama,
        jenisIdentitas: d.jenisIdentitas ?? "",
        noIdentitas: d.noIdentitas ?? "",
        noSkPengesahan: d.noSkPengesahan ?? "",
        tanggalSkPengesahan: toDateInputValue(d.tanggalSkPengesahan),
        noIjinUsaha: d.noIjinUsaha ?? "",
        tanggalIjinUsaha: toDateInputValue(d.tanggalIjinUsaha),
        npwp: d.npwp ?? "",
        alamat: d.alamat ?? "",
        nomorTelepon: d.nomorTelepon ?? "",
        nomorFaksimili: d.nomorFaksimili ?? "",
        bidangUsaha: d.bidangUsaha ?? "",
        noAktaPendirian: d.noAktaPendirian ?? "",
        sumberDana: d.sumberDana ?? "",
        pendapatanRataRata: d.pendapatanRataRata ?? "",
        tujuanTransaksi: d.tujuanTransaksi ?? "",
      },
      beneficialOwners: customer.beneficialOwners.map(mapBeneficialOwner),
      parties: customer.legalArrangementParties.map((p) => ({
        namaLengkap: p.namaLengkap,
        namaAlias: p.namaAlias ?? "",
        jenisIdentitas: p.jenisIdentitas ?? "",
        noIdentitas: p.noIdentitas ?? "",
        tempatLahir: p.tempatLahir ?? "",
        tanggalLahir: toDateInputValue(p.tanggalLahir),
        kewarganegaraan: p.kewarganegaraan ?? "",
        alamatTempatTinggal: p.alamatTempatTinggal ?? "",
        hubunganHukumPenggunaJasa: p.hubunganHukumPenggunaJasa ?? "",
        noPerjanjian: p.noPerjanjian ?? "",
        tanggalPerjanjian: toDateInputValue(p.tanggalPerjanjian),
        penandatangananPerjanjian: p.penandatangananPerjanjian ?? "",
      })),
      notaryService: {
        namaNotaris: customer.notaryService?.namaNotaris ?? "",
        jasaYangDiberikan: customer.notaryService?.jasaYangDiberikan ?? "",
      },
    },
  };
}
