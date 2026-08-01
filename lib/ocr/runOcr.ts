import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createWorker } from "tesseract.js";

// Cache lokal untuk trained data bahasa (ind+eng) — didownload sekali dari
// jsdelivr CDN saat pertama kali dipakai, lalu disimpan di sini dan dipakai
// ulang tanpa perlu internet lagi. Direktori HARUS sudah ada sebelum worker
// dibuat — tesseract.js gagal menyimpan cache secara diam-diam (tidak throw)
// kalau direktori belum ada, sehingga akan mendownload ulang setiap kali.
const OCR_CACHE_DIR = path.join(process.cwd(), "storage", "ocr-cache");

export async function extractTextFromImage(filePath: string): Promise<string> {
  await mkdir(OCR_CACHE_DIR, { recursive: true });

  const worker = await createWorker("ind+eng", 1, {
    cachePath: OCR_CACHE_DIR,
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(filePath);
    return text;
  } finally {
    await worker.terminate();
  }
}
