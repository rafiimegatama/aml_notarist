import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createWorker } from "tesseract.js";

// Cache lokal untuk trained data bahasa (ind+eng) — didownload sekali dari
// jsdelivr CDN saat pertama kali dipakai, lalu disimpan di sini dan dipakai
// ulang tanpa perlu internet lagi. Direktori HARUS sudah ada sebelum worker
// dibuat — tesseract.js gagal menyimpan cache secara diam-diam (tidak throw)
// kalau direktori belum ada, sehingga akan mendownload ulang setiap kali.
const OCR_CACHE_DIR = path.join(process.cwd(), "storage", "ocr-cache");

export type OcrWord = {
  text: string;
  confidence: number; // 0-100, dari Tesseract.js data.words[].confidence
  bbox: { x0: number; y0: number; x1: number; y1: number };
};

export type OcrResult = { text: string; words: OcrWord[] };

// FR-3 (Should) — sebelumnya hanya `text` gabungan yang disimpan, confidence
// per-word dari Tesseract dibuang. Di-capture di sini supaya extractFields.ts
// bisa memetakannya balik ke tiap field guess (lihat mapWordsToGuess).
//
// Menerima Buffer (bukan filePath) sejak Phase 3 (enkripsi PII saat
// rest) — file di storage/uploads/ sekarang selalu berupa ciphertext, jadi
// OCR dijalankan di memori dari buffer plaintext hasil upload SEBELUM
// dienkripsi & ditulis ke disk (lihat uploadAndExtractDocument). Plaintext
// gambar tidak pernah menyentuh disk sama sekali.
export async function extractTextFromImage(image: Buffer): Promise<OcrResult> {
  await mkdir(OCR_CACHE_DIR, { recursive: true });

  const worker = await createWorker("ind+eng", 1, {
    cachePath: OCR_CACHE_DIR,
  });
  try {
    // { blocks: true } wajib diminta eksplisit — data.words tidak ada di root
    // Page, hanya di data.blocks[].paragraphs[].lines[].words[], dan blocks
    // itu sendiri false secara default (lihat defaultOutput.js tesseract.js).
    const {
      data: { text, blocks },
    } = await worker.recognize(image, {}, { blocks: true });

    const words: OcrWord[] = [];
    for (const block of blocks ?? []) {
      for (const paragraph of block.paragraphs) {
        for (const line of paragraph.lines) {
          for (const word of line.words) {
            words.push({
              text: word.text,
              confidence: word.confidence,
              bbox: word.bbox,
            });
          }
        }
      }
    }

    return { text, words };
  } finally {
    await worker.terminate();
  }
}
