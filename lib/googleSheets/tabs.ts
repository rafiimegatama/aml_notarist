// Nama tab (sheet) tambahan untuk mirror relasional CDD ke Google Sheets.
// Tab spine (rollup per Customer) TETAP pakai GOOGLE_SHEETS_SHEET_NAME dari
// .env (default tab yang sudah ada) — lihat lib/actions/sheetsExport.ts.
// Tab-tab di bawah ini murni tambahan baru (Fase 2-4), namanya tetap/hardcode
// karena ini bagian dari desain skema, bukan konfigurasi per-instalasi.

export const TAB_CDD_PERORANGAN = "CDD_Perorangan";
export const TAB_CDD_KORPORASI = "CDD_Korporasi";
export const TAB_CDD_PERIKATAN_LAINNYA = "CDD_PerikatanLainnya";
export const TAB_BENEFICIAL_OWNERS = "BeneficialOwners";
export const TAB_KUASA_KORPORASI = "KuasaKorporasi";
export const TAB_PIHAK_PERIKATAN = "PihakPerikatan";
export const TAB_RISK_ASSESSMENT = "RiskAssessment";
export const TAB_EDD_BERISIKO_TINGGI = "EDD_BerisikoTinggi";
export const TAB_ACTIVITY_LOG = "ActivityLog";
export const TAB_REFERENSI_SKOR = "Referensi_Skor";

export const ALL_DETAIL_TABS = [
  TAB_CDD_PERORANGAN,
  TAB_CDD_KORPORASI,
  TAB_CDD_PERIKATAN_LAINNYA,
  TAB_BENEFICIAL_OWNERS,
  TAB_KUASA_KORPORASI,
  TAB_PIHAK_PERIKATAN,
  TAB_RISK_ASSESSMENT,
  TAB_EDD_BERISIKO_TINGGI,
  TAB_ACTIVITY_LOG,
  TAB_REFERENSI_SKOR,
] as const;
