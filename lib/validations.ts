import { z } from "zod";
import {
  JenisIdentitas,
  JenisKelamin,
  StatusPernikahan,
  SumberPendapatan,
  PendapatanRange,
  HubunganHukumPengurus,
  PepAsalNegara,
  PepJabatan,
  PepHubungan,
  JenisIdentitasEdd,
  JenisHighRiskCustomer,
  TujuanTransaksiEdd,
  SumberKekayaanEdd,
  PenghasilanBulananEdd,
} from "@/lib/generated/prisma/enums";

// ------------------------------------------------------------------
// Helper primitives
// ------------------------------------------------------------------

// Input HTML <input type="date"> selalu mengirim "" jika kosong / "YYYY-MM-DD" jika diisi.
// "" tetap valid secara tipe (string), lalu dikonversi ke undefined di lib/actions sebelum ke Prisma.
export const optionalDateString = z
  .string()
  .optional()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), {
    message: "Format tanggal tidak valid",
  });

export const optionalString = z.string().optional();

// Untuk <select> opsional: placeholder mengirim "", diperlakukan setara "belum dipilih".
export function optionalEnum<T extends readonly [string, ...string[]]>(
  values: T
) {
  return z
    .union([z.enum(values), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v));
}

// Untuk radio Ya/Tidak yang belum tentu terjawab (mis. P1/P5 Risk Assessment):
// belum dijawab (undefined) sengaja dibedakan dari jawaban eksplisit "Tidak".
// Nilai "YA"/"TIDAK" dikonversi ke boolean di lib/actions (bukan di sini) agar
// tipe input/output form tetap sama persis — menghindari re-validasi ganda
// terhadap nilai yang sudah ditransformasi (lihat catatan di riskAssessment.ts).
export const optionalYesNo = optionalString;

// Untuk <select> wajib: input type tetap mengizinkan "" (placeholder awal),
// tapi ditolak saat validasi dan output-nya dijamin bukan "".
export function requiredEnum<T extends readonly [string, ...string[]]>(
  values: T,
  message: string
) {
  return z
    .union([z.enum(values), z.literal("")])
    .refine((v): v is T[number] => v !== "", { message })
    .transform((v) => v as T[number]);
}

const jenisIdentitasValues = Object.values(JenisIdentitas) as [
  JenisIdentitas,
  ...JenisIdentitas[]
];
const jenisKelaminValues = Object.values(JenisKelamin) as [
  JenisKelamin,
  ...JenisKelamin[]
];
const statusPernikahanValues = Object.values(StatusPernikahan) as [
  StatusPernikahan,
  ...StatusPernikahan[]
];
const sumberPendapatanValues = Object.values(SumberPendapatan) as [
  SumberPendapatan,
  ...SumberPendapatan[]
];
const pendapatanRangeValues = Object.values(PendapatanRange) as [
  PendapatanRange,
  ...PendapatanRange[]
];
const hubunganHukumPengurusValues = Object.values(HubunganHukumPengurus) as [
  HubunganHukumPengurus,
  ...HubunganHukumPengurus[]
];
const pepAsalNegaraValues = Object.values(PepAsalNegara) as [
  PepAsalNegara,
  ...PepAsalNegara[]
];
const pepJabatanValues = Object.values(PepJabatan) as [
  PepJabatan,
  ...PepJabatan[]
];
const pepHubunganValues = Object.values(PepHubungan) as [
  PepHubungan,
  ...PepHubungan[]
];
const jenisIdentitasEddValues = Object.values(JenisIdentitasEdd) as [
  JenisIdentitasEdd,
  ...JenisIdentitasEdd[]
];
const jenisHighRiskCustomerValues = Object.values(JenisHighRiskCustomer) as [
  JenisHighRiskCustomer,
  ...JenisHighRiskCustomer[]
];
const tujuanTransaksiEddValues = Object.values(TujuanTransaksiEdd) as [
  TujuanTransaksiEdd,
  ...TujuanTransaksiEdd[]
];
const sumberKekayaanEddValues = Object.values(SumberKekayaanEdd) as [
  SumberKekayaanEdd,
  ...SumberKekayaanEdd[]
];
const penghasilanBulananEddValues = Object.values(PenghasilanBulananEdd) as [
  PenghasilanBulananEdd,
  ...PenghasilanBulananEdd[]
];

