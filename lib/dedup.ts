// FR-9 (evolved) — deteksi klien lama lewat No. HP/Telepon atau No.
// Identitas/NPWP, supaya notaris tidak mengetik ulang data klien yang sudah
// pernah terdaftar. Dua strategi normalisasi berbeda karena bentuk datanya
// beda:
//  - Nomor telepon: notaris/klien bisa menulis "0812...", "+62812...", atau
//    "62812..." untuk nomor yang sama — semua diringkas ke digit inti tanpa
//    awalan negara/trunk supaya ketiganya cocok satu sama lain.
//  - No. Identitas/NPWP: NIK cuma digit, NPWP lazim ditulis/OCR-terbaca
//    dengan format titik+strip ("01.234.567.8-901.000"), dan No. Identitas
//    juga bisa diisi nomor paspor (alfanumerik) — jadi spasi, strip, DAN
//    titik dibuang (paspor Indonesia tidak memakai titik), huruf disamakan
//    besar-kecilnya, tapi tidak di-strip jadi digit saja supaya paspor
//    alfanumerik tetap kebaca.

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/^62/, "").replace(/^0/, "");
}

export function normalizeIdValue(raw: string): string {
  return raw.replace(/[\s.-]/g, "").toUpperCase();
}
