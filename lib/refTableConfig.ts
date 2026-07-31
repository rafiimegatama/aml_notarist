export const REF_TABLE_KEYS = [
  "userProfile",
  "businessSector",
  "region",
  "country",
  "notaryServiceType",
] as const;

export type RefTableKey = (typeof REF_TABLE_KEYS)[number];

export const REF_TABLE_CONFIG: Record<
  RefTableKey,
  { label: string; scoreRequired: boolean; note?: string }
> = {
  userProfile: {
    label: "Tabel A — Profil Pengguna Jasa dan/atau BO",
    scoreRequired: true,
  },
  businessSector: {
    label: "Tabel B — Profil Bisnis Pengguna Jasa dan/atau BO",
    scoreRequired: false,
    note:
      "BELUM ADA DATA RESMI — lengkapi kategori dan skor di sini sebelum Total Nilai risiko dianggap final. Lihat reference-data.md bagian 9.",
  },
  region: {
    label: "Tabel C — Profil Wilayah Pengguna Jasa dan/atau BO",
    scoreRequired: true,
  },
  country: {
    label: "Tabel D — Profil Negara Asal Pengguna Jasa dan/atau BO",
    scoreRequired: true,
  },
  notaryServiceType: {
    label: "Tabel E — Profil Jasa yang Diberikan oleh Notaris",
    scoreRequired: true,
  },
};
