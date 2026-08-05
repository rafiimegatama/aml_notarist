// FR-8 — pembuatan string CSV untuk export laporan LTKM
// (app/api/ltkm-export/route.ts). Dipisah jadi fungsi murni supaya bisa
// dites langsung tanpa lewat route handler (lihat quoting/escaping RFC 4180).

export type LtkmExportRow = {
  nama: string;
  tipe: string;
  kategoriRisiko: string;
  status: string;
  tanggalDitandai: string;
  catatan: string;
};

const LTKM_CSV_HEADER = [
  "Nama",
  "Tipe",
  "Kategori Risiko",
  "Status",
  "Tanggal Ditandai",
  "Catatan",
];

// Karakter yang bisa membuat Excel/Sheets menafsirkan sel sebagai formula
// saat CSV dibuka (CSV/formula injection) — "nama" dan "catatan" berasal dari
// input bebas notaris/data klien, jadi bisa saja diawali salah satu ini.
const FORMULA_TRIGGER_CHARS = ["=", "+", "-", "@"];

/** Bungkus tiap field dalam tanda kutip ganda, dobelkan tanda kutip internal
 * (RFC 4180), dan cegah formula injection dengan prefix kutip tunggal kalau
 * field diawali =, +, -, atau @. */
function csvField(value: string): string {
  const safe = FORMULA_TRIGGER_CHARS.includes(value[0])
    ? `'${value}`
    : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildLtkmCsv(rows: LtkmExportRow[]): string {
  const lines = [
    LTKM_CSV_HEADER,
    ...rows.map((r) => [
      r.nama,
      r.tipe,
      r.kategoriRisiko,
      r.status,
      r.tanggalDitandai,
      r.catatan,
    ]),
  ].map((cols) => cols.map(csvField).join(","));

  return lines.join("\r\n");
}