// ------------------------------------------------------------------
// Beneficial Owner (Section 1.C / 2.C / 3.C — dipakai 3 tipe Customer)
// ------------------------------------------------------------------

export const beneficialOwnerSchema = z.object({
  namaLengkap: z.string().min(1, "Nama Lengkap wajib diisi"), // C1, wajib jika BO diisi
  namaAlias: optionalString, // C2
  jenisIdentitas: optionalEnum(jenisIdentitasValues), // C3
  noIdentitas: optionalString, // C3a
  tempatLahir: optionalString, // C4
  tanggalLahir: optionalDateString, // C4a
  kewarganegaraan: optionalString, // C5
  alamatTempatTinggal: optionalString, // C6
  alamatNegaraAsal: optionalString, // C7, hanya jika WNA
  npwp: optionalString, // C8
  hubunganDenganPenggunaJasa: optionalString, // C9
});

export type BeneficialOwnerInput = z.infer<typeof beneficialOwnerSchema>;

// ------------------------------------------------------------------
// Notary Service (Section 1.E / 2.D / 3.E — identik semua tipe)
// ------------------------------------------------------------------

export const notaryServiceSchema = z.object({
  namaNotaris: optionalString, // E1
  jasaYangDiberikan: optionalString, // E2
});

// ------------------------------------------------------------------
// 1. CDD Korporasi
// ------------------------------------------------------------------

export const corporateDetailSchema = z.object({
  namaKorporasi: z.string().min(1, "Nama Korporasi wajib diisi"), // A1, wajib
  bentukKorporasi: optionalString, // A2
  noSkPengesahan: optionalString, // A3
  tanggalSkPengesahan: optionalDateString, // A3a
  noIjinUsaha: optionalString, // A4
  tanggalIjinUsaha: optionalDateString, // A4a
  npwp: optionalString, // A5
  alamatSesuaiAkta: optionalString, // A6
  alamatLokasiUsaha: optionalString, // A7
  nomorTelepon: optionalString, // A8
  nomorFaksimili: optionalString, // A9
  bidangUsaha: optionalString, // A10 == B2
  noAktaPendirian: optionalString, // A11
  sumberDana: optionalString, // B1
  pendapatanRataRata: optionalString, // B3
  tujuanTransaksi: optionalString, // B4
});

// Section 1.D — Informasi Kuasa Korporasi. Wajib untuk CDD Korporasi
// (bagian ini tidak diberi anotasi "*jika ada*" di reference-data.md,
// berbeda dengan Section C/BO yang eksplisit opsional).
export const powerOfAttorneySchema = z.object({
  hubunganHukum: requiredEnum(
    hubunganHukumPengurusValues,
    "Hubungan Hukum Pengguna Jasa wajib dipilih"
  ), // D1
  noSuratKuasa: optionalString, // D2
  tanggalSuratKuasa: optionalDateString, // D2a
  penandatanganSuratKuasa: optionalString, // D3
  jabatanPenandatangan: optionalString, // D3a
  namaLengkapPenggunaJasa: optionalString, // D4
  namaAlias: optionalString, // D5
  jenisIdentitasPenggunaJasa: optionalEnum(jenisIdentitasValues), // D6
  noIdentitasPenggunaJasa: optionalString, // D6a
  tempatLahir: optionalString, // D7
  tanggalLahir: optionalDateString, // D7a
  kewarganegaraan: optionalString, // D8
  alamatTempatTinggal: optionalString, // D9
});

