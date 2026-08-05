"use server";

import { prisma } from "@/lib/prisma";
import { CustomerType } from "@/lib/generated/prisma/enums";
import type { CustomerStatus, JenisIdentitas } from "@/lib/generated/prisma/enums";
import { normalizePhone, normalizeIdValue } from "@/lib/dedup";
import type {
  IndividualFormValues,
  CorporateFormValues,
  LegalArrangementFormValues,
  BeneficialOwnerFormValues,
  NotaryServiceFormValues,
} from "@/lib/validations";

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ------------------------------------------------------------------
// FR-9 (evolved) — pencarian klien lama by No. HP/Telepon atau No.
// Identitas/NPWP, dipanggil dari langkah "CDD Baru" supaya notaris bisa
// memilih prefill dari data yang sudah ada alih-alih mengetik ulang untuk
// klien yang sama. Best-effort: dua nomor yang "mestinya sama" tapi ditulis
// beda format (mis. "0812..." vs "+62812...") tetap harus ditemukan, tapi
// hasil akhirnya tetap daftar kandidat untuk notaris pilih sendiri, bukan
// penggabungan otomatis — false positive nama kembar tetap mungkin.
// ------------------------------------------------------------------

export type DuplicateCandidate = {
  customerId: string;
  type: CustomerType;
  displayName: string;
  matchedOn: string;
  status: CustomerStatus;
  label: string; // "<nama> (CDD sebelumnya: <tanggal>)" — siap tampil & siap dipakai sbg activity log note
};

export async function findPotentialDuplicates(
  rawQuery: string
): Promise<DuplicateCandidate[]> {
  const idKey = normalizeIdValue(rawQuery);
  const phoneKey = normalizePhone(rawQuery);
  if (idKey.length < 4 && phoneKey.length < 6) return [];

  const [individuals, corporates, arrangements] = await Promise.all([
    prisma.individualDetail.findMany({
      where: {
        OR: [
          idKey.length >= 4 ? { noIdentitas: { not: null } } : undefined,
          phoneKey.length >= 6 ? { nomorHp: { not: null } } : undefined,
        ].filter((c): c is NonNullable<typeof c> => c !== undefined),
      },
      select: {
        customerId: true,
        namaLengkap: true,
        noIdentitas: true,
        nomorHp: true,
        customer: { select: { createdAt: true, status: true } },
      },
    }),
    prisma.corporateDetail.findMany({
      where: {
        OR: [
          idKey.length >= 4 ? { npwp: { not: null } } : undefined,
          phoneKey.length >= 6 ? { nomorTelepon: { not: null } } : undefined,
        ].filter((c): c is NonNullable<typeof c> => c !== undefined),
      },
      select: {
        customerId: true,
        namaKorporasi: true,
        npwp: true,
        nomorTelepon: true,
        customer: { select: { createdAt: true, status: true } },
      },
    }),
    prisma.legalArrangementDetail.findMany({
      where: {
        OR: [
          idKey.length >= 4 ? { noIdentitas: { not: null } } : undefined,
          idKey.length >= 4 ? { npwp: { not: null } } : undefined,
          phoneKey.length >= 6 ? { nomorTelepon: { not: null } } : undefined,
        ].filter((c): c is NonNullable<typeof c> => c !== undefined),
      },
      select: {
        customerId: true,
        nama: true,
        noIdentitas: true,
        npwp: true,
        nomorTelepon: true,
        customer: { select: { createdAt: true, status: true } },
      },
    }),
  ]);

  const results: DuplicateCandidate[] = [];

  function push(
    customerId: string,
    type: CustomerType,
    displayName: string,
    matchedOn: string,
    createdAt: Date,
    status: CustomerStatus
  ) {
    results.push({
      customerId,
      type,
      displayName,
      matchedOn,
      status,
      label: `${displayName} (CDD sebelumnya: ${formatShortDate(createdAt)})`,
    });
  }

  for (const ind of individuals) {
    if (idKey.length >= 4 && ind.noIdentitas && normalizeIdValue(ind.noIdentitas) === idKey) {
      push(ind.customerId, "PERORANGAN", ind.namaLengkap, "No. Identitas", ind.customer.createdAt, ind.customer.status);
    } else if (phoneKey.length >= 6 && ind.nomorHp && normalizePhone(ind.nomorHp) === phoneKey) {
      push(ind.customerId, "PERORANGAN", ind.namaLengkap, "No. HP", ind.customer.createdAt, ind.customer.status);
    }
  }

  for (const corp of corporates) {
    if (idKey.length >= 4 && corp.npwp && normalizeIdValue(corp.npwp) === idKey) {
      push(corp.customerId, "KORPORASI", corp.namaKorporasi, "NPWP", corp.customer.createdAt, corp.customer.status);
    } else if (phoneKey.length >= 6 && corp.nomorTelepon && normalizePhone(corp.nomorTelepon) === phoneKey) {
      push(corp.customerId, "KORPORASI", corp.namaKorporasi, "No. Telepon", corp.customer.createdAt, corp.customer.status);
    }
  }

  for (const la of arrangements) {
    if (idKey.length >= 4 && la.noIdentitas && normalizeIdValue(la.noIdentitas) === idKey) {
      push(la.customerId, "LEGAL_ARRANGEMENT", la.nama, "No. Identitas", la.customer.createdAt, la.customer.status);
    } else if (idKey.length >= 4 && la.npwp && normalizeIdValue(la.npwp) === idKey) {
      push(la.customerId, "LEGAL_ARRANGEMENT", la.nama, "NPWP", la.customer.createdAt, la.customer.status);
    } else if (phoneKey.length >= 6 && la.nomorTelepon && normalizePhone(la.nomorTelepon) === phoneKey) {
      push(la.customerId, "LEGAL_ARRANGEMENT", la.nama, "No. Telepon", la.customer.createdAt, la.customer.status);
    }
  }

  results.sort((a, b) => (a.label < b.label ? 1 : -1));
  return results;
}

