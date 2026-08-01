import type { FieldGuesses } from "@/lib/ocr/extractFields";

// Menggabungkan hasil tebakan OCR (dot-path -> nilai) ke object defaultValues
// bersarang milik react-hook-form. Hanya mengisi path yang di form aslinya
// masih kosong ("" / undefined) — tidak pernah menimpa default eksplisit.
export function applyFieldGuesses<T extends Record<string, unknown>>(
  base: T,
  guesses: FieldGuesses
): T {
  const result = structuredClone(base);
  for (const [path, value] of Object.entries(guesses)) {
    const keys = path.split(".");
    let obj: Record<string, unknown> = result;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (typeof obj[key] !== "object" || obj[key] === null) {
        obj[key] = {};
      }
      obj = obj[key] as Record<string, unknown>;
    }
    const lastKey = keys[keys.length - 1];
    if (obj[lastKey] === "" || obj[lastKey] === undefined) {
      obj[lastKey] = value;
    }
  }
  return result;
}