export const corporateFormSchema = z.object({
  corporateDetail: corporateDetailSchema,
  beneficialOwners: z.array(beneficialOwnerSchema).default([]),
  powerOfAttorney: powerOfAttorneySchema,
  notaryService: notaryServiceSchema,
});

// "Values" = tipe yang dipakai form (react-hook-form defaultValues, boleh berisi "" untuk select kosong).
// "Output" = tipe hasil validasi zod (dikirim ke server action, "" sudah dinormalisasi).
export type CorporateFormValues = z.input<typeof corporateFormSchema>;
export type CorporateFormOutput = z.output<typeof corporateFormSchema>;

// ------------------------------------------------------------------
// 2. CDD Perorangan
// ------------------------------------------------------------------

export const individualDetailSchema = z.object({
  namaLengkap: z.string().min(1, "Nama Lengkap wajib diisi"), // A1, wajib
  namaAlias: optionalString, // A2
  jenisIdentitas: requiredEnum(
    jenisIdentitasValues,
    "Jenis Identitas wajib dipilih"
  ), // A3
  noIdentitas: optionalString, // A3a
  npwp: optionalString, // A4
  tempatLahir: optionalString, // A5
  tanggalLahir: optionalDateString, // A5a
  kewarganegaraan: optionalString, // A6
  alamatTempatTinggal: optionalString, // A7
  alamatDomisili: optionalString, // A8
  alamatNegaraAsal: optionalString, // A9, hanya jika WNA
  nomorTeleponRumah: optionalString, // A10
  nomorHp: optionalString, // A10a
  jenisKelamin: requiredEnum(
    jenisKelaminValues,
    "Jenis Kelamin wajib dipilih"
  ), // A11
  statusPernikahan: requiredEnum(
    statusPernikahanValues,
    "Status Pernikahan wajib dipilih"
  ), // A12
  statusPernikahanLainnya: optionalString, // A12, isi jika Lainnya
  sumberPendapatan: optionalEnum(sumberPendapatanValues), // B1
  sumberPendapatanLainnya: optionalString, // B1, isi jika Lainnya
  bidangUsaha: optionalString, // B2
  namaKantor: optionalString, // B3
  alamatKantor: optionalString, // B3a
  nomorTeleponKantor: optionalString, // B3b
  jabatan: optionalString, // B3c
  pendapatanRataRata: optionalEnum(pendapatanRangeValues), // B4
  tujuanTransaksi: optionalString, // B5
});

export const individualFormSchema = z.object({
  individualDetail: individualDetailSchema,
  beneficialOwners: z.array(beneficialOwnerSchema).default([]),
  notaryService: notaryServiceSchema,
});

export type IndividualFormValues = z.input<typeof individualFormSchema>;
export type IndividualFormOutput = z.output<typeof individualFormSchema>;

// ------------------------------------------------------------------
// 3. CDD Perikatan Lainnya (Legal Arrangement)
// ------------------------------------------------------------------

export const legalArrangementDetailSchema = z.object({
  nama: z.string().min(1, "Nama wajib diisi"), // A1
  jenisIdentitas: optionalEnum(jenisIdentitasValues), // A2
  noIdentitas: optionalString, // A2a
  noSkPengesahan: optionalString, // A3
  tanggalSkPengesahan: optionalDateString, // A3a
  noIjinUsaha: optionalString, // A4
  tanggalIjinUsaha: optionalDateString, // A4a
  npwp: optionalString, // A5
  alamat: optionalString, // A6
  nomorTelepon: optionalString, // A7
  nomorFaksimili: optionalString, // A8
  bidangUsaha: optionalString, // A9 == B2
  noAktaPendirian: optionalString, // A10
  sumberDana: optionalString, // B1
  pendapatanRataRata: optionalString, // B3
  tujuanTransaksi: optionalString, // B4
});

// Section 3.C.C9 — quick-select peran (mengisi field teks hubunganDenganPenggunaJasa yang sama)
export const legalArrangementBoRoleValues = [
  "Pemilik Manfaat",
  "Penerima Manfaat",
  "Pengelola Harta Kekayaan",
  "Penjamin",
] as const;

