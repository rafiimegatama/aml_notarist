import {
  CustomerType,
  CustomerStatus,
  JenisIdentitas,
  JenisKelamin,
  StatusPernikahan,
  SumberPendapatan,
  PendapatanRange,
  HubunganHukumPengurus,
  PepAsalNegara,
  PepJabatan,
  PepHubungan,
  RiskCategory,
  JenisIdentitasEdd,
  JenisHighRiskCustomer,
  TujuanTransaksiEdd,
  SumberKekayaanEdd,
  PenghasilanBulananEdd,
} from "@/lib/generated/prisma/enums";

export const customerTypeLabels: Record<CustomerType, string> = {
  KORPORASI: "Korporasi",
  PERORANGAN: "Perorangan",
  LEGAL_ARRANGEMENT: "Perikatan Lainnya",
};

export const customerStatusLabels: Record<CustomerStatus, string> = {
  DRAFT: "Draft",
  COMPLETE: "Lengkap",
};

export const jenisIdentitasLabels: Record<JenisIdentitas, string> = {
  KTP: "KTP",
  PASPOR: "Paspor",
  SIM: "SIM",
};

export const jenisKelaminLabels: Record<JenisKelamin, string> = {
  LAKI_LAKI: "Laki-Laki",
  PEREMPUAN: "Perempuan",
};

export const statusPernikahanLabels: Record<StatusPernikahan, string> = {
  BELUM_MENIKAH: "Belum Menikah",
  MENIKAH: "Menikah",
  LAINNYA: "Lainnya",
};

export const sumberPendapatanLabels: Record<SumberPendapatan, string> = {
  PEKERJAAN: "Pekerjaan (Gaji, Bonus, Pensiun, Saham)",
  PROFESI: "Profesi (Pengacara, Dokter, Akuntan, dll)",
  KEPEMILIKAN_USAHA: "Kepemilikan Usaha",
  LAINNYA: "Lainnya",
};

export const pendapatanRangeLabels: Record<PendapatanRange, string> = {
  SD_12_JUTA: "≤ Rp12.000.000",
  DI_ATAS_12_JUTA_SD_120_JUTA: "> Rp12.000.000 – Rp120.000.000",
  DI_ATAS_120_JUTA_SD_1_2_MILIAR: "> Rp120.000.000 – Rp1.200.000.000",
  DI_ATAS_1_2_MILIAR: "> Rp1.200.000.000",
};

export const hubunganHukumPengurusLabels: Record<
  HubunganHukumPengurus,
  string
> = {
  DIREKTUR_UTAMA: "Direktur Utama",
  DIREKTUR: "Direktur",
  PEMEGANG_SAHAM: "Pemegang Saham",
  KOMISARIS_UTAMA: "Komisaris Utama",
  KOMISARIS: "Komisaris",
  LAINNYA: "Lainnya",
};

export const pepAsalNegaraLabels: Record<PepAsalNegara, string> = {
  LOKAL: "Lokal",
  ASING: "Asing",
};

export const pepJabatanLabels: Record<PepJabatan, string> = {
  EKSEKUTIF: "Eksekutif",
  YUDIKATIF: "Yudikatif",
  LEGISLATIF: "Legislatif",
  NEGARA_ATAU_YURISDIKSI_ASING: "Negara asing atau yurisdiksi asing",
  ORGANISASI_INTERNASIONAL: "Organisasi internasional",
};

export const pepHubunganLabels: Record<PepHubungan, string> = {
  KLIEN_SENDIRI: "Klien sendiri",
  ANGGOTA_KELUARGA_DERAJAT_KEDUA: "Anggota keluarga sampai derajat kedua",
  PIHAK_TERKAIT_ATAU_CLOSE_ASSOCIATE:
    "Pihak terkait atau Close Associate dari PEP",
};

export const riskCategoryLabels: Record<RiskCategory, string> = {
  RENDAH: "Rendah",
  SEDANG: "Sedang",
  TINGGI: "Tinggi",
};

export const jenisIdentitasEddLabels: Record<JenisIdentitasEdd, string> = {
  KTP: "KTP",
  SIM: "SIM",
  PASPOR: "Paspor",
  KITAS: "KITAS",
};

export const jenisHighRiskCustomerLabels: Record<
  JenisHighRiskCustomer,
  string
> = {
  PEP: "PEP",
  PIHAK_TERKAIT_PEP: "Pihak Terkait PEP",
  TRANSAKSI_NEGARA_HIGH_RISK: "Transaksi Negara High Risk",
  BERDASAR_PENILAIAN_RISIKO: "Berdasar Penilaian Risiko",
};

export const tujuanTransaksiEddLabels: Record<TujuanTransaksiEdd, string> = {
  DIGUNAKAN_SENDIRI: "Digunakan Sendiri",
  LAIN_LAIN: "Lain-lain",
};

export const sumberKekayaanEddLabels: Record<SumberKekayaanEdd, string> = {
  GAJI_UPAH: "Gaji/Upah",
  LAIN_LAIN: "Lain-lain",
};

export const penghasilanBulananEddLabels: Record<
  PenghasilanBulananEdd,
  string
> = {
  RANGE_3_25_JUTA: "Rp3.000.000 – Rp25.000.000",
  RANGE_25_50_JUTA: "Rp25.000.000 – Rp50.000.000",
  RANGE_50_100_JUTA: "Rp50.000.000 – Rp100.000.000",
  DI_ATAS_100_JUTA: "≥ Rp100.000.000",
};

export function labelOptions<T extends string>(
  labels: Record<T, string>
): { value: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }));
}
