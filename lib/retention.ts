// FR-5 baseline — angka 5 tahun berasal dari komentar profesional Ikatan
// Notaris Indonesia (INI) atas PP No. 43/2015 & Permenkumham No. 9/2017,
// dikutip di PRD-Notary-CDD-Phase2-Improvements.md Bagian 4 (FR-5) &
// Lampiran B sebagai figur yang UMUM DIKUTIP, BUKAN nomor primer yang
// terverifikasi. PRD Bagian 7 secara eksplisit meminta ini dikonfirmasi ke
// notaris/penasihat hukum sebelum dianggap final — ubah di sini kalau sudah
// ada konfirmasi.
export const RETENTION_YEARS = 5;

export function getRetentionReviewDate(createdAt: Date): Date {
  const result = new Date(createdAt);
  result.setFullYear(result.getFullYear() + RETENTION_YEARS);
  return result;
}

export function isPastRetentionReviewDate(createdAt: Date, now: Date): boolean {
  return now >= getRetentionReviewDate(createdAt);
}
