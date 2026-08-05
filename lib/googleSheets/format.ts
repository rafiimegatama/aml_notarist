// Helper format nilai untuk baris Google Sheet. ISO 8601 dipakai untuk
// tanggal (bukan format panjang Indonesia) supaya sort/filter/QUERY di
// Sheets tetap mengenali kolom sebagai tanggal asli, bukan teks.

export function fmtDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function fmtDateTime(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString();
}

export function fmtStr(value: string | null | undefined): string {
  return value ?? "";
}

export function fmtInt(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

export function fmtTriBool(value: boolean | null | undefined): string {
  if (value === true) return "Ya";
  if (value === false) return "Tidak";
  return "";
}
