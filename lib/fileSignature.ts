/**
 * Verifikasi magic bytes file terhadap MIME type yang diklaim — `file.type`
 * dari browser/FormData bisa dipalsukan (nama/ekstensi/Content-Type
 * ditentukan client), jadi tidak bisa jadi satu-satunya penjaga sebelum
 * konten disimpan. X-Content-Type-Options: nosniff (next.config.ts) sudah
 * mencegah browser salah men-sniff konten saat file dibaca balik, tapi
 * pengecekan di sini mencegah konten yang tidak cocok tersimpan sama sekali
 * — defense-in-depth, bukan pengganti allowlist MIME yang sudah ada di
 * uploadAndExtractDocument (lib/actions/document.ts) / uploadHeroImage
 * (lib/actions/heroSettings.ts).
 */
const SIGNATURE_CHECKS: Record<string, (buf: Buffer) => boolean> = {
  "image/jpeg": (buf) => buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff,
  "image/png": (buf) =>
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a,
  "image/webp": (buf) =>
    buf.length >= 12 &&
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP",
};

export function matchesFileSignature(mimeType: string, buffer: Buffer): boolean {
  const check = SIGNATURE_CHECKS[mimeType];
  return check ? check(buffer) : false;
}