// ------------------------------------------------------------------
// Loader per tipe — dipanggil dari halaman "CDD Baru/<tipe>" saat ada
// ?prefillFromCustomerId=..., mengikuti pola loadDraftDocument (document.ts):
// gagal diam-diam ke null (bukan error) kalau id tidak ada/tipe tidak
// cocok — form kosong lebih aman daripada memblokir notaris.
// ------------------------------------------------------------------

export type IndividualPrefill = {
  sourceLabel: string;
  values: Pick<IndividualFormValues, "individualDetail" | "beneficialOwners" | "notaryService">;
};

export async function loadIndividualPrefill(
  customerId: string
): Promise<IndividualPrefill | null> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { individualDetail: true, beneficialOwners: true, notaryService: true },
  });
  if (!customer || customer.type !== "PERORANGAN" || !customer.individualDetail) {
    return null;
  }
  const d = customer.individualDetail;
  const individualDetail: IndividualFormValues["individualDetail"] = {
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
  };
  return {
    sourceLabel: `${d.namaLengkap} (CDD sebelumnya: ${formatShortDate(customer.createdAt)})`,
    values: {
      individualDetail,
      beneficialOwners: customer.beneficialOwners.map(mapBeneficialOwner),
      notaryService: mapNotaryService(customer.notaryService),
    },
  };
}

export type CorporatePrefill = {
  sourceLabel: string;
  values: Pick<
    CorporateFormValues,
    "corporateDetail" | "beneficialOwners" | "powerOfAttorney" | "notaryService"
  >;
};

export async function loadCorporatePrefill(
  customerId: string
): Promise<CorporatePrefill | null> {
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
    sourceLabel: `${d.namaKorporasi} (CDD sebelumnya: ${formatShortDate(customer.createdAt)})`,
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
      notaryService: mapNotaryService(customer.notaryService),
    },
  };
}

export type LegalArrangementPrefill = {
  sourceLabel: string;
  values: Pick<
    LegalArrangementFormValues,
    "legalArrangementDetail" | "beneficialOwners" | "parties" | "notaryService"
  >;
};

export async function loadLegalArrangementPrefill(
  customerId: string
): Promise<LegalArrangementPrefill | null> {
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
    sourceLabel: `${d.nama} (CDD sebelumnya: ${formatShortDate(customer.createdAt)})`,
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
      notaryService: mapNotaryService(customer.notaryService),
    },
  };
}

function mapBeneficialOwner(bo: {
  namaLengkap: string;
  namaAlias: string | null;
  jenisIdentitas: JenisIdentitas | null;
  noIdentitas: string | null;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  kewarganegaraan: string | null;
  alamatTempatTinggal: string | null;
  alamatNegaraAsal: string | null;
  npwp: string | null;
  hubunganDenganPenggunaJasa: string | null;
}): BeneficialOwnerFormValues {
  return {
    namaLengkap: bo.namaLengkap,
    namaAlias: bo.namaAlias ?? "",
    jenisIdentitas: bo.jenisIdentitas ?? "",
    noIdentitas: bo.noIdentitas ?? "",
    tempatLahir: bo.tempatLahir ?? "",
    tanggalLahir: toDateInputValue(bo.tanggalLahir),
    kewarganegaraan: bo.kewarganegaraan ?? "",
    alamatTempatTinggal: bo.alamatTempatTinggal ?? "",
    alamatNegaraAsal: bo.alamatNegaraAsal ?? "",
    npwp: bo.npwp ?? "",
    hubunganDenganPenggunaJasa: bo.hubunganDenganPenggunaJasa ?? "",
  };
}

// jasaYangDiberikan sengaja TIDAK dibawa dari CDD lama — deskripsi jasa
// melekat ke transaksi/engagement baru ini, bukan ke profil klien.
// namaNotaris dibawa karena biasanya notaris yang sama menangani klien ini.
function mapNotaryService(
  service: { namaNotaris: string | null } | null
): NotaryServiceFormValues {
  return {
    namaNotaris: service?.namaNotaris ?? "",
    jasaYangDiberikan: "",
  };
}
