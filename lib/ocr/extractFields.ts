import { CustomerType } from "@/lib/generated/prisma/enums";

export type FieldGuesses = Record<string, string>;

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

// Best-effort: cari kemunculan pertama tiap label di teks OCR, lalu ambil
// teks di antara akhir label tsb sampai label berikutnya (atau baris kosong)
// sebagai nilai. Ini heuristik sederhana, BUKAN parser formulir yang presisi
// — hasilnya wajib direview manual oleh notaris (lihat OcrAssistBanner).
export function extractFieldGuesses(
  rawText: string,
  labelMap: Record<string, string[]>
): FieldGuesses {
  const normalized = rawText.replace(/\r\n/g, "\n");
  const lower = normalized.toLowerCase();

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
    if (paragraphBreak !== -1) value = value.slice(0, paragraphBreak);

    value = value.replace(/^[\s:.\-–—]+/, "").replace(/\s+/g, " ").trim();

    if (value.length >= MIN_VALUE_LENGTH && value.length <= MAX_VALUE_LENGTH) {
      guesses[current.field] = value;
    }
  }

  return guesses;
}
