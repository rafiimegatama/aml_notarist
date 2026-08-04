// FR-7 — PMPJ (Prinsip Mengenali Pengguna Jasa) adalah kewajiban PEMANTAUAN
// berkelanjutan, bukan formulir sekali isi. Interval untuk kategori risiko
// TINGGI (setahun sekali) disebutkan eksplisit sebagai contoh di
// PRD-Notary-CDD-Phase2-Improvements.md Bagian 5 (FR-7) — dianggap cukup
// terkonfirmasi, tapi tetap dijadikan konstanta agar mudah disesuaikan.
export const REVIEW_INTERVAL_YEARS_HIGH_RISK = 1;

// FR-7 — PRD TIDAK menyebutkan angka untuk kategori SEDANG/RENDAH/belum
// dinilai. Ini ASUMSI penulis, bukan angka resmi — konfirmasi ke
// notaris/penasihat hukum sebelum dianggap final, sama seperti
// RETENTION_YEARS di lib/retention.ts.
export const REVIEW_INTERVAL_YEARS_DEFAULT = 3;

export function getNextReviewDue(
  anchorDate: Date,
  riskCategory: "RENDAH" | "SEDANG" | "TINGGI" | null
): Date {
  const intervalYears: number =
    riskCategory === "TINGGI"
      ? REVIEW_INTERVAL_YEARS_HIGH_RISK
      : REVIEW_INTERVAL_YEARS_DEFAULT;
  const result = new Date(anchorDate);
  result.setFullYear(result.getFullYear() + intervalYears);
  return result;
}

export function isReviewOverdue(
  anchorDate: Date,
  riskCategory: "RENDAH" | "SEDANG" | "TINGGI" | null,
  now: Date
): boolean {
  return now >= getNextReviewDue(anchorDate, riskCategory);
}
