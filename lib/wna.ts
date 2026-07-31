const DOMESTIC_VALUES = ["indonesia", "wni", "indonesian"];

/** Heuristik sederhana: field "Kewarganegaraan" bertipe teks bebas di reference-data.md,
 * jadi status WNA disimpulkan dari isinya (kosong / "Indonesia" / "WNI" = bukan WNA). */
export function isForeignNational(kewarganegaraan?: string): boolean {
  const v = kewarganegaraan?.trim().toLowerCase();
  if (!v) return false;
  return !DOMESTIC_VALUES.includes(v);
}