// Section 3.D — Informasi Pihak dalam Legal Arrangement
export const legalArrangementPartySchema = z.object({
  namaLengkap: z.string().min(1, "Nama Lengkap wajib diisi"), // D1
  namaAlias: optionalString, // D2
  jenisIdentitas: optionalEnum(jenisIdentitasValues), // D3
  noIdentitas: optionalString, // D3a
  tempatLahir: optionalString, // D4
  tanggalLahir: optionalDateString, // D4a
  kewarganegaraan: optionalString, // D5
  alamatTempatTinggal: optionalString, // D6
  hubunganHukumPenggunaJasa: optionalString, // D7
  noPerjanjian: optionalString, // D8
  tanggalPerjanjian: optionalDateString, // D8a
  penandatangananPerjanjian: optionalString, // D9
});

export const legalArrangementFormSchema = z.object({
  legalArrangementDetail: legalArrangementDetailSchema,
  beneficialOwners: z.array(beneficialOwnerSchema).default([]),
  parties: z.array(legalArrangementPartySchema).default([]),
  notaryService: notaryServiceSchema,
});

export type LegalArrangementFormValues = z.input<
  typeof legalArrangementFormSchema
>;
export type LegalArrangementFormOutput = z.output<
  typeof legalArrangementFormSchema
>;

// ------------------------------------------------------------------
// 4/5/6. Risk Assessment — PEP + Skoring
// ------------------------------------------------------------------

export const riskAssessmentSchema = z.object({
  // -- Section 4: Analisa PEP --
  isPep: optionalYesNo, // P1
  namaLengkapPep: optionalString, // P2, isi jika P1 = Ya
  pepAsalNegara: optionalEnum(pepAsalNegaraValues), // P3
  wargaNegaraPep: optionalString, // P4
  adaBeritaNegatif: optionalYesNo, // P5
  jabatanPep: optionalEnum(pepJabatanValues), // P6
  hubunganDenganPep: optionalEnum(pepHubunganValues), // P7
  // -- Section 5/6: FK ke 5 tabel referensi skor --
  userProfileScoreId: optionalString,
  businessSectorScoreId: optionalString,
  regionScoreId: optionalString,
  countryScoreId: optionalString,
  notaryServiceTypeScoreId: optionalString,
});

export type RiskAssessmentValues = z.input<typeof riskAssessmentSchema>;
export type RiskAssessmentOutput = z.output<typeof riskAssessmentSchema>;

// ------------------------------------------------------------------
// 7.A Informasi Tambahan — Berisiko Tinggi (EDD Perorangan)
// ------------------------------------------------------------------

export const highRiskAdditionalInfoSchema = z.object({
  namaLengkap: optionalString, // H1
  jenisIdentitas: optionalEnum(jenisIdentitasEddValues), // H2
  nomorIdentitas: optionalString, // H3
  tempatLahir: optionalString, // H4
  tanggalLahir: optionalDateString, // H4
  alamatSesuaiIdentitas: optionalString, // H5
  jenisHighRiskCustomer: optionalEnum(jenisHighRiskCustomerValues), // H6
  metodePembayaran: optionalString, // H7
  tujuanTransaksi: optionalEnum(tujuanTransaksiEddValues), // H8
  tujuanTransaksiLainnya: optionalString, // H8, isi jika Lain-lain
  sumberKekayaan: optionalEnum(sumberKekayaanEddValues), // H9
  sumberKekayaanLainnya: optionalString, // H9, isi jika Lain-lain
  namaPerusahaanTempatBekerja: optionalString, // H10
  jumlahPenghasilanPerBulan: optionalEnum(penghasilanBulananEddValues), // H11
});

export type HighRiskAdditionalInfoValues = z.input<
  typeof highRiskAdditionalInfoSchema
>;
export type HighRiskAdditionalInfoOutput = z.output<
  typeof highRiskAdditionalInfoSchema
>;
