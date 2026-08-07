import { CustomerType } from "@/lib/generated/prisma/enums";
import type { OcrWord } from "@/lib/ocr/runOcr";
import { isValidNpwpFormat } from "@/lib/validations";

export type Bbox = { x0: number; y0: number; x1: number; y1: number };

// FR-3 (Should) — confidence & bbox null kalau tidak ada word Tesseract yang
// bisa dicocokkan ke rentang karakter guess ini (lihat mapWordsToRange).
// `source` — "ocr" (Tesseract, default) atau "ai" (second opinion dari
// lib/ocr/aiVisionAssist.ts, dipakai buat badge tiga-state di fields.tsx).
// AI-sourced guess selalu bbox:null (vision model tidak mengembalikan
// bounding box per-word seperti Tesseract, jadi cuplikan gambar tidak
// tersedia untuk guess ini — lihat guard di OcrCroppedSnippet.tsx).
export type FieldGuess = {
  value: string;
  confidence: number | null;
  bbox: Bbox | null;
  source: "ocr" | "ai";
};
export type FieldGuesses = Record<string, FieldGuess>;

// Peta label -> path field (dot-path react-hook-form) per tipe CDD.
// HANYA berisi field bertipe teks bebas (bukan dropdown/enum, bukan tanggal,
// bukan array Beneficial Owner/Pihak) — field pilihan tetap wajib dipilih
// manual oleh notaris karena mencocokkan teks OCR ke nilai enum yang tepat
// terlalu berisiko salah. Label harus sama persis dengan prop `label` di
// komponen form terkait (IndividualForm/CorporateForm/LegalArrangementForm)
// supaya pencocokan berhasil.
//
// Catatan: label "Nama" sengaja TIDAK dipakai untuk Perikatan Lainnya —
// ambigu dengan "Nama Lengkap"/"Nama Alias" di section Pemilik Manfaat pada
// formulir fisik yang sama, sehingga rawan salah tangkap.
const INDIVIDUAL_LABEL_MAP: Record<string, string[]> = {
  "individualDetail.namaLengkap": ["Nama Lengkap"],
  "individualDetail.namaAlias": ["Nama Alias"],
  "individualDetail.noIdentitas": ["No. Identitas", "Nomor Identitas"],
  "individualDetail.npwp": ["NPWP"],
  "individualDetail.tempatLahir": ["Tempat Lahir"],
  "individualDetail.kewarganegaraan": ["Kewarganegaraan"],
  "individualDetail.alamatTempatTinggal": ["Alamat Tempat Tinggal"],
  "individualDetail.alamatDomisili": ["Alamat Domisili"],
  "individualDetail.nomorTeleponRumah": ["Nomor Telepon Rumah"],
  "individualDetail.nomorHp": ["Nomor HP"],
  "individualDetail.bidangUsaha": ["Bidang Usaha"],
  "individualDetail.namaKantor": ["Nama Kantor"],
  "individualDetail.nomorTeleponKantor": ["Nomor Telepon Kantor"],
  "individualDetail.jabatan": ["Jabatan"],
  "individualDetail.alamatKantor": ["Alamat Kantor"],
  "individualDetail.tujuanTransaksi": ["Tujuan Transaksi"],
};

const CORPORATE_LABEL_MAP: Record<string, string[]> = {
  "corporateDetail.namaKorporasi": ["Nama Korporasi"],
  "corporateDetail.bentukKorporasi": ["Bentuk Korporasi"],
  "corporateDetail.noSkPengesahan": ["No. SK Pengesahan", "Nomor SK Pengesahan"],
  "corporateDetail.noIjinUsaha": ["No. Ijin Usaha", "Nomor Ijin Usaha"],
  "corporateDetail.npwp": ["NPWP"],
  "corporateDetail.noAktaPendirian": ["No. Akta Pendirian"],
  "corporateDetail.alamatSesuaiAkta": ["Alamat Korporasi sesuai Akta", "Alamat sesuai Akta"],
  "corporateDetail.alamatLokasiUsaha": ["Alamat Lokasi Usaha"],
  "corporateDetail.nomorTelepon": ["Nomor Telepon Korporasi"],
  "corporateDetail.nomorFaksimili": ["Nomor Faksimili"],
  "corporateDetail.bidangUsaha": ["Bidang Usaha"],
  "corporateDetail.sumberDana": ["Sumber Dana"],
  "corporateDetail.pendapatanRataRata": ["Pendapatan Rata-Rata per Tahun"],
  "corporateDetail.tujuanTransaksi": ["Tujuan Transaksi"],
};

const LEGAL_ARRANGEMENT_LABEL_MAP: Record<string, string[]> = {
  "legalArrangementDetail.noIdentitas": ["No. Identitas", "Nomor Identitas"],
  "legalArrangementDetail.noSkPengesahan": ["No. SK Pengesahan", "Nomor SK Pengesahan"],
  "legalArrangementDetail.noIjinUsaha": ["No. Ijin Usaha", "Nomor Ijin Usaha"],
  "legalArrangementDetail.npwp": ["NPWP"],
  "legalArrangementDetail.nomorTelepon": ["Nomor Telepon"],
  "legalArrangementDetail.nomorFaksimili": ["Nomor Faksimili"],
  "legalArrangementDetail.bidangUsaha": ["Bidang Usaha"],
  "legalArrangementDetail.noAktaPendirian": ["No. Akta Pendirian"],
  "legalArrangementDetail.alamat": ["Alamat"],
  "legalArrangementDetail.sumberDana": ["Sumber Dana"],
  "legalArrangementDetail.pendapatanRataRata": ["Pendapatan Rata-Rata per Tahun"],
  "legalArrangementDetail.tujuanTransaksi": ["Tujuan Transaksi"],
};

