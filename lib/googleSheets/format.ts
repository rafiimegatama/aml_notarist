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

// Karakter yang membuat Google Sheets menafsirkan sel sebagai formula —
// baris ditulis via valueInputOption=USER_ENTERED (lib/googleSheets/client.ts),
// jadi nilai apa pun yang diawali salah satu ini AKAN dieksekusi sebagai
// formula saat sheet dibuka, bukan cuma teks. Field CDD bebas-teks (nama,
// alamat, catatan, dll.) diisi notaris atau berasal dari saran OCR, jadi
// tidak bisa diasumsikan aman. Sama seperti csvField() di lib/ltkmCsv.ts.
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@"];

export function fmtStr(value: string | null | undefined): string {
  const str = value ?? "";
  return str && FORMULA_TRIGGER_CHARS.includes(str[0]) ? `'${str}` : str;
}

export function fmtInt(value: number | null | undefined): string {
  return value != null ? String(value) : "";
}

export function fmtTriBool(value: boolean | null | undefined): string {
  if (value === true) return "Ya";
  if (value === false) return "Tidak";
  return "";
}