export const LABEL_MAPS: Record<CustomerType, Record<string, string[]>> = {
  PERORANGAN: INDIVIDUAL_LABEL_MAP,
  KORPORASI: CORPORATE_LABEL_MAP,
  LEGAL_ARRANGEMENT: LEGAL_ARRANGEMENT_LABEL_MAP,
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MIN_VALUE_LENGTH = 2;
const MAX_VALUE_LENGTH = 200;

/**
 * Tesseract tidak memberi offset karakter word terhadap `text` gabungan —
 * dicari ulang di sini dengan pencarian maju (cursor tidak pernah mundur)
 * karena `text` memang hasil penggabungan word-word ini apa adanya oleh
 * Tesseract. Word yang tidak ketemu (mis. karena whitespace/normalisasi
 * beda) dilewati — hanya mengurangi presisi confidence/bbox, bukan error.
 */
function computeWordOffsets(
  normalized: string,
  words: OcrWord[]
): Array<{ start: number; end: number; word: OcrWord }> {
  const offsets: Array<{ start: number; end: number; word: OcrWord }> = [];
  let cursor = 0;
  for (const word of words) {
    if (!word.text) continue;
    const idx = normalized.indexOf(word.text, cursor);
    if (idx === -1) continue;
    offsets.push({ start: idx, end: idx + word.text.length, word });
    cursor = idx + word.text.length;
  }
  return offsets;
}

function mergeBbox(a: Bbox, b: Bbox): Bbox {
  return {
    x0: Math.min(a.x0, b.x0),
    y0: Math.min(a.y0, b.y0),
    x1: Math.max(a.x1, b.x1),
    y1: Math.max(a.y1, b.y1),
  };
}

// Best-effort: cari kemunculan pertama tiap label di teks OCR, lalu ambil
// teks di antara akhir label tsb sampai label berikutnya (atau baris kosong)
// sebagai nilai. Ini heuristik sederhana, BUKAN parser formulir yang presisi
// — hasilnya wajib direview manual oleh notaris (lihat OcrAssistBanner).
// `words` (opsional) — dari extractTextFromImage; kalau diberikan, tiap
// guess juga dilengkapi confidence rata-rata & bbox gabungan word yang
// overlap dengan rentang teks guess tsb, dipakai untuk styling tiga-state
// (FR-3) dan cuplikan gambar sumber di field identitas kritis.
export function extractFieldGuesses(
  rawText: string,
  labelMap: Record<string, string[]>,
  words: OcrWord[] = [],
  source: "ocr" | "ai" = "ocr"
): FieldGuesses {
  const normalized = rawText.replace(/\r\n/g, "\n");
  const lower = normalized.toLowerCase();
  const wordOffsets = computeWordOffsets(normalized, words);

  type LabelMatch = { field: string; start: number; end: number };
  const matches: LabelMatch[] = [];

  for (const [field, labels] of Object.entries(labelMap)) {
    for (const label of labels) {
      const regex = new RegExp(`(?<![a-z0-9])${escapeRegExp(label.toLowerCase())}(?![a-z0-9])`);
      const found = lower.match(regex);
      if (found && found.index !== undefined) {
        matches.push({ field, start: found.index, end: found.index + label.length });
        break; // satu label pertama saja per field
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const guesses: FieldGuesses = {};
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];
    const sliceEnd = next ? next.start : normalized.length;
    let value = normalized.slice(current.end, sliceEnd);

    const paragraphBreak = value.indexOf("\n\n");
    const rangeEnd = paragraphBreak !== -1 ? current.end + paragraphBreak : sliceEnd;
    if (paragraphBreak !== -1) value = value.slice(0, paragraphBreak);

    value = value.replace(/^[\s:.\-–—]+/, "").replace(/\s+/g, " ").trim();

    if (value.length < MIN_VALUE_LENGTH || value.length > MAX_VALUE_LENGTH) {
      continue;
    }
    if (current.field.endsWith(".npwp") && !isValidNpwpFormat(value)) {
      continue;
    }

    // Rentang dipakai untuk overlap word longgar (batas mentah sebelum
    // trim) — cukup untuk sinyal confidence/bbox best-effort, tidak perlu
    // presisi karakter-demi-karakter.
    const overlapping = wordOffsets.filter(
      (o) => o.start < rangeEnd && o.end > current.end
    );
    let confidence: number | null = null;
    let bbox: Bbox | null = null;
    if (overlapping.length > 0) {
      confidence =
        overlapping.reduce((sum, o) => sum + o.word.confidence, 0) /
        overlapping.length;
      bbox = overlapping
        .map((o) => o.word.bbox)
        .reduce((acc, b) => (acc ? mergeBbox(acc, b) : b), null as Bbox | null);
    }

    guesses[current.field] = { value, confidence, bbox, source };
  }

  return guesses;
}
